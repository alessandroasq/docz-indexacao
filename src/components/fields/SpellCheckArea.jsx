import React, { useState, useEffect } from "react";
import { spellCheck } from "../../utils/fuzzy";

export default function SpellCheckArea({ value, onChange, maxLength, disabled, className, onPasteFromPDF }) {
  const [fixes, setFixes] = useState([]);

  useEffect(() => {
    if (!value) { setFixes([]); return; }
    const t = setTimeout(() => {
      setFixes(spellCheck(value).fixes);
    }, 400);
    return () => clearTimeout(t);
  }, [value]);

  const applyFixes = () => {
    onChange(spellCheck(value).corrected);
    setFixes([]);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          maxLength={maxLength}
          rows={3}
          className={`field-input resize-y min-h-[72px] pr-8 ${fixes.length ? "field-input-warn" : ""} ${className || ""}`}
          placeholder="Descreva o assunto do documento..."
        />
        {onPasteFromPDF && (
          <button
            type="button"
            onClick={onPasteFromPDF}
            title="Colar texto selecionado do PDF"
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
          >
            ⎘
          </button>
        )}
      </div>
      {maxLength && (
        <p className="text-xs text-slate-400 text-right">{(value || "").length}/{maxLength}</p>
      )}
      {fixes.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-amber-800">
              {fixes.length} {fixes.length === 1 ? "correção sugerida" : "correções sugeridas"}
            </span>
            <div className="flex gap-2">
              <button
                onClick={applyFixes}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
              >
                ✓ Aplicar
              </button>
              <button
                onClick={() => setFixes([])}
                className="px-2 py-1 bg-white border border-slate-200 text-slate-500 rounded text-xs hover:bg-slate-50"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {fixes.map((fix, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-amber-200 rounded">
                <s className="text-red-500">{fix.from}</s>
                <span className="text-slate-400">→</span>
                <strong className="text-emerald-700">{fix.to}</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
