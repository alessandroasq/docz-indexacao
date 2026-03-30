import React, { createContext, useContext, useState, useCallback, useRef } from "react";
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

function buildInitial() {
  const stored = loadFromStorage();
  return stored ? { ...DEFAULTS, ...stored } : { ...DEFAULTS };
}

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  // draft = in-memory edits (not yet persisted)
  const [draft, setDraft] = useState(buildInitial);
  // saved = last persisted state (used for discard)
  const [saved, setSaved] = useState(buildInitial);
  const [isDirty, setIsDirty] = useState(false);

  // ref so save() always captures latest draft without stale closure
  const draftRef = useRef(draft);
  const updateDraft = useCallback((updater) => {
    setDraft((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      draftRef.current = next;
      return next;
    });
    setIsDirty(true);
  }, []);

  const save = useCallback(() => {
    const current = draftRef.current;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch {}
    setSaved(current);
    setIsDirty(false);
  }, []);

  const discard = useCallback(() => {
    setDraft(saved);
    draftRef.current = saved;
    setIsDirty(false);
  }, [saved]);

  const resetToDefaults = useCallback(() => {
    setDraft({ ...DEFAULTS });
    setSaved({ ...DEFAULTS });
    draftRef.current = { ...DEFAULTS };
    setIsDirty(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const setDocumentTypes = useCallback(
    (dt) => updateDraft((p) => ({ ...p, documentTypes: dt })),
    [updateDraft]
  );
  const setVocabulary = useCallback(
    (v) => updateDraft((p) => ({ ...p, vocabulary: v })),
    [updateDraft]
  );
  const setSpellDict = useCallback(
    (d) => updateDraft((p) => ({ ...p, spellDict: d })),
    [updateDraft]
  );

  return (
    <ConfigContext.Provider
      value={{
        documentTypes: draft.documentTypes,
        vocabulary: draft.vocabulary,
        spellDict: draft.spellDict,
        setDocumentTypes,
        setVocabulary,
        setSpellDict,
        save,
        discard,
        resetToDefaults,
        isDirty,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
