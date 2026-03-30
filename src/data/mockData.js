// Simulated document queue
export const MOCK_QUEUE = [
  { id: 1, file: "decreto_4587_2026.pdf", type: "decreto", pages: 3, size: "234 KB" },
  { id: 2, file: "oficio_SEI_0341_2026.pdf", type: "oficio", pages: 2, size: "189 KB" },
  { id: 3, file: "portaria_0892_2026.pdf", type: "portaria", pages: 1, size: "145 KB" },
  { id: 4, file: "contrato_CT0045_2026.pdf", type: "contrato", pages: 8, size: "612 KB" },
  { id: 5, file: "decreto_4590_2026.pdf", type: "decreto", pages: 2, size: "198 KB" },
  { id: 6, file: "oficio_GAB_0120_2026.pdf", type: "oficio", pages: 1, size: "112 KB" },
  { id: 7, file: "resolucao_TC_0034_2026.pdf", type: "resolucao", pages: 4, size: "445 KB" },
  { id: 8, file: "portaria_1104_2026.pdf", type: "portaria", pages: 2, size: "201 KB" },
];

// Simulated PDF text content per document type
export const MOCK_PDF_CONTENT = {
  decreto: [
    "GOVERNO DO DISTRITO FEDERAL",
    "",
    "DECRETO Nº 4.587, DE 15 DE MARÇO DE 2026",
    "",
    "Dispõe sobre a reorganização administrativa da",
    "Secretaria de Saúde do Distrito Federal e dá",
    "outras providências.",
    "",
    "O GOVERNADOR DO DISTRITO FEDERAL,",
    "no uso das atribuições que lhe confere o art. 100,",
    "inciso VII, da Lei Orgânica do DF,",
    "",
    "DECRETA:",
    "",
    "Art. 1º Fica reorganizada a estrutura orgânica",
    "da Secretaria de Saúde do DF.",
    "",
    "Art. 2º Este Decreto entra em vigor na data",
    "de sua publicação.",
    "",
    "Brasília, 15 de março de 2026.",
    "GOVERNADOR DO DISTRITO FEDERAL",
    "",
    "Publicado no DODF nº 52, página 12.",
  ],
  oficio: [
    "GOVERNO DO DISTRITO FEDERAL",
    "SECRETARIA DE ADMINISTRAÇÃO",
    "",
    "Ofício nº SEI-0341/2026",
    "Brasília, 20 de março de 2026.",
    "",
    "À Secretaria de Fazenda do DF",
    "At.: Secretário de Fazenda",
    "",
    "Assunto: Solicitação de crédito suplementar",
    "para adequação orçamentária do exercício 2026",
    "",
    "Senhor Secretário,",
    "",
    "Encaminhamos para análise a solicitação de",
    "crédito suplementar no valor de R$ 2.450.000,00",
    "(dois milhões, quatrocentos e cinquenta mil reais).",
    "",
    "Ref.: Processo SEI 00040-00025841/2026-15",
    "CARÁTER: URGENTE",
  ],
  portaria: [
    "SECRETARIA DE EDUCAÇÃO DO DF",
    "",
    "PORTARIA Nº 0892, DE 10 DE MARÇO DE 2026",
    "",
    "A SECRETÁRIA DE EDUCAÇÃO DO DISTRITO FEDERAL,",
    "Sra. Maria Helena Costa Silva,",
    "no uso de suas atribuições legais,",
    "",
    "RESOLVE:",
    "",
    "Art. 1º DESIGNAR os servidores abaixo listados",
    "para compor a Comissão Permanente de Licitação,",
    "da Secretaria de Educação do DF.",
    "",
    "Art. 2º Esta Portaria entra em vigor a partir",
    "de 01 de abril de 2026.",
    "",
    "Brasília, 10 de março de 2026.",
  ],
  contrato: [
    "CONTRATO Nº CT-2026/0045",
    "",
    "CONTRATANTE: Secretaria de Saúde do DF",
    "CNPJ: 00.394.585/0001-41",
    "",
    "CONTRATADA: TechMed Soluções Ltda",
    "CNPJ: 12.345.678/0001-90",
    "",
    "OBJETO: Prestação de serviços de manutenção",
    "preventiva e corretiva de equipamentos de",
    "informática das Unidades Básicas de Saúde.",
    "",
    "VALOR: R$ 2.450.000,00",
    "(dois milhões, quatrocentos e cinquenta mil reais)",
    "",
    "VIGÊNCIA: 01/03/2026 a 28/02/2027",
    "MODALIDADE: Pregão Eletrônico",
    "PROCESSO: 00040-00048712/2026-33",
    "",
    "Brasília, 28 de fevereiro de 2026.",
  ],
  resolucao: [
    "TRIBUNAL DE CONTAS DO DISTRITO FEDERAL",
    "",
    "RESOLUÇÃO Nº 0034/2026",
    "",
    "Regulamenta os procedimentos de auditoria",
    "operacional nos órgãos do GDF.",
    "",
    "O TRIBUNAL DE CONTAS DO DISTRITO FEDERAL,",
    "em sessão de 12 de março de 2026,",
    "",
    "RESOLVE:",
    "",
    "Art. 1º Ficam estabelecidas as normas para",
    "realização de auditorias operacionais.",
    "",
    "Publicado no DODF nº 49, página 8.",
  ],
};

// AI extraction simulation - realistic confidence scores
export const MOCK_AI_EXTRACTION = {
  decreto: {
    numero: { value: "4587/2026", confidence: 0.97 },
    data_pub: { value: "2026-03-15", confidence: 0.99 },
    orgao: { value: "Governo do Distrito Federal", confidence: 0.95 },
    assunto: { value: "Dispõe sobre a reorganização administrativa da Secretaria de Saúde do Distrito Federal e dá outras providências.", confidence: 0.88 },
    esfera: { value: "Distrital", confidence: 0.99 },
    situacao: { value: "Vigente", confidence: 0.92 },
    diario_oficial: { value: "Diário Oficial do Distrito Federal (DODF)", confidence: 0.94 },
    pagina: { value: "12", confidence: 0.78 },
  },
  oficio: {
    numero: { value: "SEI-0341/2026", confidence: 0.96 },
    data_em: { value: "2026-03-20", confidence: 0.98 },
    remetente: { value: "Secretaria de Administração", confidence: 0.91 },
    destinatario: { value: "Secretaria de Fazenda", confidence: 0.87 },
    assunto: { value: "Solicitação de crédito suplementar para adequação orçamentária do exercício 2026", confidence: 0.82 },
    valor: { value: "2450000", confidence: 0.85 },
    carater: { value: "Urgente", confidence: 0.75 },
    esfera_orc: { value: "Fiscal", confidence: 0.90 },
    processo_sei: { value: "00040-00025841/2026-15", confidence: 0.90 },
  },
  portaria: {
    numero: { value: "0892/2026", confidence: 0.98 },
    data_pub: { value: "2026-03-10", confidence: 0.99 },
    orgao: { value: "Secretaria de Educação", confidence: 0.93 },
    autoridade: { value: "Maria Helena Costa Silva", confidence: 0.72 },
    assunto: { value: "Designa servidores para compor a Comissão Permanente de Licitação da Secretaria de Educação do DF", confidence: 0.85 },
    tipo_portaria: { value: "Designação", confidence: 0.91 },
    vig_ini: { value: "2026-04-01", confidence: 0.88 },
  },
  contrato: {
    numero: { value: "CT-2026/0045", confidence: 0.96 },
    data_ass: { value: "2026-02-28", confidence: 0.97 },
    contratante: { value: "Secretaria de Saúde", confidence: 0.94 },
    contratada: { value: "TechMed Soluções Ltda", confidence: 0.89 },
    cnpj: { value: "12.345.678/0001-90", confidence: 0.91 },
    objeto: { value: "Manutenção preventiva e corretiva de equipamentos de informática das Unidades Básicas de Saúde", confidence: 0.83 },
    valor: { value: "2450000", confidence: 0.77 },
    vig_ini: { value: "2026-03-01", confidence: 0.95 },
    vig_fim: { value: "2027-02-28", confidence: 0.93 },
    modalidade: { value: "Pregão Eletrônico", confidence: 0.96 },
  },
  resolucao: {
    numero: { value: "0034/2026", confidence: 0.97 },
    data_pub: { value: "2026-03-12", confidence: 0.96 },
    orgao: { value: "Tribunal de Contas", confidence: 0.94 },
    assunto: { value: "Regulamenta os procedimentos de auditoria operacional nos órgãos do GDF", confidence: 0.86 },
    situacao: { value: "Vigente", confidence: 0.93 },
    diario_oficial: { value: "Diário Oficial do Distrito Federal (DODF)", confidence: 0.91 },
  },
};

// Dashboard mock records with intentional errors for QA demo
const OPERATORS = ["Ana Silva", "Carlos Souza", "Mariana Costa", "Pedro Santos"];
const SUBJECTS_WITH_ERRORS = [
  "Reorganização administrativa",
  "Solcitação de crédito suplmentar",   // typos
  "Designação de comisão",               // typo
  "Nomeação de diretor",
  "Regulamentação de transporte",
  "",                                     // empty - error
  "Aquisição de equipamentos",
  "Delegação de competências",
  "Exoneração de servidor",
  "Contratação de serviços",
];
const ORGS_WITH_ERRORS = [
  ...["Secretaria de Fazenda", "Secretaria de Saúde", "Secretaria de Administração", "Secretaria de Educação", "Secretaria de Planejamento"],
  "Secertaria de Fazenda",    // typo
  "Secretaria de Sáude",      // accent error
  "Procuraduria-Geral",       // typo
];
const DATES_WITH_ERRORS = [
  "15/03/2026", "14/03/2026", "32/02/2026",  // invalid day
  "13/03/2026", "12/03/2026", "00/03/2026",  // invalid day
  "11/03/2026", "10/03/2026", "09/03/2026",
];
const DOC_TYPES = ["decreto", "oficio", "portaria", "contrato"];

export const DASHBOARD_RECORDS = Array.from({ length: 45 }, (_, i) => ({
  id: i + 1,
  file: `doc_${1001 + i}.pdf`,
  type: DOC_TYPES[i % 4],
  orgao: ORGS_WITH_ERRORS[i % ORGS_WITH_ERRORS.length],
  data: DATES_WITH_ERRORS[i % DATES_WITH_ERRORS.length],
  assunto: SUBJECTS_WITH_ERRORS[i % SUBJECTS_WITH_ERRORS.length],
  op: OPERATORS[i % 4],
}));
