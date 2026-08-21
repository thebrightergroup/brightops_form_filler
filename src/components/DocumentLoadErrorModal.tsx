import React, { useState } from 'react';
import { ShieldAlert, RefreshCw, FileUp, Bug, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { DocumentRecord, StorageDiagnostics } from '../types';

interface DocumentLoadErrorModalProps {
  documentRecord: DocumentRecord;
  errorMessage: string;
  diagnostics?: StorageDiagnostics | null;
  onRetry: () => void;
  onReupload: (file: File) => void;
  onBackToRecent: () => void;
}

export const DocumentLoadErrorModal: React.FC<DocumentLoadErrorModalProps> = ({
  documentRecord,
  errorMessage,
  diagnostics,
  onRetry,
  onReupload,
  onBackToRecent,
}) => {
  const [showTechDetails, setShowTechDetails] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onReupload(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 flex-shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Document file could not be loaded.</h3>
            <p className="text-xs text-slate-500 truncate max-w-[340px] mt-0.5">
              {documentRecord.title}
            </p>
          </div>
        </div>

        {/* Human-Readable Error Description */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 leading-relaxed space-y-2">
          <p className="font-semibold text-slate-800">
            The saved record was found, but the PDF file could not be retrieved. You can retry or reconnect the original PDF.
          </p>
          <p className="text-slate-600">
            Your saved field definitions ({documentRecord.fields?.length || 0} fields) and document metadata remain completely intact and safe.
          </p>
        </div>

        {/* Preserved Document Stats */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Pages</div>
            <div className="font-bold text-slate-800 text-sm mt-0.5">{documentRecord.pagesCount || 0}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Saved Fields</div>
            <div className="font-bold text-slate-800 text-sm mt-0.5">{documentRecord.fields?.length || 0}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Status</div>
            <div className="font-bold text-slate-800 text-sm mt-0.5">{documentRecord.status}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            className="hidden"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-[#006CA3] hover:bg-[#005a88] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <FileUp className="w-4 h-4" />
              <span>Re-upload Original PDF</span>
            </button>

            <button
              onClick={onRetry}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Load</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={onBackToRecent}
              className="px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Recent Documents</span>
            </button>

            <button
              onClick={() => setShowTechDetails(!showTechDetails)}
              className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Technical details</span>
            </button>
          </div>
        </div>

        {/* Expandable Technical Details */}
        {showTechDetails && (
          <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 text-xs space-y-2.5 animate-in fade-in duration-150 font-mono text-[11px]">
            <div className="font-bold font-sans text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <Bug className="w-3.5 h-3.5 text-slate-500" />
              <span>Technical Diagnostics</span>
            </div>

            <div className="space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span className="font-sans text-slate-500">Document ID:</span>
                <span className="font-bold text-slate-800 truncate max-w-[200px]">{documentRecord.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-500">Source File ID / Key:</span>
                <span className="font-bold text-slate-800 truncate max-w-[200px]">
                  {diagnostics?.sourceFileId || documentRecord.sourceFileId || 'Not assigned'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-500">Storage Provider:</span>
                <span className="font-bold text-slate-800">
                  {diagnostics?.storageProvider || documentRecord.storageProvider || 'IndexedDB'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-500">File Exists in Storage:</span>
                <span
                  className={`font-bold ${
                    diagnostics?.fileExists ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {diagnostics?.fileExists ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-500">Expected File Size:</span>
                <span className="font-bold text-slate-800">{diagnostics?.fileSizeFormatted || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-500">File Fingerprint:</span>
                <span className="font-bold text-slate-800 truncate max-w-[200px]">
                  {diagnostics?.fileFingerprint || documentRecord.fileFingerprint || 'None'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 text-rose-800 bg-rose-50/80 p-2 rounded border border-rose-200">
              <span className="font-bold font-sans block mb-1">Raw Error Message:</span>
              <p className="break-words [overflow-wrap:anywhere]">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
