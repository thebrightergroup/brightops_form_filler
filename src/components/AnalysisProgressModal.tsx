import React from 'react';
import { Loader2, Sparkles, XCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AnalysisProgressModalProps {
  documentTitle: string;
  currentPage: number;
  totalPages: number;
  nativeCount: number;
  aiCreatedCount: number;
  reviewCount: number;
  onCancel: () => void;
}

export const AnalysisProgressModal: React.FC<AnalysisProgressModalProps> = ({
  documentTitle,
  currentPage,
  totalPages,
  nativeCount,
  aiCreatedCount,
  reviewCount,
  onCancel,
}) => {
  const percentage = Math.min(100, Math.round((currentPage / (totalPages || 1)) * 100));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-100 text-[#006CA3] rounded-xl">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Analysing Form Fields</h3>
            <p className="text-xs text-slate-500 truncate max-w-[280px]">{documentTitle}</p>
          </div>
        </div>

        {/* Progress Bar & Status */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-[#006CA3] flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Processing Page {currentPage} of {totalPages}</span>
            </span>
            <span className="font-mono text-slate-700">{percentage}%</span>
          </div>

          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="h-full bg-gradient-to-r from-[#006CA3] to-sky-400 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Dynamic Stats Grid */}
        <div className="grid grid-cols-3 gap-2 py-1">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Native</div>
            <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{nativeCount}</div>
          </div>

          <div className="bg-sky-50/60 p-2.5 rounded-xl border border-sky-100 text-center">
            <div className="text-[10px] font-semibold text-[#006CA3] uppercase tracking-wider">AI Created</div>
            <div className="text-sm font-bold text-[#006CA3] font-mono mt-0.5">{aiCreatedCount}</div>
          </div>

          <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100 text-center">
            <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">Needs Review</div>
            <div className="text-sm font-bold text-amber-800 font-mono mt-0.5">{reviewCount}</div>
          </div>
        </div>

        {/* Footer / Cancel */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 italic">
            Scanning page structure & visual inputs...
          </span>
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
};
