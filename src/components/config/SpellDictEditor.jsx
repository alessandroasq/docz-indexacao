import React, { useState } from "react";
import { useConfig } from "../../context/ConfigContext";

export default function SpellDictEditor() {
  const { spellDict, setSpellDict } = useConfig();
  const [newWrong, setNewWrong] = useState("");
  const [newCorrect, setNewCorrect] = useState("");
  const [search, setSearch] = useState("");

  const entries = Object.entries(spellDict);
  const filtered = search.trim()
    ? entries.filter(([w, c]) =>
        w.includes(search.toLowerCase()) || c.toLowerCase().includes(search.toLowerCase())
      )
    : entries;

  const addEntry = () => {
    const w = newWrong.trim().toLowerCase();
    const c = newCorrect.trim().toLowerCase();
    if (!w || !c) return;
    setSpellDict({ ...spellDict, [w]: c });
    setNewWrong("");
    setNewCorrect("");
  };

  const removeEntry = (key) => {
    const next = { ...spellDict };
    delete next[key];
    setSpellDict(next);
  };

  const updateEntry = (oldKey, newKey, newVal) => {
    const next = { ...spellDict };
    if (oldKey !== newKey) delete next[oldKey];
    next[newKey.toLowerCase()] = newVal.toLowerCase();
    setSpellDict(next);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800">Dicionário do Corretor Ortográfico</h2>
        <p className="text-sm text-slate-500 mt-1">
          Pares de <strong>palavra errada → correção</strong> usados para sugerir correções nos campos de texto. {entries.length} entradas.
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar entradas..."
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-4">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_1fr_36px] px-4 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold uppercase tracking-wide gap-3">
          <span>Palavra errada</span>
          <span>Correção</span>
          <span />
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 italic text-center py-8">
            {search ? "Nenhuma entrada encontrada." : "Nenhuma entrada no dicionário."}
          </p>
        )}

        {filtered.map(([wrong, correct]) => (
          <EntryRow
            key={wrong}
            wrong={wrong}
            correct={correct}
            onUpdate={(nw, nc) => updateEntry(wrong, nw, nc)}
            onDelete={() => removeEntry(wrong)}
          />
        ))}
      </div>

      {/* Add row */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Nova entrada</p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-slate-400 block mb-1">Palavra errada</label>
            <input
              value={newWrong}
              onChange={(e) => setNewWrong(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addEntry(); }}
              placeholder="ex: comisão"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 bg-white font-mono"
            />
          </div>
          <div className="shrink-0 text-slate-400 pb-2">→</div>
          <div className="flex-1">
            <label className="text-xs text-slate-400 block mb-1">Correção</label>
            <input
              value={newCorrect}
              onChange={(e) => setNewCorrect(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addEntry(); }}
              placeholder="ex: comissão"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 bg-white font-mono"
            />
          </div>
          <button
            onClick={addEntry}
            disabled={!newWrong.trim() || !newCorrect.trim()}
            className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

function EntryRow({ wrong, correct, onUpdate, onDelete }) {
  const [editWrong, setEditWrong] = useState(wrong);
  const [editCorrect, setEditCorrect] = useState(correct);
  const [editing, setEditing] = useState(false);

  const commit = () => {
    const w = editWrong.trim();
    const c = editCorrect.trim();
    if (w && c) onUpdate(w, c);
    setEditing(false);
  };

  return (
    <div className="grid grid-cols-[1fr_1fr_36px] px-4 py-2.5 border-b border-slate-100 last:border-0 gap-3 items-center group hover:bg-slate-50">
      {editing ? (
        <>
          <input
            autoFocus
            value={editWrong}
            onChange={(e) => setEditWrong(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
            className="px-2 py-1 text-sm border border-blue-400 rounded font-mono focus:outline-none bg-blue-50 w-full"
          />
          <input
            value={editCorrect}
            onChange={(e) => setEditCorrect(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
            className="px-2 py-1 text-sm border border-blue-400 rounded font-mono focus:outline-none bg-blue-50 w-full"
          />
        </>
      ) : (
        <>
          <span
            className="text-sm font-mono text-red-600 cursor-pointer hover:underline truncate"
            onClick={() => setEditing(true)}
            title="Clique para editar"
          >
            {wrong}
          </span>
          <span
            className="text-sm font-mono text-emerald-700 cursor-pointer hover:underline truncate"
            onClick={() => setEditing(true)}
            title="Clique para editar"
          >
            {correct}
          </span>
        </>
      )}
      <button
        onClick={onDelete}
        className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-sm justify-self-center"
        title="Remover entrada"
      >✕</button>
    </div>
  );
}
