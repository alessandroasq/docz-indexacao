import React, { useState, useEffect, useCallback, useRef } from "react";
import { DOCUMENT_TYPES } from "../data/documentTypes";
import { MOCK_AI_EXTRACTION } from "../data/mockData";
import { validateCNPJ, isMaskComplete } from "../utils/validators";
import AutocompleteField from "./fields/AutocompleteField";
import SpellCheckArea from "./fields/SpellCheckArea";
import MaskedField from "./fields/MaskedField";
import CnpjField from "./fields/CnpjField";
import CurrencyField from "./fields/CurrencyField";
import RegexField from "./fields/RegexField";
import FieldWrapper from "./fields/FieldWrapper";

function ConfBar({ pct }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-blue-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-slate-500">{pct}%</span>
    </div>
  );
}

export default function IndexingForm({ doc, onSave, onSkip, selectedPdfText, autoAI }) {
  const cfg = DOCUMENT_TYPES[doc.type];
  const aiData = MOCK_AI_EXTRACTION[doc.type] || {};

  const [values, setValues] = useState({});
  const [aiActive, setAiActive] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const [saved, setSaved] = useState(false);

  // Reset when document changes
  useEffect(() => {
    setValues(cfg.defaults ? { ...cfg.defaults } : {});
    setAiActive(false);
    setAiLoading(false);
    setErrors({});
    setShowErrors(false);
    setSaved(false);
  }, [doc.id]);

  // Auto-run AI if enabled
  useEffect(() => {
    if (autoAI && !aiActive && !aiLoading) {
      triggerAI();
    }
  }, [doc.id, autoAI]);

  const set = (id, val) => setValues((prev) => ({ ...prev, [id]: val }));

  const triggerAI = useCallback(() => {
    setAiLoading(true);
    setTimeout(() => {
      const newVals = { ...(cfg.defaults || {}) };
      Object.entries(aiData).forEach(([key, data]) => {
        if (data.value) newVals[key] = data.value;
      });
      setValues(newVals);
      setAiActive(true);
      setAiLoading(false);
    }, 1600);
  }, [aiData, cfg.defaults]);

  const validate = useCallback(() => {
    const errs = {};
    cfg.fields.forEach((f) => {
      const v = values[f.id];
      const empty = !v || !v.toString().trim();

      if (f.required && empty) {
        errs[f.id] = "Campo obrigatório";
        return;
      }
      if (empty) return;

      if (f.type === "masked" && !isMaskComplete(v, f.mask)) {
        errs[f.id] = `Formato incompleto: ${f.mask.replace(/9/g, "N")}`;
      } else if (f.type === "regex" && f.pattern && !new RegExp(f.pattern).test(v)) {
        errs[f.id] = `Formato inválido: ${f.patternHint}`;
      } else if (f.type === "cnpj" && v.replace(/\D/g, "").length === 14 && !validateCNPJ(v)) {
        errs[f.id] = "CNPJ inválido — dígito verificador incorreto";
      }
    });
    return errs;
  }, [values, cfg]);

  const handleSave = useCallback(() => {
    const errs = validate();
    setErrors(errs);
    setShowErrors(true);

    if (Object.keys(errs).length === 0) {
      setSaved(true);
      setTimeout(() => onSave(values, aiActive ? aiData : null), 800);
    }
  }, [validate, values, aiActive, aiData, onSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); handleSave(); }
      if (e.ctrlKey && e.key === "ArrowRight") { e.preventDefault(); onSkip(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave, onSkip]);

  const fieldsRef = useRef(null);
  const handleFieldsKeyDown = useCallback((e) => {
    if (e.key !== "Tab") return;
    const container = fieldsRef.current;
    if (!container) return;
    const focusable = Array.from(container.querySelectorAll("input, select, textarea"));
    const idx = focusable.indexOf(document.activeElement);
    if (idx === -1) return;
    e.preventDefault();
    const next = e.shiftKey
      ? focusable[(idx - 1 + focusable.length) % focusable.length]
      : focusable[(idx + 1) % focusable.length];
    next?.focus();
  }, []);

  const filledCount = cfg.fields.filter((f) => {
    const v = values[f.id];
    return v && v.toString().trim();
  }).length;
  const pct = Math.round((filledCount / cfg.fields.length) * 100);

  const renderField = (f) => {
    const v = values[f.id] || "";
    const confidence = aiActive && aiData[f.id] ? aiData[f.id].confidence : 0;
    const hasError = showErrors && errors[f.id];

    const borderClass = hasError
      ? "field-input-error"
      : confidence >= 0.95
      ? "field-input-valid"
      : confidence >= 0.8
      ? "field-input-warn"
      : "";

    let fieldEl;
    switch (f.type) {
      case "autocomplete":
        fieldEl = (
          <AutocompleteField
            value={v}
            onChange={(val) => set(f.id, val)}
            voc={f.voc}
            className={borderClass}
          />
        );
        break;
      case "select":
        fieldEl = (
          <select
            value={v}
            onChange={(e) => set(f.id, e.target.value)}
            className={`field-input cursor-pointer ${borderClass}`}
          >
            <option value="">— Selecione —</option>
            {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        );
        break;
      case "textarea":
        fieldEl = (
          <SpellCheckArea
            value={v}
            onChange={(val) => set(f.id, val)}
            maxLength={f.maxLength}
            className={borderClass}
            onPasteFromPDF={selectedPdfText ? () => set(f.id, selectedPdfText.replace(/[\r\n]+/g, " ").trim()) : undefined}
          />
        );
        break;
      case "masked":
        fieldEl = (
          <MaskedField
            value={v}
            onChange={(val) => set(f.id, val)}
            mask={f.mask}
            placeholder={f.placeholder}
            className={borderClass}
          />
        );
        break;
      case "regex":
        fieldEl = (
          <RegexField
            value={v}
            onChange={(val) => set(f.id, val)}
            pattern={f.pattern}
            patternHint={f.patternHint}
            placeholder={f.placeholder}
            className={borderClass}
          />
        );
        break;
      case "currency":
        fieldEl = <CurrencyField value={v} onChange={(val) => set(f.id, val)} className={borderClass} />;
        break;
      case "cnpj":
        fieldEl = <CnpjField value={v} onChange={(val) => set(f.id, val)} className={borderClass} />;
        break;
      case "date":
        fieldEl = (
          <input
            type="date"
            value={v}
            onChange={(e) => set(f.id, e.target.value)}
            className={`field-input ${borderClass}`}
          />
        );
        break;
      case "number":
        fieldEl = (
          <input
            type="number"
            value={v}
            onChange={(e) => set(f.id, e.target.value)}
            min={f.min}
            max={f.max}
            placeholder={f.placeholder || ""}
            className={`field-input ${borderClass}`}
          />
        );
        break;
      default:
        fieldEl = (
          <input
            type="text"
            value={v}
            onChange={(e) => set(f.id, e.target.value)}
            placeholder={f.placeholder || ""}
            className={`field-input ${borderClass}`}
          />
        );
    }

    return (
      <FieldWrapper
        key={f.id}
        field={f}
        confidence={confidence}
        hasError={hasError}
        errorMsg={errors[f.id]}
      >
        {fieldEl}
      </FieldWrapper>
    );
  };

  const typeColor = {
    decreto: "blue", oficio: "violet", portaria: "amber",
    contrato: "emerald", resolucao: "rose",
  }[doc.type] || "blue";

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Form Header */}
      <div className="px-5 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`px-2.5 py-1 rounded-md bg-${typeColor}-100 text-${typeColor}-700 text-xs font-bold uppercase tracking-wide`}>
              {cfg.label}
            </div>
            <span className="text-xs text-slate-400 font-mono">{doc.file}</span>
          </div>
          <ConfBar pct={pct} />
        </div>
      </div>

      {/* Defaults banner */}
      {Object.keys(cfg.defaults || {}).length > 0 && (
        <div className="px-5 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-700">
          <span className="font-semibold">Padrão aplicado: </span>
          {Object.entries(cfg.defaults).map(([k, v]) => {
            const fieldDef = cfg.fields.find((f) => f.id === k);
            return (
              <span key={k} className="inline-flex items-center gap-1 mr-3">
                <span className="text-blue-500">{fieldDef?.label || k}:</span>
                <span className="font-medium">"{v}"</span>
              </span>
            );
          })}
        </div>
      )}

      {/* AI Banner */}
      <div className={`px-5 py-2.5 border-b ${aiActive ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-200"} flex items-center justify-between`}>
        {aiLoading ? (
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">Docling processando documento...</span>
          </div>
        ) : aiActive ? (
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <span className="text-emerald-500 font-bold">✓</span>
            <span className="font-medium">IA extraiu campos — revise e confirme</span>
            <span className="text-xs text-emerald-500 ml-2">
              Confiança média: {Math.round(
                Object.values(aiData).reduce((s, d) => s + (d.confidence || 0), 0) /
                  Math.max(Object.keys(aiData).length, 1) * 100
              )}%
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="text-blue-400">⚡</span>
            <span>IA disponível para extração automática</span>
          </div>
        )}
        {!aiActive && !aiLoading && (
          <button
            onClick={triggerAI}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            ⚡ Extrair com IA
          </button>
        )}
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {saved ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-3xl">✓</span>
            </div>
            <p className="text-lg font-semibold text-emerald-700">Indexado com sucesso!</p>
          </div>
        ) : (
          <div ref={fieldsRef} onKeyDown={handleFieldsKeyDown} className="flex flex-col gap-5">
            {cfg.fields.map((f) => renderField(f))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-mono">{filledCount}/{cfg.fields.length} campos</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onSkip}
            className="btn-secondary flex items-center gap-1.5"
          >
            Pular
            <kbd className="text-xs bg-slate-100 border border-slate-300 px-1 rounded">Ctrl→</kbd>
          </button>
          <button
            onClick={handleSave}
            disabled={saved}
            className="btn-primary flex items-center gap-1.5"
          >
            {saved ? "✓ Salvo" : "Salvar"}
            <kbd className="text-xs bg-blue-500 px-1 rounded">Ctrl↵</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
