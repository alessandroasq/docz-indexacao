import React from "react";

export default function Header({ screen, onNavigate }) {
  return (
    <header className="bg-slate-900 border-b-2 border-blue-600 sticky top-0 z-50">
      <div className="flex items-center justify-between px-5 py-2.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-black text-sm leading-none">D</span>
          </div>
          <div>
            <span className="text-white font-bold text-base tracking-tight">DocZ</span>
            <span className="text-slate-500 text-xs ml-2">Indexação de Documentos</span>
          </div>
        </div>
        <nav className="flex gap-1">
          <button
            onClick={() => onNavigate("queue")}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              screen === "queue" || screen === "indexing"
                ? "bg-slate-700 text-blue-300"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Fila
          </button>
          <button
            onClick={() => onNavigate("dashboard")}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              screen === "dashboard"
                ? "bg-slate-700 text-blue-300"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Dashboard QA
          </button>
        </nav>
      </div>
    </header>
  );
}
