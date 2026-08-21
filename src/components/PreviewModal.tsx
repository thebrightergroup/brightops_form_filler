import React, { useState } from 'react';
import { Download, X, FileText, CheckCircle2, ShieldCheck, Layers } from 'lucide-react';

interface PreviewModalProps {
  pdfBlobUrl: string;
  documentTitle: string;
  onDownload: (flatten: boolean) => void;
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  pdfBlobUrl,
  documentTitle,
  onDownload,
  onClose,
}) => {
  const [downloadFormat, setDownloadFormat] = useState<'flattened' | 'editable'>('flattened');

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50 animate-in fade-in duration-200">
      <div className="bg-[#0B1220] text-white rounded-2xl border border-slate-700 shadow-2xl max-w-5xl w-full h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-white">
                Completed Document Preview: {documentTitle}
              </h3>
              <p className="text-xs text-slate-400">
                Review your filled form prior to downloading or sharing.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Embedded PDF IFrame */}
        <div className="flex-1 bg-slate-900 p-2 overflow-hidden relative">
          {pdfBlobUrl ? (
            <iframe src={pdfBlobUrl} className="w-full h-full rounded-xl border border-slate-800" title="PDF Preview" />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              Generating PDF preview...
            </div>
          )}
        </div>

        {/* Footer: Export & Download Options */}
        <div className="p-4 sm:p-6 bg-[#152033] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setDownloadFormat('flattened')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                downloadFormat === 'flattened'
                  ? 'bg-[#006CA3] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sky-300" />
              <span>Flattened PDF (Permanent)</span>
            </button>

            <button
              onClick={() => setDownloadFormat('editable')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                downloadFormat === 'editable'
                  ? 'bg-[#006CA3] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-sky-300" />
              <span>Editable AcroForm PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Close
            </button>

            <button
              onClick={() => onDownload(downloadFormat === 'flattened')}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#006CA3] hover:bg-[#005a88] text-white shadow-md transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export {downloadFormat === 'flattened' ? 'Flattened' : 'Editable'} PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
