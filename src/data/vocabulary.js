export const ORGAOS = [
  "Secretaria de Governo",
  "Secretaria de Fazenda",
  "Secretaria de Saúde",
  "Secretaria de Educação",
  "Secretaria de Segurança Pública",
  "Secretaria de Infraestrutura",
  "Secretaria de Meio Ambiente",
  "Secretaria de Administração",
  "Secretaria de Planejamento",
  "Secretaria de Cultura",
  "Secretaria de Esportes e Lazer",
  "Secretaria de Trabalho e Desenvolvimento Social",
  "Procuradoria-Geral do Estado",
  "Procuradoria-Geral do Município",
  "Controladoria-Geral",
  "Tribunal de Contas",
  "Câmara Legislativa",
  "Assembleia Legislativa",
  "Ministério da Economia",
  "Ministério da Saúde",
  "Ministério da Educação",
  "Ministério da Justiça",
  "Governo do Distrito Federal",
  "Prefeitura Municipal",
  "Instituto de Previdência",
  "Agência Reguladora de Águas",
  "Companhia de Saneamento",
  "Companhia Energética",
  "Departamento de Trânsito",
  "Corpo de Bombeiros Militar",
];

export const DIARIOS_OFICIAIS = [
  "Diário Oficial da União (DOU)",
  "Diário Oficial do Distrito Federal (DODF)",
  "Diário Oficial do Estado de São Paulo",
  "Diário Oficial do Município",
  "Diário da Justiça Eletrônico",
];

export const ORGAOS_SET = new Set(ORGAOS);

export const VOCABULARY = {
  orgaos: ORGAOS,
  diarios: DIARIOS_OFICIAIS,
};
