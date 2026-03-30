import React, { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { MOCK_PDF_CONTENT } from "../data/mockData";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default function PDFViewer({ docType, fileName, onTextSelected, activeZone, isScanned }) {
  const [selectedText, setSelectedText] = useState("");
  const [localPdfUrl, setLocalPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.0);

  const lines = MOCK_PDF_CONTENT[docType] || MOCK_PDF_CONTENT.decreto;
  const lineRefs = useRef({});
  const fileInputRef = useRef(null);

  // Auto-scroll to zone when field is focused (mock mode only)
  useEffect(() => {
    if (!activeZone || localPdfUrl) return;
    const el = lineRefs.current[activeZone.lineStart];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeZone, localPdfUrl]);

  const handleMouseUp = () => {
    const sel = window.getSelection()?.toString().trim();
    if (sel && sel.length > 2) {
      setSelectedText(sel);
      if (onTextSelected) onTextSelected(sel);
    }
  };

  const clearSelection = () => {
    setSelectedText("");
    if (onTextSelected) onTextSelected(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (localPdfUrl) URL.revokeObjectURL(localPdfUrl);
    const url = URL.createObjectURL(file);
    setLocalPdfUrl(url);
    setCurrentPage(1);
    setZoom(1.0);
    setNumPages(null);
    e.target.value = "";
  };

  const closePdf = () => {
    if (localPdfUrl) URL.revokeObjectURL(localPdfUrl);
    setLocalPdfUrl(null);
    setNumPages(null);
    setCurrentPage(1);
    setZoom(1.0);
  };

  // ── Mock text rendering with zone highlight ────────────────────────────────
  const renderMockPDF = () => (
    <div
      className="flex-1 overflow-y-auto p-6 flex justify-center"
      onMouseUp={handleMouseUp}
    >
      <div
        className={`
          bg-white w-full max-w-md shadow-2xl rounded-sm p-10 font-mono text-xs
          leading-relaxed text-slate-800 select-text min-h-96
          ${isScanned ? "scanned-page" : ""}
        `}
      >
        {lines.map((line, i) => {
          const inZone =
            activeZone != null &&
            i >= activeZone.lineStart &&
            i <= activeZone.lineEnd;
          return (
            <div
              key={i}
              ref={(el) => { lineRefs.current[i] = el; }}
              className={[
                line === "" ? "mb-3" : "mb-0",
                i === 0 ? "text-center font-bold text-sm mb-1" : "",
                i === 2 ? "text-center font-bold text-sm mb-2" : "",
                inZone
                  ? "bg-amber-100 outline outline-2 outline-amber-400 rounded px-1 -mx-1 font-semibold"
                  : "",
                "transition-all duration-200",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {line || "\u00A0"}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Real PDF rendering via react-pdf ──────────────────────────────────────
  const renderRealPDF = () => (
    <div
      className="flex-1 overflow-auto flex flex-col items-center py-4"
      onMouseUp={handleMouseUp}
    >
      {/* Zoom controls */}
      <div className="flex items-center gap-1 mb-3 bg-slate-700 rounded-lg px-3 py-1.5 sticky top-2 z-10">
        <button
          onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.2).toFixed(1)))}
          className="text-white text-base font-mono w-6 h-6 flex items-center justify-center hover:text-amber-300 transition-colors"
        >
          −
        </button>
        <span className="text-white text-xs font-mono w-12 text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(3.0, +(z + 0.2).toFixed(1)))}
          className="text-white text-base font-mono w-6 h-6 flex items-center justify-center hover:text-amber-300 transition-colors"
        >
          +
        </button>
        <span className="w-px h-4 bg-slate-500 mx-1" />
        <button
          onClick={() => setZoom(1.0)}
          className="text-white text-xs hover:text-amber-300 transition-colors"
        >
          100%
        </button>
        {numPages && numPages > 1 && (
          <>
            <span className="w-px h-4 bg-slate-500 mx-1" />
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="text-white text-xs disabled:opacity-30 hover:text-amber-300 transition-colors"
            >
              ← Ant.
            </button>
            <span className="text-white text-xs font-mono mx-1">
              {currentPage}/{numPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
              disabled={currentPage === numPages}
              className="text-white text-xs disabled:opacity-30 hover:text-amber-300 transition-colors"
            >
              Próx. →
            </button>
          </>
        )}
      </div>

      <Document
        file={localPdfUrl}
        onLoadSuccess={({ numPages: n }) => setNumPages(n)}
        loading={
          <div className="flex items-center gap-2 text-slate-400 text-sm mt-8">
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            Carregando PDF…
          </div>
        }
        error={
          <div className="text-red-400 text-sm mt-8 text-center px-4">
            Erro ao carregar o PDF.<br />
            <span className="text-xs text-slate-400">Verifique se o arquivo não está corrompido.</span>
          </div>
        }
      >
        <Page
          pageNumber={currentPage}
          scale={zoom}
          renderTextLayer
          renderAnnotationLayer
          className="shadow-2xl"
        />
      </Document>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-amber-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
          </div>
          <span className="text-slate-400 text-xs font-mono ml-1 truncate max-w-40">
            {localPdfUrl ? fileName + " (carregado)" : fileName}
          </span>
          {isScanned && !localPdfUrl && (
            <span className="shrink-0 text-xs bg-amber-700/40 text-amber-300 border border-amber-600/40 px-1.5 py-0.5 rounded font-medium">
              Digitalizado
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!localPdfUrl && !activeZone && (
            <span className="text-slate-500 text-xs hidden sm:block">
              Selecione texto para usar nos campos →
            </span>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors flex items-center gap-1"
            title="Abrir PDF do computador"
          >
            <span>📂</span>
            <span>Abrir PDF</span>
          </button>
          {localPdfUrl && (
            <button
              onClick={closePdf}
              className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded hover:bg-red-900/60 hover:text-red-300 transition-colors"
              title="Fechar PDF"
            >
              ✕
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Zone indicator (mock mode only) */}
      {activeZone && !localPdfUrl && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-900/30 border-b border-amber-700/40">
          <span className="text-amber-400 text-xs">📍</span>
          <span className="text-amber-200 text-xs">
            Zoom em: <strong>{activeZone.label}</strong>
          </span>
        </div>
      )}

      {/* PDF Content */}
      {localPdfUrl ? renderRealPDF() : renderMockPDF()}

      {/* Selected Text Bar */}
      {selectedText && (
        <div className="mx-4 mb-4 p-3 bg-blue-900/50 border border-blue-600/50 rounded-lg">
          <p className="text-xs font-semibold text-blue-300 mb-1.5">Texto selecionado:</p>
          <p className="text-xs text-slate-200 bg-slate-800 px-2 py-1.5 rounded font-mono leading-relaxed max-h-14 overflow-y-auto">
            "{selectedText}"
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => navigator.clipboard?.writeText(selectedText)}
              className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors"
            >
              Copiar
            </button>
            <button
              onClick={clearSelection}
              className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors"
            >
              ✕ Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
