import React, { useState } from "react";
import PDFViewer from "./PDFViewer";
import IndexingForm from "./IndexingForm";
import ReviewPanel from "./ReviewPanel";

export default function IndexingView({ doc, onDone, onBack, autoAI }) {
  const [screen, setScreen] = useState("form"); // "form" | "review"
  const [savedValues, setSavedValues] = useState(null);
  const [savedAiData, setSavedAiData] = useState(null);
  const [selectedPdfText, setSelectedPdfText] = useState(null);
  const [activeZone, setActiveZone] = useState(null);

  const handleFormSave = (values, aiData) => {
    setSavedValues(values);
    setSavedAiData(aiData);
    setScreen("review");
  };

  const handleFieldFocus = (field) => {
    if (field.pdfZone) {
      setActiveZone({ ...field.pdfZone, label: field.label });
    } else {
      setActiveZone(null);
    }
  };

  const handleConfirm = () => {
    onDone();
  };

  const handleEdit = () => {
    setScreen("form");
  };

  return (
    <div className="h-[calc(100vh-52px)] flex">
      {/* Left: PDF Viewer */}
      <div className="w-1/2 p-4 border-r border-slate-200 bg-slate-800">
        <PDFViewer
          docType={doc.type}
          fileName={doc.file}
          onTextSelected={setSelectedPdfText}
          activeZone={activeZone}
          isScanned={doc.scanned}
        />
      </div>

      {/* Right: Form or Review */}
      <div className="w-1/2 flex flex-col">
        <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-slate-200">
          <button
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
          >
            ← Voltar à fila
          </button>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${screen === "form" ? "text-blue-600" : "text-slate-400"}`}>
              1. Preencher
            </span>
            <span className="text-slate-300">›</span>
            <span className={`text-xs font-semibold ${screen === "review" ? "text-blue-600" : "text-slate-400"}`}>
              2. Revisar
            </span>
            <span className="text-slate-300">›</span>
            <span className="text-xs text-slate-400 font-semibold">3. Salvo</span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {screen === "form" ? (
            <IndexingForm
              doc={doc}
              onSave={handleFormSave}
              onSkip={onBack}
              selectedPdfText={selectedPdfText}
              autoAI={autoAI}
              onFieldFocus={handleFieldFocus}
            />
          ) : (
            <ReviewPanel
              doc={doc}
              values={savedValues || {}}
              aiData={savedAiData}
              onConfirm={handleConfirm}
              onEdit={handleEdit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
