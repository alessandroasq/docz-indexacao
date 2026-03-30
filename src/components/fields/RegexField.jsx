import React from "react";

export default function RegexField({ value, onChange, pattern, patternHint, placeholder, disabled, className }) {
  const re = pattern ? new RegExp(pattern) : null;
  const isValid = value ? (re ? re.test(value) : true) : null;
  const borderClass = isValid === true ? "field-input-valid" : isValid === false ? "field-input-error" : "";

  return (
    <div>
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder || ""}
        onChange={(e) => onChange(e.target.value)}
        className={`field-input font-mono ${borderClass} ${className || ""}`}
      />
      {isValid === false && (
        <p className="text-xs text-red-500 mt-1">
          ⚠ Formato esperado: <span className="font-mono bg-red-50 px-1 rounded">{patternHint || pattern}</span>
        </p>
      )}
      {isValid === true && (
        <p className="text-xs text-emerald-600 mt-1">✓ Formato válido</p>
      )}
    </div>
  );
}
