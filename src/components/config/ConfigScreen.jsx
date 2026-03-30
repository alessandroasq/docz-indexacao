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
  const { resetToDefaults } = useConfig();

  const handleReset = () => {
    if (window.confirm("Restaurar todos os padrões? Suas configurações personalizadas serão perdidas.")) {
      resetToDefaults();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-52px)] bg-slate-100">
      {/* Sub-header */}
      <div className="bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors py-3"
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
        <button
          onClick={handleReset}
          className="text-xs px-3 py-1.5 text-red-500 border border-red-200 rounded hover:bg-red-50 transition-colors"
        >
          Restaurar padrões
        </button>
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
