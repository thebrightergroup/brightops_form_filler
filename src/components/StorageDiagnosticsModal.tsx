import React from 'react';
import { Bug, Database, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { StorageDiagnostics } from '../types';

interface StorageDiagnosticsModalProps {
  diagnostics: StorageDiagnostics;
  onClose: () => void;
}

export const StorageDiagnosticsModal: React.FC<StorageDiagnosticsModalProps> = ({
  diagnostics,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-100 text-[#006CA3]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Document Storage Diagnostics</h3>
              <p className="text-xs text-slate-500">For support and persistence debugging</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs font-mono">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-slate-700">
            <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
              <span className="font-sans font-medium text-slate-500">Document ID:</span>
              <span className="font-bold text-slate-900 truncate max-w-[220px]">{diagnostics.documentId}</span>
            </div>

            <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
              <span className="font-sans font-medium text-slate-500">Source File ID / Storage Key:</span>
              <span className="font-bold text-slate-900 truncate max-w-[220px]">{diagnostics.sourceFileId}</span>
            </div>

            <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
              <span className="font-sans font-medium text-slate-500">Storage Provider:</span>
              <span className="font-bold text-[#006CA3]">{diagnostics.storageProvider}</span>
            </div>

            <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
              <span className="font-sans font-medium text-slate-500">File Exists in Storage:</span>
              <span className={`font-bold flex items-center gap-1 ${diagnostics.fileExists ? 'text-emerald-700' : 'text-rose-700'}`}>
                {diagnostics.fileExists ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" /> No
                  </>
                )}
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
              <span className="font-sans font-medium text-slate-500">Stored File Size:</span>
              <span className="font-bold text-slate-900">{diagnostics.fileSizeFormatted}</span>
            </div>

            <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
              <span className="font-sans font-medium text-slate-500">MIME Type:</span>
              <span className="font-bold text-slate-900">{diagnostics.storedMimeType}</span>
            </div>

            <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
              <span className="font-sans font-medium text-slate-500">File SHA-256 Fingerprint:</span>
              <span className="font-bold text-slate-900 truncate max-w-[200px]" title={diagnostics.fileFingerprint}>
                {diagnostics.fileFingerprint}
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
              <span className="font-sans font-medium text-slate-500">Last Successful Retrieval:</span>
              <span className="font-bold text-slate-900">
                {diagnostics.lastSuccessfulRetrieval
                  ? new Date(diagnostics.lastSuccessfulRetrieval).toLocaleTimeString()
                  : 'N/A'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-sans font-medium text-slate-500">Field Schema Count:</span>
              <span className="font-bold text-slate-900">{diagnostics.fieldSchemaRecordCount} fields</span>
            </div>
          </div>

          {diagnostics.retrievalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px]">
              <span className="font-sans font-bold block mb-0.5">Retrieval Error:</span>
              <span>{diagnostics.retrievalError}</span>
            </div>
          )}
        </div>

        <div className="pt-1 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
