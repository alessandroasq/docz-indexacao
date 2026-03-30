import React, { createContext, useContext, useState, useCallback } from "react";
import { DOCUMENT_TYPES } from "../data/documentTypes";
import { VOCABULARY } from "../data/vocabulary";

const SPELL_DICT_DEFAULT = {
  "secertaria": "secretaria",
  "secrataria": "secretaria",
  "solcitação": "solicitação",
  "suplmentar": "suplementar",
  "nomeição": "nomeação",
  "desingação": "designação",
  "comisão": "comissão",
  "equipamenots": "equipamentos",
  "procuraduria": "procuradoria",
};

const STORAGE_KEY = "docz-config";

const DEFAULTS = {
  documentTypes: DOCUMENT_TYPES,
  vocabulary: VOCABULARY,
  spellDict: SPELL_DICT_DEFAULT,
};

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [cfg, setCfg] = useState(() => {
    const stored = loadFromStorage();
    return stored ? { ...DEFAULTS, ...stored } : { ...DEFAULTS };
  });
  const [savedIndicator, setSavedIndicator] = useState(false);

  const persist = useCallback((updater) => {
    setCfg((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setSavedIndicator(true);
    setTimeout(() => setSavedIndicator(false), 1500);
  }, []);

  const setDocumentTypes = useCallback(
    (dt) => persist((p) => ({ ...p, documentTypes: dt })),
    [persist]
  );
  const setVocabulary = useCallback(
    (v) => persist((p) => ({ ...p, vocabulary: v })),
    [persist]
  );
  const setSpellDict = useCallback(
    (d) => persist((p) => ({ ...p, spellDict: d })),
    [persist]
  );
  const resetToDefaults = useCallback(() => {
    setCfg({ ...DEFAULTS });
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return (
    <ConfigContext.Provider
      value={{
        documentTypes: cfg.documentTypes,
        vocabulary: cfg.vocabulary,
        spellDict: cfg.spellDict,
        setDocumentTypes,
        setVocabulary,
        setSpellDict,
        resetToDefaults,
        savedIndicator,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
