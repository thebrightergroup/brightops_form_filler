import React from 'react';
import { DetectedField } from '../types';
import { Sparkles, Check, Trash2, CheckCircle2, X, AlertCircle } from 'lucide-react';

interface ReviewDrawerProps {
  fields: DetectedField[];
  onAcceptField: (id: string) => void;
  onAcceptAllHighConfidence: () => void;
  onDeleteField: (id: string) => void;
  onSelectField: (field: DetectedField) => void;
  onClose: () => void;
}

export const ReviewDrawer: React.FC<ReviewDrawerProps> = ({
  fields,
  onAcceptField,
  onAcceptAllHighConfidence,
  onDeleteField,
  onSelectField,
  onClose,
}) => {
  const unacceptedFields = fields.filter((f) => f.source === 'ai_detected' && !f.accepted);
  const highConfidenceCount = unacceptedFields.filter((f) => f.confidence >= 0.85).length;

  return (
    <div className="bg-[#0B1220] text-white border-b border-slate-700 p-4 shadow-xl relative z-20 animate-in slide-in-from-top duration-200">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Summary */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 flex-shrink-0">
            <Sparkles className="w-5 h-5 text-sky-400" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-sm sm:text-base text-white">
                AI Field Detection Review
              </h3>
              <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-semibold">
                {unacceptedFields.length} Pending Review
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Gemini identified visual form inputs. Review and accept field boundaries.
            </p>
          </div>
        </div>

        {/* Center: Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {highConfidenceCount > 0 && (
            <button
              onClick={onAcceptAllHighConfidence}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#006CA3] hover:bg-[#005a88] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Accept High Confidence ({highConfidenceCount})</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Field List Cards Horizontal Slider */}
      {unacceptedFields.length > 0 && (
        <div className="max-w-6xl mx-auto mt-4 pt-3 border-t border-slate-800 flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {unacceptedFields.map((field) => (
            <div
              key={field.id}
              onClick={() => onSelectField(field)}
              className="bg-[#152033] hover:bg-[#1C2C47] border border-slate-700 rounded-xl p-3 min-w-[240px] flex-shrink-0 flex flex-col justify-between cursor-pointer transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-semibold text-sky-200 truncate">{field.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      field.confidence >= 0.85
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {Math.round(field.confidence * 100)}%
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  Type: {field.fieldType} | Page {field.pageNumber}
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-800/80">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAcceptField(field.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-[#006CA3] hover:bg-[#005a88] text-white text-[11px] font-medium"
                >
                  <Check className="w-3 h-3" /> Accept
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteField(field.id);
                  }}
                  className="p-1 rounded hover:bg-rose-900/50 text-rose-400"
                  title="Remove Field"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
