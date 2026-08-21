import React from 'react';
import { BrandLogo } from '../brand/BrandLogo';
import { ViewMode, AppMode, DocumentStatus } from '../types';
import {
  FileText,
  Sparkles,
  Edit3,
  CheckSquare,
  Save,
  Eye,
  Download,
  ArrowLeft,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';

interface HeaderProps {
  documentTitle: string;
  status: DocumentStatus;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onBackToStart: () => void;
  onAnalyzePdf: () => void;
  onOpenReview: () => void;
  onSaveTemplate: () => void;
  onPreview: () => void;
  onComplete: () => void;
  isAnalyzing: boolean;
  unacceptedAiCount: number;
  totalFieldsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  documentTitle,
  status,
  viewMode,
  setViewMode,
  onBackToStart,
  onAnalyzePdf,
  onOpenReview,
  onSaveTemplate,
  onPreview,
  onComplete,
  isAnalyzing,
  unacceptedAiCount,
  totalFieldsCount,
}) => {
  return (
    <header className="bg-[#0B1220] text-white border-b border-[#1E293B] sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Back button */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onBackToStart}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Return to Start Screen"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <BrandLogo size="md" variant="light" className="hidden sm:flex" />

          <div className="h-6 w-px bg-slate-700 hidden sm:block" />

          {/* Document Title & Status Pill */}
          <div className="min-w-0 flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm sm:text-base text-slate-100 truncate max-w-[180px] sm:max-w-[280px]">
                {documentTitle || 'Untitled Document'}
              </span>
              <span
                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                  status === 'Completed'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : status === 'In Progress'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'bg-slate-700/60 text-slate-300 border border-slate-600'
                }`}
              >
                {status}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono hidden md:inline">
              {totalFieldsCount} {totalFieldsCount === 1 ? 'field' : 'fields'} configured
            </span>
          </div>
        </div>

        {/* Center: Design Fields vs Fill Document Toggle */}
        <div className="flex items-center bg-[#152033] p-1 rounded-lg border border-slate-700/60 shadow-inner">
          <button
            onClick={() => setViewMode('design')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'design'
                ? 'bg-[#006CA3] text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Design Fields</span>
          </button>

          <button
            onClick={() => setViewMode('fill')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'fill'
                ? 'bg-[#006CA3] text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Fill Document</span>
          </button>
        </div>

        {/* Right: Actions (Analyse, Review, Save Template, Preview, Complete) */}
        <div className="flex items-center gap-2">
          {/* AI Analyse Form button */}
          <button
            onClick={onAnalyzePdf}
            disabled={isAnalyzing}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1E293B] hover:bg-[#334155] text-sky-300 border border-sky-500/30 transition-colors disabled:opacity-50"
            title="Analyse document using Gemini AI"
          >
            <Sparkles className={`w-3.5 h-3.5 text-sky-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing...' : 'Analyse Form'}</span>
          </button>

          {/* Review AI Fields count pill */}
          {unacceptedAiCount > 0 && (
            <button
              onClick={onOpenReview}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors animate-pulse-subtle"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Review ({unacceptedAiCount})</span>
            </button>
          )}

          {/* Save as Template */}
          <button
            onClick={onSaveTemplate}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1E293B] text-slate-200 hover:bg-[#334155] hover:text-white transition-colors"
            title="Save field layout as reusable document template"
          >
            <Save className="w-3.5 h-3.5 text-slate-400" />
            <span>Save Template</span>
          </button>

          {/* Preview */}
          <button
            onClick={onPreview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          {/* Complete / Export PDF */}
          <button
            onClick={onComplete}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#006CA3] hover:bg-[#005a88] text-white shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Complete</span>
          </button>
        </div>
      </div>
    </header>
  );
};
