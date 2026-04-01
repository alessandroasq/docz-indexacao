// Decreto 10.278/2020 — Digitalização de documentos com validade legal
// Art. 5º + Anexo II: metadados mínimos obrigatórios

// 8 campos obrigatórios para todos os documentos
export const DECRETO_FIELDS_GERAL = [
  {
    id: "assunto",
    label: "Assunto",
    hint: "Palavras-chave representando o conteúdo do documento (vocabulário livre ou controlado)",
  },
  {
    id: "autorEmitente",
    label: "Autor / Emitente",
    hint: "Nome da pessoa física ou jurídica que produziu o documento",
  },
  {
    id: "dataLocalDigitalizacao",
    label: "Data e Local de Digitalização",
    hint: "Registro cronológico (data/hora) e local onde foi realizada a digitalização",
  },
  {
    id: "identificadorUnico",
    label: "Identificador Único",
    hint: "Número de identificação único atribuído no momento da captura no sistema informatizado",
  },
  {
    id: "responsavelDigitalizacao",
    label: "Responsável pela Digitalização",
    hint: "Pessoa física ou jurídica responsável pela transformação do documento físico em digital",
  },
  {
    id: "titulo",
    label: "Título",
    hint: "Elemento de denominação do documento (formal ou atribuído)",
  },
  {
    id: "tipoDocumental",
    label: "Tipo Documental",
    hint: "Configuração da espécie documental conforme a atividade que a gerou (ex: decreto, portaria, ofício)",
  },
  {
    id: "hash",
    label: "Hash (Integridade)",
    hint: "Código de verificação da integridade do arquivo digital — gerado automaticamente pelo sistema",
  },
];

// 5 campos adicionais obrigatórios para entidades públicas (pessoa jurídica de direito público interno)
export const DECRETO_FIELDS_PUBLICA = [
  {
    id: "classe",
    label: "Classe",
    hint: "Identificação da classe do documento com base no plano de classificação adotado",
  },
  {
    id: "dataProdOriginal",
    label: "Data do Documento Original",
    hint: "Data de criação/produção do documento físico original",
  },
  {
    id: "destinacaoPrevista",
    label: "Destinação Prevista",
    hint: "Indicação da destinação prevista para o documento (eliminação, guarda permanente etc.)",
  },
  {
    id: "generoDocumental",
    label: "Gênero Documental",
    hint: "Forma de apresentação do documento segundo seu suporte (textual, cartográfico, iconográfico...)",
  },
  {
    id: "prazoGuarda",
    label: "Prazo de Guarda",
    hint: "Prazo legal em que o documento deve ser mantido antes de sua destinação final",
  },
];

/**
 * Retorna a lista completa de campos exigidos conforme tipo de entidade.
 * @param {"publica"|"privada"} entidade
 */
export function getDecretoFields(entidade) {
  return entidade === "privada"
    ? [...DECRETO_FIELDS_GERAL]
    : [...DECRETO_FIELDS_GERAL, ...DECRETO_FIELDS_PUBLICA];
}

/**
 * Calcula o status de conformidade para um documento.
 * @param {object} typeConfig  - objeto do tipo documental (do ConfigContext)
 * @param {object} values      - valores atuais do formulário { fieldId: value }
 * @returns {null | { enabled, allMet, missing, fields[] }}
 */
export function calcCompliance(typeConfig, values) {
  if (!typeConfig?.decreto10278) return null;

  const entidade = typeConfig.decreto10278Entidade || "publica";
  const fields = getDecretoFields(entidade);
  const mapping = typeConfig.decreto10278Mapping || {};

  const result = fields.map((f) => {
    const mappedTo = mapping[f.id] || null;
    const value = mappedTo ? (values?.[mappedTo] ?? "") : "";
    const met = !!(mappedTo && String(value).trim());
    return { ...f, mappedTo, value, met };
  });

  const missing = result.filter((r) => !r.met).length;

  return {
    enabled: true,
    allMet: missing === 0,
    missing,
    total: result.length,
    entidade,
    fields: result,
  };
}
