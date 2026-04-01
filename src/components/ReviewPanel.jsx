import React, { useState } from "react";
import { useConfig } from "../context/ConfigContext";
import { confidenceColor } from "../utils/validators";
import { spellCheck } from "../utils/fuzzy";
import { calcCompliance } from "../data/decree10278";

function ReviewRow({ label, value, confidence, required, checkSpelling }) {
  const conf = confidence ? confidenceColor(confidence) : null;
  const empty = !value || !value.toString().trim();
  const spellResult = checkSpelling && !empty ? spellCheck(value) : null;
  const hasFixes = spellResult?.fixes?.length > 0;

  return (
    <div className={`flex flex-col py-2.5 border-b border-slate-100 last:border-0 ${empty && required ? "bg-red-50" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="w-36 flex-shrink-0">
          <span className="text-xs font-semibold text-slate-500">{label}</span>
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </div>
        <div className="flex-1 flex items-center gap-2">
          {empty ? (
            <span className="text-xs text-red-400 italic">— não preenchido —</span>
          ) : (
            <span className={`text-sm break-words ${hasFixes ? "text-amber-800" : "text-slate-800"}`}>{value}</span>
          )}
          {conf && confidence > 0 && (
            <span className={`badge ${conf.bg} ${conf.text} border ${conf.border} ml-auto flex-shrink-0 font-mono`}>
              {Math.round(confidence * 100)}%
            </span>
          )}
        </div>
      </div>
      {hasFixes && (
        <div className="ml-36 mt-1.5 pl-3 flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5 bg-amber-50 border border-amber-200 rounded text-xs">
          <span className="font-semibold text-amber-700">Possível erro ortográfico:</span>
          {spellResult.fixes.map((fix, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              <s className="text-red-500">{fix.from}</s>
              <span className="text-slate-400">→</span>
              <strong className="text-emerald-700">{fix.to}</strong>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReviewPanel({ doc, values, aiData, onConfirm, onEdit }) {
  const { documentTypes } = useConfig();
  const cfg = documentTypes[doc.type];
  const [complianceExpanded, setComplianceExpanded] = useState(false);

  const compliance = calcCompliance(cfg, values);

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
                checkSpelling={f.spellCheck === true}
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

      {/* Decreto 10.278/2020 compliance section */}
      {compliance && (
        <div className={`mx-6 mb-4 rounded-lg border ${
          compliance.allMet
            ? "bg-emerald-50 border-emerald-200"
            : "bg-amber-50 border-amber-200"
        }`}>
          <button
            onClick={() => setComplianceExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">📋</span>
              <span className={`text-sm font-semibold ${
                compliance.allMet ? "text-emerald-800" : "text-amber-800"
              }`}>
                Decreto 10.278/2020
              </span>
              {compliance.allMet ? (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300">
                  ✓ Atende
                </span>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300">
                  ⚠ {compliance.missing} campo{compliance.missing > 1 ? "s" : ""} ausente{compliance.missing > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <span className={`text-xs ${compliance.allMet ? "text-emerald-600" : "text-amber-600"}`}>
              {complianceExpanded ? "▲ ocultar" : "▼ detalhar"}
            </span>
          </button>

          {complianceExpanded && (
            <div className="px-4 pb-3 border-t border-slate-200">
              <div className="mt-2 flex flex-col gap-1">
                {compliance.fields.map((f) => (
                  <div key={f.id} className="flex items-start gap-2 py-1 border-b border-slate-100 last:border-0">
                    <span className={`text-xs mt-0.5 ${f.met ? "text-emerald-600" : "text-red-500"}`}>
                      {f.met ? "✓" : "✗"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-slate-700">{f.label}</span>
                      {f.mappedTo ? (
                        <span className="text-xs text-slate-400 ml-1">→ {f.mappedTo}</span>
                      ) : (
                        <span className="text-xs text-red-400 ml-1 italic">não mapeado</span>
                      )}
                      {f.met && (
                        <p className="text-xs text-slate-500 truncate">{f.value}</p>
                      )}
                      {!f.met && !f.mappedTo && (
                        <p className="text-xs text-red-400 italic">Configure o mapeamento em ⚙ Configuração</p>
                      )}
                      {!f.met && f.mappedTo && (
                        <p className="text-xs text-amber-600 italic">Campo mapeado mas não preenchido</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2 italic">
                Entidade {compliance.entidade === "publica" ? "pública" : "privada"} — {compliance.total} campos exigidos
              </p>
            </div>
          )}
        </div>
      )}

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
