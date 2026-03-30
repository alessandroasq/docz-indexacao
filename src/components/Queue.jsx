import React, { useState, useCallback } from "react";
import { useConfig } from "../context/ConfigContext";

const TYPE_COLORS = {
  decreto: "bg-blue-100 text-blue-700",
  oficio: "bg-violet-100 text-violet-700",
  portaria: "bg-amber-100 text-amber-700",
  contrato: "bg-emerald-100 text-emerald-700",
  resolucao: "bg-rose-100 text-rose-700",
};

export default function Queue({ queue, onSelect, aiResults, onRunAI, autoAI, setAutoAI }) {
  const { documentTypes } = useConfig();
  const pending = queue.filter((d) => d.status === "pending").length;
  const done = queue.filter((d) => d.status === "done").length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Fila de Indexação</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {pending} pendente{pending !== 1 ? "s" : ""} · {done} indexado{done !== 1 ? "s" : ""}
          </p>
        </div>
        <label className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
          <input
            type="checkbox"
            checked={autoAI}
            onChange={(e) => setAutoAI(e.target.checked)}
            className="accent-blue-600"
          />
          <span className="text-sm font-medium text-slate-600">IA automática</span>
          <span className="text-xs text-slate-400">(extrai ao abrir)</span>
        </label>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total", value: queue.length, color: "text-slate-800" },
          { label: "Pendentes", value: pending, color: "text-amber-600" },
          { label: "Indexados", value: done, color: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Queue table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-[32px_1fr_100px_60px_100px_80px] px-4 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold uppercase tracking-wide gap-3">
          <span>#</span>
          <span>Arquivo</span>
          <span>Tipo</span>
          <span>Págs</span>
          <span>IA</span>
          <span></span>
        </div>

        {queue.map((doc, idx) => {
          const ai = aiResults[doc.id];
          const isDone = doc.status === "done";
          const avgConf = ai
            ? Object.values(ai).reduce((s, d) => s + (d.confidence || 0), 0) / Object.keys(ai).length
            : 0;
          const typeCfg = documentTypes[doc.type];

          return (
            <div
              key={doc.id}
              className={`grid grid-cols-[32px_1fr_100px_60px_100px_80px] px-4 py-3 gap-3 items-center border-b border-slate-100 last:border-0 transition-colors ${
                isDone ? "bg-emerald-50" : "hover:bg-slate-50"
              }`}
            >
              <span className="text-xs text-slate-400 font-mono">{doc.id}</span>

              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-slate-700 font-mono">{doc.file}</p>
                  {doc.scanned && (
                    <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                      Digitalizado
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{doc.size}</p>
              </div>

              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${TYPE_COLORS[doc.type] || ""}`}>
                {typeCfg?.label || doc.type}
              </span>

              <span className="text-xs text-slate-500">{doc.pages}p</span>

              <div>
                {isDone ? (
                  <span className="text-xs text-emerald-600 font-semibold">✓ Pronto</span>
                ) : ai ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${avgConf >= 0.9 ? "bg-emerald-500" : avgConf >= 0.75 ? "bg-amber-500" : "bg-red-400"}`}
                        style={{ width: `${avgConf * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-mono font-semibold ${avgConf >= 0.9 ? "text-emerald-600" : avgConf >= 0.75 ? "text-amber-600" : "text-red-500"}`}>
                      {Math.round(avgConf * 100)}%
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => onRunAI(doc.id)}
                    className="text-xs px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                  >
                    ⚡ IA
                  </button>
                )}
              </div>

              <div className="flex justify-end">
                {isDone ? (
                  <span className="text-xs font-bold text-emerald-600">✓</span>
                ) : (
                  <button
                    onClick={() => onSelect(doc)}
                    className={`text-xs px-3 py-1.5 rounded font-semibold text-white transition-colors ${
                      ai && avgConf >= 0.9
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {ai && avgConf >= 0.9 ? "Conferir" : "Indexar"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
