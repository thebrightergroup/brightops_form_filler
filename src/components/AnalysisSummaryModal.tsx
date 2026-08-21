import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Eye,
  Bug,
  PenTool,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { AnalysisStatus, PdfParsingDiagnostics } from '../types';

interface AnalysisSummaryModalProps {
  documentTitle: string;
  status: AnalysisStatus;
  statusMessage: string;
  diagnostics: PdfParsingDiagnostics;
  pagesAnalysed: number;
  nativeCount: number;
  aiCreatedCount: number;
  reviewCount: number;
  onReview: () => void;
  onAcceptAllHighConfidence: () => void;
  onEnterManualDesignMode?: () => void;
  onClose: () => void;
}

export const AnalysisSummaryModal: React.FC<AnalysisSummaryModalProps> = ({
  documentTitle,
  status,
  statusMessage,
  diagnostics,
  pagesAnalysed,
  nativeCount,
  aiCreatedCount,
  reviewCount,
  onReview,
  onAcceptAllHighConfidence,
  onEnterManualDesignMode,
  onClose,
}) => {
  const totalFields = nativeCount + aiCreatedCount;

  const isSuccess = status === 'SUCCESS';
  const isWarning = status === 'SUCCESS_WITH_WARNING';
  const isPartial = status === 'PARTIAL';
  const isFailed = status === 'FAILED';

  // Plain-language user message formatting according to BG-DEMS-001
  const renderUserSummaryMessage = () => {
    if (statusMessage) {
      // Map known raw library parse errors to plain human language
      if (statusMessage.includes('PDFDict') || statusMessage.includes('parse error') || statusMessage.includes('pdf-lib')) {
        return (
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">
              Some PDF form controls could not be fully processed.
            </p>
            <p className="text-slate-600">
              {nativeCount > 0
                ? `${nativeCount} existing form fields were imported successfully. You can continue, but some advanced PDF features may require review.`
                : 'You can continue and add fields manually using Design Mode.'}
            </p>
          </div>
        );
      }
      return <p className="font-medium text-slate-700">{statusMessage}</p>;
    }

    if (isFailed) {
      return (
        <div className="space-y-1">
          <p className="font-semibold text-rose-900">
            Document processing could not extract form fields automatically.
          </p>
          <p className="text-rose-700">
            You can continue working with this document and place form fields manually using Design Mode.
          </p>
        </div>
      );
    }

    if (totalFields === 0) {
      return (
        <p className="font-medium text-slate-700">
          No form fields were detected automatically. You can add fields manually using Design Mode.
        </p>
      );
    }

    return (
      <div className="space-y-1">
        <p className="font-semibold text-slate-800">
          {totalFields} form fields ready across {pagesAnalysed} pages.
        </p>
        {aiCreatedCount === 0 && nativeCount > 0 ? (
          <p className="text-slate-600">
            No additional fields were needed. Existing PDF fields were detected successfully.
          </p>
        ) : reviewCount > 0 ? (
          <p className="text-slate-600">
            {reviewCount} fields have been flagged for your review before completion.
          </p>
        ) : (
          <p className="text-slate-600">
            All fields were placed successfully and are ready for completion.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                isSuccess
                  ? 'bg-emerald-100 text-emerald-800'
                  : isWarning
                  ? 'bg-amber-100 text-amber-800'
                  : isPartial
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : isWarning || isPartial ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <ShieldAlert className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900">
                  {isSuccess || isWarning ? 'Analysis Complete' : isPartial ? 'Analysis Partial' : 'Analysis Unsuccessful'}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                    isSuccess
                      ? 'bg-emerald-100 text-emerald-800'
                      : isWarning || isPartial
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isWarning ? 'SUCCESS WITH WARNING' : status}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-[320px]">{documentTitle}</p>
            </div>
          </div>
        </div>

        {/* SECTION 1: USER SUMMARY */}
        <div className="space-y-3">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            User Summary
          </div>

          {/* Breakdown Stats Grid with Plain Language Labels */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pages</div>
              <div className="text-base font-extrabold text-slate-800 font-mono mt-0.5">{pagesAnalysed}</div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Existing PDF Fields</div>
              <div className="text-base font-extrabold text-slate-800 font-mono mt-0.5">{nativeCount}</div>
            </div>

            <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-200/80 text-center">
              <div className="text-[10px] font-bold text-[#006CA3] uppercase tracking-wider">AI Added</div>
              <div className="text-base font-extrabold text-[#006CA3] font-mono mt-0.5">{aiCreatedCount}</div>
            </div>

            <div
              className={`p-2.5 rounded-xl border text-center ${
                reviewCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  reviewCount > 0 ? 'text-amber-800' : 'text-slate-500'
                }`}
              >
                Needs Review
              </div>
              <div
                className={`text-base font-extrabold font-mono mt-0.5 ${
                  reviewCount > 0 ? 'text-amber-900' : 'text-slate-800'
                }`}
              >
                {reviewCount}
              </div>
            </div>
          </div>

          {/* User Message Banner */}
          <div
            className={`border rounded-xl p-3.5 text-xs leading-relaxed flex items-start gap-3 ${
              isSuccess
                ? 'bg-sky-50/70 border-sky-100 text-slate-700'
                : isWarning || isPartial
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}
          >
            {isSuccess ? (
              <Sparkles className="w-4 h-4 text-[#006CA3] flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0 break-words [overflow-wrap:anywhere] whitespace-normal">
              {renderUserSummaryMessage()}
            </div>
          </div>
        </div>

        {/* SECTION 2: TECHNICAL DIAGNOSTICS (EXPANDABLE) */}
        <details className="group border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
          <summary className="flex items-center justify-between p-3 cursor-pointer text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors select-none">
            <span className="flex items-center gap-2">
              <Bug className="w-3.5 h-3.5 text-slate-500" />
              <span>Technical details</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-normal">For support/development use only</span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
            </div>
          </summary>

          <div className="p-3.5 border-t border-slate-200 space-y-2 text-xs bg-white break-words [overflow-wrap:anywhere] whitespace-normal">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="font-sans text-slate-500">PDF Page Count:</span>
                <span className="font-bold text-slate-800">{diagnostics?.pageCount ?? pagesAnalysed}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-500">AcroForm Present:</span>
                <span
                  className={`font-bold ${
                    diagnostics?.acroFormPresent ? 'text-emerald-700' : 'text-slate-600'
                  }`}
                >
                  {diagnostics?.acroFormPresent ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-500">Raw Field Nodes:</span>
                <span className="font-bold text-slate-800">{diagnostics?.rawFieldNodesCount ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-500">Widget Annotations:</span>
                <span className="font-bold text-slate-800">{diagnostics?.widgetAnnotationsCount ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-500">Existing PDF Fields:</span>
                <span className="font-bold text-slate-800">{diagnostics?.nativeFieldsImported ?? nativeCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-500">AI Added Fields:</span>
                <span className="font-bold text-[#006CA3]">{diagnostics?.aiFieldsCreated ?? aiCreatedCount}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[10px]">
              <span className="font-bold text-slate-600 block mb-1">Raw Parser Log / Warnings:</span>
              {diagnostics?.warningsAndErrors && diagnostics.warningsAndErrors.length > 0 ? (
                <div className="p-2 bg-slate-50 border border-slate-200 rounded font-mono text-rose-700 max-h-24 overflow-y-auto space-y-1 break-words [overflow-wrap:anywhere] whitespace-normal">
                  {diagnostics.warningsAndErrors.map((err, i) => (
                    <div key={i} className="leading-snug break-words [overflow-wrap:anywhere]">
                      {err}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-slate-400 font-mono italic">None reported</span>
              )}
            </div>
          </div>
        </details>

        {/* Actions */}
        <div className="pt-1 flex flex-col sm:flex-row gap-2">
          {reviewCount > 0 && (
            <button
              onClick={() => {
                onReview();
                onClose();
              }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Review {reviewCount} Fields</span>
            </button>
          )}

          <button
            onClick={() => {
              onAcceptAllHighConfidence();
              onClose();
            }}
            disabled={aiCreatedCount === 0}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#006CA3] hover:bg-[#005a88] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Accept All High Confidence</span>
          </button>

          <button
            onClick={onClose}
            disabled={totalFields === 0}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Eye className="w-4 h-4" />
            <span>View Fields</span>
          </button>
        </div>

        {/* Manual Design Mode option if 0 fields exist */}
        {totalFields === 0 && (
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              onClick={() => {
                if (onEnterManualDesignMode) onEnterManualDesignMode();
                onClose();
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <PenTool className="w-4 h-4 text-sky-400" />
              <span>Enter Manual Design Mode</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
