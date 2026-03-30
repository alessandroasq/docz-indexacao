import React from "react";
import { DOCUMENT_TYPES } from "../data/documentTypes";
import { confidenceColor } from "../utils/validators";

function ReviewRow({ label, value, confidence, required }) {
  const conf = confidence ? confidenceColor(confidence) : null;
  const empty = !value || !value.toString().trim();

  return (
    <div className={`flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0 ${empty && required ? "bg-red-50" : ""}`}>
      <div className="w-36 flex-shrink-0">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </div>
      <div className="flex-1 flex items-center gap-2">
        {empty ? (
          <span className="text-xs text-red-400 italic">— não preenchido —</span>
        ) : (
          <span className="text-sm text-slate-800 break-words">{value}</span>
        )}
        {conf && confidence > 0 && (
          <span className={`badge ${conf.bg} ${conf.text} border ${conf.border} ml-auto flex-shrink-0 font-mono`}>
            {Math.round(confidence * 100)}%
          </span>
        )}
      </div>
    </div>
  );
}

export default function ReviewPanel({ doc, values, aiData, onConfirm, onEdit }) {
  const cfg = DOCUMENT_TYPES[doc.type];

  const missingRequired = cfg.fields.filter((f) => {
    if (!f.required) return false;
    const v = values[f.id];
    return !v || !v.toString().trim();
  });

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Revisão antes de salvar</h2>
            <p className="text-xs text-slate-500 mt-0.5">Camada 4 — Garantia de Qualidade</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">{doc.file}</span>
            <span className="badge bg-slate-50 text-slate-700 border border-slate-200">
              {cfg.label}
            </span>
          </div>
        </div>
      </div>

      {missingRequired.length > 0 && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-semibold text-red-700 mb-1">
            ⚠ {missingRequired.length} campo{missingRequired.length > 1 ? "s obrigatórios" : " obrigatório"} não preenchido{missingRequired.length > 1 ? "s" : ""}:
          </p>
          <p className="text-xs text-red-600">{missingRequired.map((f) => f.label).join(", ")}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {cfg.fields.map((f) => {
            const v = values[f.id];
            const confidence = aiData?.[f.id]?.confidence;
            return (
              <ReviewRow
                key={f.id}
                label={f.label}
                value={v}
                confidence={confidence}
                required={f.required}
              />
            );
          })}
        </div>

        {aiData && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-xs font-semibold text-blue-700 mb-2">Resumo de confiança da IA:</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(aiData).map(([key, data]) => {
                const fieldDef = cfg.fields.find((f) => f.id === key);
                const col = confidenceColor(data.confidence);
                return (
                  <span key={key} className={`badge ${col.bg} ${col.text} border ${col.border} font-mono text-xs`}>
                    {fieldDef?.label || key}: {Math.round(data.confidence * 100)}%
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
        <button onClick={onEdit} className="btn-secondary">
          ← Editar campos
        </button>
        <button
          onClick={onConfirm}
          disabled={missingRequired.length > 0}
          className="btn-primary px-6"
        >
          ✓ Confirmar e Salvar
        </button>
      </div>
    </div>
  );
}
