import { DocumentRecord, StorageDiagnostics } from '../types';

const DB_NAME = 'brightops_document_db';
const DB_VERSION = 1;
const STORE_BINARIES = 'pdf_binaries';
const STORE_RECORDS = 'document_records';

export async function getDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_BINARIES)) {
        db.createObjectStore(STORE_BINARIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_RECORDS)) {
        db.createObjectStore(STORE_RECORDS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Compute stable SHA-256 fingerprint for a PDF ArrayBuffer
export async function computeFileFingerprint(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    if (window.crypto && window.crypto.subtle) {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    /* fallback below */
  }
  // Fallback hash based on byte sampling and length
  const bytes = new Uint8Array(arrayBuffer);
  let hash = 0;
  const len = bytes.length;
  const step = Math.max(1, Math.floor(len / 1000));
  for (let i = 0; i < len; i += step) {
    hash = (hash << 5) - hash + bytes[i];
    hash |= 0;
  }
  return `fp-${len}-${Math.abs(hash).toString(16)}`;
}

// Sync recent docs metadata list to localStorage
function syncRecentDocsLocalStorage(docRecord: DocumentRecord) {
  try {
    const stored = localStorage.getItem('brightops_recent_docs');
    let list: DocumentRecord[] = stored ? JSON.parse(stored) : [];
    list = list.filter((d) => d.id !== docRecord.id);

    const safeDoc = {
      ...docRecord,
      fileDataUrl: '', // Do NOT store transient blob URLs in localStorage
    };

    list = [safeDoc, ...list].slice(0, 20);
    localStorage.setItem('brightops_recent_docs', JSON.stringify(list));
  } catch {
    /* ignore localStorage quota/parse errors */
  }
}

// Save PDF binary and document record durably in IndexedDB
export async function saveDocumentWithBinary(
  doc: DocumentRecord,
  arrayBuffer: ArrayBuffer
): Promise<DocumentRecord> {
  const db = await getDb();
  const sourceFileId = doc.sourceFileId || `file_${doc.id}`;
  const fingerprint = doc.fileFingerprint || (await computeFileFingerprint(arrayBuffer));
  const fileSize = arrayBuffer.byteLength;
  const mimeType = doc.mimeType || 'application/pdf';
  const storageProvider = 'IndexedDB (Local Durable Storage)';

  const bufferCopy = arrayBuffer.slice(0);

  // 1. Save binary in IndexedDB
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_BINARIES, 'readwrite');
    const store = tx.objectStore(STORE_BINARIES);
    const req = store.put({
      id: sourceFileId,
      arrayBuffer: bufferCopy,
      fingerprint,
      fileSize,
      mimeType,
      updatedAt: new Date().toISOString(),
    });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  // 2. Prepare record WITHOUT transient blob URLs
  const recordToSave: DocumentRecord = {
    ...doc,
    sourceFileId,
    fileFingerprint: fingerprint,
    fileSize,
    mimeType,
    storageProvider,
    fileDataUrl: '', // Clear blob URL before storing
    retrievalError: null,
    lastRetrievedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 3. Save record in IndexedDB
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_RECORDS, 'readwrite');
    const store = tx.objectStore(STORE_RECORDS);
    const req = store.put(recordToSave);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  // 4. Sync metadata list to localStorage
  syncRecentDocsLocalStorage(recordToSave);

  return recordToSave;
}

// Retrieve PDF ArrayBuffer from IndexedDB
export async function getPdfBinary(sourceFileId: string): Promise<ArrayBuffer | null> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_BINARIES, 'readonly');
      const store = tx.objectStore(STORE_BINARIES);
      const req = store.get(sourceFileId);
      req.onsuccess = () => {
        if (req.result && req.result.arrayBuffer) {
          resolve(req.result.arrayBuffer);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Retrieve Document Record by ID
export async function getDocumentRecord(id: string): Promise<DocumentRecord | null> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_RECORDS, 'readonly');
      const store = tx.objectStore(STORE_RECORDS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Load full document with binary Object URL generated on the fly
export async function loadDocumentForEditing(
  docId: string
): Promise<{ doc: DocumentRecord; arrayBuffer: ArrayBuffer } | { error: string; docRecord?: DocumentRecord }> {
  let docRecord = await getDocumentRecord(docId);

  // Fallback check in localStorage if not in IDB
  if (!docRecord) {
    try {
      const stored = localStorage.getItem('brightops_recent_docs');
      if (stored) {
        const list: DocumentRecord[] = JSON.parse(stored);
        docRecord = list.find((d) => d.id === docId) || null;
      }
    } catch {
      /* ignore */
    }
  }

  if (!docRecord) {
    return { error: 'The saved document record could not be found.' };
  }

  const sourceFileId = docRecord.sourceFileId || `file_${docRecord.id}`;
  const binary = await getPdfBinary(sourceFileId);

  if (!binary || binary.byteLength === 0) {
    const updatedRecord: DocumentRecord = {
      ...docRecord,
      retrievalError: 'PDF binary file missing from IndexedDB storage.',
    };
    await updateDocumentRecordOnly(updatedRecord);
    return {
      error: 'The saved record was found, but the PDF file could not be retrieved from durable storage.',
      docRecord: updatedRecord,
    };
  }

  // Create temporary object URL for runtime canvas rendering
  const blob = new Blob([binary], { type: docRecord.mimeType || 'application/pdf' });
  const objectUrl = URL.createObjectURL(blob);

  const activeDoc: DocumentRecord = {
    ...docRecord,
    fileDataUrl: objectUrl,
    lastRetrievedAt: new Date().toISOString(),
    retrievalError: null,
  };

  await updateDocumentRecordOnly(activeDoc);

  return { doc: activeDoc, arrayBuffer: binary };
}

// Update document metadata and field schema without overwriting binary
export async function updateDocumentRecordOnly(doc: DocumentRecord): Promise<void> {
  try {
    const db = await getDb();
    const recordToSave: DocumentRecord = {
      ...doc,
      fileDataUrl: '', // Do not store transient object URLs
      updatedAt: new Date().toISOString(),
    };
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_RECORDS, 'readwrite');
      const store = tx.objectStore(STORE_RECORDS);
      const req = store.put(recordToSave);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    syncRecentDocsLocalStorage(recordToSave);
  } catch (err) {
    console.error('Error updating document record:', err);
  }
}

// Find matching document by fingerprint or name/size
export async function findMatchingDocument(
  fingerprint: string,
  title: string,
  fileSize: number
): Promise<DocumentRecord | null> {
  try {
    const db = await getDb();
    const allRecords: DocumentRecord[] = await new Promise((resolve) => {
      const tx = db.transaction(STORE_RECORDS, 'readonly');
      const store = tx.objectStore(STORE_RECORDS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    // 1. Exact fingerprint match
    let match = allRecords.find((r) => r.fileFingerprint && r.fileFingerprint === fingerprint);
    if (match) return match;

    // 2. Title & exact size match
    const cleanTitle = title.replace(/\.(pdf|png|jpe?g|webp|bmp|tiff?)$/i, '');
    match = allRecords.find(
      (r) =>
        r.fileSize === fileSize &&
        (r.title === title || r.title === cleanTitle || r.title.startsWith(cleanTitle))
    );

    return match || null;
  } catch {
    return null;
  }
}

// Reconnect a re-uploaded PDF binary to an existing document record
export async function reconnectBinaryToDocument(
  docId: string,
  arrayBuffer: ArrayBuffer,
  fileName: string
): Promise<{ doc: DocumentRecord; arrayBuffer: ArrayBuffer }> {
  let existingRecord = await getDocumentRecord(docId);
  if (!existingRecord) {
    // Fallback search in localStorage
    try {
      const stored = localStorage.getItem('brightops_recent_docs');
      if (stored) {
        const list: DocumentRecord[] = JSON.parse(stored);
        existingRecord = list.find((d) => d.id === docId) || null;
      }
    } catch {
      /* ignore */
    }
  }

  if (!existingRecord) {
    throw new Error(`Cannot reconnect file: Document record ${docId} not found.`);
  }

  const sourceFileId = existingRecord.sourceFileId || `file_${docId}`;
  const fingerprint = await computeFileFingerprint(arrayBuffer);
  const fileSize = arrayBuffer.byteLength;

  // Save new binary
  const db = await getDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_BINARIES, 'readwrite');
    const store = tx.objectStore(STORE_BINARIES);
    const req = store.put({
      id: sourceFileId,
      arrayBuffer: arrayBuffer.slice(0),
      fingerprint,
      fileSize,
      mimeType: 'application/pdf',
      updatedAt: new Date().toISOString(),
    });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const objectUrl = URL.createObjectURL(blob);

  const updatedDoc: DocumentRecord = {
    ...existingRecord,
    sourceFileId,
    fileFingerprint: fingerprint,
    fileSize,
    fileDataUrl: objectUrl,
    retrievalError: null,
    lastRetrievedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await updateDocumentRecordOnly(updatedDoc);

  return { doc: updatedDoc, arrayBuffer };
}

// Get all recent document records ordered by updatedAt desc
export async function getAllRecentDocuments(): Promise<DocumentRecord[]> {
  try {
    const db = await getDb();
    const records: DocumentRecord[] = await new Promise((resolve) => {
      const tx = db.transaction(STORE_RECORDS, 'readonly');
      const store = tx.objectStore(STORE_RECORDS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    if (records.length > 0) {
      records.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return records.slice(0, 20);
    }
  } catch {
    /* fallback to localStorage */
  }

  try {
    const stored = localStorage.getItem('brightops_recent_docs');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Delete document record and binary
export async function deleteDocumentRecord(docId: string): Promise<void> {
  try {
    const doc = await getDocumentRecord(docId);
    const db = await getDb();
    if (doc?.sourceFileId) {
      const txB = db.transaction(STORE_BINARIES, 'readwrite');
      txB.objectStore(STORE_BINARIES).delete(doc.sourceFileId);
    }
    const txR = db.transaction(STORE_RECORDS, 'readwrite');
    txR.objectStore(STORE_RECORDS).delete(docId);

    const local = localStorage.getItem('brightops_recent_docs');
    if (local) {
      const list: DocumentRecord[] = JSON.parse(local);
      const updated = list.filter((d) => d.id !== docId);
      localStorage.setItem('brightops_recent_docs', JSON.stringify(updated));
    }
  } catch (err) {
    console.error('Error deleting document record:', err);
  }
}

// Get full storage diagnostics for Technical Details modal
export async function getStorageDiagnostics(docId: string): Promise<StorageDiagnostics> {
  const docRecord = await getDocumentRecord(docId);
  const sourceFileId = docRecord?.sourceFileId || `file_${docId}`;
  const binary = sourceFileId ? await getPdfBinary(sourceFileId) : null;

  const fileExists = !!binary && binary.byteLength > 0;
  const fileSizeBytes = binary ? binary.byteLength : docRecord?.fileSize || 0;

  const fileSizeFormatted = fileSizeBytes > 0
    ? fileSizeBytes > 1024 * 1024
      ? `${(fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(fileSizeBytes / 1024).toFixed(1)} KB`
    : '0 KB';

  return {
    documentId: docId,
    sourceFileId,
    storageProvider: docRecord?.storageProvider || 'IndexedDB (Local Durable Storage)',
    fileExists,
    fileSizeFormatted,
    fileSizeBytes,
    storedMimeType: docRecord?.mimeType || 'application/pdf',
    fileFingerprint: docRecord?.fileFingerprint || 'Unknown',
    lastSuccessfulRetrieval: docRecord?.lastRetrievedAt || null,
    retrievalError: docRecord?.retrievalError || (fileExists ? null : 'PDF binary file missing from IndexedDB storage'),
    fieldSchemaRecordCount: docRecord?.fields?.length || 0,
  };
}
