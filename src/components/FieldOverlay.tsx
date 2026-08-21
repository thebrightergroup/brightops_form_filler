import React, { useState, useRef } from 'react';
import { DetectedField, ViewMode } from '../types';
import { Sparkles, Trash2, Copy, Check, Move, HelpCircle, PenTool } from 'lucide-react';

interface FieldOverlayProps {
  field: DetectedField;
  viewMode: ViewMode;
  isSelected: boolean;
  onSelect: (field: DetectedField) => void;
  onUpdateField: (updated: DetectedField) => void;
  onDeleteField: (id: string) => void;
  onDuplicateField: (field: DetectedField) => void;
  onOpenSignatureModal: (field: DetectedField) => void;
}

export const FieldOverlay: React.FC<FieldOverlayProps> = ({
  field,
  viewMode,
  isSelected,
  onSelect,
  onUpdateField,
  onDeleteField,
  onDuplicateField,
  onOpenSignatureModal,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; fieldX: number; fieldY: number }>({
    x: 0,
    y: 0,
    fieldX: 0,
    fieldY: 0,
  });
  const resizeStartRef = useRef<{ x: number; y: number; w: number; h: number }>({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  });

  const isDesignMode = viewMode === 'design';

  // Mouse Handlers for Dragging Field in Design Mode
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDesignMode) return;
    e.stopPropagation();
    onSelect(field);

    const container = (e.currentTarget as HTMLElement).closest('.pdf-page-container');
    if (!container) return;

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      fieldX: field.x,
      fieldY: field.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const dxPct = ((moveEvent.clientX - dragStartRef.current.x) / rect.width) * 100;
      const dyPct = ((moveEvent.clientY - dragStartRef.current.y) / rect.height) * 100;

      const newX = Math.max(0, Math.min(100 - field.width, dragStartRef.current.fieldX + dxPct));
      const newY = Math.max(0, Math.min(100 - field.height, dragStartRef.current.fieldY + dyPct));

      onUpdateField({
        ...field,
        x: Number(newX.toFixed(2)),
        y: Number(newY.toFixed(2)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Mouse Handlers for Resizing Field
  const handleResizeDown = (e: React.MouseEvent, corner: string) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);

    const container = (e.currentTarget as HTMLElement).closest('.pdf-page-container');
    if (!container) return;

    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: field.width,
      h: field.height,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const dxPct = ((moveEvent.clientX - resizeStartRef.current.x) / rect.width) * 100;
      const dyPct = ((moveEvent.clientY - resizeStartRef.current.y) / rect.height) * 100;

      let newW = field.width;
      let newH = field.height;

      if (corner.includes('r')) newW = Math.max(3, resizeStartRef.current.w + dxPct);
      if (corner.includes('b')) newH = Math.max(2, resizeStartRef.current.h + dyPct);

      onUpdateField({
        ...field,
        width: Number(newW.toFixed(2)),
        height: Number(newH.toFixed(2)),
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Value change handler for Fill Mode
  const handleValueChange = (val: string | boolean) => {
    onUpdateField({
      ...field,
      value: val,
    });
  };

  // Border and background color calculation
  const getFieldBorderClass = () => {
    if (isDesignMode) {
      if (isSelected) return 'border-2 border-[#006CA3] bg-[#006CA3]/15 shadow-md ring-2 ring-[#006CA3]/30 z-20';
      if (field.source === 'ai_detected') {
        if (field.requiresReview || (!field.accepted && field.confidence < 0.85)) {
          return 'border-2 border-dashed border-[#006CA3] bg-amber-500/10 z-10';
        }
        return 'border border-[#006CA3] bg-sky-500/15 z-10';
      }
      if (field.source === 'native_pdf') {
        return 'border border-[#006CA3] bg-[#006CA3]/10 z-10';
      }
      return 'border border-slate-700 bg-slate-500/10 z-10';
    }

    // Fill Mode
    if (field.fieldType === 'signature' || field.fieldType === 'initials') {
      return field.value
        ? 'border border-emerald-500 bg-emerald-50/50 hover:border-emerald-600'
        : 'border-2 border-dashed border-[#006CA3] bg-[#F4F8FC]/80 hover:bg-[#C2E4F5]/30 cursor-pointer';
    }
    return 'border border-slate-300 focus-within:border-[#006CA3] focus-within:ring-1 focus-within:ring-[#006CA3] bg-white/90 hover:border-slate-400';
  };

  const isReviewNeeded =
    field.source === 'ai_detected' && (field.requiresReview || (!field.accepted && field.confidence < 0.85));

  return (
    <div
      onClick={(e) => {
        if (isDesignMode) {
          e.stopPropagation();
          onSelect(field);
        }
      }}
      onMouseDown={handleMouseDown}
      style={{
        left: `${field.x}%`,
        top: `${field.y}%`,
        width: `${field.width}%`,
        height: `${field.height}%`,
      }}
      className={`absolute rounded transition-all select-none ${getFieldBorderClass()} ${
        isDesignMode ? 'cursor-move' : ''
      }`}
    >
      {/* Design Mode Header Overlay */}
      {isDesignMode && (
        <div className="absolute -top-6 left-0 flex items-center gap-1 z-30 pointer-events-auto">
          <div
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1 max-w-[170px] truncate ${
              isReviewNeeded
                ? 'bg-amber-800 text-amber-100 font-bold'
                : 'bg-[#0B1220] text-white'
            }`}
          >
            {field.source === 'ai_detected' && (
              <Sparkles className="w-2.5 h-2.5 text-sky-400 flex-shrink-0" />
            )}
            <span className="truncate">{field.label || 'Unnamed'}</span>
            {isReviewNeeded && (
              <span className="bg-amber-500 text-slate-950 font-bold text-[9px] px-1 rounded-xs uppercase">
                Review
              </span>
            )}
            {field.required && <span className="text-rose-400 font-bold">*</span>}
          </div>

          {isSelected && (
            <div className="flex items-center gap-1 bg-[#0B1220] p-0.5 rounded shadow-xs">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateField(field);
                }}
                className="p-1 hover:bg-slate-700 text-slate-200 rounded"
                title="Duplicate Field"
              >
                <Copy className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteField(field.id);
                }}
                className="p-1 hover:bg-rose-900 text-rose-300 rounded"
                title="Delete Field"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Resize Handle for Design Mode */}
      {isDesignMode && isSelected && (
        <div
          onMouseDown={(e) => handleResizeDown(e, 'rb')}
          className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#006CA3] border border-white rounded-full cursor-se-resize z-30 shadow-xs"
        />
      )}

      {/* Input Control Rendering (Fill Mode / Preview) */}
      <div className="w-full h-full flex items-center justify-center p-0.5 overflow-hidden">
        {field.fieldType === 'checkbox' ? (
          <label className="flex items-center justify-center w-full h-full cursor-pointer">
            <input
              type="checkbox"
              checked={!!field.value}
              onChange={(e) => handleValueChange(e.target.checked)}
              disabled={isDesignMode}
              className="w-4 h-4 text-[#006CA3] rounded border-slate-300 focus:ring-[#006CA3]"
            />
          </label>
        ) : field.fieldType === 'signature' || field.fieldType === 'initials' ? (
          <div
            onClick={(e) => {
              if (!isDesignMode) {
                e.stopPropagation();
                onOpenSignatureModal(field);
              }
            }}
            className="w-full h-full flex items-center justify-center text-center p-1"
          >
            {field.value ? (
              typeof field.value === 'string' && field.value.startsWith('data:image/') ? (
                <img
                  src={field.value as string}
                  alt={field.label}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="font-serif italic font-bold text-slate-900 text-xs sm:text-sm">
                  {String(field.value)}
                </span>
              )
            ) : (
              <div className="flex items-center gap-1 text-[#006CA3] text-[11px] font-medium">
                <PenTool className="w-3 h-3" />
                <span>{field.fieldType === 'signature' ? 'Click to Sign' : 'Click Initials'}</span>
              </div>
            )}
          </div>
        ) : field.fieldType === 'multiline' ? (
          <textarea
            value={String(field.value || '')}
            onChange={(e) => handleValueChange(e.target.value)}
            disabled={isDesignMode}
            placeholder={isDesignMode ? field.label : ''}
            className="w-full h-full resize-none border-none bg-transparent p-1 text-xs text-slate-900 focus:outline-none"
          />
        ) : field.fieldType === 'select' ? (
          <select
            value={String(field.value || '')}
            onChange={(e) => handleValueChange(e.target.value)}
            disabled={isDesignMode}
            className="w-full h-full border-none bg-transparent p-0.5 text-xs text-slate-900 focus:outline-none"
          >
            <option value="">Select...</option>
            {(field.options || ['Option 1', 'Option 2', 'Option 3']).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={
              field.fieldType === 'date'
                ? 'date'
                : field.fieldType === 'email'
                ? 'email'
                : field.fieldType === 'number' || field.fieldType === 'currency'
                ? 'number'
                : 'text'
            }
            value={String(field.value || '')}
            onChange={(e) => handleValueChange(e.target.value)}
            disabled={isDesignMode}
            placeholder={isDesignMode ? field.label : ''}
            className="w-full h-full border-none bg-transparent px-1 text-xs text-slate-900 focus:outline-none"
          />
        )}
      </div>
    </div>
  );
};
