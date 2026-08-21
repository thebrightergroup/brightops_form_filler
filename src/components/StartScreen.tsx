import React, { useRef } from 'react';
import { BrandLogo } from '../brand/BrandLogo';
import { DocumentRecord, TemplateRecord } from '../types';
import { SAMPLE_TEMPLATES } from '../lib/samplePdfs';
import { Upload, FileText, ArrowRight, ShieldCheck, Sparkles, Clock, FileCheck, Layers, Image as ImageIcon, Scan } from 'lucide-react';

interface StartScreenProps {
  onFileUpload: (file: File) => void;
  onOpenSample: (template: TemplateRecord) => void;
  recentDocuments: DocumentRecord[];
  onOpenRecent: (doc: DocumentRecord) => void;
  onDeleteRecent?: (docId: string) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onFileUpload,
  onOpenSample,
  recentDocuments,
  onOpenRecent,
  onDeleteRecent,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSupportedFile = (file: File) => {
    return (
      file.type === 'application/pdf' ||
      file.type.startsWith('image/') ||
      /\.(pdf|png|jpe?g|webp|bmp|tiff?)$/i.test(file.name)
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (isSupportedFile(file)) {
        onFileUpload(file);
      } else {
        alert('Please select a valid PDF or Image file (PNG, JPG, WEBP, BMP, TIFF).');
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (isSupportedFile(file)) {
        onFileUpload(file);
      } else {
        alert('Please select a valid PDF or Image file.');
      }
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-[#F4F8FC] flex flex-col justify-between selection:bg-[#96D1F2]">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10 px-6 py-3.5 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between relative min-h-[44px]">
          {/* Left: Full Brand Logo */}
          <div className="flex items-center">
            <BrandLogo size="md" variant="dark" layout="horizontal" showSubtitle={true} />
          </div>

          {/* Center: Standalone App Title */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0B1220] tracking-tight">
              Form Filler
            </h1>
          </div>

          {/* Right: Balance spacer / sub-label */}
          <div className="hidden md:block text-xs text-slate-400 font-medium">
            Brighter Workspace Technologies
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full flex flex-col gap-6 sm:gap-8">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-100 text-[#006CA3] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Native PDF + Image OCR Field Converter</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0B1220] tracking-tight">
            Turn PDF forms or scanned images into fillable documents.
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Intelligently inspect PDF form fields or convert image documents (PNG, JPG, WEBP) into structured, fillable, and signable PDF forms using Gemini AI OCR.
          </p>
        </div>

        {/* Upload Dropzone - Compacted 20-25% */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="bg-white rounded-2xl border-2 border-dashed border-[#669FD5]/50 hover:border-[#006CA3] p-5 sm:p-7 text-center shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".pdf,application/pdf,image/*,.png,.jpg,.jpeg,.webp,.bmp,.tiff"
            className="hidden"
          />

          <div className="w-12 h-12 rounded-xl bg-[#C2E4F5]/60 group-hover:bg-[#006CA3] text-[#006CA3] group-hover:text-white flex items-center justify-center mx-auto mb-3 transition-all duration-200 shadow-2xs">
            <Upload className="w-6 h-6" />
          </div>

          <h2 className="font-heading font-semibold text-base text-[#0B1220] mb-1">
            Upload or Drag & Drop a PDF or Image Document
          </h2>
          <p className="text-slate-500 text-xs max-w-md mx-auto mb-4">
            Supports AcroForm PDFs, scanned PDF pages, and raw images (PNG, JPG, WEBP, BMP, TIFF) with automatic AI OCR conversion.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#006CA3] hover:bg-[#005a88] text-white font-medium text-xs shadow-2xs transition-colors">
              <FileText className="w-3.5 h-3.5" />
              <span>Select PDF or Image</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200">
              <Scan className="w-3.5 h-3.5 text-[#006CA3]" />
              <span>Auto OCR & Field Detection</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-6 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Secure Server-side AI
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-sky-600" /> Image to PDF Converter
            </span>
          </div>
        </div>

        {/* Demo Templates */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#006CA3]" />
              <h3 className="font-heading font-bold text-slate-900 text-base">
                Demo Templates
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Click to test instant form field detection</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {SAMPLE_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => onOpenSample(tmpl)}
                className="bg-white rounded-xl p-4 border border-slate-200 hover:border-[#669FD5] shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-sky-100 text-[#006CA3]">
                      Demo Template • {tmpl.category}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#006CA3] group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h4 className="font-heading font-semibold text-slate-900 text-sm mb-1 group-hover:text-[#006CA3] transition-colors">
                    {tmpl.name}
                  </h4>
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                    {tmpl.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Interactive AcroForm + AI</span>
                  <span className="text-[#006CA3] font-medium group-hover:underline">Launch →</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Documents */}
        {recentDocuments.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#006CA3]" />
                <h3 className="font-heading font-bold text-slate-900 text-base">Recent Documents</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">{recentDocuments.length} saved</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
              {recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onOpenRecent(doc)}
                  className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#006CA3] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-900 text-xs sm:text-sm truncate group-hover:text-[#006CA3]">
                          {doc.title}
                        </h4>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            doc.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-sky-100 text-[#006CA3]'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{doc.pagesCount || 1} pages</span>
                        <span>•</span>
                        <span>{doc.fields?.length || 0} fields</span>
                        <span>•</span>
                        <span>Saved {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString()} {new Date(doc.updatedAt || doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {onDeleteRecent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRecent(doc.id);
                        }}
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove from Recent Documents"
                      >
                        <span className="text-xs font-bold">✕</span>
                      </button>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#006CA3] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Simplified Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 font-medium">
        Form Filler — Brighter Workspace Technologies
      </footer>
    </div>
  );
};

