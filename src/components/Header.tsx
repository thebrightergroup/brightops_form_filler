import React from 'react';
import { BrandLogo } from '../brand/BrandLogo';
import { ViewMode, AppMode, DocumentStatus } from '../types';
import { UserMenu } from '../auth/UserMenu';
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
  Zap,
  RotateCcw,
  Trash2,
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
  onOpenPrefillSettings?: () => void;
  onClearChanges?: () => void;
  onDeleteForm?: () => void;
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
  onOpenPrefillSettings,
  onClearChanges,
  onDeleteForm,
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
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
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
          {/* Quick Prefill Profile Button */}
          {onOpenPrefillSettings && (
            <button
              onClick={onOpenPrefillSettings}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1E293B] hover:bg-[#334155] text-sky-300 border border-sky-500/30 transition-colors cursor-pointer"
              title="Browser Stored Profile & Auto-Prefill Data"
            >
              <Zap className="w-3.5 h-3.5 text-sky-400 fill-sky-400/40" />
              <span>Auto-Prefill</span>
            </button>
          )}

          {/* AI Analyse Form button */}
          <button
            onClick={onAnalyzePdf}
            disabled={isAnalyzing}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1E293B] hover:bg-[#334155] text-sky-300 border border-sky-500/30 transition-colors disabled:opacity-50 cursor-pointer"
            title="Analyse document using Gemini AI"
          >
            <Sparkles className={`w-3.5 h-3.5 text-sky-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing...' : 'Analyse Form'}</span>
          </button>

          {/* Review AI Fields count pill */}
          {unacceptedAiCount > 0 && (
            <button
              onClick={onOpenReview}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors animate-pulse-subtle cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Review ({unacceptedAiCount})</span>
            </button>
          )}

          {/* Save as Template */}
          <button
            onClick={onSaveTemplate}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1E293B] text-slate-200 hover:bg-[#334155] hover:text-white transition-colors cursor-pointer"
            title="Save field layout as reusable document template"
          >
            <Save className="w-3.5 h-3.5 text-slate-400" />
            <span>Save Template</span>
          </button>

          {/* Preview */}
          <button
            onClick={onPreview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          {/* Clear Changes / Start Again */}
          {onClearChanges && (
            <button
              onClick={onClearChanges}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1E293B] text-slate-200 hover:bg-[#334155] hover:text-white transition-colors cursor-pointer border border-slate-700/50"
              title="Clear form changes or restart"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Clear Changes</span>
            </button>
          )}

          {/* Delete Form */}
          {onDeleteForm && (
            <button
              onClick={onDeleteForm}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 border border-rose-500/30 transition-colors cursor-pointer"
              title="Delete this form and all configured fields"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden xl:inline">Delete Form</span>
            </button>
          )}

          {/* Complete / Export PDF */}
          <button
            onClick={onComplete}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#006CA3] hover:bg-[#005a88] text-white shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Complete</span>
          </button>

          <div className="h-6 w-px bg-slate-700 hidden sm:block mx-1" />

          {/* User Profile / Menu */}
          <UserMenu onOpenPrefillSettings={onOpenPrefillSettings} />
        </div>
      </div>
    </header>
  );
};

