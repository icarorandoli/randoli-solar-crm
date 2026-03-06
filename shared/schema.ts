import { pgTable, text, varchar, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const clientes = pgTable("clientes", {
  id: varchar("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email"),
  telefone: text("telefone"),
  cpf: text("cpf"),
  cidade: text("cidade"),
  estado: text("estado"),
  endereco: text("endereco"),
  whatsapp: text("whatsapp"),
  cep: text("cep"),
  origemCliente: text("origem_cliente"),
  dataNascimento: text("data_nascimento"),
  rg: text("rg"),
  nacionalidade: text("nacionalidade"),
  profissao: text("profissao"),
  rendaMensal: text("renda_mensal"),
  observacoes: text("observacoes"),
  proprietario: text("proprietario").default("GERENTE"),
  createdAt: text("created_at").notNull(),
});

export const vendas = pgTable("vendas", {
  id: varchar("id").primaryKey(),
  clienteNome: text("cliente_nome").notNull(),
  valor: text("valor").notNull(),
  kwp: text("kwp").notNull(),
  status: text("status").notNull(),
  proprietario: text("proprietario").notNull().default("GERENTE"),
  temperatura: text("temperatura").default(""),
  cpf: text("cpf"),
  email: text("email"),
  telefone: text("telefone"),
  cidade: text("cidade"),
  endereco: text("endereco"),
  potencia: text("potencia").default("0,00"),
  modulos: integer("modulos").default(0),
  inversores: integer("inversores").default(0),
  topologiaInv: text("topologia_inv").default("String"),
  distancia: text("distancia").default("0,00"),
  propostas: integer("propostas").default(0),
  visualizacoes: integer("visualizacoes").default(0),
  notas: integer("notas").default(0),
  validade: text("validade"),
  createdAt: text("created_at").notNull(),
});

export const kits = pgTable("kits", {
  id: varchar("id").primaryKey(),
  nome: text("nome").notNull(),
  kwp: text("kwp").notNull(),
  preco: text("preco").notNull(),
  precoPorKwp: text("preco_por_kwp").notNull(),
  tensao: text("tensao").notNull(),
  estrutura: text("estrutura").notNull(),
  modulos: integer("modulos").default(0),
  inversores: integer("inversores").default(0),
  fornecedor: text("fornecedor"),
  tipoFixacao: text("tipo_fixacao"),
  modulosData: text("modulos_data"),
  inversoresData: text("inversores_data"),
  adicionaisData: text("adicionais_data"),
  createdAt: text("created_at").notNull(),
});

export const colaboradores = pgTable("colaboradores", {
  id: varchar("id").primaryKey(),
  nome: text("nome").notNull(),
  cargo: text("cargo").notNull(),
  email: text("email"),
  telefone: text("telefone"),
  cpfCnpj: text("cpf_cnpj"),
  createdAt: text("created_at").notNull(),
});

export const contratos = pgTable("contratos", {
  id: varchar("id").primaryKey(),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull().default("template"),
  editadoEm: text("editado_em").notNull(),
  conteudo: text("conteudo"),
  templateData: text("template_data"),
  templateNome: text("template_nome"),
});

export const projetos = pgTable("projetos", {
  id: varchar("id").primaryKey(),
  clienteNome: text("cliente_nome").notNull(),
  status: text("status").notNull().default("Em andamento"),
  kwp: text("kwp").notNull().default("0,00"),
  modulos: integer("modulos").default(0),
  inversores: integer("inversores").default(0),
  cidade: text("cidade"),
  proprietario: text("proprietario").default("GERENTE"),
  createdAt: text("created_at").notNull(),
});

export const obras = pgTable("obras", {
  id: varchar("id").primaryKey(),
  clienteNome: text("cliente_nome").notNull(),
  status: text("status").notNull().default("Em andamento"),
  kwp: text("kwp").notNull().default("0,00"),
  cidade: text("cidade"),
  proprietario: text("proprietario").default("GERENTE"),
  createdAt: text("created_at").notNull(),
});

export const atividades = pgTable("atividades", {
  id: varchar("id").primaryKey(),
  clienteNome: text("cliente_nome").notNull(),
  descricao: text("descricao").notNull(),
  status: text("status").notNull().default("Pendente"),
  tipo: text("tipo").notNull().default("Manutenção"),
  createdAt: text("created_at").notNull(),
});

export const agendaItems = pgTable("agenda_items", {
  id: varchar("id").primaryKey(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  data: text("data").notNull(),
  hora: text("hora"),
  tipo: text("tipo").notNull().default("Reunião"),
  clienteNome: text("cliente_nome"),
  createdAt: text("created_at").notNull(),
});

export const propostas = pgTable("propostas", {
  id: varchar("id").primaryKey(),
  clienteNome: text("cliente_nome").notNull(),
  valor: text("valor").notNull(),
  kwp: text("kwp").notNull(),
  status: text("status").notNull().default("ABERTO"),
  visualizacoes: integer("visualizacoes").default(0),
  vendaId: text("venda_id"),
  kitId: text("kit_id"),
  kitNome: text("kit_nome"),
  email: text("email"),
  cidade: text("cidade"),
  uf: text("uf"),
  endereco: text("endereco"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  deslocamento: text("deslocamento"),
  concessionaria: text("concessionaria"),
  valorKwh: text("valor_kwh"),
  taxaIlumPub: text("taxa_ilum_pub"),
  rede: text("rede"),
  consumoMensal: text("consumo_mensal"),
  percGeracao: text("perc_geracao"),
  percPerdas: text("perc_perdas"),
  modalidadeTarifaria: text("modalidade_tarifaria"),
  nomeUc: text("nome_uc"),
  tipoUc: text("tipo_uc"),
  potCalculada: text("pot_calculada"),
  valorKit: text("valor_kit"),
  descontoKit: text("desconto_kit"),
  areaObra: text("area_obra"),
  custosServico: text("custos_servico"),
  receitasServico: text("receitas_servico"),
  percImpostos: text("perc_impostos"),
  percMargem: text("perc_margem"),
  receitaAdicional: text("receita_adicional"),
  inflacaoAnual: text("inflacao_anual"),
  condicoesPagamento: text("condicoes_pagamento"),
  descontoNegociacao: text("desconto_negociacao"),
  totalFinal: text("total_final"),
  validade: text("validade"),
  dataValidade: text("data_validade"),
  tema: text("tema"),
  createdAt: text("created_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({ username: true, password: true });
export const insertClienteSchema = createInsertSchema(clientes).omit({ id: true, createdAt: true });
export const insertVendaSchema = createInsertSchema(vendas).omit({ id: true, createdAt: true });
export const insertKitSchema = createInsertSchema(kits).omit({ id: true, createdAt: true });
export const insertColaboradorSchema = createInsertSchema(colaboradores).omit({ id: true, createdAt: true });
export const insertContratoSchema = createInsertSchema(contratos).omit({ id: true, editadoEm: true });
export const insertProjetoSchema = createInsertSchema(projetos).omit({ id: true, createdAt: true });
export const insertObraSchema = createInsertSchema(obras).omit({ id: true, createdAt: true });
export const insertAtividadeSchema = createInsertSchema(atividades).omit({ id: true, createdAt: true });
export const insertAgendaItemSchema = createInsertSchema(agendaItems).omit({ id: true, createdAt: true });
export const insertPropostaSchema = createInsertSchema(propostas).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Venda = typeof vendas.$inferSelect;
export type InsertVenda = z.infer<typeof insertVendaSchema>;
export type Kit = typeof kits.$inferSelect;
export type InsertKit = z.infer<typeof insertKitSchema>;
export type Colaborador = typeof colaboradores.$inferSelect;
export type InsertColaborador = z.infer<typeof insertColaboradorSchema>;
export type Contrato = typeof contratos.$inferSelect;
export type InsertContrato = z.infer<typeof insertContratoSchema>;
export type Projeto = typeof projetos.$inferSelect;
export type InsertProjeto = z.infer<typeof insertProjetoSchema>;
export type Obra = typeof obras.$inferSelect;
export type InsertObra = z.infer<typeof insertObraSchema>;
export type Atividade = typeof atividades.$inferSelect;
export type InsertAtividade = z.infer<typeof insertAtividadeSchema>;
export type AgendaItem = typeof agendaItems.$inferSelect;
export type InsertAgendaItem = z.infer<typeof insertAgendaItemSchema>;
export type Proposta = typeof propostas.$inferSelect;
export type InsertProposta = z.infer<typeof insertPropostaSchema>;
