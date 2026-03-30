import React, { useState } from "react";
import { useConfig } from "../../context/ConfigContext";
import FieldEditor, { TYPE_BADGE, FIELD_TYPES } from "./FieldEditor";

const COLOR_PALETTE = [
  { key: "blue",    bg: "bg-blue-100",    text: "text-blue-700",    ring: "ring-blue-500" },
  { key: "violet",  bg: "bg-violet-100",  text: "text-violet-700",  ring: "ring-violet-500" },
  { key: "amber",   bg: "bg-amber-100",   text: "text-amber-700",   ring: "ring-amber-500" },
  { key: "emerald", bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-500" },
  { key: "rose",    bg: "bg-rose-100",    text: "text-rose-700",    ring: "ring-rose-500" },
  { key: "slate",   bg: "bg-slate-100",   text: "text-slate-700",   ring: "ring-slate-400" },
];

function colorFor(key) {
  return COLOR_PALETTE.find((c) => c.key === key) || COLOR_PALETTE[0];
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .slice(0, 32);
}

function newField(label, existingIds) {
  let id = slugify(label) || "campo";
  let i = 1;
  while (existingIds.includes(id)) id = slugify(label) + "_" + i++;
  return { id, label, type: "text", required: false };
}

export default function DocTypeEditor() {
  const { documentTypes, setDocumentTypes } = useConfig();

  const typeKeys = Object.keys(documentTypes);
  const [selectedTypeKey, setSelectedTypeKey] = useState(typeKeys[0] || null);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [newTypeName, setNewTypeName] = useState("");
  const [addingType, setAddingType] = useState(false);

  const selectedType = selectedTypeKey ? documentTypes[selectedTypeKey] : null;
  const selectedField = selectedType?.fields?.find((f) => f.id === selectedFieldId) || null;

  // ── Doc type operations ───────────────────────────────────────

  const addType = () => {
    const label = newTypeName.trim();
    if (!label) return;
    const key = slugify(label) || "tipo";
    const safeKey = documentTypes[key] ? key + "_" + Date.now() : key;
    const next = {
      ...documentTypes,
      [safeKey]: { label, color: "blue", defaults: {}, fields: [] },
    };
    setDocumentTypes(next);
    setSelectedTypeKey(safeKey);
    setSelectedFieldId(null);
    setNewTypeName("");
    setAddingType(false);
  };

  const deleteType = (key) => {
    if (!window.confirm(`Excluir tipo "${documentTypes[key]?.label}"? Isso não pode ser desfeito.`)) return;
    const next = { ...documentTypes };
    delete next[key];
    setDocumentTypes(next);
    if (selectedTypeKey === key) {
      setSelectedTypeKey(Object.keys(next)[0] || null);
      setSelectedFieldId(null);
    }
  };

  const updateType = (key, patch) => {
    setDocumentTypes({ ...documentTypes, [key]: { ...documentTypes[key], ...patch } });
  };

  // ── Field operations ──────────────────────────────────────────

  const addField = () => {
    if (!selectedTypeKey) return;
    const existingIds = (selectedType.fields || []).map((f) => f.id);
    const field = newField("Novo campo", existingIds);
    const fields = [...(selectedType.fields || []), field];
    updateType(selectedTypeKey, { fields });
    setSelectedFieldId(field.id);
  };

  const deleteField = (fieldId) => {
    const fields = (selectedType.fields || []).filter((f) => f.id !== fieldId);
    updateType(selectedTypeKey, { fields });
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };

  const updateField = (updatedField) => {
    const fields = (selectedType.fields || []).map((f) =>
      f.id === selectedFieldId ? updatedField : f
    );
    updateType(selectedTypeKey, { fields });
    setSelectedFieldId(updatedField.id);
  };

  const moveField = (fieldId, dir) => {
    const fields = [...(selectedType.fields || [])];
    const i = fields.findIndex((f) => f.id === fieldId);
    const j = i + dir;
    if (j < 0 || j >= fields.length) return;
    [fields[i], fields[j]] = [fields[j], fields[i]];
    updateType(selectedTypeKey, { fields });
  };

  // ── Defaults (key-value) ──────────────────────────────────────

  const setDefault = (k, v, oldKey) => {
    const defaults = { ...(selectedType?.defaults || {}) };
    if (oldKey && oldKey !== k) delete defaults[oldKey];
    if (k) defaults[k] = v;
    updateType(selectedTypeKey, { defaults });
  };

  const removeDefault = (k) => {
    const defaults = { ...(selectedType?.defaults || {}) };
    delete defaults[k];
    updateType(selectedTypeKey, { defaults });
  };

  const addDefault = () => updateType(selectedTypeKey, {
    defaults: { ...(selectedType?.defaults || {}), "": "" },
  });

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── LEFT PANEL: Type list ──────────────────────────── */}
      <div className="w-52 shrink-0 flex flex-col bg-white border-r border-slate-200 overflow-hidden">
        <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tipos documentais</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {typeKeys.map((key) => {
            const dt = documentTypes[key];
            const col = colorFor(dt.color);
            const active = key === selectedTypeKey;
            return (
              <div
                key={key}
                onClick={() => { setSelectedTypeKey(key); setSelectedFieldId(null); }}
                className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer border-b border-slate-100 group transition-colors ${
                  active ? "bg-blue-50" : "hover:bg-slate-50"
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.bg.replace("bg-", "bg-").replace("100", "400")}`} />
                <span className={`flex-1 text-sm font-medium truncate ${active ? "text-blue-700" : "text-slate-700"}`}>
                  {dt.label}
                </span>
                <span className="text-xs text-slate-400 shrink-0">{dt.fields?.length || 0}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteType(key); }}
                  className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  title="Excluir tipo"
                >✕</button>
              </div>
            );
          })}
        </div>

        {/* Add type */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          {addingType ? (
            <div className="flex flex-col gap-1.5">
              <input
                autoFocus
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addType();
                  if (e.key === "Escape") setAddingType(false);
                }}
                placeholder="Nome do tipo..."
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-500 bg-white"
              />
              <div className="flex gap-1">
                <button onClick={addType}
                  className="flex-1 text-xs py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Criar
                </button>
                <button onClick={() => setAddingType(false)}
                  className="flex-1 text-xs py-1 border border-slate-200 text-slate-500 rounded hover:bg-slate-100">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingType(true)}
              className="w-full text-xs py-1.5 text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
            >
              + Novo tipo
            </button>
          )}
        </div>
      </div>

      {/* ── CENTER PANEL: Fields list ──────────────────────── */}
      <div className="w-72 shrink-0 flex flex-col bg-slate-50 border-r border-slate-200 overflow-hidden">
        {!selectedType ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Selecione um tipo documental
          </div>
        ) : (
          <>
            {/* Type meta */}
            <div className="px-4 py-3 bg-white border-b border-slate-200 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <input
                  value={selectedType.label}
                  onChange={(e) => updateType(selectedTypeKey, { label: e.target.value })}
                  className="flex-1 text-sm font-semibold text-slate-700 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none bg-transparent px-0 py-0.5"
                />
                <span className="text-xs text-slate-400 font-mono">{selectedTypeKey}</span>
              </div>

              {/* Color picker */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Cor:</span>
                <div className="flex gap-1.5">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => updateType(selectedTypeKey, { color: c.key })}
                      className={`w-5 h-5 rounded-full ${c.bg.replace("100", "400")} transition-all ${
                        selectedType.color === c.key ? `ring-2 ring-offset-1 ${c.ring}` : "opacity-60 hover:opacity-100"
                      }`}
                      title={c.key}
                    />
                  ))}
                </div>
              </div>

              {/* Defaults */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-500">Valores padrão</span>
                  <button onClick={addDefault}
                    className="text-xs text-blue-600 hover:underline">+ Add</button>
                </div>
                <div className="flex flex-col gap-1">
                  {Object.entries(selectedType.defaults || {}).map(([k, v], i) => (
                    <div key={i} className="flex items-center gap-1">
                      <input
                        value={k}
                        onChange={(e) => setDefault(e.target.value, v, k)}
                        placeholder="campo_id"
                        className="w-24 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono focus:outline-none focus:border-blue-500 bg-white"
                      />
                      <span className="text-slate-300 text-xs">=</span>
                      <input
                        value={v}
                        onChange={(e) => setDefault(k, e.target.value)}
                        placeholder="valor"
                        className="flex-1 px-1.5 py-0.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-500 bg-white"
                      />
                      <button onClick={() => removeDefault(k)}
                        className="text-slate-300 hover:text-red-500 text-xs">✕</button>
                    </div>
                  ))}
                  {Object.keys(selectedType.defaults || {}).length === 0 && (
                    <p className="text-xs text-slate-400 italic">Nenhum valor padrão.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Fields list */}
            <div className="px-3 py-2 bg-slate-100 border-b border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Campos ({selectedType.fields?.length || 0})
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {(selectedType.fields || []).length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-6">Nenhum campo ainda.</p>
              )}
              {(selectedType.fields || []).map((f, i) => {
                const badge = TYPE_BADGE[f.type] || "bg-slate-100 text-slate-600";
                const active = f.id === selectedFieldId;
                const total = selectedType.fields.length;
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFieldId(f.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer border-b border-slate-100 group transition-colors ${
                      active ? "bg-blue-50" : "hover:bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveField(f.id, -1); }}
                        disabled={i === 0}
                        className="text-slate-300 hover:text-slate-600 disabled:opacity-20 text-xs leading-none"
                      >▲</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveField(f.id, 1); }}
                        disabled={i === total - 1}
                        className="text-slate-300 hover:text-slate-600 disabled:opacity-20 text-xs leading-none"
                      >▼</button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${active ? "text-blue-700" : "text-slate-700"}`}>
                        {f.label}
                        {f.required && <span className="text-red-400 ml-0.5">*</span>}
                      </p>
                      <p className="text-xs text-slate-400 font-mono truncate">{f.id}</p>
                    </div>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded shrink-0 ${badge}`}>
                      {f.type}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Add field */}
            <div className="p-3 border-t border-slate-200 bg-white">
              <button
                onClick={addField}
                className="w-full text-xs py-1.5 text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
              >
                + Novo campo
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── RIGHT PANEL: Field editor ──────────────────────── */}
      <div className="flex-1 overflow-hidden bg-white">
        {!selectedField ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 gap-2 px-8">
            <span className="text-3xl">←</span>
            <p className="text-sm font-medium">Selecione um campo para editá-lo</p>
            <p className="text-xs">Ou adicione um novo campo no painel central</p>
          </div>
        ) : (
          <FieldEditor
            key={selectedFieldId}
            typeKey={selectedTypeKey}
            field={selectedField}
            onUpdate={updateField}
            onDelete={() => deleteField(selectedFieldId)}
          />
        )}
      </div>

    </div>
  );
}
