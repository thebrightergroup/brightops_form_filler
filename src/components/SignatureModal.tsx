import React, { useRef, useState, useEffect } from 'react';
import { SignatureSession } from '../types';
import { PenTool, Type, Upload, X, RotateCcw, Check } from 'lucide-react';

interface SignatureModalProps {
  fieldLabel: string;
  isInitials?: boolean;
  signatureSession: SignatureSession;
  onSaveSignature: (signatureDataUrl: string, storeInSession: boolean) => void;
  onClose: () => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  fieldLabel,
  isInitials = false,
  signatureSession,
  onSaveSignature,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState<string>('');
  const [storeSession, setStoreSession] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);

  // Initialize Canvas
  useEffect(() => {
    if (activeTab !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0B1220';
    }
  }, [activeTab]);

  // Drawing Event Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasDrawn(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  };

  // Convert Typed Name to Canvas Data URL
  const generateTypedDataUrl = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = '38px "Dancing Script", "Brush Script MT", cursive, sans-serif';
      ctx.fillStyle = '#0B1220';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName || 'Your Signature', 200, 60);

      // Add subtle underline
      ctx.strokeStyle = '#669FD5';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(40, 95);
      ctx.lineTo(360, 95);
      ctx.stroke();
    }
    return canvas.toDataURL('image/png');
  };

  const handleApply = () => {
    let finalDataUrl = '';

    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (canvas && hasDrawn) {
        finalDataUrl = canvas.toDataURL('image/png');
      }
    } else if (activeTab === 'type') {
      if (typedName.trim()) {
        finalDataUrl = generateTypedDataUrl();
      }
    }

    if (finalDataUrl) {
      onSaveSignature(finalDataUrl, storeSession);
    } else {
      alert('Please provide a signature before applying.');
    }
  };

  // Upload Image Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          onSaveSignature(uploadEvent.target.result as string, storeSession);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B1220] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-sky-400" />
            <h3 className="font-heading font-bold text-base">
              {isInitials ? 'Apply Initials' : `Sign: ${fieldLabel || 'Signature'}`}
            </h3>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setActiveTab('draw')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'draw'
                ? 'border-[#006CA3] text-[#006CA3] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Draw</span>
          </button>

          <button
            onClick={() => setActiveTab('type')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'type'
                ? 'border-[#006CA3] text-[#006CA3] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Type Name</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'upload'
                ? 'border-[#006CA3] text-[#006CA3] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* Use Session Saved Signature if Available */}
          {signatureSession.signatureImage && (
            <div className="mb-4 p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={signatureSession.signatureImage} alt="Saved session" className="h-8 object-contain" />
                <span className="text-xs text-[#006CA3] font-medium">Use stored session signature?</span>
              </div>
              <button
                onClick={() => onSaveSignature(signatureSession.signatureImage!, true)}
                className="px-3 py-1 bg-[#006CA3] text-white rounded-lg text-xs font-semibold hover:bg-[#005a88]"
              >
                Use Stored
              </button>
            </div>
          )}

          {activeTab === 'draw' && (
            <div className="space-y-3">
              <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={440}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseUp={stopDrawing}
                  onMouseMove={draw}
                  onTouchStart={startDrawing}
                  onTouchEnd={stopDrawing}
                  onTouchMove={draw}
                  className="w-full h-[150px] cursor-crosshair touch-none"
                />

                <button
                  onClick={clearCanvas}
                  className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs hover:bg-slate-100 text-xs text-slate-600 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </button>
              </div>
              <p className="text-[11px] text-slate-400 text-center">Use mouse or touch screen to draw your signature.</p>
            </div>
          )}

          {activeTab === 'type' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Type Full Name or Initials</label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="e.g. Alexander Vance"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-[#006CA3] focus:ring-1 focus:ring-[#006CA3] outline-none"
                />
              </div>

              <div className="h-28 border border-slate-200 bg-slate-50 rounded-xl flex items-center justify-center p-4">
                <span className="font-serif italic text-2xl text-slate-900 tracking-wide">
                  {typedName || 'Signature Preview'}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="text-center p-8 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
              <Upload className="w-8 h-8 text-[#006CA3] mx-auto mb-2" />
              <p className="text-xs text-slate-600 mb-3 font-medium">Upload signature image file (PNG, JPG)</p>
              <label className="px-4 py-2 bg-[#006CA3] text-white text-xs font-semibold rounded-xl cursor-pointer hover:bg-[#005a88] shadow-xs">
                Browse File
                <input type="file" accept="image/png,image/jpeg" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          )}

          {/* Session Storage Checkbox */}
          <div className="mt-5 flex items-center gap-2 pt-3 border-t border-slate-100">
            <input
              type="checkbox"
              id="store-session-cb"
              checked={storeSession}
              onChange={(e) => setStoreSession(e.target.checked)}
              className="w-4 h-4 text-[#006CA3] rounded border-slate-300 focus:ring-[#006CA3]"
            />
            <label htmlFor="store-session-cb" className="text-xs text-slate-600 cursor-pointer">
              Reuse this signature for other signature lines in this session
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>

          {activeTab !== 'upload' && (
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#006CA3] hover:bg-[#005a88] text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply Signature</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
