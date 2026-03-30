// Levenshtein distance
export function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i][j] = a[i - 1] === b[j - 1]
        ? d[i - 1][j - 1]
        : 1 + Math.min(d[i - 1][j], d[i][j - 1], d[i - 1][j - 1]);
    }
  }
  return d[m][n];
}

// Fuzzy search over a list of strings
export function fuzzySearch(query, items, maxResults = 12) {
  const q = (query || "").toLowerCase().trim();
  if (!q) return items.slice(0, maxResults).map((item) => ({ item, score: 0, exact: false }));

  return items
    .map((item) => {
      const lower = item.toLowerCase();
      if (lower === q) return { item, score: 0, exact: true };
      if (lower.startsWith(q)) return { item, score: 0.1, exact: false };
      if (lower.includes(q)) return { item, score: 0.5, exact: false };
      // Check each word
      const words = lower.split(/\s+/);
      for (const word of words) {
        if (word.startsWith(q)) return { item, score: 0.8, exact: false };
      }
      // Levenshtein on first chunk
      const chunk = lower.substring(0, Math.min(q.length + 4, lower.length));
      const dist = levenshtein(q, chunk);
      return { item, score: dist, exact: false };
    })
    .filter((r) => r.score <= 3)
    .sort((a, b) => a.score - b.score)
    .slice(0, maxResults);
}

// Spell check dictionary (common typos in Brazilian government documents)
const SPELL_DICT = {
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

export function spellCheck(text) {
  if (!text) return { corrected: text, fixes: [] };
  const fixes = [];
  const parts = text.split(/(\s+)/);
  const out = parts.map((word) => {
    if (/^\s+$/.test(word)) return word;
    const punct = word.match(/[.,;:!?()\[\]]+$/)?.[0] || "";
    const core = word.replace(/[.,;:!?()\[\]]+$/, "");
    const lower = core.toLowerCase();
    if (SPELL_DICT[lower]) {
      const fix = SPELL_DICT[lower];
      const cased = core[0] && core[0] === core[0].toUpperCase()
        ? fix[0].toUpperCase() + fix.slice(1)
        : fix;
      fixes.push({ from: core, to: cased });
      return cased + punct;
    }
    return word;
  });
  return { corrected: out.join(""), fixes };
}

// Analyze a dashboard record for quality issues
export function analyzeRecord(record, orgaosSet) {
  const issues = [];

  // Check orgao
  if (!orgaosSet.has(record.orgao)) {
    // Find closest match
    const candidates = [...orgaosSet].map((o) => ({
      o,
      d: levenshtein(record.orgao.toLowerCase(), o.toLowerCase()),
    })).sort((a, b) => a.d - b.d);
    if (candidates[0] && candidates[0].d <= 5) {
      issues.push({ field: "orgao", severity: "warn", suggestion: candidates[0].o });
    } else {
      issues.push({ field: "orgao", severity: "error" });
    }
  }

  // Check date
  if (record.data) {
    const m = record.data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) {
      issues.push({ field: "data", severity: "error" });
    } else {
      const [, dd, mm, yyyy] = m;
      const day = parseInt(dd), month = parseInt(mm), year = parseInt(yyyy);
      const valid = month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100;
      if (valid) {
        const date = new Date(year, month - 1, day);
        if (!(date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day)) {
          issues.push({ field: "data", severity: "error" });
        }
      } else {
        issues.push({ field: "data", severity: "error" });
      }
    }
  }

  // Check assunto
  if (!record.assunto?.trim()) {
    issues.push({ field: "assunto", severity: "error" });
  } else {
    const { fixes } = spellCheck(record.assunto);
    if (fixes.length > 0) {
      issues.push({ field: "assunto", severity: "warn", fixes });
    }
  }

  return { ...record, issues };
}
