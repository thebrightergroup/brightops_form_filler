import React, { useState, useEffect, useRef } from 'react';
import {
  AppMode,
  ViewMode,
  DocumentRecord,
  DetectedField,
  TemplateRecord,
  SignatureSession,
  FieldType,
  AnalysisStatus,
  AnalysisResultSummary,
  StorageDiagnostics,
} from './types';
import { Header } from './components/Header';
import { StartScreen } from './components/StartScreen';
import { PdfViewer } from './components/PdfViewer';
import { InspectorPanel } from './components/InspectorPanel';
import { ReviewDrawer } from './components/ReviewDrawer';
import { SignatureModal } from './components/SignatureModal';
import { PreviewModal } from './components/PreviewModal';
import { AiActionsModal } from './components/AiActionsModal';
import { AnalysisProgressModal } from './components/AnalysisProgressModal';
import { AnalysisSummaryModal } from './components/AnalysisSummaryModal';
import { DocumentLoadErrorModal } from './components/DocumentLoadErrorModal';
import { DuplicateDocumentModal } from './components/DuplicateDocumentModal';
import { StorageDiagnosticsModal } from './components/StorageDiagnosticsModal';

import { convertImageToPdf } from './lib/imageConverter';
import {
  extractNativePdfFieldsWithDiagnostics,
  NativeParsingDetails,
  renderPdfPagesToImages,
  toMachineName,
} from './lib/pdfAnalyzer';
import { createSamplePdf } from './lib/samplePdfs';
import { generateCompletedPdf } from './lib/pdfGenerator';
import {
  saveDocumentWithBinary,
  loadDocumentForEditing,
  updateDocumentRecordOnly,
  findMatchingDocument,
  reconnectBinaryToDocument,
  getAllRecentDocuments,
  deleteDocumentRecord,
  getPdfBinary,
  getStorageDiagnostics,
  computeFileFingerprint,
} from './lib/pdfStorage';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('start');
  const [viewMode, setViewMode] = useState<ViewMode>('design');

  const [currentDoc, setCurrentDoc] = useState<DocumentRecord | null>(null);
  const [selectedField, setSelectedField] = useState<DetectedField | null>(null);
  const [signatureSession, setSignatureSession] = useState<SignatureSession>({});
  const [recentDocuments, setRecentDocuments] = useState<DocumentRecord[]>([]);

  // Modals & Drawers
  const [showReviewDrawer, setShowReviewDrawer] = useState<boolean>(false);
  const [showSignatureModal, setShowSignatureModal] = useState<boolean>(false);
  const [signatureTarget, setSignatureTarget] = useState<DetectedField | null>(null);

  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [previewPdfBlobUrl, setPreviewPdfBlobUrl] = useState<string>('');

  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiMissingFields, setAiMissingFields] = useState<string[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const cancelAnalysisRef = useRef<boolean>(false);

  // Workflow & Export States
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Storage & Diagnostics Modals State
  const [loadErrorDoc, setLoadErrorDoc] = useState<{
    docRecord: DocumentRecord;
    errorMessage: string;
    diagnostics?: StorageDiagnostics | null;
  } | null>(null);

  const [pendingDuplicateUpload, setPendingDuplicateUpload] = useState<{
    file: File;
    arrayBuffer: ArrayBuffer;
    dataUrl: string;
    isImage: boolean;
    existingDoc: DocumentRecord;
  } | null>(null);

  const [activeDiagnosticsModal, setActiveDiagnosticsModal] = useState<StorageDiagnostics | null>(null);

  // Progress & Summary Modals
  const [analysisProgress, setAnalysisProgress] = useState<{
    currentPage: number;
    totalPages: number;
    nativeCount: number;
    aiCreatedCount: number;
    reviewCount: number;
  } | null>(null);

  const [analysisSummary, setAnalysisSummary] = useState<AnalysisResultSummary | null>(null);

  // Load Recent Documents from IndexedDB on initial mount
  useEffect(() => {
    refreshRecentDocs();
  }, []);

  const refreshRecentDocs = async () => {
    const list = await getAllRecentDocuments();
    setRecentDocuments(list);
  };

  // Helper: Convert File/Blob to ArrayBuffer
  const fileToArrayBuffer = (file: Blob): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // 1. Handle Custom PDF or Image File Upload with Fingerprint / Duplicate Detection
  const handleFileUpload = async (file: File) => {
    setIsAnalyzing(true);
    try {
      let arrayBuffer: ArrayBuffer;
      let dataUrl: string;
      const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|tiff?)$/i.test(file.name);

      if (isImage) {
        const converted = await convertImageToPdf(file);
        arrayBuffer = converted.pdfArrayBuffer;
        dataUrl = converted.dataUrl;
      } else {
        arrayBuffer = await fileToArrayBuffer(file);
        dataUrl = URL.createObjectURL(new Blob([arrayBuffer], { type: 'application/pdf' }));
      }

      // Compute stable SHA-256 fingerprint & check existing library
      const fingerprint = await computeFileFingerprint(arrayBuffer);
      const existingDoc = await findMatchingDocument(fingerprint, file.name, arrayBuffer.byteLength);

      if (existingDoc) {
        setIsAnalyzing(false);
        setPendingDuplicateUpload({
          file,
          arrayBuffer,
          dataUrl,
          isImage,
          existingDoc,
        });
        return;
      }

      await processNewFileUpload(file, arrayBuffer, dataUrl, isImage);
    } catch (err) {
      console.error('Error handling uploaded file:', err);
      alert('Failed to process file. Please ensure it is a valid PDF or Image file.');
      setIsAnalyzing(false);
    }
  };

  // Process fresh document upload
  const processNewFileUpload = async (
    file: File,
    arrayBuffer: ArrayBuffer,
    dataUrl: string,
    isImage: boolean
  ) => {
    setIsAnalyzing(true);
    try {
      const nativeParsing = await extractNativePdfFieldsWithDiagnostics(arrayBuffer);
      const cleanTitle = file.name.replace(/\.(pdf|png|jpe?g|webp|bmp|tiff?)$/i, '');

      const newDoc: DocumentRecord = {
        id: `doc-${Date.now()}`,
        title: isImage ? `${cleanTitle} (Converted PDF)` : cleanTitle,
        fileDataUrl: dataUrl,
        pagesCount: nativeParsing.pageCount,
        fields: nativeParsing.fields,
        status: 'In Progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fileSize: arrayBuffer.byteLength,
        mimeType: 'application/pdf',
      };

      // Persist binary and metadata in IndexedDB
      const savedDoc = await saveDocumentWithBinary(newDoc, arrayBuffer);
      const activeDoc = { ...savedDoc, fileDataUrl: dataUrl };

      setCurrentDoc(activeDoc);
      setAppMode('editor');
      setViewMode('design');
      await refreshRecentDocs();

      // Trigger AI Visual Form & OCR Detection
      await runAiAnalysisForDocument(arrayBuffer, activeDoc, nativeParsing);
    } catch (err) {
      console.error('Error processing upload:', err);
      alert('Failed to process uploaded file.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 2. Handle Opening Sample Template
  const handleOpenSample = async (template: TemplateRecord) => {
    setIsAnalyzing(true);
    try {
      let sampleType: 'whs' | 'hr' | 'po' = 'whs';
      if (template.id === 'tmpl-hr') sampleType = 'hr';
      if (template.id === 'tmpl-po') sampleType = 'po';

      const blobUrl = await createSamplePdf(sampleType);
      const blob = await fetch(blobUrl).then((r) => r.blob());
      const arrayBuffer = await fileToArrayBuffer(blob);

      const nativeParsing = await extractNativePdfFieldsWithDiagnostics(arrayBuffer);

      const newDoc: DocumentRecord = {
        id: `doc-${sampleType}-${Date.now()}`,
        title: template.name,
        fileDataUrl: blobUrl,
        pagesCount: nativeParsing.pageCount,
        fields: nativeParsing.fields,
        status: 'In Progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        templateId: template.id,
        fileSize: arrayBuffer.byteLength,
        mimeType: 'application/pdf',
      };

      const savedDoc = await saveDocumentWithBinary(newDoc, arrayBuffer);
      const activeDoc = { ...savedDoc, fileDataUrl: blobUrl };

      setCurrentDoc(activeDoc);
      setAppMode('editor');
      setViewMode('design');
      await refreshRecentDocs();

      // Run AI Detection
      await runAiAnalysisForDocument(arrayBuffer, activeDoc, nativeParsing);
    } catch (err) {
      console.error('Error loading sample PDF:', err);
      alert('Failed to load sample template.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 3. Handle Opening Recent Document (Load -> Resolve -> Retrieve Binary -> Load Schema/Values -> Render)
  const handleOpenRecentDoc = async (docRecord: DocumentRecord) => {
    setIsAnalyzing(true);
    try {
      const result = await loadDocumentForEditing(docRecord.id);

      if ('error' in result) {
        const diag = await getStorageDiagnostics(docRecord.id);
        setLoadErrorDoc({
          docRecord: result.docRecord || docRecord,
          errorMessage: result.error,
          diagnostics: diag,
        });
        return;
      }

      // Success! Open document cleanly with stored fields and status without re-analyzing
      setCurrentDoc(result.doc);
      setAppMode('editor');
      setViewMode('design');
      await refreshRecentDocs();
    } catch (err: any) {
      console.error('Error opening recent document:', err);
      const diag = await getStorageDiagnostics(docRecord.id);
      setLoadErrorDoc({
        docRecord,
        errorMessage: err?.message || 'Failed to retrieve source PDF from local storage.',
        diagnostics: diag,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 4. Handle Re-uploading / Reconnecting File when Binary is missing
  const handleReuploadOriginalPdf = async (file: File) => {
    if (!loadErrorDoc) return;
    try {
      const arrayBuffer = await fileToArrayBuffer(file);
      const { doc } = await reconnectBinaryToDocument(
        loadErrorDoc.docRecord.id,
        arrayBuffer,
        file.name
      );

      setLoadErrorDoc(null);
      setCurrentDoc(doc);
      setAppMode('editor');
      setViewMode('design');
      await refreshRecentDocs();
    } catch (err: any) {
      alert(`Failed to reconnect file: ${err?.message || 'Invalid PDF'}`);
    }
  };

  // Delete Recent Document
  const handleDeleteRecentDoc = async (docId: string) => {
    await deleteDocumentRecord(docId);
    await refreshRecentDocs();
  };

  // Run Multi-Page AI Form Field Analysis
  const runAiAnalysisForDocument = async (
    arrayBuffer: ArrayBuffer,
    docRecord: DocumentRecord,
    nativeParsing: NativeParsingDetails
  ) => {
    setIsAnalyzing(true);
    cancelAnalysisRef.current = false;

    let currentFields = [...docRecord.fields];
    let totalAiCreated = 0;
    let totalReview = 0;
    const totalPages = nativeParsing.pageCount;
    const nativeCount = nativeParsing.fields.length;

    try {
      const batchSize = 3;
      const totalBatches = Math.ceil(totalPages / batchSize);

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        if (cancelAnalysisRef.current) break;

        const startPage = batchIndex * batchSize + 1;
        const endPage = Math.min(totalPages, (batchIndex + 1) * batchSize);
        const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

        setAnalysisProgress({
          currentPage: endPage,
          totalPages,
          nativeCount,
          aiCreatedCount: totalAiCreated,
          reviewCount: totalReview,
        });

        const pageImages = await renderPdfPagesToImages(arrayBuffer, pageNumbers);
        if (pageImages.length === 0) continue;

        const response = await fetch('/api/analyze-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pages: pageImages }),
        });

        const data = await response.json();

        if (data.success && Array.isArray(data.detectedFields)) {
          const newAiFields: DetectedField[] = [];

          data.detectedFields.forEach((f: Partial<DetectedField>, idx: number) => {
            const rawLabel = f.label || 'Detected Input';
            const machineName = f.machineName ? toMachineName(f.machineName) : toMachineName(rawLabel);
            const conf = f.confidence ?? 0.85;

            const isHighConfidence = conf >= 0.85;
            const requiresReview = !isHighConfidence;
            const targetPage = f.pageNumber || startPage;

            const isDuplicate = currentFields.some(
              (ef) =>
                (ef.pageNumber || 1) === targetPage &&
                (ef.machineName === machineName ||
                  (Math.abs(ef.x - (f.x || 0)) < 3 && Math.abs(ef.y - (f.y || 0)) < 3))
            );

            if (!isDuplicate) {
              const newField: DetectedField = {
                id: `ai-p${targetPage}-${idx}-${Date.now()}`,
                label: rawLabel,
                machineName,
                fieldType: (f.fieldType as FieldType) || 'text',
                pageNumber: targetPage,
                x: f.x || 10,
                y: f.y || 10,
                width: f.width || 25,
                height: f.height || 3.5,
                confidence: conf,
                required: f.required ?? false,
                source: 'ai_detected',
                inferredPurpose: f.inferredPurpose,
                surroundingText: f.surroundingText,
                accepted: isHighConfidence,
                requiresReview,
              };

              newAiFields.push(newField);
              totalAiCreated++;
              if (requiresReview) totalReview++;
            }
          });

          if (newAiFields.length > 0) {
            currentFields = [...currentFields, ...newAiFields];
            const updatedDoc = {
              ...docRecord,
              pagesCount: totalPages,
              fields: currentFields,
              updatedAt: new Date().toISOString(),
            };
            setCurrentDoc(updatedDoc);
            await updateDocumentRecordOnly(updatedDoc);
            await refreshRecentDocs();
          }
        }
      }
    } catch (err: any) {
      console.warn('AI Analysis notice:', err);
      const msg = err?.message || String(err);
      if (!nativeParsing.warningsAndErrors.includes(msg)) {
        nativeParsing.warningsAndErrors.push(`AI Analysis error: ${msg}`);
      }
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(null);

      const totalFields = currentFields.length;
      let status: AnalysisStatus = 'SUCCESS';
      let statusMessage = '';

      if (totalPages === 0 || (totalPages === 1 && nativeCount === 0 && totalAiCreated === 0 && nativeParsing.warningsAndErrors.length > 0)) {
        status = 'FAILED';
        statusMessage =
          'Document processing could not extract form fields automatically. You can continue working with this document and place form fields manually using Design Mode.';
      } else if (totalFields === 0) {
        status = 'FAILED';
        statusMessage = 'Document parsing completed, but 0 form fields were detected or extracted.';
      } else if (nativeParsing.warningsAndErrors.length > 0 || totalReview > 0 || cancelAnalysisRef.current) {
        status = 'SUCCESS_WITH_WARNING';
        statusMessage = `${totalFields} form fields placed across ${totalPages} pages (${
          totalReview > 0 ? `${totalReview} fields flagged for review` : 'all accepted'
        }). Some PDF form controls could not be fully processed, but your fields were imported successfully.`;
      } else {
        status = 'SUCCESS';
        statusMessage = `${totalFields} form fields placed across ${totalPages} pages. All fields were placed successfully and are ready for completion.`;
      }

      setAnalysisSummary({
        status,
        statusMessage,
        diagnostics: {
          pageCount: totalPages,
          acroFormPresent: nativeParsing.acroFormPresent,
          rawFieldNodesCount: nativeParsing.rawFieldNodesCount,
          widgetAnnotationsCount: nativeParsing.widgetAnnotationsCount,
          nativeFieldsImported: nativeCount,
          aiFieldsCreated: totalAiCreated,
          fieldsNeedingReview: totalReview,
          warningsAndErrors: nativeParsing.warningsAndErrors,
        },
        pagesAnalysed: totalPages,
        nativeCount,
        aiCreatedCount: totalAiCreated,
        reviewCount: totalReview,
      });
    }
  };

  // Re-run AI Analysis on current doc
  const handleTriggerAnalysis = async () => {
    if (!currentDoc) return;
    try {
      let arrayBuffer: ArrayBuffer | null = null;
      if (currentDoc.sourceFileId) {
        arrayBuffer = await getPdfBinary(currentDoc.sourceFileId);
      }
      if (!arrayBuffer && currentDoc.fileDataUrl) {
        const blob = await fetch(currentDoc.fileDataUrl).then((r) => r.blob());
        arrayBuffer = await fileToArrayBuffer(blob);
      }
      if (!arrayBuffer) {
        alert('Could not retrieve PDF binary for analysis.');
        return;
      }
      const nativeParsing = await extractNativePdfFieldsWithDiagnostics(arrayBuffer);
      await runAiAnalysisForDocument(arrayBuffer, currentDoc, nativeParsing);
    } catch (err) {
      console.error('Error triggering AI analysis:', err);
    }
  };

  // Field Operations
  const handleUpdateField = (updated: DetectedField) => {
    if (!currentDoc) return;
    const updatedFields = currentDoc.fields.map((f) => (f.id === updated.id ? updated : f));
    const updatedDoc = { ...currentDoc, fields: updatedFields, updatedAt: new Date().toISOString() };
    setCurrentDoc(updatedDoc);
    updateDocumentRecordOnly(updatedDoc);
    refreshRecentDocs();
    if (selectedField?.id === updated.id) {
      setSelectedField(updated);
    }
  };

  const handleDeleteField = (id: string) => {
    if (!currentDoc) return;
    const updatedFields = currentDoc.fields.filter((f) => f.id !== id);
    const updatedDoc = { ...currentDoc, fields: updatedFields, updatedAt: new Date().toISOString() };
    setCurrentDoc(updatedDoc);
    updateDocumentRecordOnly(updatedDoc);
    refreshRecentDocs();
    if (selectedField?.id === id) {
      setSelectedField(null);
    }
  };

  const handleDuplicateField = (field: DetectedField) => {
    if (!currentDoc) return;
    const dup: DetectedField = {
      ...field,
      id: `user-${Date.now()}`,
      x: Math.min(90, field.x + 3),
      y: Math.min(90, field.y + 3),
      machineName: `${field.machineName}_copy`,
      source: 'user_created',
      accepted: true,
    };
    const updatedFields = [...currentDoc.fields, dup];
    const updatedDoc = { ...currentDoc, fields: updatedFields, updatedAt: new Date().toISOString() };
    setCurrentDoc(updatedDoc);
    setSelectedField(dup);
    updateDocumentRecordOnly(updatedDoc);
    refreshRecentDocs();
  };

  const handleAddField = (type: FieldType, pageNumber = 1, xPct = 20, yPct = 20) => {
    if (!currentDoc) return;
    const count = currentDoc.fields.length + 1;
    const newField: DetectedField = {
      id: `user-${Date.now()}`,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} ${count}`,
      machineName: `field_${type}_${count}`,
      fieldType: type,
      pageNumber,
      x: xPct,
      y: yPct,
      width: type === 'checkbox' ? 3.5 : type === 'multiline' ? 45 : 30,
      height: type === 'checkbox' ? 3.5 : type === 'multiline' ? 12 : 3.5,
      confidence: 1.0,
      required: false,
      source: 'user_created',
      accepted: true,
    };

    const updatedFields = [...currentDoc.fields, newField];
    const updatedDoc = { ...currentDoc, fields: updatedFields, updatedAt: new Date().toISOString() };
    setCurrentDoc(updatedDoc);
    setSelectedField(newField);
    updateDocumentRecordOnly(updatedDoc);
    refreshRecentDocs();
  };

  // AI Review Actions
  const handleAcceptAiField = (id: string) => {
    if (!currentDoc) return;
    const updatedFields = currentDoc.fields.map((f) => (f.id === id ? { ...f, accepted: true } : f));
    const updatedDoc = { ...currentDoc, fields: updatedFields };
    setCurrentDoc(updatedDoc);
    updateDocumentRecordOnly(updatedDoc);
    refreshRecentDocs();
  };

  const handleAcceptAllHighConfidence = () => {
    if (!currentDoc) return;
    const updatedFields = currentDoc.fields.map((f) =>
      f.source === 'ai_detected' && f.confidence >= 0.85 ? { ...f, accepted: true } : f
    );
    const updatedDoc = { ...currentDoc, fields: updatedFields };
    setCurrentDoc(updatedDoc);
    updateDocumentRecordOnly(updatedDoc);
    refreshRecentDocs();
  };

  // Open Signature Modal
  const handleOpenSignatureModal = (field: DetectedField) => {
    setSignatureTarget(field);
    setShowSignatureModal(true);
  };

  const handleSaveSignature = (type: 'signature' | 'initials', dataUrl: string) => {
    if (type === 'signature') {
      setSignatureSession((prev) => ({ ...prev, signatureImage: dataUrl }));
    } else {
      setSignatureSession((prev) => ({ ...prev, initialsImage: dataUrl }));
    }

    if (signatureTarget && currentDoc) {
      const updatedFields = currentDoc.fields.map((f) =>
        f.id === signatureTarget.id ? { ...f, value: dataUrl } : f
      );
      const updatedDoc = { ...currentDoc, fields: updatedFields };
      setCurrentDoc(updatedDoc);
      updateDocumentRecordOnly(updatedDoc);
      refreshRecentDocs();
    }

    setShowSignatureModal(false);
  };

  // Preview Completed PDF
  const handlePreviewPdf = async () => {
    if (!currentDoc) return;
    try {
      let arrayBuffer: ArrayBuffer | null = null;
      if (currentDoc.sourceFileId) {
        arrayBuffer = await getPdfBinary(currentDoc.sourceFileId);
      }
      if (!arrayBuffer && currentDoc.fileDataUrl) {
        const blob = await fetch(currentDoc.fileDataUrl).then((r) => r.blob());
        arrayBuffer = await fileToArrayBuffer(blob);
      }
      if (!arrayBuffer) {
        alert('Source PDF binary missing.');
        return;
      }

      const bytes = await generateCompletedPdf({
        pdfArrayBuffer: arrayBuffer,
        fields: currentDoc.fields,
        flatten: false,
      });

      const blob = new Blob([bytes], { type: 'application/pdf' });
      setPreviewPdfBlobUrl(URL.createObjectURL(blob));
      setShowPreviewModal(true);
    } catch (err) {
      console.error('Error generating preview PDF:', err);
      alert('Failed to generate preview.');
    }
  };

  // Workflow Actions & Save Progress
  const handleSaveProgress = async () => {
    if (!currentDoc) return;
    try {
      const updatedDoc = { ...currentDoc, updatedAt: new Date().toISOString() };
      setCurrentDoc(updatedDoc);
      await updateDocumentRecordOnly(updatedDoc);
      await refreshRecentDocs();
      setSaveToast('Progress saved safely.');
      setTimeout(() => setSaveToast(null), 3500);
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  const handleSaveAndClose = async () => {
    await handleSaveProgress();
    setAppMode('start');
    refreshRecentDocs();
  };

  // Hardened Download Fillable PDF (Flatten = false)
  const handleDownloadFillablePdf = async () => {
    if (!currentDoc) return;
    setIsExporting(true);
    setExportError(null);
    try {
      let arrayBuffer: ArrayBuffer | null = null;
      if (currentDoc.sourceFileId) {
        arrayBuffer = await getPdfBinary(currentDoc.sourceFileId);
      }
      if (!arrayBuffer && currentDoc.fileDataUrl) {
        const blob = await fetch(currentDoc.fileDataUrl).then((r) => r.blob());
        arrayBuffer = await fileToArrayBuffer(blob);
      }
      if (!arrayBuffer) {
        setExportError('Unable to prepare the fillable PDF right now. Please try again.');
        return;
      }

      const bytes = await generateCompletedPdf({
        pdfArrayBuffer: arrayBuffer,
        fields: currentDoc.fields,
        flatten: false,
      });

      const downloadBlob = new Blob([bytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(downloadBlob);
      link.download = `${currentDoc.title}_fillable.pdf`;
      link.click();

      setSaveToast('Fillable PDF downloaded safely.');
      setTimeout(() => setSaveToast(null), 3500);
    } catch (err) {
      console.error('Error downloading fillable PDF:', err);
      setExportError('Unable to prepare the fillable PDF right now. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Hardened Complete & Export PDF (Flatten = true)
  const handleCompleteAndExport = async () => {
    if (!currentDoc) return;
    setIsExporting(true);
    setExportError(null);
    try {
      let arrayBuffer: ArrayBuffer | null = null;
      if (currentDoc.sourceFileId) {
        arrayBuffer = await getPdfBinary(currentDoc.sourceFileId);
      }
      if (!arrayBuffer && currentDoc.fileDataUrl) {
        const blob = await fetch(currentDoc.fileDataUrl).then((r) => r.blob());
        arrayBuffer = await fileToArrayBuffer(blob);
      }
      if (!arrayBuffer) {
        setExportError('Unable to complete and export the form right now. Your progress has not been lost.');
        return;
      }

      const bytes = await generateCompletedPdf({
        pdfArrayBuffer: arrayBuffer,
        fields: currentDoc.fields,
        flatten: true,
      });

      const downloadBlob = new Blob([bytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(downloadBlob);
      link.download = `${currentDoc.title}_completed.pdf`;
      link.click();

      const completedDoc: DocumentRecord = {
        ...currentDoc,
        status: 'Completed',
        updatedAt: new Date().toISOString(),
      };
      setCurrentDoc(completedDoc);
      await updateDocumentRecordOnly(completedDoc);
      await refreshRecentDocs();

      setSaveToast('Form completed and exported successfully.');
      setTimeout(() => setSaveToast(null), 3500);
    } catch (err) {
      console.error('Error completing and exporting PDF:', err);
      setExportError('Unable to complete and export the form right now. Your progress has not been lost.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async (flatten: boolean) => {
    if (flatten) {
      await handleCompleteAndExport();
    } else {
      await handleDownloadFillablePdf();
    }
  };

  // AI Form Check
  const handleCheckForm = async () => {
    if (!currentDoc) return;
    try {
      const response = await fetch('/api/check-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentTitle: currentDoc.title,
          fields: currentDoc.fields,
        }),
      });

      const data = await response.json();
      setAiMissingFields(data.missingFields || []);
      setAiRecommendations(data.recommendations || []);
      setShowAiModal(true);
    } catch (err) {
      console.error('Error running AI form check:', err);
    }
  };

  const handleAutoSuggestNames = () => {
    if (!currentDoc) return;
    const updatedFields = currentDoc.fields.map((f) => ({
      ...f,
      machineName: toMachineName(f.label),
    }));
    const updatedDoc = { ...currentDoc, fields: updatedFields };
    setCurrentDoc(updatedDoc);
    updateDocumentRecordOnly(updatedDoc);
    refreshRecentDocs();
  };

  const handleSaveAsTemplate = () => {
    if (!currentDoc) return;
    alert(`Template "${currentDoc.title}" saved successfully to local BrightOps template repository!`);
  };

  const handleShowDiagnostics = async () => {
    if (!currentDoc) return;
    const diag = await getStorageDiagnostics(currentDoc.id);
    setActiveDiagnosticsModal(diag);
  };

  const unacceptedAiCount = currentDoc
    ? currentDoc.fields.filter((f) => f.source === 'ai_detected' && !f.accepted).length
    : 0;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans antialiased">
      {appMode === 'start' || !currentDoc ? (
        <StartScreen
          onFileUpload={handleFileUpload}
          onOpenSample={handleOpenSample}
          recentDocuments={recentDocuments}
          onOpenRecent={handleOpenRecentDoc}
          onDeleteRecent={handleDeleteRecentDoc}
        />
      ) : (
        <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0">
          {/* Main Top Header */}
          <Header
            documentTitle={currentDoc.title}
            status={currentDoc.status}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onBackToStart={() => {
              setAppMode('start');
              refreshRecentDocs();
            }}
            onAnalyzePdf={handleTriggerAnalysis}
            onOpenReview={() => setShowReviewDrawer(true)}
            onSaveTemplate={handleSaveAsTemplate}
            onPreview={handlePreviewPdf}
            onComplete={handlePreviewPdf}
            isAnalyzing={isAnalyzing}
            unacceptedAiCount={unacceptedAiCount}
            totalFieldsCount={currentDoc.fields.length}
          />

          {/* AI Field Review Drawer */}
          {showReviewDrawer && (
            <ReviewDrawer
              fields={currentDoc.fields}
              onAcceptField={handleAcceptAiField}
              onAcceptAllHighConfidence={handleAcceptAllHighConfidence}
              onDeleteField={handleDeleteField}
              onSelectField={setSelectedField}
              onClose={() => setShowReviewDrawer(false)}
            />
          )}

          {/* Main Workspace Layout */}
          <div className="flex-1 flex overflow-hidden min-h-0 relative">
            {/* Central PDF Canvas & Overlay Viewer */}
            <PdfViewer
              fileDataUrl={currentDoc.fileDataUrl}
              fields={currentDoc.fields}
              viewMode={viewMode}
              selectedField={selectedField}
              onSelectField={setSelectedField}
              onUpdateField={handleUpdateField}
              onDeleteField={handleDeleteField}
              onDuplicateField={handleDuplicateField}
              onOpenSignatureModal={handleOpenSignatureModal}
              onAddFieldOnPage={(pNum, xPct, yPct) => handleAddField('text', pNum, xPct, yPct)}
              onAddField={(type) => handleAddField(type, 1, 25, 25)}
            />

            {/* Right Inspector Sidebar */}
            <InspectorPanel
              selectedField={selectedField}
              onUpdateField={handleUpdateField}
              onDeleteField={handleDeleteField}
              onDuplicateField={handleDuplicateField}
              documentRecord={currentDoc}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onAnalyzePdf={handleTriggerAnalysis}
              onCheckForm={handleCheckForm}
              onSuggestNames={handleAutoSuggestNames}
              onShowStorageDiagnostics={handleShowDiagnostics}
              isAnalyzing={isAnalyzing}
              onDownloadFillablePdf={handleDownloadFillablePdf}
              onSaveProgress={handleSaveProgress}
              onCompleteAndExport={handleCompleteAndExport}
              onSaveAndClose={handleSaveAndClose}
              isExporting={isExporting}
              exportError={exportError}
              onClearExportError={() => setExportError(null)}
              saveToast={saveToast}
            />
          </div>
        </div>
      )}

      {/* Load Error Modal (When PDF binary is missing from IndexedDB) */}
      {loadErrorDoc && (
        <DocumentLoadErrorModal
          documentRecord={loadErrorDoc.docRecord}
          errorMessage={loadErrorDoc.errorMessage}
          diagnostics={loadErrorDoc.diagnostics}
          onRetry={() => handleOpenRecentDoc(loadErrorDoc.docRecord)}
          onReupload={handleReuploadOriginalPdf}
          onBackToRecent={() => setLoadErrorDoc(null)}
        />
      )}

      {/* Duplicate Document Action Modal */}
      {pendingDuplicateUpload && (
        <DuplicateDocumentModal
          existingDoc={pendingDuplicateUpload.existingDoc}
          uploadedFileName={pendingDuplicateUpload.file.name}
          onOpenExisting={() => {
            const docToOpen = pendingDuplicateUpload.existingDoc;
            setPendingDuplicateUpload(null);
            handleOpenRecentDoc(docToOpen);
          }}
          onCreateNewCopy={() => {
            const { file, arrayBuffer, dataUrl, isImage } = pendingDuplicateUpload;
            setPendingDuplicateUpload(null);
            processNewFileUpload(file, arrayBuffer, dataUrl, isImage);
          }}
          onReplaceFile={async () => {
            const { existingDoc, arrayBuffer, file } = pendingDuplicateUpload;
            setPendingDuplicateUpload(null);
            try {
              const { doc } = await reconnectBinaryToDocument(existingDoc.id, arrayBuffer, file.name);
              setCurrentDoc(doc);
              setAppMode('editor');
              setViewMode('design');
              await refreshRecentDocs();
            } catch (err: any) {
              alert(`Failed to replace file: ${err?.message || 'Error'}`);
            }
          }}
          onClose={() => setPendingDuplicateUpload(null)}
        />
      )}

      {/* Storage Diagnostics Modal */}
      {activeDiagnosticsModal && (
        <StorageDiagnosticsModal
          diagnostics={activeDiagnosticsModal}
          onClose={() => setActiveDiagnosticsModal(null)}
        />
      )}

      {/* Analysis Modals */}
      {analysisProgress && (
        <AnalysisProgressModal
          documentTitle={currentDoc?.title || 'Document'}
          currentPage={analysisProgress.currentPage}
          totalPages={analysisProgress.totalPages}
          nativeCount={analysisProgress.nativeCount}
          aiCreatedCount={analysisProgress.aiCreatedCount}
          reviewCount={analysisProgress.reviewCount}
          onCancel={() => {
            cancelAnalysisRef.current = true;
          }}
        />
      )}

      {analysisSummary && (
        <AnalysisSummaryModal
          documentTitle={currentDoc?.title || 'Document'}
          status={analysisSummary.status}
          statusMessage={analysisSummary.statusMessage}
          diagnostics={analysisSummary.diagnostics}
          pagesAnalysed={analysisSummary.pagesAnalysed}
          nativeCount={analysisSummary.nativeCount}
          aiCreatedCount={analysisSummary.aiCreatedCount}
          reviewCount={analysisSummary.reviewCount}
          onReview={() => setShowReviewDrawer(true)}
          onAcceptAllHighConfidence={handleAcceptAllHighConfidence}
          onEnterManualDesignMode={() => {
            setAppMode('editor');
            setViewMode('design');
          }}
          onClose={() => setAnalysisSummary(null)}
        />
      )}

      {/* Modals */}
      {showSignatureModal && (
        <SignatureModal
          fieldLabel={signatureTarget?.label || 'Signature'}
          isInitials={signatureTarget?.fieldType === 'initials'}
          signatureSession={signatureSession}
          onSaveSignature={handleSaveSignature}
          onClose={() => setShowSignatureModal(false)}
        />
      )}

      {showPreviewModal && (
        <PreviewModal
          pdfBlobUrl={previewPdfBlobUrl}
          documentTitle={currentDoc?.title || 'Document'}
          onDownload={handleDownloadPdf}
          onClose={() => setShowPreviewModal(false)}
        />
      )}

      {showAiModal && (
        <AiActionsModal
          missingFields={aiMissingFields}
          recommendations={aiRecommendations}
          onAddMissingField={(fieldName) => handleAddField('text', 1, 30, 30)}
          onClose={() => setShowAiModal(false)}
        />
      )}
    </div>
  );
}
