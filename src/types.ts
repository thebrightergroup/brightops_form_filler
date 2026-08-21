export type FieldType =
  | 'text'
  | 'multiline'
  | 'number'
  | 'currency'
  | 'date'
  | 'email'
  | 'phone'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'signature'
  | 'initials';

export type FieldSource = 'native_pdf' | 'ai_detected' | 'user_created';

export type DataSource =
  | 'manual'
  | 'document_variable'
  | 'contact.name'
  | 'contact.email'
  | 'organisation.name'
  | 'employee.phone';

export interface DetectedField {
  id: string;
  label: string;
  machineName: string;
  fieldType: FieldType;
  pageNumber: number; // 1-indexed
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  width: number; // percentage (0 - 100)
  height: number; // percentage (0 - 100)
  confidence: number; // 0.0 to 1.0
  required: boolean;
  source: FieldSource;
  inferredPurpose?: string;
  surroundingText?: string;
  options?: string[]; // For dropdown or radio choices
  value?: string | boolean; // Current value entered by user
  fontSize?: number;
  dataSource?: DataSource;
  accepted?: boolean; // For AI review status
  requiresReview?: boolean; // Flag for fields requiring review (0.65 - 0.84 confidence)
}

export interface DocumentAnalysis {
  documentId: string;
  pageCount: number;
  detectedFields: DetectedField[];
  contextData?: Record<string, string>; // Extracted document context like Company Name, Date
  aiReviewCount: number;
  analyzedAt: string;
}

export type DocumentStatus = 'Original' | 'In Progress' | 'Completed';

export interface DocumentRecord {
  id: string;
  title: string;
  fileDataUrl: string; // Runtime Base64 data URL or Object URL of original PDF
  pagesCount: number;
  fields: DetectedField[];
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
  templateId?: string;
  contextData?: Record<string, string>;
  completedPdfUrl?: string; // Generated PDF
  sourceFileId?: string;
  fileFingerprint?: string;
  fileSize?: number;
  mimeType?: string;
  storageProvider?: string;
  lastRetrievedAt?: string;
  retrievalError?: string | null;
}

export interface StorageDiagnostics {
  documentId: string;
  sourceFileId: string;
  storageProvider: string;
  fileExists: boolean;
  fileSizeFormatted: string;
  fileSizeBytes: number;
  storedMimeType: string;
  fileFingerprint: string;
  lastSuccessfulRetrieval: string | null;
  retrievalError: string | null;
  fieldSchemaRecordCount: number;
}

export interface TemplateRecord {
  id: string;
  name: string;
  description: string;
  category: 'WHS & Safety' | 'HR & Onboarding' | 'Operations' | 'Finance & Procurement' | 'General';
  fields: DetectedField[];
  samplePdfUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface SignatureSession {
  signatureImage?: string; // Data URL PNG
  typedName?: string;
  initialsImage?: string; // Data URL PNG
}

export type AppMode = 'start' | 'editor';
export type ViewMode = 'design' | 'fill' | 'review';

export type AnalysisStatus = 'PARSING' | 'ANALYSING' | 'SUCCESS' | 'SUCCESS_WITH_WARNING' | 'PARTIAL' | 'FAILED';

export interface PdfParsingDiagnostics {
  pageCount: number;
  acroFormPresent: boolean;
  rawFieldNodesCount: number;
  widgetAnnotationsCount: number;
  nativeFieldsImported: number;
  aiFieldsCreated: number;
  fieldsNeedingReview: number;
  warningsAndErrors: string[];
}

export interface AnalysisResultSummary {
  status: AnalysisStatus;
  statusMessage: string;
  diagnostics: PdfParsingDiagnostics;
  pagesAnalysed: number;
  nativeCount: number;
  aiCreatedCount: number;
  reviewCount: number;
}
