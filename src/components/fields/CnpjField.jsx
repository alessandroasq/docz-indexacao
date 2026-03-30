import React from "react";
import { applyMask, validateCNPJ } from "../../utils/validators";

export default function CnpjField({ value, onChange, disabled, className }) {
  const raw = (value || "").replace(/\D/g, "");
  const isValid = raw.length === 14 ? validateCNPJ(value) : null;
  const borderClass = isValid === true ? "field-input-valid" : isValid === false ? "field-input-error" : "";

  return (
    <div>
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder="00.000.000/0001-00"
        maxLength={18}
        onChange={(e) => onChange(applyMask(e.target.value.replace(/\D/g, ""), "99.999.999/9999-99"))}
        className={`field-input font-mono ${borderClass} ${className || ""}`}
      />
      {isValid === false && (
        <p className="text-xs text-red-500 mt-1">⚠ CNPJ inválido — dígito verificador incorreto</p>
      )}
      {isValid === true && (
        <p className="text-xs text-emerald-600 mt-1">✓ CNPJ válido</p>
      )}
    </div>
  );
}
