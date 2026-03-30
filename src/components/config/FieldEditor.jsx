import React, { useState } from "react";
import { useConfig } from "../../context/ConfigContext";

const FIELD_TYPES = [
  { value: "text",         label: "Texto livre" },
  { value: "date",         label: "Data" },
  { value: "number",       label: "Número" },
  { value: "select",       label: "Lista (select)" },
  { value: "autocomplete", label: "Autocomplete (fuzzy)" },
  { value: "masked",       label: "Máscara (masked)" },
  { value: "regex",        label: "Expressão regular" },
  { value: "currency",     label: "Moeda (R$)" },
  { value: "cnpj",         label: "CNPJ" },
  { value: "textarea",     label: "Área de texto" },
];

const TYPE_BADGE = {
  text: "bg-slate-100 text-slate-600",
  date: "bg-blue-100 text-blue-700",
  number: "bg-purple-100 text-purple-700",
  select: "bg-amber-100 text-amber-700",
  autocomplete: "bg-cyan-100 text-cyan-700",
  masked: "bg-orange-100 text-orange-700",
  regex: "bg-red-100 text-red-700",
  currency: "bg-emerald-100 text-emerald-700",
  cnpj: "bg-lime-100 text-lime-700",
  textarea: "bg-violet-100 text-violet-700",
};

function Row({ label, children, hint }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, mono, type = "text" }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 bg-white ${mono ? "font-mono" : ""}`}
    />
  );
}

function CheckRow({ label, checked, onChange, hint }) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-blue-600"
      />
      <div>
        <span className="text-sm text-slate-700 group-hover:text-slate-900">{label}</span>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    </label>
  );
}

// Options list editor for "select" type
function OptionsEditor({ options = [], onChange }) {
  const [newOpt, setNewOpt] = useState("");

  const add = () => {
    const v = newOpt.trim();
    if (!v || options.includes(v)) return;
    onChange([...options, v]);
    setNewOpt("");
  };

  const remove = (i) => onChange(options.filter((_, idx) => idx !== i));

  const move = (i, dir) => {
    const arr = [...options];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange(arr);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
        {options.length === 0 && (
          <p className="text-xs text-slate-400 px-3 py-2 italic">Nenhuma opção ainda.</p>
        )}
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-1 px-2 py-1.5 border-b border-slate-100 last:border-0 group hover:bg-slate-50">
            <span className="flex-1 text-sm text-slate-700 truncate">{opt}</span>
            <button onClick={() => move(i, -1)} disabled={i === 0}
              className="text-slate-300 hover:text-slate-600 disabled:opacity-20 text-xs px-1">↑</button>
            <button onClick={() => move(i, 1)} disabled={i === options.length - 1}
              className="text-slate-300 hover:text-slate-600 disabled:opacity-20 text-xs px-1">↓</button>
            <button onClick={() => remove(i)}
              className="text-slate-300 hover:text-red-500 text-xs px-1 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          value={newOpt}
          onChange={(e) => setNewOpt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Nova opção..."
          className="flex-1 px-2.5 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 bg-white"
        />
        <button
          onClick={add}
          className="px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + Add
        </button>
      </div>
    </div>
  );
}

export default function FieldEditor({ typeKey, field, onUpdate, onDelete }) {
  const { vocabulary } = useConfig();
  const vocKeys = Object.keys(vocabulary);

  const set = (key, val) => onUpdate({ ...field, [key]: val });
  const setZone = (k, v) => {
    const zone = field.pdfZone ? { ...field.pdfZone } : {};
    if (v === "" || v === undefined) {
      delete zone[k];
      onUpdate({ ...field, pdfZone: Object.keys(zone).length ? zone : undefined });
    } else {
      zone[k] = Number(v);
      onUpdate({ ...field, pdfZone: zone });
    }
  };

  const handleTypeChange = (newType) => {
    if (newType === field.type) return;
    // Clear type-specific props
    const {
      placeholder, min, max, options, voc, mask,
      pattern, patternHint, maxLength, spellCheck: sc,
      ...rest
    } = field;
    onUpdate({ ...rest, type: newType });
  };

  return (
    <div className="flex flex-col gap-5 p-5 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-700">Editar campo</h3>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded mt-1 inline-block ${TYPE_BADGE[field.type] || "bg-slate-100 text-slate-600"}`}>
            {field.type}
          </span>
        </div>
        <button
          onClick={onDelete}
          className="text-xs px-2.5 py-1.5 text-red-500 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
        >
          🗑 Excluir
        </button>
      </div>

      <hr className="border-slate-200" />

      {/* Common fields */}
      <Row label="ID do campo" hint="Identificador único (snake_case). Não altere após criar documentos.">
        <Input value={field.id} onChange={(v) => set("id", v)} placeholder="ex: numero_decreto" mono />
      </Row>

      <Row label="Label (rótulo)">
        <Input value={field.label} onChange={(v) => set("label", v)} placeholder="ex: Nº Decreto" />
      </Row>

      <Row label="Tipo de campo">
        <select
          value={field.type}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 bg-white"
        >
          {FIELD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </Row>

      <CheckRow
        label="Campo obrigatório"
        checked={field.required}
        onChange={(v) => set("required", v)}
      />

      {/* ── Type-specific config ─────────────────────────────── */}

      {(field.type === "text" || field.type === "number") && (
        <Row label="Placeholder">
          <Input value={field.placeholder} onChange={(v) => set("placeholder", v)} placeholder="Texto de ajuda..." />
        </Row>
      )}

      {field.type === "number" && (
        <div className="grid grid-cols-2 gap-3">
          <Row label="Mínimo">
            <Input value={field.min} onChange={(v) => set("min", v === "" ? undefined : Number(v))} type="number" />
          </Row>
          <Row label="Máximo">
            <Input value={field.max} onChange={(v) => set("max", v === "" ? undefined : Number(v))} type="number" />
          </Row>
        </div>
      )}

      {field.type === "select" && (
        <Row label="Opções da lista">
          <OptionsEditor
            options={field.options || []}
            onChange={(opts) => set("options", opts)}
          />
        </Row>
      )}

      {field.type === "autocomplete" && (
        <Row label="Vocabulário controlado" hint="Chave do vocabulário que alimenta este campo.">
          {vocKeys.length === 0 ? (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              Nenhum vocabulário criado. Vá à aba "Vocabulário Controlado".
            </p>
          ) : (
            <select
              value={field.voc || ""}
              onChange={(e) => set("voc", e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">— Selecione —</option>
              {vocKeys.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          )}
        </Row>
      )}

      {field.type === "masked" && (
        <>
          <Row label="Máscara" hint="Use 9 para dígito numérico. Ex: 9999/9999">
            <Input value={field.mask} onChange={(v) => set("mask", v)} placeholder="9999/9999" mono />
          </Row>
          <Row label="Placeholder">
            <Input value={field.placeholder} onChange={(v) => set("placeholder", v)} placeholder="0000/0000" mono />
          </Row>
        </>
      )}

      {field.type === "regex" && (
        <>
          <Row label="Padrão (regex)" hint="Expressão regular JavaScript sem delimitadores.">
            <Input value={field.pattern} onChange={(v) => set("pattern", v)} placeholder="^[A-Z]{2,5}-\d{3,5}\/\d{4}$" mono />
          </Row>
          <Row label="Dica do padrão" hint="Mostrada ao usuário quando o valor for inválido.">
            <Input value={field.patternHint} onChange={(v) => set("patternHint", v)} placeholder="SIGLA-NNN/AAAA" />
          </Row>
          <Row label="Placeholder">
            <Input value={field.placeholder} onChange={(v) => set("placeholder", v)} placeholder="SEI-0000/2026" mono />
          </Row>
        </>
      )}

      {field.type === "textarea" && (
        <>
          <Row label="Tamanho máximo (caracteres)">
            <Input value={field.maxLength} onChange={(v) => set("maxLength", v === "" ? undefined : Number(v))} type="number" placeholder="500" />
          </Row>
          <CheckRow
            label="Habilitar corretor ortográfico"
            checked={field.spellCheck}
            onChange={(v) => set("spellCheck", v)}
            hint="Detecta e sugere correções com base no dicionário configurado."
          />
        </>
      )}

      {/* ── PDF Zone ─────────────────────────────────────────── */}
      <hr className="border-slate-200" />
      <Row label="Zona do PDF" hint="Linha(s) do conteúdo mock onde este campo aparece. O viewer fará zoom ao focar o campo.">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Linha início</label>
            <Input
              value={field.pdfZone?.lineStart ?? ""}
              onChange={(v) => setZone("lineStart", v)}
              type="number"
              placeholder="ex: 2"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Linha fim</label>
            <Input
              value={field.pdfZone?.lineEnd ?? ""}
              onChange={(v) => setZone("lineEnd", v)}
              type="number"
              placeholder="ex: 4"
            />
          </div>
        </div>
      </Row>

      {/* ── Valor padrão ─────────────────────────────────────── */}
      <Row label="Valor padrão" hint="Pré-preenchido automaticamente ao abrir o formulário.">
        <Input
          value={field.defaultValue ?? ""}
          onChange={(v) => set("defaultValue", v || undefined)}
          placeholder="Opcional"
        />
      </Row>
    </div>
  );
}

export { TYPE_BADGE, FIELD_TYPES };
