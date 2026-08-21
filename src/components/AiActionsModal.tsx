import React from 'react';
import { ShieldCheck, AlertCircle, CheckCircle, X, Plus } from 'lucide-react';

interface AiActionsModalProps {
  missingFields: string[];
  recommendations: string[];
  onAddMissingField: (fieldName: string) => void;
  onClose: () => void;
}

export const AiActionsModal: React.FC<AiActionsModalProps> = ({
  missingFields,
  recommendations,
  onAddMissingField,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B1220] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            <h3 className="font-heading font-bold text-base">AI Form Completeness Audit</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Missing Fields section */}
          {missingFields.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Suggested Missing Fields</span>
              </h4>
              <p className="text-xs text-slate-500">
                The AI detected standard fields commonly expected in this type of document that are not yet added:
              </p>

              <div className="space-y-1.5">
                {missingFields.map((field) => (
                  <div
                    key={field}
                    className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs"
                  >
                    <span className="font-medium text-amber-900">{field}</span>
                    <button
                      onClick={() => onAddMissingField(field)}
                      className="px-2.5 py-1 bg-[#006CA3] hover:bg-[#005a88] text-white font-medium rounded-lg flex items-center gap-1 transition-colors text-[11px]"
                    >
                      <Plus className="w-3 h-3" /> Add Field
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>No major field omissions detected by AI.</span>
            </div>
          )}

          {/* Recommendations section */}
          {recommendations.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Compliance & Usability Recommendations
              </h4>

              <ul className="space-y-1.5 text-xs text-slate-600">
                {recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[#006CA3] font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#006CA3] text-white text-xs font-semibold rounded-xl hover:bg-[#005a88] shadow-xs"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
};
