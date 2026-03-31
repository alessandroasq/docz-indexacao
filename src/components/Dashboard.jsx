import { useState, useMemo, useRef, useEffect } from "react";
import { DASHBOARD_RECORDS } from "../data/mockData";
import { DOCUMENT_TYPES } from "../data/documentTypes";
import { ORGAOS_SET } from "../data/vocabulary";
import { analyzeRecord, spellCheck } from "../utils/fuzzy";
import AutocompleteField from "./fields/AutocompleteField";
import SpellCheckArea from "./fields/SpellCheckArea";

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

  const operatorStats = useMemo(() => {
    return OPERATORS.map((op) => {
      const opRecs = records.filter((r) => r.op === op);
      const errors = opRecs.filter((r) => r.issues.length > 0).length;
      const rate = opRecs.length ? (errors / opRecs.length) * 100 : 0;
      return { op, errors, total: opRecs.length, rate };
    }).sort((a, b) => b.rate - a.rate);
  }, [records]);

  const fieldStats = useMemo(() => {
    const counts = {};
    records.forEach((r) =>
      r.issues.forEach((i) => { counts[i.field] = (counts[i.field] || 0) + 1; })
    );
    const FIELD_LABELS = { orgao: "Órgão", data: "Data", assunto: "Assunto" };
    return Object.entries(counts)
      .map(([field, count]) => ({ field, count, label: FIELD_LABELS[field] || field }))
      .sort((a, b) => b.count - a.count);
  }, [records]);

  const { patterns, recommendations } = useMemo(() => {
    const avgRate = operatorStats.length
      ? operatorStats.reduce((s, o) => s + o.rate, 0) / operatorStats.length
      : 0;
    const outlier = operatorStats.find((o) => o.rate >= avgRate * 1.8 && o.rate > 0);

    const pats = [];
    const recs = [];

    // orgao spelling errors
    const orgaoErrorRecs = records.filter((r) => r.issues.find((i) => i.field === "orgao"));
    if (orgaoErrorRecs.length > 0) {
      const wrongOrgaos = [...new Set(orgaoErrorRecs.map((r) => r.orgao))].slice(0, 4);
      pats.push({
        icon: "📄",
        severity: "warn",
        text: `"${wrongOrgaos.join('", "')}" — Erros de grafia recorrentes no campo Órgão`,
      });
      recs.push({
        text: "Adicionar autocomplete fuzzy no campo Órgão Emissor — eliminaria 100% dos erros de grafia detectados.",
        action: "Implementar Camada 2",
        actionColor: "text-blue-600",
      });
    }

    // impossible dates
    const dateErrorRecs = records.filter((r) => r.issues.find((i) => i.field === "data"));
    if (dateErrorRecs.length > 0) {
      const wrongDates = [...new Set(dateErrorRecs.map((r) => r.data))].slice(0, 3);
      pats.push({
        icon: "📅",
        severity: "error",
        text: `Datas impossíveis encontradas: "${wrongDates.join('", "')}"`,
        detail: "Validação de data não ativa",
      });
      recs.push({
        text: "Ativar validação de máscara de data em todos os tipos documentais para impedir entradas como 32/02 ou 00/03.",
        action: "Configurar na Camada 1",
        actionColor: "text-blue-600",
      });
    }

    // empty assunto
    const emptyAssuntoCount = records.filter((r) => !r.assunto?.trim()).length;
    if (emptyAssuntoCount > 0) {
      pats.push({
        icon: "🔴",
        severity: "error",
        text: `${emptyAssuntoCount} registro${emptyAssuntoCount > 1 ? "s" : ""} com campo Assunto vazio`,
        detail: "Campo obrigatório não enforçado",
      });
      recs.push({
        text: "Tornar Assunto campo obrigatório bloqueante — impedir salvar sem preenchimento.",
        action: "Configurar na Camada 1",
        actionColor: "text-blue-600",
      });
    }

    // operator outlier
    if (outlier) {
      pats.push({
        icon: "👤",
        severity: "warn",
        text: `${outlier.op}: ${outlier.rate.toFixed(1)}% de erro vs média ${avgRate.toFixed(1)}%`,
        detail: "Pode precisar de treinamento adicional",
      });
      recs.push({
        text: `Agendar sessão de reciclagem com ${outlier.op} — taxa de erro ${(outlier.rate / avgRate).toFixed(0)}x acima da média.`,
        action: "Ação de Operações",
        actionColor: "text-violet-600",
      });
    }

    return { patterns: pats, recommendations: recs };
  }, [records, operatorStats]);

  const modalFieldRef = useRef(null);
  useEffect(() => {
    if (!editingCell || !modalFieldRef.current) return;
    const el = modalFieldRef.current.querySelector("input, textarea");
    el?.focus();
  }, [editingCell?.field, editingCell?.recordId]);

  const renderModalField = () => {
    const { field } = editingCell;
    if (field === "orgao") {
      return (
        <AutocompleteField
          value={editValue}
          onChange={setEditValue}
          voc="orgaos"
        />
      );
    }
    if (field === "data") {
      // dashboard stores DD/MM/YYYY; input type="date" needs YYYY-MM-DD
      const toISO = (v) => {
        const m = v?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
      };
      const fromISO = (v) => {
        const m = v?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
      };
      return (
        <input
          type="date"
          value={toISO(editValue)}
          onChange={(e) => setEditValue(fromISO(e.target.value))}
          className="field-input"
        />
      );
    }
    if (field === "assunto") {
      return (
        <SpellCheckArea
          value={editValue}
          onChange={setEditValue}
          maxLength={500}
        />
      );
    }
    return (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="field-input"
      />
    );
  };

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

      {/* Analytics row 1: Erros por Operador + Erros por Campo */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Erros por Operador */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-1.5">
            <span>👤</span> Erros por Operador
          </h2>
          {(() => {
            const maxRate = Math.max(...operatorStats.map((o) => o.rate), 1);
            return operatorStats.map(({ op, errors, total, rate }) => (
              <div key={op} className="mb-3 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-700">{op}</span>
                  <span className={`text-xs font-mono font-bold ${
                    rate === 0 ? "text-emerald-600" : rate > 70 ? "text-red-600" : "text-amber-600"
                  }`}>
                    {rate.toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      rate === 0 ? "bg-emerald-400" : rate > 70 ? "bg-red-500" : "bg-amber-400"
                    }`}
                    style={{ width: `${(rate / maxRate) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{errors} de {total} docs com erro</p>
              </div>
            ));
          })()}
        </div>

        {/* Erros por Campo */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-1.5">
            <span>📋</span> Erros por Campo
          </h2>
          {(() => {
            const maxCount = Math.max(...fieldStats.map((f) => f.count), 1);
            return fieldStats.map(({ field, count, label }) => (
              <div key={field} className="mb-3 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-700">{label}</span>
                  <span className="text-xs font-mono font-bold text-blue-700">{count}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {((count / records.length) * 100).toFixed(0)}% dos registros afetados
                </p>
              </div>
            ));
          })()}
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

      {/* Analytics row 2: Padrões Detectados + Recomendações do Sistema */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        {/* Padrões Detectados */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
            <span>🔍</span> Padrões Detectados
          </h2>
          {patterns.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Nenhum padrão de erro identificado.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {patterns.map((p, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 p-3 rounded-lg border ${
                    p.severity === "error"
                      ? "bg-red-50 border-red-100"
                      : "bg-amber-50 border-amber-100"
                  }`}
                >
                  <span className="text-base leading-none mt-0.5">{p.icon}</span>
                  <div>
                    <p className="text-xs text-slate-700 leading-snug">{p.text}</p>
                    {p.detail && (
                      <p className="text-xs text-slate-400 mt-0.5">{p.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recomendações do Sistema */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
            <span>💡</span> Recomendações do Sistema
          </h2>
          {recommendations.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Nenhuma recomendação pendente.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recommendations.map((r, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-700 leading-snug mb-2">{r.text}</p>
                  <button className={`text-xs font-semibold ${r.actionColor} hover:underline`}>
                    {r.action} →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
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
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditingCell(null);
              if (e.key === "Enter" && editingCell.field !== "assunto") { e.preventDefault(); saveEdit(); }
              if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); saveEdit(); }
            }}
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
                    tabIndex={-1}
                    onClick={() => setEditValue(editingCell.suggestion)}
                    className="px-3 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors whitespace-nowrap"
                  >
                    ← Usar
                  </button>
                </div>
              </div>
            )}

            {/* Campo de edição com guardrail do tipo */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                Valor corrigido
                {editingCell.field === "assunto" && (
                  <span className="text-slate-400 font-normal ml-1">(Ctrl+Enter para salvar)</span>
                )}
              </label>
              <div ref={modalFieldRef}>
                {renderModalField()}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button tabIndex={-1} onClick={() => setEditingCell(null)} className="btn-secondary">Cancelar</button>
              <button tabIndex={-1} onClick={saveEdit} className="btn-primary">✓ Corrigir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
