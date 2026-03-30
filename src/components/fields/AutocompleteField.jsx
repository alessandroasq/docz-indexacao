import React, { useState, useEffect, useMemo, useRef } from "react";
import { fuzzySearch } from "../../utils/fuzzy";
import { VOCABULARY } from "../../data/vocabulary";

export default function AutocompleteField({ value, onChange, voc, disabled, className }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [highlighted, setHighlighted] = useState(-1);
  const ref = useRef(null);
  const items = VOCABULARY[voc] || [];

  const results = useMemo(() => fuzzySearch(query, items), [query, items]);

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setHighlighted(-1); }, [query]);

  const select = (item) => {
    setQuery(item);
    onChange(item);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === "ArrowDown") { setOpen(true); e.preventDefault(); }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted((p) => Math.min(p + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted((p) => Math.max(p - 1, 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (highlighted >= 0 && results[highlighted]) select(results[highlighted].item);
      else if (results.length === 1) select(results[0].item);
    }
    else if (e.key === "Escape") setOpen(false);
    else if (e.key === "Tab") {
      if (highlighted >= 0 && results[highlighted]) select(results[highlighted].item);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        disabled={disabled}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Digite ou pressione ↓ para ver opções..."
        className={`field-input ${className || ""}`}
      />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-52 overflow-y-auto">
          {results.map((r, i) => (
            <div
              key={i}
              onMouseDown={() => select(r.item)}
              onMouseEnter={() => setHighlighted(i)}
              className={`flex items-center justify-between px-3 py-2 cursor-pointer text-sm ${
                i === highlighted ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{r.item}</span>
              {r.score > 0 && r.score <= 3 && (
                <span className="text-xs text-amber-500 font-medium">~fuzzy</span>
              )}
            </div>
          ))}
          <div className="px-3 py-1.5 text-xs text-slate-400 border-t border-slate-100">
            ↑↓ navegar · Enter selecionar · Esc fechar
          </div>
        </div>
      )}
    </div>
  );
}
