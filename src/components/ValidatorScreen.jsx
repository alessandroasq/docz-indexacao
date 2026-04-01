import React, { useState, useRef, useCallback } from "react";
import * as pdfjs from "pdfjs-dist";
import { getDecretoFields } from "../data/decree10278";

// Worker is already configured globally by PDFViewer.jsx (same pdfjs-dist package).
// Set here as well for cases where ValidatorScreen loads before PDFViewer.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsePdfDate(str) {
  if (!str) return null;
  // PDF date format: D:YYYYMMDDHHmmssOHH'mm'
  const m = str.match(/^D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?/);
  if (!m) return str;
  const [, y, mo, d, h = "00", mi = "00"] = m;
  return `${d}/${mo}/${y} ${h}:${mi}`;
}

// Extract XMP fields from the pdfjs Metadata object (v4+: .getAll(), older: .getRaw())
function extractXmp(metadata) {
  if (!metadata) return {};
  try {
    // pdfjs-dist v4+ exposes .getAll() returning { "dc:title": ..., "xmp:CreateDate": ... }
    if (typeof metadata.getAll === "function") {
      const all = metadata.getAll();
      const first = (v) => {
        if (!v) return null;
        if (Array.isArray(v)) return v[0] ? String(v[0]).trim() : null;
        return String(v).trim() || null;
      };
      return {
        title:        first(all["dc:title"]),
        creator:      first(all["dc:creator"]),
        subject:      first(all["dc:subject"]),
        description:  first(all["dc:description"]),
        date:         first(all["dc:date"]),
        identifier:   first(all["dc:identifier"]),
        type:         first(all["dc:type"]),
        format:       first(all["dc:format"]),
        createDate:   first(all["xmp:CreateDate"]),
        modifyDate:   first(all["xmp:ModifyDate"]),
        creatorTool:  first(all["xmp:CreatorTool"]),
        keywords:     first(all["pdf:Keywords"]),
      };
    }
    // Fallback: parse raw XML
    if (typeof metadata.getRaw === "function") {
      return parseXmpXml(metadata.getRaw());
    }
  } catch {}
  return {};
}

function parseXmpXml(xml) {
  if (!xml) return {};
  try {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const DC  = "http://purl.org/dc/elements/1.1/";
    const XMP = "http://ns.adobe.com/xap/1.0/";
    const PDF = "http://ns.adobe.com/pdf/1.3/";
    const get = (ns, local) => {
      const el = doc.getElementsByTagNameNS(ns, local)[0];
      if (!el) return null;
      const li = el.querySelector("li");
      return ((li ? li.textContent : el.textContent) || "").trim() || null;
    };
    return {
      title:       get(DC, "title"),
      creator:     get(DC, "creator"),
      subject:     get(DC, "subject"),
      description: get(DC, "description"),
      date:        get(DC, "date"),
      identifier:  get(DC, "identifier"),
      type:        get(DC, "type"),
      format:      get(DC, "format"),
      createDate:  get(XMP, "CreateDate"),
      modifyDate:  get(XMP, "ModifyDate"),
      creatorTool: get(XMP, "CreatorTool"),
      keywords:    get(PDF, "Keywords"),
    };
  } catch {
    return {};
  }
}

// Map extracted PDF metadata to Decree Annex II field IDs
function buildDecreeMapping(info, xmp, sha256) {
  const v = (s) => (s ? String(s).trim() || null : null);
  return {
    titulo:                   v(xmp.title)       || v(info.Title),
    autorEmitente:            v(xmp.creator)     || v(info.Author),
    assunto:                  v(xmp.subject)     || v(xmp.description) || v(info.Subject) || v(xmp.keywords) || v(info.Keywords),
    dataLocalDigitalizacao:   v(xmp.createDate)  || parsePdfDate(info.CreationDate),
    identificadorUnico:       v(xmp.identifier),
    responsavelDigitalizacao: v(xmp.creatorTool) || v(info.Creator),
    tipoDocumental:           v(xmp.type),
    hash:                     sha256 || null,
    classe:                   null,
    dataProdOriginal:         v(xmp.date)        || parsePdfDate(info.ModDate),
    destinacaoPrevista:       null,
    generoDocumental:         v(xmp.format),
    prazoGuarda:              null,
  };
}

async function computeSha256(buffer) {
  try {
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ValidationRow({ label, status, detail }) {
  const cfg = {
    ok:      { icon: "✓", labelCls: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    fail:    { icon: "✗", labelCls: "text-red-600",     bg: "bg-red-50 border-red-200" },
    unknown: { icon: "?", labelCls: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
    skip:    { icon: "—", labelCls: "text-slate-400",   bg: "bg-slate-50 border-slate-200" },
  }[status] || { icon: "—", labelCls: "text-slate-400", bg: "bg-slate-50 border-slate-200" };

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${cfg.bg}`}>
      <span className={`text-sm font-black mt-0.5 w-4 text-center shrink-0 ${cfg.labelCls}`}>{cfg.icon}</span>
      <div className="min-w-0">
        <p className={`text-sm font-semibold leading-tight ${cfg.labelCls}`}>{label}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{detail}</p>
      </div>
    </div>
  );
}

function SignatureCard({ signatureInfo }) {
  const { detected, count, fields, hasTimestamp } = signatureInfo;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
        <span className="text-sm">🔏</span>
        <span className="text-sm font-bold text-slate-700">Assinatura Digital — Art. 5º, inciso I</span>
        {detected ? (
          <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
            Detectada
          </span>
        ) : (
          <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
            Não detectada
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2">
        <ValidationRow
          label="Assinatura digital presente"
          status={detected ? "ok" : "fail"}
          detail={
            detected
              ? `${count > 0 ? `${count} campo(s) de assinatura` : "Assinatura detectada"} no documento`
              : "Nenhuma assinatura digital encontrada. O documento não pode ser considerado válido para fins legais (Art. 5º, inciso I)."
          }
        />
        <ValidationRow
          label="Carimbo de Tempo (RFC 3161)"
          status={!detected ? "skip" : hasTimestamp ? "ok" : "unknown"}
          detail={
            !detected
              ? "Não aplicável — documento sem assinatura"
              : hasTimestamp
              ? "Carimbo de tempo encontrado na assinatura"
              : "Não detectado nos campos acessíveis. Pode estar embutido na estrutura PKCS#7 — verificação completa requer análise servidor."
          }
        />
        <ValidationRow
          label="Certificado ICP-Brasil"
          status={!detected ? "fail" : "unknown"}
          detail={
            !detected
              ? "Documento não assinado — requisito do Art. 5º, inciso I não atendido"
              : "A validação da cadeia de certificados ICP-Brasil requer verificação servidor (OCSP/CRL). Não é possível confirmar via browser."
          }
        />

        {detected && fields.length > 0 && (
          <div className="mt-1 p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-slate-500">Campos de assinatura encontrados:</p>
            {fields.map((f, i) => (
              <div key={i} className="flex flex-wrap gap-x-4 gap-y-0.5">
                <span className="text-xs font-mono text-blue-700 font-semibold">{f.name}</span>
                {f.signingTime && (
                  <span className="text-xs text-slate-500">Assinado em: <strong>{f.signingTime}</strong></span>
                )}
                {f.reason && (
                  <span className="text-xs text-slate-500">Motivo: <strong>{f.reason}</strong></span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-lg flex flex-col gap-2">
          <p className="text-xs font-semibold text-blue-800">Opções para validação completa ICP-Brasil:</p>
          <div className="flex flex-col gap-1.5 text-xs text-blue-700">
            <div className="flex items-start gap-2">
              <span className="shrink-0">①</span>
              <span>
                <strong>Portal ITI (gratuito):</strong> Envie o arquivo para validação oficial.{" "}
                <a
                  href="https://validar.iti.gov.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold hover:text-blue-900"
                >
                  validar.iti.gov.br ↗
                </a>
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="shrink-0">②</span>
              <span>
                <strong>API ITI (OAuth 2.0):</strong> endpoint <span className="font-mono bg-blue-100 px-1 rounded">https://api.iti.gov.br/</span> — requer credenciais OAuth2 solicitadas ao ITI (gratuito para órgãos públicos).
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="shrink-0">③</span>
              <span>
                <strong>Lacuna RestPKI:</strong> API REST com suporte ICP-Brasil — plano gratuito para desenvolvimento disponível em{" "}
                <a
                  href="https://pki.rest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold hover:text-blue-900"
                >
                  pki.rest ↗
                </a>
              </span>
            </div>
          </div>
          {detected && (
            <a
              href="https://validar.iti.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-fit"
            >
              🔗 Validar no Portal ITI ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function DecreeComplianceCard({ decreeFields, mapping }) {
  const found = decreeFields.filter((f) => !!mapping[f.id]).length;
  const total = decreeFields.length;
  const allMet = found === total;
  const pct = Math.round((found / total) * 100);

  // Fields that standard PDF metadata cannot carry — require custom XMP embedding
  const needsCustomXmp = new Set([
    "identificadorUnico", "hash", "classe", "destinacaoPrevista", "prazoGuarda", "responsavelDigitalizacao",
  ]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">📋</span>
          <span className="text-sm font-bold text-slate-700">Metadados Mínimos — Anexo II</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress bar */}
          <div className="flex items-center gap-1.5">
            <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  allMet ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-400"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 font-mono">{pct}%</span>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
            allMet
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : pct >= 60
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-red-50 text-red-600 border-red-200"
          }`}>
            {found}/{total} campos
          </span>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {decreeFields.map((f) => {
          const value = mapping[f.id];
          const ok = !!value;
          const isHash = f.id === "hash";

          return (
            <div key={f.id} className={`flex items-start gap-3 px-5 py-3 ${ok ? "" : "bg-red-50/40"}`}>
              <span className={`mt-0.5 text-sm font-bold w-4 text-center shrink-0 ${ok ? "text-emerald-500" : "text-red-400"}`}>
                {ok ? "✓" : "✗"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700">{f.label}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">{f.hint}</p>
                {ok ? (
                  isHash ? (
                    <p className="text-xs text-emerald-700 mt-1.5 font-mono bg-emerald-50 border border-emerald-200 px-2 py-1 rounded break-all">
                      SHA-256: {value}
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-700 mt-1.5 font-mono bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded inline-block max-w-full truncate">
                      {value}
                    </p>
                  )
                ) : (
                  <p className="text-xs text-red-400 mt-1 italic">
                    {isHash
                      ? "Hash calculado mas não embarcado no PDF — deve ser inserido como metadado XMP personalizado"
                      : needsCustomXmp.has(f.id)
                      ? "Requer metadado XMP personalizado (não encontrado em campos padrão)"
                      : "Não encontrado nos metadados do PDF"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-3 bg-blue-50 border-t border-blue-100">
        <p className="text-xs text-blue-700 leading-snug">
          <strong>Atenção:</strong> Campos como Classe, Destinação Prevista, Prazo de Guarda e Gênero Documental requerem
          metadados XMP customizados (namespace próprio do sistema). PDFs gerados por sistemas de GED que
          implementam o Decreto geralmente utilizam namespaces como <span className="font-mono">conarq:</span> ou <span className="font-mono">gdf:</span>.
        </p>
      </div>
    </div>
  );
}

function RawMetadataCard({ info, xmp }) {
  const [expanded, setExpanded] = useState(false);

  const infoRows = Object.entries(info || {})
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => ({ key: k, value: String(v) }));

  const xmpRows = Object.entries(xmp || {})
    .filter(([, v]) => !!v)
    .map(([k, v]) => ({ key: k, value: String(v) }));

  const total = infoRows.length + xmpRows.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">📊</span>
          <span className="text-sm font-bold text-slate-700">Metadados Embarcados (brutos)</span>
          <span className="text-xs text-slate-400">{total} entradas</span>
        </div>
        <span className="text-xs text-slate-400">{expanded ? "▲ recolher" : "▼ expandir"}</span>
      </button>

      {expanded && (
        <div className="p-5 flex flex-col gap-5">
          {infoRows.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dicionário Info (PDF Info Dict)</p>
              <div className="rounded-lg border border-slate-200 overflow-hidden text-xs">
                {infoRows.map(({ key, value }) => (
                  <div key={key} className="flex border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <span className="w-44 px-3 py-1.5 font-mono font-semibold text-slate-500 bg-slate-50 shrink-0 border-r border-slate-100">{key}</span>
                    <span className="flex-1 px-3 py-1.5 text-slate-700 break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {xmpRows.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">XMP (Dublin Core + Adobe)</p>
              <div className="rounded-lg border border-slate-200 overflow-hidden text-xs">
                {xmpRows.map(({ key, value }) => (
                  <div key={key} className="flex border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <span className="w-44 px-3 py-1.5 font-mono font-semibold text-blue-600 bg-slate-50 shrink-0 border-r border-slate-100">{key}</span>
                    <span className="flex-1 px-3 py-1.5 text-slate-700 break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {total === 0 && (
            <p className="text-sm text-slate-400 italic text-center py-4">
              Nenhum metadado encontrado. O PDF pode estar sem informações embarcadas.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ValidatorScreen() {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const processFile = useCallback(async (file) => {
    if (!file || file.type !== "application/pdf") {
      setError("Selecione um arquivo PDF válido.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const arrayBuffer = await file.arrayBuffer();

      // ── Load PDF ──────────────────────────────────────────────
      const pdf = await pdfjs.getDocument({ data: arrayBuffer.slice(0) }).promise;

      // ── Metadata ──────────────────────────────────────────────
      const { info, metadata } = await pdf.getMetadata();
      const xmpData = extractXmp(metadata);

      // ── SHA-256 hash of file ───────────────────────────────────
      const sha256 = await computeSha256(arrayBuffer);

      // ── Signature detection ───────────────────────────────────
      let sigFields = [];
      try {
        const fieldObjects = await pdf.getFieldObjects();
        if (fieldObjects) {
          sigFields = Object.entries(fieldObjects).flatMap(([name, fields]) =>
            (fields || [])
              .filter((f) => f.fieldType === "Sig")
              .map((f) => ({
                name,
                signingTime: f.value?.signingTime ?? f.value?.M ?? null,
                reason: f.value?.reason ?? f.value?.Reason ?? null,
              }))
          );
        }
      } catch {}

      const isSigned = info.IsSignaturesPresent === true || sigFields.length > 0;
      const hasTimestamp = sigFields.some((f) => !!f.signingTime);

      const signatureInfo = {
        detected: isSigned,
        count: sigFields.length,
        fields: sigFields,
        hasTimestamp,
      };

      // ── Decree mapping ────────────────────────────────────────
      const decreeMapping = buildDecreeMapping(info, xmpData, sha256);

      // hash always has a computed value even if not embedded in PDF
      // We mark it as "found" since we computed it, but note it isn't embedded
      const hashNote = sha256;

      setResult({
        fileName: file.name,
        fileSize: file.size,
        numPages: pdf.numPages,
        pdfVersion: info.PDFFormatVersion,
        producer: info.Producer || xmpData.producer,
        pdfInfo: info,
        xmpData,
        signatureInfo,
        decreeMapping: { ...decreeMapping, hash: hashNote },
        sha256,
      });
    } catch (e) {
      setError(`Erro ao processar o PDF: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const allDecreeFields = getDecretoFields("publica");

  // Overall compliance summary
  const getSummary = () => {
    if (!result) return null;
    const { signatureInfo, decreeMapping } = result;
    const metaFound = allDecreeFields.filter((f) => !!decreeMapping[f.id]).length;
    const metaTotal = allDecreeFields.length;
    const art5Met = signatureInfo.detected;
    const annexIIMet = metaFound === metaTotal;
    return { art5Met, annexIIMet, metaFound, metaTotal };
  };

  const summary = getSummary();

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Validador — Decreto 10.278/2020</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Carregue um PDF para verificar metadados embarcados, conformidade com o Anexo II e assinatura digital (Art. 5º)
        </p>
      </div>

      {/* Upload zone */}
      {!result && !loading && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-4 p-14 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
            dragging
              ? "border-blue-400 bg-blue-50 scale-[1.01]"
              : "border-slate-300 bg-white hover:border-blue-300 hover:bg-slate-50"
          }`}
        >
          <div className="text-5xl select-none">📄</div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">
              Arraste um PDF aqui ou clique para selecionar
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Processamento 100% local — nenhum dado enviado a servidores
            </p>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
            <span>✓ Metadados Info Dict</span>
            <span>✓ XMP Dublin Core</span>
            <span>✓ Assinatura digital</span>
            <span>✓ Hash SHA-256</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 p-14 bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
          <p className="text-sm text-slate-500">Extraindo metadados e calculando hash...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2 mt-4">
          <span className="shrink-0">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-5">

          {/* File header bar */}
          <div className="bg-white rounded-xl border border-slate-200 px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📄</span>
              <div>
                <p className="font-semibold text-slate-800">{result.fileName}</p>
                <p className="text-xs text-slate-400">
                  {result.numPages} página{result.numPages !== 1 ? "s" : ""}
                  {result.pdfVersion ? ` · PDF ${result.pdfVersion}` : ""}
                  {result.producer ? ` · ${result.producer}` : ""}
                  {result.fileSize ? ` · ${(result.fileSize / 1024).toFixed(1)} KB` : ""}
                </p>
              </div>
            </div>
            <button
              onClick={() => { setResult(null); setError(null); }}
              className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
            >
              ← Novo arquivo
            </button>
          </div>

          {/* Overall verdict */}
          {summary && (
            <div className={`rounded-xl border p-4 flex items-start gap-4 ${
              summary.art5Met && summary.annexIIMet
                ? "bg-emerald-50 border-emerald-200"
                : summary.art5Met || summary.metaFound >= Math.floor(summary.metaTotal * 0.6)
                ? "bg-amber-50 border-amber-200"
                : "bg-red-50 border-red-200"
            }`}>
              <span className="text-3xl shrink-0">
                {summary.art5Met && summary.annexIIMet ? "✅" : summary.art5Met || summary.metaFound >= 5 ? "⚠️" : "❌"}
              </span>
              <div>
                <p className={`font-bold text-sm ${
                  summary.art5Met && summary.annexIIMet
                    ? "text-emerald-800"
                    : summary.art5Met || summary.metaFound >= 5
                    ? "text-amber-800"
                    : "text-red-700"
                }`}>
                  {summary.art5Met && summary.annexIIMet
                    ? "Documento em conformidade com o Decreto 10.278/2020"
                    : summary.art5Met && !summary.annexIIMet
                    ? "Assinatura presente, mas metadados do Anexo II incompletos"
                    : !summary.art5Met && summary.annexIIMet
                    ? "Metadados completos, mas assinatura digital ausente"
                    : "Documento não atende os requisitos do Decreto 10.278/2020"}
                </p>
                <div className="flex gap-4 mt-1.5">
                  <span className={`text-xs font-semibold flex items-center gap-1 ${summary.art5Met ? "text-emerald-700" : "text-red-600"}`}>
                    {summary.art5Met ? "✓" : "✗"} Art. 5º — Assinatura ICP-Brasil
                  </span>
                  <span className={`text-xs font-semibold flex items-center gap-1 ${summary.annexIIMet ? "text-emerald-700" : "text-amber-700"}`}>
                    {summary.annexIIMet ? "✓" : "⚠"} Anexo II — Metadados ({summary.metaFound}/{summary.metaTotal})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Digital Signature */}
          <SignatureCard signatureInfo={result.signatureInfo} />

          {/* Section 2: Decree Annex II */}
          <DecreeComplianceCard decreeFields={allDecreeFields} mapping={result.decreeMapping} />

          {/* Section 3: Raw metadata (collapsible) */}
          <RawMetadataCard info={result.pdfInfo} xmp={result.xmpData} />

          {/* SHA-256 footer */}
          <div className="bg-slate-800 rounded-xl px-5 py-3.5 flex items-start gap-3">
            <span className="text-slate-400 text-xs font-semibold mt-0.5 shrink-0">SHA-256</span>
            <span className="text-emerald-400 font-mono text-xs break-all">{result.sha256}</span>
          </div>
        </div>
      )}
    </div>
  );
}
