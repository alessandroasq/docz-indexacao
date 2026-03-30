import React, { useState } from "react";
import { useConfig } from "../../context/ConfigContext";

export default function VocabularyEditor() {
  const { vocabulary, setVocabulary } = useConfig();
  const vocKeys = Object.keys(vocabulary);

  const [selectedVoc, setSelectedVoc] = useState(vocKeys[0] || null);
  const [addingVoc, setAddingVoc] = useState(false);
  const [newVocName, setNewVocName] = useState("");
  const [newItem, setNewItem] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  const items = selectedVoc ? (vocabulary[selectedVoc] || []) : [];

  // ── Vocabulary CRUD ───────────────────────────────────────────

  const addVoc = () => {
    const key = newVocName.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (!key || vocabulary[key]) return;
    setVocabulary({ ...vocabulary, [key]: [] });
    setSelectedVoc(key);
    setNewVocName("");
    setAddingVoc(false);
  };

  const deleteVoc = (key) => {
    if (!window.confirm(`Excluir vocabulário "${key}"? Campos que usam este vocabulário precisarão ser reconfigurados.`)) return;
    const next = { ...vocabulary };
    delete next[key];
    setVocabulary(next);
    if (selectedVoc === key) setSelectedVoc(Object.keys(next)[0] || null);
  };

  // ── Item CRUD ─────────────────────────────────────────────────

  const addItem = () => {
    const v = newItem.trim();
    if (!v || !selectedVoc) return;
    if (items.includes(v)) { setNewItem(""); return; }
    setVocabulary({ ...vocabulary, [selectedVoc]: [...items, v] });
    setNewItem("");
  };

  const removeItem = (i) => {
    const next = items.filter((_, idx) => idx !== i);
    setVocabulary({ ...vocabulary, [selectedVoc]: next });
    if (editingIndex === i) setEditingIndex(null);
  };

  const startEdit = (i) => {
    setEditingIndex(i);
    setEditingValue(items[i]);
  };

  const commitEdit = (i) => {
    const v = editingValue.trim();
    if (!v) { setEditingIndex(null); return; }
    const next = [...items];
    next[i] = v;
    setVocabulary({ ...vocabulary, [selectedVoc]: next });
    setEditingIndex(null);
  };

  const moveItem = (i, dir) => {
    const next = [...items];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setVocabulary({ ...vocabulary, [selectedVoc]: next });
  };

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── LEFT: Vocabulary list ─────────────────────────── */}
      <div className="w-64 shrink-0 flex flex-col bg-white border-r border-slate-200 overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Vocabulários</p>
          <p className="text-xs text-slate-400 mt-0.5">Usados pelos campos autocomplete</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {vocKeys.map((key) => (
            <div
              key={key}
              onClick={() => setSelectedVoc(key)}
              className={`flex items-center gap-2 px-4 py-3 cursor-pointer border-b border-slate-100 group transition-colors ${
                selectedVoc === key ? "bg-blue-50" : "hover:bg-slate-50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold font-mono truncate ${selectedVoc === key ? "text-blue-700" : "text-slate-700"}`}>
                  {key}
                </p>
                <p className="text-xs text-slate-400">{vocabulary[key]?.length || 0} itens</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteVoc(key); }}
                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                title="Excluir vocabulário"
              >✕</button>
            </div>
          ))}
          {vocKeys.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center py-6 px-4">
              Nenhum vocabulário criado ainda.
            </p>
          )}
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-50">
          {addingVoc ? (
            <div className="flex flex-col gap-1.5">
              <input
                autoFocus
                value={newVocName}
                onChange={(e) => setNewVocName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addVoc();
                  if (e.key === "Escape") setAddingVoc(false);
                }}
                placeholder="nome_do_vocabulario"
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded font-mono focus:outline-none focus:border-blue-500 bg-white"
              />
              <div className="flex gap-1">
                <button onClick={addVoc}
                  className="flex-1 text-xs py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Criar
                </button>
                <button onClick={() => setAddingVoc(false)}
                  className="flex-1 text-xs py-1 border border-slate-200 text-slate-500 rounded hover:bg-slate-100">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingVoc(true)}
              className="w-full text-xs py-1.5 text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
            >
              + Novo vocabulário
            </button>
          )}
        </div>
      </div>

      {/* ── RIGHT: Items list ─────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {!selectedVoc ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Selecione um vocabulário
          </div>
        ) : (
          <>
            <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-700 font-mono">{selectedVoc}</h2>
                <p className="text-xs text-slate-400">{items.length} itens</p>
              </div>
              <p className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                Clique em um item para editar
              </p>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                {items.length === 0 && (
                  <p className="text-sm text-slate-400 italic text-center py-8">Nenhum item. Adicione abaixo.</p>
                )}
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 last:border-0 group hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-0 shrink-0">
                      <button onClick={() => moveItem(i, -1)} disabled={i === 0}
                        className="text-slate-200 hover:text-slate-500 disabled:opacity-20 text-xs leading-none">▲</button>
                      <button onClick={() => moveItem(i, 1)} disabled={i === items.length - 1}
                        className="text-slate-200 hover:text-slate-500 disabled:opacity-20 text-xs leading-none">▼</button>
                    </div>

                    {editingIndex === i ? (
                      <input
                        autoFocus
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => commitEdit(i)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit(i);
                          if (e.key === "Escape") setEditingIndex(null);
                        }}
                        className="flex-1 text-sm px-2 py-0.5 border border-blue-400 rounded focus:outline-none bg-blue-50"
                      />
                    ) : (
                      <span
                        className="flex-1 text-sm text-slate-700 cursor-text hover:text-blue-600"
                        onClick={() => startEdit(i)}
                        title="Clique para editar"
                      >
                        {item}
                      </span>
                    )}

                    <button
                      onClick={() => removeItem(i)}
                      className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-1"
                      title="Remover item"
                    >✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add item */}
            <div className="px-6 py-3 bg-white border-t border-slate-200">
              <div className="flex gap-2">
                <input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
                  placeholder="Novo item do vocabulário..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 bg-white"
                />
                <button
                  onClick={addItem}
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
