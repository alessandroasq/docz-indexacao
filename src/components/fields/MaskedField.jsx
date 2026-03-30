import React from "react";
import { applyMask, isMaskComplete } from "../../utils/validators";

export default function MaskedField({ value, onChange, mask, placeholder, disabled, className }) {
  const complete = isMaskComplete(value, mask);
  const borderClass = value
    ? complete ? "field-input-valid" : "field-input-warn"
    : "";

  return (
    <div>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(applyMask(e.target.value.replace(/\D/g, ""), mask))}
        maxLength={mask.length}
        className={`field-input ${borderClass} ${className || ""}`}
      />
      {value && !complete && (
        <p className="text-xs text-amber-600 mt-1">
          ⚠ Formato esperado: {mask.replace(/9/g, "N")}
        </p>
      )}
    </div>
  );
}
