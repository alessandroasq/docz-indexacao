import React from "react";
import { formatCurrency } from "../../utils/validators";

function parseBR(s) {
  if (!s) return NaN;
  // "2.450.000,00" → 2450000.00
  return parseFloat(s.replace(/\./g, "").replace(",", "."));
}

export default function CurrencyField({ value, onChange, disabled, className }) {
  const n = parseBR(value);
  const formatted = value && !isNaN(n) ? formatCurrency(n) : null;

  return (
    <div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold pointer-events-none">R$</span>
        <input
          type="text"
          value={value}
          disabled={disabled}
          placeholder="0,00"
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
          className={`field-input pl-9 font-mono ${className || ""}`}
        />
      </div>
      {formatted && (
        <p className="text-xs text-emerald-600 font-semibold mt-1">{formatted}</p>
      )}
    </div>
  );
}
