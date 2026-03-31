# DocZ — Contexto de Sessão para Claude Code

> Este arquivo é lido automaticamente pelo Claude Code no início de cada sessão.
> Última atualização: 2026-03-31 — branch `claude/scanned-pdf-zoom-DhcTC`

---

## 1. Projeto

**DocZ** é um protótipo de sistema de indexação de documentos públicos brasileiros (GDF — Governo do Distrito Federal). Permite que operadores visualizem um PDF ao lado de um formulário de indexação, com extração automática por IA (mock), validação de campos e configuração sem código pelo usuário Implantador.

**Stack:** React 18 + Vite + Tailwind CSS + react-pdf (pdfjs-dist)
**Repositório:** `alessandroasq/docz-indexacao`
**Branch de trabalho:** `claude/scanned-pdf-zoom-DhcTC`

```bash
npm install          # SEMPRE rodar após limpar sessão — react-pdf não sobrevive ao cleanup
npm run dev          # http://localhost:5173
npm run build        # dist/
```

---

## 2. Estrutura de Arquivos

```
src/
├── App.jsx                          # Roteamento: queue | indexing | dashboard | config
├── main.jsx                         # Ponto de entrada React
├── index.css                        # Tailwind + classes field-input, btn-primary, .scanned-page
│
├── context/
│   └── ConfigContext.jsx            # ★ FONTE DE VERDADE GLOBAL — draft/saved/localStorage
│
├── data/
│   ├── documentTypes.js             # Config padrão dos tipos (fallback do ConfigContext)
│   ├── mockData.js                  # MOCK_QUEUE, MOCK_PDF_CONTENT, MOCK_AI_EXTRACTION
│   └── vocabulary.js                # Vocabulários padrão (fallback do ConfigContext)
│
├── utils/
│   ├── fuzzy.js                     # spellCheck(text, dict) — dict é parâmetro, não constante
│   └── validators.js                # validateCNPJ, isMaskComplete, parseCurrency, confColor
│
├── components/
│   ├── PDFViewer.jsx                # Modo duplo: mock-text (zoom) + real PDF (react-pdf)
│   ├── IndexingView.jsx             # Layout 50/50: PDFViewer + IndexingForm ou ReviewPanel
│   ├── IndexingForm.jsx             # Formulário com IA, validação, atalhos Ctrl+Enter/→
│   ├── ReviewPanel.jsx              # Revisão pré-confirmação
│   ├── Queue.jsx                    # Fila de documentos + botão ⚡ IA por item
│   ├── Dashboard.jsx                # Métricas QA mock
│   ├── SplashScreen.jsx             # Tela de entrada animada
│   │
│   ├── layout/
│   │   └── Header.jsx               # Nav: Fila | Dashboard QA | ⚙ Configuração
│   │
│   ├── fields/                      # 10 componentes de campo (ver seção 5)
│   │   ├── FieldWrapper.jsx         # Label + hint + erro + confiança IA + onFocus prop
│   │   ├── AutocompleteField.jsx    # Fuzzy search — usa vocabulary do ConfigContext
│   │   ├── SpellCheckArea.jsx       # Textarea com highlight de erros — usa spellDict do ConfigContext
│   │   ├── MaskedField.jsx          # Máscara de input (ex: 9999/9999)
│   │   ├── CnpjField.jsx            # CNPJ com validação de dígito verificador
│   │   ├── CurrencyField.jsx        # BRL formatado (R$ 1.234,56)
│   │   └── RegexField.jsx           # Input com validação por regex customizado
│   │
│   └── config/                      # Tela do Implantador (3 abas)
│       ├── ConfigScreen.jsx         # Container com abas + header Save/Discard
│       ├── DocTypeEditor.jsx        # 3 painéis: lista tipos | lista campos | FieldEditor
│       ├── FieldEditor.jsx          # Editor dinâmico por tipo de campo
│       ├── VocabularyEditor.jsx     # Gerencia vocabulários dos autocompletes
│       └── SpellDictEditor.jsx      # Tabela errado→correto do corretor
```

---

## 3. Padrões Arquiteturais Críticos

### ConfigContext — Draft/Saved/Ref

O ConfigContext é a única fonte de verdade para configuração em runtime.

```javascript
// Padrão draft/saved para Save explícito (sem auto-save perigoso)
const [draft, setDraft] = useState(buildInitial);   // edições em memória
const [saved, setSaved] = useState(buildInitial);   // último estado persistido
const draftRef = useRef(draft);                     // evita closure stale no save()

const updateDraft = (updater) => {
  setDraft((prev) => {
    const next = typeof updater === "function" ? updater(prev) : updater;
    draftRef.current = next;    // atualiza ref sincronamente
    return next;
  });
  setIsDirty(true);
};

const save = () => {
  const current = draftRef.current;   // lê ref, não estado (closure safe)
  localStorage.setItem("docz-config", JSON.stringify(current));
  setSaved(current);
  setIsDirty(false);
};

const discard = () => {
  setDraft(saved);
  draftRef.current = saved;
  setIsDirty(false);
};
```

**localStorage:** chave `"docz-config"`, shape `{ documentTypes, vocabulary, spellDict }`
**Fallback:** localStorage vazio → imports estáticos de `documentTypes.js` e `vocabulary.js`

### PDFViewer — Modo Duplo

```javascript
// Modo 1 (padrão): mock text com zoom
// MOCK_PDF_CONTENT[docType] = array de strings (linhas)
// lineRefs.current[i] = ref DOM para cada linha
// activeZone = { lineStart, lineEnd, label } → scrollIntoView + highlight amber

// Modo 2: PDF real via react-pdf
// Ativado quando usuário clica "📂 Abrir PDF" → file input → createObjectURL
// pdfjs worker (OBRIGATÓRIO no Vite):
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();
// react-pdf v10.4.1, pdfjs-dist v5.4.296
```

### Zoom-to-Field (activeZone)

Fluxo completo ao focar um campo:

```
IndexingForm (onFocus no FieldWrapper)
  → onFieldFocus(field)          [prop de IndexingView]
  → setActiveZone({ ...field.pdfZone, label: field.label })
  → passa activeZone como prop para PDFViewer
  → PDFViewer: lineRefs.current[zone.lineStart].scrollIntoView({ behavior:'smooth', block:'center' })
  → linhas entre lineStart e lineEnd recebem: bg-amber-100 outline outline-2 outline-amber-400
```

Campos em `documentTypes.js` declaram pdfZone (índice 0-based nas linhas do MOCK_PDF_CONTENT):
```javascript
{ id: "numero", type: "masked", pdfZone: { lineStart: 2, lineEnd: 2 } }
{ id: "assunto", type: "textarea", pdfZone: { lineStart: 4, lineEnd: 6 } }
```

### IA Pré-carregada da Fila (preloadedAiData)

```
App.jsx: aiResults[docId] (state) ← preenchido pelo botão ⚡ na Queue
  → <IndexingView preloadedAiData={aiResults[selectedDoc.id] || null} />
  → <IndexingForm preloadedAiData={...} />

IndexingForm: useEffect([doc.id]) {
  if (preloadedAiData) {
    // pré-preenche campos + seta aiActive=true (sem animação de loading)
  } else {
    // usa defaults normais
  }
}

const aiData = preloadedAiData || MOCK_AI_EXTRACTION[doc.type] || {};
// aiData é usado para barras de confiança e médias, independente da fonte
```

---

## 4. Documentos Digitalizados (Scanned)

Dois documentos na fila têm `scanned: true` em `mockData.js`:
- `portaria_0892_2026.pdf`
- `resolucao_TC_0034_2026.pdf`

PDFViewer recebe `isScanned` prop e aplica classe `.scanned-page` no modo mock (definida em `index.css`):
```css
.scanned-page {
  filter: contrast(1.08) brightness(0.97) sepia(0.12);
  background-image: url("data:image/svg+xml,..."); /* ruído SVG */
  transform: rotate(-0.3deg);
}
```

No modo PDF real, react-pdf renderiza canvas diretamente — qualquer PDF funciona (nato-digital ou digitalizado).

---

## 5. Tipos de Campo

| Tipo         | Componente         | Props específicas                        |
|--------------|--------------------|------------------------------------------|
| `text`       | `<input type=text>`| `placeholder`                            |
| `date`       | `<input type=date>`| —                                        |
| `number`     | `<input type=number>`| `min`, `max`, `placeholder`            |
| `select`     | `<select>`         | `options: string[]`                      |
| `autocomplete`| AutocompleteField | `voc: string` (chave em vocabulary)      |
| `textarea`   | SpellCheckArea     | `maxLength`, `spellCheck: bool`          |
| `masked`     | MaskedField        | `mask` (ex: "9999/9999"), `placeholder`  |
| `regex`      | RegexField         | `pattern`, `patternHint`, `placeholder`  |
| `currency`   | CurrencyField      | —                                        |
| `cnpj`       | CnpjField          | —                                        |

Para adicionar um novo tipo:
1. Adicionar case em `IndexingForm.jsx` `renderField()`
2. Criar componente em `src/components/fields/` (se necessário)
3. Adicionar em `FIELD_TYPES` array e `TYPE_BADGE` map em `FieldEditor.jsx`
4. Adicionar lógica de validação em `IndexingForm.jsx` `validate()`

---

## 6. Tela de Configuração (Implantador)

Acesso: Header → "⚙ Configuração" → `ConfigScreen.jsx`

**Header da tela:**
- Badge "● Alterações não salvas" quando `isDirty === true`
- Botão "Descartar" → `discard()` (desabilitado se `!isDirty`)
- Botão "Salvar configuração" → `save()` (desabilitado se `!isDirty`)
- Botão "Voltar à fila" → pede confirmação se `isDirty`

**3 abas:**
1. **Tipos Documentais** (`DocTypeEditor`): 3 painéis — lista de tipos | lista de campos | FieldEditor
2. **Vocabulário Controlado** (`VocabularyEditor`): 2 painéis — lista de vocabulários | itens do vocabulário selecionado
3. **Corretor Ortográfico** (`SpellDictEditor`): tabela pesquisável `errado → correto`

**Bug fix aplicado em DocTypeEditor:** `setDefault(k, v, oldKey)` usa `delete defaults[oldKey]` incondicional (o oldKey pode ser string vazia `""` que é falsy — não usar `if (oldKey)`).

---

## 7. Bugs Conhecidos / Limitações

- **Persistência real:** tudo em localStorage — substituir por backend API em produção
- **IA real:** `MOCK_AI_EXTRACTION` simula extração — integrar Docling/API real
- **OCR:** PDFs digitalizados são exibidos como imagem via react-pdf, mas sem extração de texto real — considerar Tesseract.js
- **Vocabulário no FieldEditor:** dropdown de `voc` mostra apenas chaves existentes — se novo voc criado na aba 2, reabrir FieldEditor para ver

---

## 8. Próximos Passos Sugeridos

- Integrar OCR real (Tesseract.js) para extração de texto de PDFs digitalizados
- Backend/API para persistência real (substituir localStorage)
- Exportar/importar config como JSON (botão na ConfigScreen)
- Modo de pré-visualização de campo no FieldEditor (renderizar o componente do tipo)
- Integrar Docling API real no lugar de MOCK_AI_EXTRACTION
- Autenticação por perfil (Operador vs Implantador) para controlar acesso à ConfigScreen
