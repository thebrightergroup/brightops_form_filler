import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, FileCheck, Bug, X, ChevronDown, ChevronUp } from 'lucide-react';
import { PdfExportResult } from '../types';

interface ExportStatusModalProps {
  isOpen: boolean;
  documentTitle: string;
  exportResult?: PdfExportResult | null;
  errorMessage?: string | null;
  onClose: () => void;
  onRetryFillable: () => void;
  onExportFlattened: () => void;
}

export const ExportStatusModal: React.FC<ExportStatusModalProps> = ({
  isOpen,
  documentTitle,
  exportResult,
  errorMessage,
  onClose,
  onRetryFillable,
  onExportFlattened,
}) => {
  const [showTechDetails, setShowTechDetails] = useState<boolean>(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto text-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Unable to prepare the fillable PDF
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-[320px] mt-0.5">
                {documentTitle || 'Current Document'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User-Facing Explanation */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-950 leading-relaxed space-y-2">
          <p className="font-semibold text-slate-900">
            This document contains PDF form controls that could not be safely updated.
          </p>
          <p className="text-slate-600">
            Your work has not been lost. You can try again or export a completed PDF instead.
          </p>
        </div>

        {/* Export Field Statistics */}
        {exportResult && (
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Attempted</div>
              <div className="font-bold text-slate-800 mt-0.5">{exportResult.fieldsAttempted}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Written</div>
              <div className="font-bold text-emerald-600 mt-0.5">{exportResult.fieldsSuccessfullyWritten}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Skipped</div>
              <div className="font-bold text-slate-600 mt-0.5">{exportResult.fieldsSkipped}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Failed</div>
              <div className="font-bold text-rose-600 mt-0.5">{exportResult.fieldsFailed}</div>
            </div>
          </div>
        )}

        {/* Technical Details Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowTechDetails(!showTechDetails)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Bug className="w-3.5 h-3.5 text-slate-400" />
            <span>Technical details</span>
            {showTechDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showTechDetails && (
            <div className="mt-2.5 bg-slate-900 text-slate-300 font-mono text-[11px] p-3.5 rounded-xl space-y-2 max-h-48 overflow-y-auto">
              {errorMessage && (
                <div>
                  <span className="text-rose-400 font-bold">Error: </span>
                  <span>{errorMessage}</span>
                </div>
              )}
              {exportResult?.warnings && exportResult.warnings.length > 0 && (
                <div>
                  <span className="text-amber-400 font-bold">Warnings:</span>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-slate-400">
                    {exportResult.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
              {exportResult?.failures && exportResult.failures.length > 0 && (
                <div>
                  <span className="text-rose-400 font-bold">Field Failures:</span>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-slate-400">
                    {exportResult.failures.map((f, idx) => (
                      <li key={idx}>
                        {f.label} ({f.originalPdfFieldName || f.machineName}): {f.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(!exportResult || ((!exportResult.warnings || exportResult.warnings.length === 0) && (!exportResult.failures || exportResult.failures.length === 0))) && !errorMessage && (
                <div className="text-slate-400">No low-level failure logs recorded.</div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onRetryFillable}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Try again</span>
          </button>

          <button
            type="button"
            onClick={onExportFlattened}
            className="px-4 py-2.5 rounded-xl bg-[#006CA3] hover:bg-[#005a88] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <FileCheck className="w-4 h-4 text-sky-200" />
            <span>Export completed PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
