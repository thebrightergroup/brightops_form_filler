import React from 'react';
import { Copy, FileCheck, RefreshCw, Sparkles, FileText, Calendar, CheckCircle2 } from 'lucide-react';
import { DocumentRecord } from '../types';

interface DuplicateDocumentModalProps {
  existingDoc: DocumentRecord;
  uploadedFileName: string;
  onOpenExisting: () => void;
  onCreateNewCopy: () => void;
  onReplaceFile: () => void;
  onClose: () => void;
}

export const DuplicateDocumentModal: React.FC<DuplicateDocumentModalProps> = ({
  existingDoc,
  uploadedFileName,
  onOpenExisting,
  onCreateNewCopy,
  onReplaceFile,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-sky-100 text-[#006CA3] flex-shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Matching Document Found</h3>
            <p className="text-xs text-slate-500">
              An existing record matching <span className="font-semibold text-slate-700">"{uploadedFileName}"</span> was found in your library.
            </p>
          </div>
        </div>

        {/* Existing Document Info Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-800 text-sm">
            <span className="truncate max-w-[280px]">{existingDoc.title}</span>
            <span className="text-[10px] bg-sky-100 text-[#006CA3] font-bold px-2 py-0.5 rounded font-mono uppercase">
              {existingDoc.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-600 pt-1">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>{existingDoc.pagesCount || 1} Pages</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{existingDoc.fields?.length || 0} Configured Fields</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">
                {new Date(existingDoc.updatedAt || existingDoc.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Choices */}
        <div className="space-y-2.5 pt-1">
          <p className="text-xs font-semibold text-slate-600">Choose how to proceed:</p>

          <button
            onClick={onOpenExisting}
            className="w-full p-3.5 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100/80 text-[#006CA3] font-bold text-xs transition-colors flex items-center justify-between cursor-pointer group text-left"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#006CA3]" />
                <span>Open Existing Saved Document</span>
              </div>
              <p className="text-[11px] font-normal text-slate-600">
                Loads existing field definitions ({existingDoc.fields?.length || 0} fields) and entered values without re-parsing.
              </p>
            </div>
          </button>

          <button
            onClick={onCreateNewCopy}
            className="w-full p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition-colors flex items-center justify-between cursor-pointer group text-left"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Copy className="w-4 h-4 text-slate-600" />
                <span>Create New Copy & Re-analyze</span>
              </div>
              <p className="text-[11px] font-normal text-slate-500">
                Analyzes as a fresh document record without altering the existing saved version.
              </p>
            </div>
          </button>

          <button
            onClick={onReplaceFile}
            className="w-full p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition-colors flex items-center justify-between cursor-pointer group text-left"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-slate-600" />
                <span>Reconnect PDF File to Existing Record</span>
              </div>
              <p className="text-[11px] font-normal text-slate-500">
                Updates the stored PDF binary while preserving all existing field definitions and values.
              </p>
            </div>
          </button>
        </div>

        {/* Cancel button */}
        <div className="pt-1 text-center">
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
