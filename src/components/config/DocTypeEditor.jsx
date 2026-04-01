import React, { useState } from "react";
import { useConfig } from "../../context/ConfigContext";
import FieldEditor, { TYPE_BADGE } from "./FieldEditor";
import { getDecretoFields } from "../../data/decree10278";

const COLOR_PALETTE = [
  { key: "blue",    bg400: "bg-blue-400",    ring: "ring-blue-500" },
  { key: "violet",  bg400: "bg-violet-400",  ring: "ring-violet-500" },
  { key: "amber",   bg400: "bg-amber-400",   ring: "ring-amber-500" },
  { key: "emerald", bg400: "bg-emerald-400", ring: "ring-emerald-500" },
  { key: "rose",    bg400: "bg-rose-400",    ring: "ring-rose-500" },
  { key: "slate",   bg400: "bg-slate-400",   ring: "ring-slate-400" },
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
    setDocumentTypes({
      ...documentTypes,
      [safeKey]: { label, color: "blue", defaults: {}, fields: [] },
    });
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
    updateType(selectedTypeKey, { fields: [...(selectedType.fields || []), field] });
    setSelectedFieldId(field.id);
  };

  const deleteField = (fieldId) => {
    updateType(selectedTypeKey, {
      fields: (selectedType.fields || []).filter((f) => f.id !== fieldId),
    });
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };

  const updateField = (updatedField) => {
    updateType(selectedTypeKey, {
      fields: (selectedType.fields || []).map((f) =>
        f.id === selectedFieldId ? updatedField : f
      ),
    });
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

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── PANEL 1: Type list ────────────────────────────────── */}
      <div className="w-44 shrink-0 flex flex-col bg-white border-r border-slate-200 overflow-hidden">
        <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tipos</p>
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
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.bg400}`} />
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
                  ✕
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

      {/* ── PANEL 2: Fields list ──────────────────────────────── */}
      <div className="w-52 shrink-0 flex flex-col bg-slate-50 border-r border-slate-200 overflow-hidden">
        {!selectedType ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs text-center px-4">
            Selecione um tipo
          </div>
        ) : (
          <>
            {/* Type meta: label + color */}
            <div className="px-3 py-2.5 bg-white border-b border-slate-200 flex flex-col gap-2">
              <input
                value={selectedType.label}
                onChange={(e) => updateType(selectedTypeKey, { label: e.target.value })}
                className="w-full text-sm font-semibold text-slate-700 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none bg-transparent px-0 py-0.5"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 shrink-0">Cor:</span>
                <div className="flex gap-1.5">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => updateType(selectedTypeKey, { color: c.key })}
                      className={`w-4 h-4 rounded-full ${c.bg400} transition-all ${
                        selectedType.color === c.key ? `ring-2 ring-offset-1 ${c.ring}` : "opacity-50 hover:opacity-100"
                      }`}
                      title={c.key}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Fields list header */}
            <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Campos ({selectedType.fields?.length || 0})
              </p>
            </div>

            {/* Fields */}
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
                    className={`flex items-center gap-1.5 px-2.5 py-2 cursor-pointer border-b border-slate-100 group transition-colors ${
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
                      <p className={`text-xs font-medium truncate ${active ? "text-blue-700" : "text-slate-700"}`}>
                        {f.label}
                        {f.required && <span className="text-red-400 ml-0.5">*</span>}
                      </p>
                      <p className="text-xs text-slate-400 font-mono truncate">{f.id}</p>
                    </div>
                    <span className={`text-xs font-semibold px-1 py-0.5 rounded shrink-0 ${badge}`}>
                      {f.type}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-2.5 border-t border-slate-200 bg-white">
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

      {/* ── PANEL 3: Decreto 10.278/2020 ──────────────────────── */}
      <div className="w-72 shrink-0 flex flex-col bg-white border-r border-slate-200 overflow-hidden">
        <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <span className="text-sm">📋</span>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Decreto 10.278/2020</p>
        </div>

        {!selectedType ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs text-center px-4">
            Selecione um tipo para configurar
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            {/* Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={!!selectedType.decreto10278}
                onChange={(e) => updateType(selectedTypeKey, {
                  decreto10278: e.target.checked,
                  decreto10278Entidade: selectedType.decreto10278Entidade || "publica",
                  decreto10278Mapping: selectedType.decreto10278Mapping || {},
                })}
                className="accent-blue-600 w-3.5 h-3.5"
              />
              <div>
                <p className="text-xs font-semibold text-slate-700">Exige conformidade</p>
                <p className="text-xs text-slate-400 leading-tight">Habilita validação pelo Decreto</p>
              </div>
            </label>

            {selectedType.decreto10278 && (() => {
              const entidade = selectedType.decreto10278Entidade || "publica";
              const mapping = selectedType.decreto10278Mapping || {};
              const decretoFields = getDecretoFields(entidade);
              const fieldIds = (selectedType.fields || []).map((f) => f.id);
              const fieldLabels = Object.fromEntries(
                (selectedType.fields || []).map((f) => [f.id, f.label])
              );

              const setMapping = (decretoId, userFieldId) => {
                updateType(selectedTypeKey, {
                  decreto10278Mapping: { ...mapping, [decretoId]: userFieldId || null },
                });
              };

              return (
                <>
                  {/* Entity type */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-slate-500">Tipo de entidade:</span>
                    <div className="flex gap-1.5">
                      {[
                        { v: "publica",  label: "Pública (13)" },
                        { v: "privada",  label: "Privada (8)" },
                      ].map(({ v, label }) => (
                        <button
                          key={v}
                          onClick={() => updateType(selectedTypeKey, { decreto10278Entidade: v })}
                          className={`flex-1 text-xs px-2 py-1 rounded border transition-colors ${
                            entidade === v
                              ? "bg-blue-600 text-white border-blue-600"
                              : "text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mapping table */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-slate-500">Mapeamento de campos:</span>
                    <div className="rounded-lg border border-slate-200 overflow-hidden">
                      {decretoFields.map((df) => {
                        const isSystem = !!df.systemProvided;
                        const mapped = mapping[df.id] || "";
                        const isMapped = isSystem || !!(mapped && fieldIds.includes(mapped));

                        return (
                          <div
                            key={df.id}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-slate-100 last:border-0"
                            title={df.hint}
                          >
                            {/* Status dot */}
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isSystem ? "bg-orange-400" : isMapped ? "bg-emerald-400" : "bg-slate-300"
                            }`} />

                            <span className={`flex-1 text-xs min-w-0 truncate ${
                              isMapped ? "text-slate-700" : "text-slate-400"
                            }`}>
                              {df.label}
                            </span>

                            {isSystem ? (
                              <span className="text-xs font-mono font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded shrink-0">
                                {df.systemVar}
                              </span>
                            ) : (
                              <select
                                value={mapped}
                                onChange={(e) => setMapping(df.id, e.target.value)}
                                className="text-xs border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:border-blue-500 bg-white w-28 shrink-0"
                              >
                                <option value="">— mapear —</option>
                                {fieldIds.map((fid) => (
                                  <option key={fid} value={fid}>
                                    {fieldLabels[fid] || fid}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 leading-snug p-2 bg-orange-50 border border-orange-100 rounded-lg">
                    <span className="font-semibold text-orange-700">Variáveis do sistema</span> —
                    campos marcados em laranja são preenchidos automaticamente pelo sistema no momento da digitalização.
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── PANEL 4: Field editor ──────────────────────────────── */}
      <div className="flex-1 overflow-hidden bg-white">
        {!selectedField ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 gap-2 px-8">
            <span className="text-3xl">←</span>
            <p className="text-sm font-medium">Selecione um campo para editá-lo</p>
            <p className="text-xs">Ou crie um novo campo no painel de campos</p>
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
