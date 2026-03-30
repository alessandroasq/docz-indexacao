import React from "react";
import { confidenceColor } from "../../utils/validators";

export default function FieldWrapper({ field, confidence, hasError, errorMsg, children }) {
  const conf = confidenceColor(confidence || 0);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-semibold text-slate-600">
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {confidence > 0 && (
          <span className={`badge ${conf.bg} ${conf.text} border ${conf.border} font-mono`}>
            {Math.round(confidence * 100)}%
          </span>
        )}
        {field.defaults && (
          <span className="badge bg-blue-50 text-blue-700 border border-blue-200">PADRÃO</span>
        )}
      </div>
      {children}
      {hasError && errorMsg && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span> {errorMsg}
        </p>
      )}
      {field.hint && !hasError && (
        <p className="text-xs text-slate-400">{field.hint}</p>
      )}
    </div>
  );
}
