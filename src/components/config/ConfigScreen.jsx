import React, { useState } from "react";
import DocTypeEditor from "./DocTypeEditor";
import VocabularyEditor from "./VocabularyEditor";
import SpellDictEditor from "./SpellDictEditor";
import { useConfig } from "../../context/ConfigContext";

const TABS = [
  { key: "doctypes", label: "Tipos Documentais" },
  { key: "vocabulary", label: "Vocabulário Controlado" },
  { key: "spellcheck", label: "Corretor Ortográfico" },
];

export default function ConfigScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState("doctypes");
  const { save, discard, resetToDefaults, isDirty } = useConfig();

  const handleReset = () => {
    if (window.confirm("Restaurar todos os padrões? Suas configurações personalizadas serão perdidas.")) {
      resetToDefaults();
    }
  };

  const handleDiscard = () => {
    if (window.confirm("Descartar todas as alterações não salvas?")) {
      discard();
    }
  };

  const handleBack = () => {
    if (isDirty && !window.confirm("Há alterações não salvas. Deseja sair sem salvar?")) return;
    onBack();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-52px)] bg-slate-100">
      {/* Sub-header */}
      <div className="bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors py-3 shrink-0"
          >
            ← Voltar à fila
          </button>
          <span className="text-slate-200">|</span>
          <div className="flex gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Save / Discard / Reset actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <span className="text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-2 py-1 rounded">
              ● Alterações não salvas
            </span>
          )}
          <button
            onClick={handleDiscard}
            disabled={!isDirty}
            className="text-xs px-3 py-1.5 text-slate-500 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Descartar
          </button>
          <button
            onClick={save}
            disabled={!isDirty}
            className="text-xs px-4 py-1.5 font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Salvar configuração
          </button>
          <span className="w-px h-4 bg-slate-200 mx-1" />
          <button
            onClick={handleReset}
            className="text-xs px-3 py-1.5 text-red-500 border border-red-200 rounded hover:bg-red-50 transition-colors"
          >
            Restaurar padrões
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "doctypes"   && <DocTypeEditor />}
        {activeTab === "vocabulary" && <VocabularyEditor />}
        {activeTab === "spellcheck" && <SpellDictEditor />}
      </div>
    </div>
  );
}
