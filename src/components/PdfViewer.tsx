import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined' || typeof self !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  } catch {
    /* fallback */
  }
}

import { DetectedField, FieldType, ViewMode } from '../types';
import { FieldOverlay } from './FieldOverlay';
import { FieldToolbar } from './FieldToolbar';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Layers,
  Loader2,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface PdfViewerProps {
  fileDataUrl: string;
  fields: DetectedField[];
  viewMode: ViewMode;
  selectedField: DetectedField | null;
  onSelectField: (field: DetectedField | null) => void;
  onUpdateField: (updated: DetectedField) => void;
  onDeleteField: (id: string) => void;
  onDuplicateField: (field: DetectedField) => void;
  onOpenSignatureModal: (field: DetectedField) => void;
  onAddFieldOnPage: (pageNumber: number, xPct: number, yPct: number) => void;
  onAddField?: (type: FieldType) => void;
}

interface PdfPageProps {
  pNum: number;
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  zoomScale: number;
  viewMode: ViewMode;
  pageFields: DetectedField[];
  selectedField: DetectedField | null;
  onSelectField: (field: DetectedField | null) => void;
  onUpdateField: (updated: DetectedField) => void;
  onDeleteField: (id: string) => void;
  onDuplicateField: (field: DetectedField) => void;
  onOpenSignatureModal: (field: DetectedField) => void;
  handlePageClick: (e: React.MouseEvent<HTMLDivElement>, pageNumber: number) => void;
  numPages: number;
}

const PdfPage: React.FC<PdfPageProps> = ({
  pNum,
  pdfDoc,
  zoomScale,
  viewMode,
  pageFields,
  selectedField,
  onSelectField,
  onUpdateField,
  onDeleteField,
  onDuplicateField,
  onOpenSignatureModal,
  handlePageClick,
  numPages,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isCancelled = false;
    let renderTask: pdfjsLib.RenderTask | null = null;

    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        const page = await pdfDoc.getPage(pNum);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale: zoomScale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        renderTask = page.render({ canvasContext: ctx, viewport });
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException' && !isCancelled) {
          console.error(`Error rendering PDF page ${pNum}:`, err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          /* ignore */
        }
      }
    };
  }, [pdfDoc, pNum, zoomScale]);

  return (
    <div
      id={`pdf-page-${pNum}`}
      onClick={(e) => handlePageClick(e, pNum)}
      className="pdf-page-container bg-white relative rounded-sm transition-all shadow-md my-2"
      style={{
        transformOrigin: 'top center',
      }}
    >
      {/* PDF Canvas Layer */}
      <canvas ref={canvasRef} className="block rounded-sm bg-white" />

      {/* Field Overlays Layer */}
      <div className="absolute inset-0 pointer-events-none">
        {pageFields.map((field) => (
          <div key={field.id} className="pointer-events-auto">
            <FieldOverlay
              field={field}
              viewMode={viewMode}
              isSelected={selectedField?.id === field.id}
              onSelect={onSelectField}
              onUpdateField={onUpdateField}
              onDeleteField={onDeleteField}
              onDuplicateField={onDuplicateField}
              onOpenSignatureModal={onOpenSignatureModal}
            />
          </div>
        ))}
      </div>

      {/* Page Indicator Tag */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-500 bg-slate-200/80 px-2.5 py-0.5 rounded shadow-2xs">
        Page {pNum} of {numPages}
      </div>
    </div>
  );
};

export const PdfViewer: React.FC<PdfViewerProps> = ({
  fileDataUrl,
  fields,
  viewMode,
  selectedField,
  onSelectField,
  onUpdateField,
  onDeleteField,
  onDuplicateField,
  onOpenSignatureModal,
  onAddFieldOnPage,
  onAddField,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1.2);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);

  // Docked Left Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'tools' | 'pages'>('tools');

  const containerRef = useRef<HTMLDivElement>(null);

  // Load PDF Document Proxy
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    const loadPdf = async () => {
      try {
        let pdfBytes: Uint8Array;

        if (fileDataUrl.startsWith('data:') || fileDataUrl.startsWith('blob:') || fileDataUrl.startsWith('http')) {
          const res = await fetch(fileDataUrl);
          const ab = await res.arrayBuffer();
          pdfBytes = new Uint8Array(ab);
        } else {
          // Base64 string
          const binaryString = window.atob(fileDataUrl.split(',')[1] || fileDataUrl);
          const len = binaryString.length;
          pdfBytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            pdfBytes[i] = binaryString.charCodeAt(i);
          }
        }

        const loadingTask = pdfjsLib.getDocument({
          data: pdfBytes,
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Failed to load PDF document:', err);
        if (isMounted) {
          setLoadError(err?.message || 'Failed to parse PDF document.');
          setIsLoading(false);
        }
      }
    };

    if (fileDataUrl) {
      loadPdf();
    }

    return () => {
      isMounted = false;
    };
  }, [fileDataUrl]);

  // Click on PDF Page canvas in Design Mode to quickly create a field
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>, pageNumber: number) => {
    if (viewMode !== 'design') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(2));
    const yPct = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(2));

    onAddFieldOnPage(pageNumber, xPct, yPct);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#E2E8F0] overflow-hidden min-h-0 min-w-0 relative">
      {/* Top Controls Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-2xs z-20 flex-shrink-0">
        {/* Left: Sidebar Toggle & Page Nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded text-xs font-medium flex items-center gap-1.5 border transition-colors ${
              isSidebarOpen
                ? 'bg-sky-100 text-[#006CA3] border-[#006CA3]'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title={isSidebarOpen ? 'Collapse Left Sidebar' : 'Expand Left Sidebar'}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            <span className="hidden sm:inline font-semibold">
              {isSidebarOpen ? 'Hide Sidebar' : 'Show Tools & Pages'}
            </span>
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          <button
            onClick={() => {
              const prevPage = Math.max(1, currentPage - 1);
              setCurrentPage(prevPage);
              const pageEl = document.getElementById(`pdf-page-${prevPage}`);
              if (pageEl && containerRef.current) {
                const containerTop = containerRef.current.getBoundingClientRect().top;
                const pageTop = pageEl.getBoundingClientRect().top;
                const currentScroll = containerRef.current.scrollTop;
                containerRef.current.scrollTo({
                  top: currentScroll + (pageTop - containerTop) - 20,
                  behavior: 'smooth',
                });
              }
            }}
            disabled={currentPage <= 1}
            className="p-1 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-medium text-slate-700 font-mono">
            Page {currentPage} of {numPages || 1}
          </span>

          <button
            onClick={() => {
              const nextPage = Math.min(numPages, currentPage + 1);
              setCurrentPage(nextPage);
              const pageEl = document.getElementById(`pdf-page-${nextPage}`);
              if (pageEl && containerRef.current) {
                const containerTop = containerRef.current.getBoundingClientRect().top;
                const pageTop = pageEl.getBoundingClientRect().top;
                const currentScroll = containerRef.current.scrollTop;
                containerRef.current.scrollTo({
                  top: currentScroll + (pageTop - containerTop) - 20,
                  behavior: 'smooth',
                });
              }
            }}
            disabled={currentPage >= numPages}
            className="p-1 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomScale((z) => Math.max(0.6, Number((z - 0.2).toFixed(1))))}
            className="p-1.5 rounded text-slate-700 hover:bg-slate-100 border border-slate-300 bg-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-medium text-slate-700 w-12 text-center">
            {Math.round(zoomScale * 100)}%
          </span>

          <button
            onClick={() => setZoomScale((z) => Math.min(2.5, Number((z + 0.2).toFixed(1))))}
            className="p-1.5 rounded text-slate-700 hover:bg-slate-100 border border-slate-300 bg-white"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

          <button
            onClick={() => setZoomScale(1.2)}
            className="px-2 py-1 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 bg-white hidden sm:block"
          >
            Fit Width
          </button>
        </div>
      </div>

      {/* Main Document Workspace */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Docked Left Sidebar (Toolbox + Page Tree) */}
        {isSidebarOpen && (
          <aside className="w-60 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-10 select-none flex-shrink-0 min-h-0 overflow-hidden">
            {/* Sidebar Tab Switcher */}
            <div className="flex items-center border-b border-slate-200 bg-slate-50 p-1 gap-1 flex-shrink-0">
              {viewMode === 'design' && (
                <button
                  onClick={() => setActiveSidebarTab('tools')}
                  className={`flex-1 py-1.5 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    activeSidebarTab === 'tools'
                      ? 'bg-white text-[#006CA3] shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Fields</span>
                </button>
              )}

              <button
                onClick={() => setActiveSidebarTab('pages')}
                className={`flex-1 py-1.5 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeSidebarTab === 'pages' || viewMode === 'fill'
                    ? 'bg-white text-[#006CA3] shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Pages ({numPages || 1})</span>
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-3 min-h-0">
              {activeSidebarTab === 'tools' && viewMode === 'design' && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Form Toolkit
                  </div>
                  <FieldToolbar
                    onAddField={(type) => {
                      if (onAddField) {
                        onAddField(type);
                      }
                    }}
                  />
                </div>
              )}

              {(activeSidebarTab === 'pages' || viewMode === 'fill') && (
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Document Page Tree
                  </div>

                  <div className="flex flex-col gap-2">
                    {Array.from({ length: numPages }, (_, i) => i + 1).map((pNum) => {
                      const pFields = fields.filter((f) => (f.pageNumber || 1) === pNum);
                      const pReview = pFields.filter((f) => f.requiresReview || (!f.accepted && f.source === 'ai_detected')).length;

                      return (
                        <div
                          key={pNum}
                          onClick={() => {
                            setCurrentPage(pNum);
                            const pageEl = document.getElementById(`pdf-page-${pNum}`);
                            if (pageEl && containerRef.current) {
                              const containerTop = containerRef.current.getBoundingClientRect().top;
                              const pageTop = pageEl.getBoundingClientRect().top;
                              const currentScroll = containerRef.current.scrollTop;
                              containerRef.current.scrollTo({
                                top: currentScroll + (pageTop - containerTop) - 20,
                                behavior: 'smooth',
                              });
                            }
                          }}
                          className={`p-2.5 rounded-lg border bg-white cursor-pointer transition-all flex items-center gap-3 ${
                            currentPage === pNum
                              ? 'border-[#006CA3] ring-2 ring-[#006CA3]/20 shadow-sm bg-sky-50/40'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="w-10 h-12 bg-slate-100 border border-slate-200 rounded flex flex-col items-center justify-center text-[10px] text-slate-500 font-mono shadow-2xs flex-shrink-0">
                            <Layers className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                            P{pNum}
                          </div>
                          <div className="flex flex-col leading-tight flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-800">Page {pNum}</span>
                              {pReview > 0 && (
                                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded">
                                  {pReview} review
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 mt-0.5 font-mono">
                              {pFields.length} {pFields.length === 1 ? 'field' : 'fields'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* PDF Document Canvas Scroll Area */}
        <div
          ref={containerRef}
          onClick={() => onSelectField(null)}
          className="flex-1 overflow-auto p-6 sm:p-10 flex flex-col items-center gap-8 min-h-0 min-w-0"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#006CA3]" />
              <span className="text-sm font-medium">Rendering document pages...</span>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-rose-600 bg-rose-50 border border-rose-200 p-6 rounded-xl max-w-md text-center">
              <span className="text-sm font-semibold">Error Loading Document</span>
              <span className="text-xs text-rose-500">{loadError}</span>
            </div>
          ) : pdfDoc ? (
            Array.from({ length: numPages }, (_, i) => i + 1).map((pNum) => {
              const pageFields = fields.filter((f) => (f.pageNumber || 1) === pNum);

              return (
                <PdfPage
                  key={pNum}
                  pNum={pNum}
                  pdfDoc={pdfDoc}
                  zoomScale={zoomScale}
                  viewMode={viewMode}
                  pageFields={pageFields}
                  selectedField={selectedField}
                  onSelectField={onSelectField}
                  onUpdateField={onUpdateField}
                  onDeleteField={onDeleteField}
                  onDuplicateField={onDuplicateField}
                  onOpenSignatureModal={onOpenSignatureModal}
                  handlePageClick={handlePageClick}
                  numPages={numPages}
                />
              );
            })
          ) : null}
        </div>
      </div>
    </div>
  );
};
