import React, { useState } from 'react';
import {
  Trash2,
  RotateCcw,
  Eraser,
  AlertTriangle,
  FileText,
  X,
  CheckCircle2,
  Layers,
} from 'lucide-react';

export type ResetActionType = 'clear_values' | 'clear_fields' | 'delete_form';

interface ResetDocumentModalProps {
  isOpen: boolean;
  documentTitle: string;
  fieldsCount: number;
  filledValuesCount: number;
  initialAction?: ResetActionType;
  onClose: () => void;
  onClearValues: () => void;
  onClearAllFields: () => void;
  onDeleteDocument: () => void;
}

export const ResetDocumentModal: React.FC<ResetDocumentModalProps> = ({
  isOpen,
  documentTitle,
  fieldsCount,
  filledValuesCount,
  initialAction,
  onClose,
  onClearValues,
  onClearAllFields,
  onDeleteDocument,
}) => {
  const [selectedAction, setSelectedAction] = useState<ResetActionType>(
    initialAction || (filledValuesCount > 0 ? 'clear_values' : 'clear_fields')
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen) return null;

  const handleExecute = () => {
    if (selectedAction === 'clear_values') {
      onClearValues();
      onClose();
    } else if (selectedAction === 'clear_fields') {
      onClearAllFields();
      onClose();
    } else if (selectedAction === 'delete_form') {
      onDeleteDocument();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl text-white ${
                selectedAction === 'delete_form' ? 'bg-rose-600' : 'bg-[#006CA3]'
              }`}
            >
              {selectedAction === 'delete_form' ? (
                <Trash2 className="w-5 h-5 text-white" />
              ) : selectedAction === 'clear_values' ? (
                <Eraser className="w-5 h-5 text-sky-200" />
              ) : (
                <RotateCcw className="w-5 h-5 text-sky-200" />
              )}
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-white">
                {selectedAction === 'delete_form'
                  ? 'Delete Form & Document'
                  : selectedAction === 'clear_values'
                  ? 'Clear All Entered Changes'
                  : 'Clear All Field Overlays'}
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-xs">
                {documentTitle || 'Current Document'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* Action Tabs / Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Choose Reset or Delete Action
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setSelectedAction('clear_values');
                  setConfirmDelete(false);
                }}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  selectedAction === 'clear_values'
                    ? 'bg-white text-[#006CA3] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eraser className="w-4 h-4" />
                <span className="truncate">Clear Values</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedAction('clear_fields');
                  setConfirmDelete(false);
                }}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  selectedAction === 'clear_fields'
                    ? 'bg-white text-[#006CA3] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span className="truncate">Clear Fields</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedAction('delete_form');
                }}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  selectedAction === 'delete_form'
                    ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-sm'
                    : 'text-slate-600 hover:text-rose-600'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span className="truncate">Delete Form</span>
              </button>
            </div>
          </div>

          {/* Action Details & Explanation Card */}
          {selectedAction === 'clear_values' && (
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Eraser className="w-4 h-4 text-[#006CA3]" />
                <span>Reset Entered Values ({filledValuesCount} filled)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                This will wipe all entered form values (text, checkboxes, dates, and signatures)
                back to blank, allowing you to fill the form again from scratch.
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Field positions, layout, and machine names will be kept intact.</span>
              </div>
            </div>
          )}

          {selectedAction === 'clear_fields' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Layers className="w-4 h-4 text-amber-700" />
                <span>Remove All Field Overlays ({fieldsCount} fields)</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                This will delete all configured input boxes, signatures, and checkboxes from this
                document. You can re-draw them manually or click "Analyse Form" to re-detect fields.
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>The original document PDF file will remain open.</span>
              </div>
            </div>
          )}

          {selectedAction === 'delete_form' && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Delete Form & Return to Start</span>
              </div>
              <p className="text-rose-700 leading-relaxed">
                This will permanently delete this document, its stored PDF binary, and all
                configured fields ({fieldsCount} fields) from your browser library.
              </p>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-rose-800 select-none pt-1">
                <input
                  type="checkbox"
                  checked={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-rose-300 focus:ring-rose-500"
                />
                <span>I understand this form will be permanently deleted</span>
              </label>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecute}
            disabled={selectedAction === 'delete_form' && !confirmDelete}
            className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedAction === 'delete_form'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-[#006CA3] hover:bg-[#005a88]'
            }`}
          >
            {selectedAction === 'delete_form' ? (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Form Permanently</span>
              </>
            ) : selectedAction === 'clear_values' ? (
              <>
                <Eraser className="w-4 h-4" />
                <span>Clear All Entered Values</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Clear All Field Overlays</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
