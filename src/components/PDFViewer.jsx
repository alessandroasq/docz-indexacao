import React, { useState } from "react";
import { MOCK_PDF_CONTENT } from "../data/mockData";

export default function PDFViewer({ docType, fileName, onTextSelected }) {
  const [selectedText, setSelectedText] = useState("");
  const lines = MOCK_PDF_CONTENT[docType] || MOCK_PDF_CONTENT.decreto;

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
          <span className="text-slate-400 text-xs font-mono ml-1">{fileName}</span>
        </div>
        <span className="text-slate-500 text-xs">Selecione texto para usar nos campos →</span>
      </div>

      {/* PDF Content */}
      <div
        className="flex-1 overflow-y-auto p-6 flex justify-center"
        onMouseUp={handleMouseUp}
      >
        <div className="bg-white w-full max-w-md shadow-2xl rounded-sm p-10 font-mono text-xs leading-relaxed text-slate-800 select-text min-h-96">
          {lines.map((line, i) => (
            <div
              key={i}
              className={`${line === "" ? "mb-3" : "mb-0"} ${
                i === 0 ? "text-center font-bold text-sm mb-1" : ""
              } ${
                i === 2 ? "text-center font-bold text-sm mb-2" : ""
              }`}
            >
              {line || "\u00A0"}
            </div>
          ))}
        </div>
      </div>

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
