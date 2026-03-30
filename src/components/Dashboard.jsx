import React, { useState, useMemo } from "react";
import { DASHBOARD_RECORDS } from "../data/mockData";
import { DOCUMENT_TYPES } from "../data/documentTypes";
import { ORGAOS_SET } from "../data/vocabulary";
import { analyzeRecord, spellCheck } from "../utils/fuzzy";

const OPERATORS = ["Ana Silva", "Carlos Souza", "Mariana Costa", "Pedro Santos"];
const PAGE_SIZE = 12;

function SeverityBadge({ count }) {
  if (!count) return <span className="text-xs font-bold text-emerald-600">✓</span>;
  return (
    <span className="badge bg-red-50 text-red-700 border border-red-200 font-mono">
      {count}
    </span>
  );
}

export default function Dashboard({ onBack }) {
  const [page, setPage] = useState(0);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterOp, setFilterOp] = useState("all");
  const [corrections, setCorrections] = useState({});
  const [editingCell, setEditingCell] = useState(null); // { recordId, field }
  const [editValue, setEditValue] = useState("");

  const records = useMemo(() => {
    return DASHBOARD_RECORDS.map((r) => {
      const corrected = { ...r, ...(corrections[r.id] || {}) };
      return analyzeRecord(corrected, ORGAOS_SET);
    });
  }, [corrections]);

  const filtered = records.filter((r) => {
    if (filterType !== "all" && r.type !== filterType) return false;
    if (filterOp !== "all" && r.op !== filterOp) return false;
    if (filterStatus === "err" && r.issues.length === 0) return false;
    if (filterStatus === "ok" && r.issues.length > 0) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const totalErrors = records.reduce((s, r) => s + r.issues.length, 0);

  const saveEdit = () => {
    if (!editingCell) return;
    setCorrections((prev) => ({
      ...prev,
      [editingCell.recordId]: {
        ...(prev[editingCell.recordId] || {}),
        [editingCell.field]: editValue,
      },
    }));
    setEditingCell(null);
  };

  const startEdit = (record, field) => {
    const issue = record.issues.find((i) => i.field === field);
    let suggestion = null;
    if (issue?.suggestion) {
      suggestion = issue.suggestion;
    } else if (field === "assunto" && record.assunto) {
      const { corrected, fixes } = spellCheck(record.assunto);
      if (fixes.length > 0) suggestion = corrected;
    }
    setEditingCell({ recordId: record.id, field, currentValue: record[field] || "", suggestion });
    setEditValue(record[field] || "");
  };

  const cellStyle = (record, field) => {
    const issue = record.issues.find((i) => i.field === field);
    if (!issue) return "";
    return issue.severity === "error"
      ? "bg-red-50 text-red-700 cursor-pointer hover:bg-red-100"
      : "bg-amber-50 text-amber-700 cursor-pointer hover:bg-amber-100";
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Dashboard QA</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {records.length} registros · {totalErrors} inconsistências · Clique em células coloridas para corrigir
          </p>
        </div>
        <button onClick={onBack} className="btn-secondary">
          ← Voltar à fila
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: records.length, color: "text-blue-600" },
          { label: "Com erros", value: records.filter((r) => r.issues.length > 0).length, color: "text-red-600" },
          { label: "OK", value: records.filter((r) => r.issues.length === 0).length, color: "text-emerald-600" },
          {
            label: "Taxa de erro",
            value: `${(records.filter((r) => r.issues.length > 0).length / records.length * 100).toFixed(1)}%`,
            color: "text-amber-600",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Operator stats */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-slate-700 mb-3">Erros por Operador</h2>
        <div className="grid grid-cols-4 gap-3">
          {OPERATORS.map((op) => {
            const opRecs = records.filter((r) => r.op === op);
            const opErrors = opRecs.filter((r) => r.issues.length > 0).length;
            const rate = opRecs.length ? (opErrors / opRecs.length) * 100 : 0;
            const errorFields = {};
            opRecs.forEach((r) =>
              r.issues.forEach((i) => { errorFields[i.field] = (errorFields[i.field] || 0) + 1; })
            );
            const topErrors = Object.entries(errorFields)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3);
            return (
              <div key={op} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">{op}</span>
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                    rate === 0 ? "bg-emerald-50 text-emerald-700" :
                    rate < 40 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                  }`}>
                    {rate.toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  {opErrors} de {opRecs.length} docs com erro
                </p>
                {topErrors.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {topErrors.map(([field, count]) => (
                      <div key={field} className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 capitalize">{field}</span>
                        <span className="text-xs font-mono text-red-600 font-semibold">{count}x</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
          className="field-input w-auto text-xs py-1.5"
        >
          <option value="all">Todos os tipos</option>
          {Object.entries(DOCUMENT_TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
          className="field-input w-auto text-xs py-1.5"
        >
          <option value="all">Todos</option>
          <option value="err">Com erros</option>
          <option value="ok">Sem erros</option>
        </select>
        <select
          value={filterOp}
          onChange={(e) => { setFilterOp(e.target.value); setPage(0); }}
          className="field-input w-auto text-xs py-1.5"
        >
          <option value="all">Todos operadores</option>
          {OPERATORS.map((op) => <option key={op} value={op}>{op}</option>)}
        </select>
        <span className="ml-auto text-xs text-slate-500">
          {filtered.length} registros · Página {page + 1}/{totalPages || 1}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white text-xs">
              {["#", "Arquivo", "Tipo", "Órgão", "Data", "Assunto", "Operador", ""].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((r, i) => (
              <tr key={r.id} className={`border-b border-slate-100 ${i % 2 ? "bg-slate-50" : "bg-white"}`}>
                <td className="px-3 py-2.5 text-xs text-slate-400 font-mono">{r.id}</td>
                <td className="px-3 py-2.5 text-xs text-slate-600 font-mono">{r.file}</td>
                <td className="px-3 py-2.5 text-xs">
                  <span className="font-medium text-slate-700">{DOCUMENT_TYPES[r.type]?.label || r.type}</span>
                </td>
                <td
                  className={`px-3 py-2.5 text-xs transition-colors ${cellStyle(r, "orgao")}`}
                  onClick={() => {
                    const issue = r.issues.find((i) => i.field === "orgao");
                    if (issue) startEdit(r, "orgao");
                  }}
                >
                  <div>{r.orgao}</div>
                  {r.issues.find((i) => i.field === "orgao")?.suggestion && (
                    <div className="text-emerald-600 text-xs mt-0.5">
                      → {r.issues.find((i) => i.field === "orgao").suggestion}
                    </div>
                  )}
                </td>
                <td
                  className={`px-3 py-2.5 text-xs font-mono transition-colors ${cellStyle(r, "data")}`}
                  onClick={() => {
                    const issue = r.issues.find((i) => i.field === "data");
                    if (issue) startEdit(r, "data");
                  }}
                >
                  {r.data}
                </td>
                <td
                  className={`px-3 py-2.5 text-xs max-w-xs transition-colors ${cellStyle(r, "assunto")}`}
                  onClick={() => {
                    const issue = r.issues.find((i) => i.field === "assunto");
                    if (issue) startEdit(r, "assunto");
                  }}
                >
                  <div className="truncate">{r.assunto || <em className="text-red-400">VAZIO</em>}</div>
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-600">{r.op}</td>
                <td className="px-3 py-2.5 text-center">
                  <SeverityBadge count={r.issues.length} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-1.5 mt-4">
        <button
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
          className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
        >
          ←
        </button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          let p = i;
          if (totalPages > 7) {
            if (page < 4) p = i;
            else if (page > totalPages - 4) p = totalPages - 7 + i;
            else p = page - 3 + i;
          }
          return (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`py-1.5 px-3 text-xs rounded border transition-colors ${
                p === page
                  ? "bg-blue-600 text-white border-blue-600 font-bold"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
              }`}
            >
              {p + 1}
            </button>
          );
        })}
        <button
          disabled={page >= totalPages - 1}
          onClick={() => setPage((p) => p + 1)}
          className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
        >
          →
        </button>
      </div>

      {/* Edit modal */}
      {editingCell && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={() => setEditingCell(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-[500px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-800 mb-4">
              Corrigir: {editingCell.field === "orgao" ? "Órgão" : editingCell.field === "data" ? "Data" : "Assunto"}
            </h3>

            {/* Valor atual (errado) */}
            <div className="mb-3">
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Valor atual (com erro)</label>
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 font-mono">
                {editingCell.currentValue || <em className="text-red-400 not-italic">vazio</em>}
              </div>
            </div>

            {/* Sugestão */}
            {editingCell.suggestion && (
              <div className="mb-3">
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Sugestão de correção</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-md text-sm text-emerald-800 font-mono">
                    {editingCell.suggestion}
                  </div>
                  <button
                    onClick={() => setEditValue(editingCell.suggestion)}
                    className="px-3 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors whitespace-nowrap"
                  >
                    ← Usar
                  </button>
                </div>
              </div>
            )}

            {/* Campo de edição */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Valor corrigido</label>
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
                className="field-input"
                onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingCell(null); }}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingCell(null)} className="btn-secondary">Cancelar</button>
              <button onClick={saveEdit} className="btn-primary">✓ Corrigir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
