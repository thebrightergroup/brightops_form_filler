import React, { useState } from 'react';
import { DetectedField, FieldType, DataSource, DocumentRecord, ViewMode } from '../types';
import { toMachineName } from '../lib/pdfAnalyzer';
import {
  Sliders,
  FileText,
  Sparkles,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  Database,
  Type,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Edit3,
  CheckSquare,
  Download,
  Save,
  ArrowRight,
  RefreshCw,
  X,
  FileCheck,
  HelpCircle,
  Clock,
} from 'lucide-react';

interface InspectorPanelProps {
  selectedField: DetectedField | null;
  onUpdateField: (updated: DetectedField) => void;
  onDeleteField: (id: string) => void;
  onDuplicateField: (field: DetectedField) => void;
  documentRecord: DocumentRecord;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onAnalyzePdf: () => void;
  onCheckForm: () => void;
  onSuggestNames: () => void;
  onShowStorageDiagnostics?: () => void;
  isAnalyzing: boolean;
  onDownloadFillablePdf: () => void;
  onSaveProgress: () => void;
  onCompleteAndExport: () => void;
  onSaveAndClose: () => void;
  isExporting: boolean;
  exportError: string | null;
  onClearExportError: () => void;
  saveToast: string | null;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedField,
  onUpdateField,
  onDeleteField,
  onDuplicateField,
  documentRecord,
  viewMode,
  setViewMode,
  onAnalyzePdf,
  onCheckForm,
  onSuggestNames,
  onShowStorageDiagnostics,
  isAnalyzing,
  onDownloadFillablePdf,
  onSaveProgress,
  onCompleteAndExport,
  onSaveAndClose,
  isExporting,
  exportError,
  onClearExportError,
  saveToast,
}) => {
  const [activeTab, setActiveTab] = useState<'field' | 'document'>('document');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [selectedWorkflowChoice, setSelectedWorkflowChoice] = useState<
    'fill' | 'download' | 'decide_later' | null
  >(viewMode === 'fill' ? 'fill' : null);

  // Derived field counts for Document Overview
  const totalFields = documentRecord.fields.length;
  const nativeFields = documentRecord.fields.filter((f) => f.source === 'native_pdf').length;
  const aiFields = documentRecord.fields.filter((f) => f.source === 'ai_detected').length;
  const userFields = documentRecord.fields.filter((f) => f.source === 'user_created').length;
  const needsReview = documentRecord.fields.filter(
    (f) => f.requiresReview || (!f.accepted && f.source === 'ai_detected')
  ).length;
  const requiredFields = documentRecord.fields.filter((f) => f.required).length;
  const completedRequired = documentRecord.fields.filter(
    (f) => f.required && f.value !== undefined && f.value !== '' && f.value !== false
  ).length;

  const handleLabelChange = (newLabel: string) => {
    if (!selectedField) return;
    const autoMachine = toMachineName(newLabel);
    onUpdateField({
      ...selectedField,
      label: newLabel,
      machineName: autoMachine,
    });
  };

  const handleSelectFillMode = () => {
    setSelectedWorkflowChoice('fill');
    setViewMode('fill');
  };

  const handleSelectDownloadPdf = () => {
    setSelectedWorkflowChoice('download');
    onDownloadFillablePdf();
  };

  const handleSelectDecideLater = () => {
    setSelectedWorkflowChoice('decide_later');
    onSaveAndClose();
  };

  return (
    <aside className="w-80 sm:w-96 bg-white border-l border-slate-200 flex flex-col h-full shadow-sm select-none flex-shrink-0 min-h-0 overflow-hidden">
      {/* Inspector Header Tabs */}
      <div className="flex items-center border-b border-slate-200 bg-slate-50 flex-shrink-0">
        <button
          onClick={() => setActiveTab('document')}
          className={`flex-1 py-3 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'document'
              ? 'border-[#006CA3] text-[#006CA3] bg-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Document Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('field')}
          className={`flex-1 py-3 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer relative ${
            activeTab === 'field'
              ? 'border-[#006CA3] text-[#006CA3] bg-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Field Properties</span>
          {selectedField && (
            <span className="w-2 h-2 rounded-full bg-sky-500 absolute top-2 right-2" />
          )}
        </button>
      </div>

      {/* Tab 1: Document Overview & Post-Analysis Workflow */}
      {activeTab === 'document' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Toast Notification */}
          {saveToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in duration-200 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold">{saveToast}</span>
            </div>
          )}

          {/* Export / Prepare Error Banner */}
          {exportError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1.5 animate-in fade-in duration-200 shadow-2xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Notice</span>
                </div>
                <button
                  onClick={onClearExportError}
                  className="text-amber-500 hover:text-amber-800 cursor-pointer p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] leading-snug">{exportError}</p>
            </div>
          )}

          {/* Step-Based Post-Analysis Workflow Container */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-4 shadow-2xs">
            {/* Header / Next Step Title */}
            <div className="space-y-1 pb-2 border-b border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006CA3] bg-sky-100 px-2 py-0.5 rounded font-mono">
                  NEXT STEP
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Step-by-step guidance</span>
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base">
                What would you like to do with this form?
              </h3>
            </div>

            {/* Step 1: Form Analysed Summary */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-mono">
                  1
                </span>
                <span>Form Analysed</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-semibold">PAGES</span>
                  <span className="font-bold text-sm font-mono text-slate-800">
                    {documentRecord.pagesCount || 1}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                    PDF FIELDS
                  </span>
                  <span className="font-bold text-sm font-mono text-slate-800">{nativeFields}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] text-[#006CA3] block font-semibold uppercase">
                    AI ADDED
                  </span>
                  <span className="font-bold text-sm font-mono text-[#006CA3]">{aiFields}</span>
                </div>
                <div
                  className={`p-2 rounded-lg border shadow-2xs ${
                    needsReview > 0
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-white border-slate-200/80'
                  }`}
                >
                  <span
                    className={`text-[10px] block font-semibold ${
                      needsReview > 0 ? 'text-amber-700' : 'text-slate-400'
                    }`}
                  >
                    NEEDS REVIEW
                  </span>
                  <span
                    className={`font-bold text-sm font-mono ${
                      needsReview > 0 ? 'text-amber-800' : 'text-slate-800'
                    }`}
                  >
                    {needsReview}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2: Choose What You Want To Do Next */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-mono">
                  2
                </span>
                <span>Choose Your Path</span>
              </div>

              {/* 3 Clickable Action Cards */}
              <div className="space-y-2">
                {/* OPTION 1: Fill in this form now */}
                <button
                  onClick={handleSelectFillMode}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer group shadow-2xs relative ${
                    viewMode === 'fill' || selectedWorkflowChoice === 'fill'
                      ? 'bg-sky-50 border-[#006CA3] ring-1 ring-[#006CA3]'
                      : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-sky-100 text-[#006CA3] flex-shrink-0">
                        <CheckSquare className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-slate-900 group-hover:text-[#006CA3]">
                        Fill in this form now
                      </span>
                    </div>
                    {viewMode === 'fill' && (
                      <span className="text-[9px] font-extrabold uppercase bg-[#006CA3] text-white px-1.5 py-0.5 rounded font-mono">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    Use BrightOps Form Filler to complete the form in your browser. You can save progress and export when finished.
                  </p>
                </button>

                {/* OPTION 2: Download fillable PDF for later */}
                <button
                  onClick={handleSelectDownloadPdf}
                  disabled={isExporting}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer group shadow-2xs ${
                    selectedWorkflowChoice === 'download'
                      ? 'bg-sky-50 border-[#006CA3]'
                      : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50/40'
                  } disabled:opacity-60`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-sky-100 text-[#006CA3] flex-shrink-0">
                        <Download className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-slate-900 group-hover:text-[#006CA3]">
                        Download fillable PDF for later
                      </span>
                    </div>
                    {isExporting && selectedWorkflowChoice === 'download' && (
                      <RefreshCw className="w-3.5 h-3.5 text-[#006CA3] animate-spin" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    Download a fillable PDF so you can complete it later in your browser or PDF software.
                  </p>
                </button>

                {/* OPTION 3: Decide later / Save and close */}
                <button
                  onClick={handleSelectDecideLater}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer group shadow-2xs ${
                    selectedWorkflowChoice === 'decide_later'
                      ? 'bg-sky-50 border-[#006CA3]'
                      : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 flex-shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 group-hover:text-[#006CA3]">
                      Decide later / Save and close
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    Save the detected form structure and return later to continue.
                  </p>
                </button>
              </div>
            </div>

            {/* Step 3: Follow Selected Path Panel */}
            <div className="pt-2 border-t border-slate-200/80 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-mono">
                  3
                </span>
                <span>Active Path Controls</span>
              </div>

              {viewMode === 'fill' ? (
                <div className="bg-white rounded-xl p-3 border border-sky-200 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-[#006CA3]" />
                      Form Filler Active
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Required: {completedRequired} / {requiredFields}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">
                    Fill out the fields directly on the document pages. You can save your progress at any time or complete and export when finished.
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={onSaveProgress}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5 text-slate-500" />
                      <span>Save progress</span>
                    </button>

                    <button
                      onClick={onCompleteAndExport}
                      disabled={isExporting}
                      className="px-3 py-2 rounded-xl bg-[#006CA3] hover:bg-[#005a88] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      {isExporting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>Complete and export</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs text-slate-600 space-y-2 shadow-2xs">
                  <p className="text-[11px] text-slate-500">
                    Select <span className="font-semibold text-slate-700">"Fill in this form now"</span> above to activate form controls and start completing fields, or click <span className="font-semibold text-slate-700">"Design Fields"</span> in the top bar to adjust field locations.
                  </p>
                  <button
                    onClick={handleSelectFillMode}
                    className="w-full py-2 rounded-lg bg-sky-50 text-[#006CA3] font-bold hover:bg-sky-100 transition-colors flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Switch to Form Filler Mode</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Instructions Box: How this works */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2 shadow-2xs">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#006CA3]" />
              <span>How this works</span>
            </h4>
            <ol className="text-[11px] text-slate-600 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>We detect or import the form fields automatically.</li>
              <li>Choose whether you want to fill the form now, download it for later, or save it and return later.</li>
              <li>If you fill it now, you can save progress and export when finished.</li>
            </ol>
          </div>

          {/* Secondary / Admin Accordion: Advanced tools */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-3.5 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#006CA3]" />
                <span>Advanced tools</span>
              </div>
              {showAdvanced ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showAdvanced && (
              <div className="p-3 space-y-2 border-t border-slate-200 bg-white animate-in fade-in duration-150">
                <button
                  onClick={onAnalyzePdf}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <span>Analyse Document Fields</span>
                  <Sparkles className="w-3.5 h-3.5 text-[#006CA3]" />
                </button>

                <button
                  onClick={onCheckForm}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span>Check Form & Find Omissions</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </button>

                <button
                  onClick={onSuggestNames}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span>Auto-Format Machine Names</span>
                  <Type className="w-3.5 h-3.5 text-sky-600" />
                </button>

                {onShowStorageDiagnostics && (
                  <button
                    onClick={onShowStorageDiagnostics}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span>Storage & File Diagnostics</span>
                    <Database className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Field Properties Inspector */}
      {activeTab === 'field' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedField ? (
            <>
              {/* Field Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-heading font-bold text-slate-900 text-sm">
                    {selectedField.label || 'Unnamed Field'}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {selectedField.id}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDuplicateField(selectedField)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Duplicate Field"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteField(selectedField.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Field"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notice to switch back to Document Overview */}
              <button
                onClick={() => setActiveTab('document')}
                className="w-full py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100/80 border border-sky-200 text-[#006CA3] font-semibold text-xs flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>Go to Next Steps & Workflow →</span>
                <FileText className="w-3.5 h-3.5" />
              </button>

              {/* Form Controls */}
              <div className="space-y-3 text-xs">
                {/* Field Label */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Display Label
                  </label>
                  <input
                    type="text"
                    value={selectedField.label}
                    onChange={(e) => handleLabelChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#006CA3] focus:ring-1 focus:ring-[#006CA3] font-medium"
                  />
                </div>

                {/* Machine Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Machine Name / Variable ID
                  </label>
                  <input
                    type="text"
                    value={selectedField.machineName}
                    onChange={(e) =>
                      onUpdateField({
                        ...selectedField,
                        machineName: toMachineName(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#006CA3] font-mono text-[11px]"
                  />
                </div>

                {/* Field Type Selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Field Type
                  </label>
                  <select
                    value={selectedField.fieldType}
                    onChange={(e) =>
                      onUpdateField({
                        ...selectedField,
                        fieldType: e.target.value as FieldType,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#006CA3] font-medium bg-white"
                  >
                    <option value="text">Text Input</option>
                    <option value="multiline">Multi-Line Text Area</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="date">Date Picker</option>
                    <option value="dropdown">Dropdown Select</option>
                    <option value="signature">Digital Signature</option>
                    <option value="initials">Initials</option>
                  </select>
                </div>

                {/* Required Toggle */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-700">Required Field</span>
                  <input
                    type="checkbox"
                    checked={selectedField.required}
                    onChange={(e) =>
                      onUpdateField({
                        ...selectedField,
                        required: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-[#006CA3] focus:ring-[#006CA3] cursor-pointer"
                  />
                </div>

                {/* Technical Coordinates */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Page Number:</span>
                    <span className="font-bold text-slate-800">{selectedField.pageNumber}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Field Source:</span>
                    <span className="font-mono text-slate-800 font-bold">
                      {selectedField.source}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <Sliders className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium">Select a field on the PDF page to edit properties.</p>
              <button
                onClick={() => setActiveTab('document')}
                className="mt-2 text-xs font-bold text-[#006CA3] hover:underline cursor-pointer block mx-auto"
              >
                Or view Document Next Steps →
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
