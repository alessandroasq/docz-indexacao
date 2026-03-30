import React, { useState, useCallback } from "react";
import { ConfigProvider } from "./context/ConfigContext";
import Header from "./components/layout/Header";
import Queue from "./components/Queue";
import IndexingView from "./components/IndexingView";
import Dashboard from "./components/Dashboard";
import ConfigScreen from "./components/config/ConfigScreen";
import SplashScreen from "./components/SplashScreen";
import { MOCK_QUEUE, MOCK_AI_EXTRACTION } from "./data/mockData";

function AppInner() {
  const [splash, setSplash] = useState(true);
  const [screen, setScreen] = useState("queue"); // "queue" | "indexing" | "dashboard" | "config"
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [queue, setQueue] = useState(MOCK_QUEUE.map((d) => ({ ...d, status: "pending" })));
  const [aiResults, setAiResults] = useState({});
  const [autoAI, setAutoAI] = useState(false);

  const handleRunAI = useCallback((docId) => {
    const doc = queue.find((d) => d.id === docId);
    if (!doc || aiResults[docId]) return;
    const extraction = MOCK_AI_EXTRACTION[doc.type];
    if (!extraction) return;
    setTimeout(() => {
      setAiResults((prev) => ({ ...prev, [docId]: extraction }));
    }, 1200);
  }, [queue, aiResults]);

  const handleSelectDoc = (doc) => {
    setSelectedDoc(doc);
    setScreen("indexing");
  };

  const handleDone = () => {
    setQueue((prev) =>
      prev.map((d) => (d.id === selectedDoc.id ? { ...d, status: "done" } : d))
    );
    const next = queue.find((d) => d.status === "pending" && d.id !== selectedDoc.id);
    if (next) {
      setSelectedDoc(next);
      setScreen("indexing");
    } else {
      setScreen("queue");
    }
  };

  const navigate = (target) => setScreen(target);

  return (
    <div className="min-h-screen bg-slate-100">
      {splash && <SplashScreen onDone={() => setSplash(false)} />}
      <Header screen={screen} onNavigate={navigate} />
      <main>
        {screen === "queue" && (
          <Queue
            queue={queue}
            onSelect={handleSelectDoc}
            aiResults={aiResults}
            onRunAI={handleRunAI}
            autoAI={autoAI}
            setAutoAI={setAutoAI}
          />
        )}
        {screen === "indexing" && selectedDoc && (
          <IndexingView
            key={selectedDoc.id}
            doc={selectedDoc}
            onDone={handleDone}
            onBack={() => setScreen("queue")}
            autoAI={autoAI}
          />
        )}
        {screen === "dashboard" && (
          <Dashboard onBack={() => setScreen("queue")} />
        )}
        {screen === "config" && (
          <ConfigScreen onBack={() => setScreen("queue")} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ConfigProvider>
      <AppInner />
    </ConfigProvider>
  );
}
