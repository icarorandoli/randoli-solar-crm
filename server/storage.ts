import { randomUUID } from "crypto";
import type {
  User, InsertUser,
  Cliente, InsertCliente,
  Venda, InsertVenda,
  Kit, InsertKit,
  Colaborador, InsertColaborador,
  Contrato, InsertContrato,
  Projeto, InsertProjeto,
  Obra, InsertObra,
  Atividade, InsertAtividade,
  AgendaItem, InsertAgendaItem,
  Proposta, InsertProposta,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getClientes(): Promise<Cliente[]>;
  getCliente(id: string): Promise<Cliente | undefined>;
  createCliente(c: InsertCliente): Promise<Cliente>;
  updateCliente(id: string, c: Partial<InsertCliente>): Promise<Cliente | undefined>;
  deleteCliente(id: string): Promise<void>;

  getVendas(): Promise<Venda[]>;
  getVenda(id: string): Promise<Venda | undefined>;
  createVenda(v: InsertVenda): Promise<Venda>;
  updateVenda(id: string, v: Partial<InsertVenda>): Promise<Venda | undefined>;
  deleteVenda(id: string): Promise<void>;

  getKits(): Promise<Kit[]>;
  getKit(id: string): Promise<Kit | undefined>;
  createKit(k: InsertKit): Promise<Kit>;
  updateKit(id: string, k: Partial<InsertKit>): Promise<Kit | undefined>;
  deleteKit(id: string): Promise<void>;

  getColaboradores(): Promise<Colaborador[]>;
  getColaborador(id: string): Promise<Colaborador | undefined>;
  createColaborador(c: InsertColaborador): Promise<Colaborador>;
  updateColaborador(id: string, c: Partial<InsertColaborador>): Promise<Colaborador | undefined>;
  deleteColaborador(id: string): Promise<void>;

  getContratos(): Promise<Contrato[]>;
  getContrato(id: string): Promise<Contrato | undefined>;
  createContrato(c: InsertContrato): Promise<Contrato>;
  updateContrato(id: string, c: Partial<InsertContrato>): Promise<Contrato | undefined>;
  deleteContrato(id: string): Promise<void>;

  getProjetos(): Promise<Projeto[]>;
  getProjeto(id: string): Promise<Projeto | undefined>;
  createProjeto(p: InsertProjeto): Promise<Projeto>;
  updateProjeto(id: string, p: Partial<InsertProjeto>): Promise<Projeto | undefined>;
  deleteProjeto(id: string): Promise<void>;

  getObras(): Promise<Obra[]>;
  getObra(id: string): Promise<Obra | undefined>;
  createObra(o: InsertObra): Promise<Obra>;
  updateObra(id: string, o: Partial<InsertObra>): Promise<Obra | undefined>;
  deleteObra(id: string): Promise<void>;

  getAtividades(): Promise<Atividade[]>;
  getAtividade(id: string): Promise<Atividade | undefined>;
  createAtividade(a: InsertAtividade): Promise<Atividade>;
  updateAtividade(id: string, a: Partial<InsertAtividade>): Promise<Atividade | undefined>;
  deleteAtividade(id: string): Promise<void>;

  getAgendaItems(): Promise<AgendaItem[]>;
  getAgendaItem(id: string): Promise<AgendaItem | undefined>;
  createAgendaItem(a: InsertAgendaItem): Promise<AgendaItem>;
  updateAgendaItem(id: string, a: Partial<InsertAgendaItem>): Promise<AgendaItem | undefined>;
  deleteAgendaItem(id: string): Promise<void>;

  getPropostas(): Promise<Proposta[]>;
  getProposta(id: string): Promise<Proposta | undefined>;
  createProposta(p: InsertProposta): Promise<Proposta>;
  updateProposta(id: string, p: Partial<InsertProposta>): Promise<Proposta | undefined>;
  deleteProposta(id: string): Promise<void>;
}

function now() {
  return new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) + " | " +
    new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private clientesMap = new Map<string, Cliente>();
  private vendasMap = new Map<string, Venda>();
  private kitsMap = new Map<string, Kit>();
  private colaboradoresMap = new Map<string, Colaborador>();
  private contratosMap = new Map<string, Contrato>();
  private projetosMap = new Map<string, Projeto>();
  private obrasMap = new Map<string, Obra>();
  private atividadesMap = new Map<string, Atividade>();
  private agendaMap = new Map<string, AgendaItem>();
  private propostasMap = new Map<string, Proposta>();

  constructor() { this.seed(); }

  private seed() {
    const clienteIds = [
      "c1","c2","c3","c4","c5","c6","c7","c8","c9","c10","c11","c12"
    ];
    const clientesData: Cliente[] = [
      { id:"c1", nome:"FRANCIELE APARECIDA SOUZA", email:"franciele@email.com", telefone:"(65) 99123-4567", cpf:"123.456.789-00", cidade:"Sinop", estado:"MT", endereco:"Av. das Flores, 123", createdAt:"18/08/2025 | 13:20" },
      { id:"c2", nome:"RUANDERSON DANIEL MEYER", email:"ruanderson@email.com", telefone:"(65) 98765-4321", cpf:"987.654.321-00", cidade:"Cuiabá", estado:"MT", endereco:"Rua do Comércio, 456", createdAt:"01/08/2025 | 17:59" },
      { id:"c3", nome:"ROSINEIA COSTA", email:"rosineia@email.com", telefone:"(65) 99234-5678", cpf:"234.567.890-11", cidade:"Sorriso", estado:"MT", endereco:"Rua das Palmeiras, 789", createdAt:"01/08/2025 | 17:59" },
      { id:"c4", nome:"CLAUDIO DE LIMA", email:"claudio@email.com", telefone:"(65) 99876-5432", cpf:"345.678.901-22", cidade:"Lucas do Rio Verde", estado:"MT", endereco:"Av. Central, 321", createdAt:"16/06/2025 | 17:02" },
      { id:"c5", nome:"ALESSANDRO DA SILVA", email:"alessandro@email.com", telefone:"(65) 99345-6789", cpf:"456.789.012-33", cidade:"Sinop", estado:"MT", endereco:"Rua Mato Grosso, 654", createdAt:"16/06/2025 | 17:02" },
      { id:"c6", nome:"MARLENE FERREIRA", email:"marlene@email.com", telefone:"(65) 99456-7890", cpf:"567.890.123-44", cidade:"Cuiabá", estado:"MT", endereco:"Av. Getúlio Vargas, 987", createdAt:"29/05/2025 | 19:02" },
      { id:"c7", nome:"KIMBERLY SANTOS", email:"kimberly@email.com", telefone:"(65) 99567-8901", cpf:"678.901.234-55", cidade:"Várzea Grande", estado:"MT", endereco:"Rua 7 de Setembro, 147", createdAt:"26/05/2025 | 16:36" },
      { id:"c8", nome:"GABRIEL OLIVEIRA", email:"gabriel@email.com", telefone:"(65) 99678-9012", cpf:"789.012.345-66", cidade:"Sinop", estado:"MT", endereco:"Av. Brasil, 258", createdAt:"26/05/2025 | 09:39" },
      { id:"c9", nome:"IRANY PEREIRA", email:"irany@email.com", telefone:"(65) 99789-0123", cpf:"890.123.456-77", cidade:"Primavera do Leste", estado:"MT", endereco:"Rua das Acácias, 369", createdAt:"16/05/2025 | 03:07" },
      { id:"c10", nome:"DANIELA PALERMO", email:"daniela@email.com", telefone:"(65) 99890-1234", cpf:"901.234.567-88", cidade:"Rondonópolis", estado:"MT", endereco:"Av. Rondon, 741", createdAt:"13/05/2025 | 13:25" },
      { id:"c11", nome:"ELINALDO PINHEIRO DOS SANTOS", email:"naldomidias871@gmail.com", telefone:"", cpf:"007.510.873-94", cidade:"SINOP", estado:"MT", endereco:"Av. Capitolium - Bairro Belvedere Residencial II", createdAt:"23/02/2026 | 09:35" },
      { id:"c12", nome:"RICARDO ROSSY", email:"ricardo@email.com", telefone:"(65) 99901-2345", cpf:"012.345.678-99", cidade:"Sinop", estado:"MT", endereco:"Rua dos Ipês, 852", createdAt:"10/01/2026 | 10:00" },
    ];
    clientesData.forEach(c => this.clientesMap.set(c.id, c));

    const vendasData: Venda[] = [
      { id:"v1", clienteNome:"ELINALDO PINHEIRO DOS SANTOS", valor:"17.000,00", kwp:"8,40", status:"objetivo do cliente", proprietario:"GERENTE", temperatura:"", cpf:"007.510.873-94", email:"naldomidias871@gmail.com", telefone:"", cidade:"SINOP - MT", endereco:"Av. Capitolium", potencia:"0,00", modulos:0, inversores:0, topologiaInv:"String", distancia:"0,00", propostas:1, visualizacoes:0, notas:0, validade:"26/02/2026", createdAt:"23/02/2026 | 09:35" },
      { id:"v2", clienteNome:"RICARDO ROSSY", valor:"168.313,92", kwp:"63,24", status:"objetivo do cliente", proprietario:"GERENTE", temperatura:"", cpf:"012.345.678-99", email:"ricardo@email.com", telefone:"(65) 99901-2345", cidade:"SINOP - MT", endereco:"Rua dos Ipês, 852", potencia:"63,24", modulos:144, inversores:4, topologiaInv:"String", distancia:"2,50", propostas:3, visualizacoes:5, notas:2, validade:"28/02/2026", createdAt:"10/01/2026 | 10:00" },
      { id:"v3", clienteNome:"NATALIA DE CASTILHO FUNCK 06034...", valor:"21.880,00", kwp:"8,40", status:"objetivo do cliente", proprietario:"GERENTE", temperatura:"", cpf:"060.344.811-27", email:"natalia@email.com", telefone:"(65) 98877-6655", cidade:"Sinop - MT", endereco:"Rua das Flores, 501", potencia:"8,40", modulos:20, inversores:1, topologiaInv:"String", distancia:"1,20", propostas:2, visualizacoes:3, notas:1, validade:"15/03/2026", createdAt:"01/02/2026 | 14:22" },
      { id:"v4", clienteNome:"DIONEIA SOARES ANDRADE", valor:"15.899,00", kwp:"8,40", status:"objetivo do cliente", proprietario:"GERENTE", temperatura:"", cpf:"234.123.987-01", email:"dioneia@email.com", telefone:"(65) 97766-5544", cidade:"Sorriso - MT", endereco:"Av. Goiás, 789", potencia:"8,40", modulos:20, inversores:1, topologiaInv:"String", distancia:"0,80", propostas:1, visualizacoes:2, notas:0, validade:"20/03/2026", createdAt:"05/02/2026 | 09:10" },
      { id:"v5", clienteNome:"VALÉRIO PASQUALETTO", valor:"23.958,81", kwp:"12,60", status:"objetivo do cliente", proprietario:"GERENTE", temperatura:"", cpf:"678.901.234-55", email:"valerio@email.com", telefone:"(65) 96655-4433", cidade:"Lucas do Rio Verde - MT", endereco:"Rua Pioneiros, 321", potencia:"12,60", modulos:28, inversores:1, topologiaInv:"String", distancia:"3,00", propostas:2, visualizacoes:4, notas:1, validade:"25/03/2026", createdAt:"08/02/2026 | 11:30" },
      { id:"v6", clienteNome:"FRANCIELE APARECIDA SOUZA", valor:"17.956,15", kwp:"8,40", status:"solicitar a conta de luz", proprietario:"GERENTE", temperatura:"", cpf:"123.456.789-00", email:"franciele@email.com", telefone:"(65) 99123-4567", cidade:"Sinop - MT", endereco:"Av. das Flores, 123", potencia:"8,40", modulos:20, inversores:1, topologiaInv:"String", distancia:"1,00", propostas:1, visualizacoes:1, notas:0, validade:"18/02/2026", createdAt:"18/08/2025 | 13:20" },
      { id:"v7", clienteNome:"MARLENE FERREIRA", valor:"33.000,00", kwp:"16,80", status:"envio de proposta", proprietario:"GERENTE", temperatura:"", cpf:"567.890.123-44", email:"marlene@email.com", telefone:"(65) 99456-7890", cidade:"Cuiabá - MT", endereco:"Av. Getúlio Vargas, 987", potencia:"16,80", modulos:40, inversores:2, topologiaInv:"String", distancia:"2,00", propostas:2, visualizacoes:6, notas:3, validade:"29/03/2026", createdAt:"29/05/2025 | 19:02" },
      { id:"v8", clienteNome:"KIMBERLY SANTOS", valor:"199.404,87", kwp:"84,00", status:"Aguardando Entrega dos Materiais", proprietario:"GERENTE", temperatura:"", cpf:"678.901.234-55", email:"kimberly@email.com", telefone:"(65) 99567-8901", cidade:"Várzea Grande - MT", endereco:"Rua 7 de Setembro, 147", potencia:"84,00", modulos:192, inversores:8, topologiaInv:"String", distancia:"5,00", propostas:4, visualizacoes:12, notas:5, validade:"01/04/2026", createdAt:"26/05/2025 | 16:36" },
    ];
    vendasData.forEach(v => this.vendasMap.set(v.id, v));

    const kitsData: Kit[] = [
      { id:"k1", nome:"KIT DE 1000KW COM PAINEL T...", kwp:"8,06", preco:"16.750,00", precoPorKwp:"2.078,16", tensao:"220 V", estrutura:"Fibrocimento Est. Ma...", modulos:20, inversores:1, createdAt:"01/01/2025" },
      { id:"k2", nome:"kit 1600 kw com Microinversor", kwp:"13,42", preco:"19.165,70", precoPorKwp:"1.428,14", tensao:"220 V", estrutura:"Metálica Ondulada", modulos:32, inversores:8, createdAt:"01/01/2025" },
      { id:"k3", nome:"KIT 1000kw com inversor sungr...", kwp:"8,06", preco:"17.250,00", precoPorKwp:"2.140,20", tensao:"220 V", estrutura:"Fibrocimento Est. Ma...", modulos:20, inversores:1, createdAt:"01/01/2025" },
      { id:"k4", nome:"KIT 2000KW COM MICRO INVE...", kwp:"17,50", preco:"20.130,76", precoPorKwp:"1.150,33", tensao:"220 V", estrutura:"Fibrocimento Est. Ma...", modulos:40, inversores:10, createdAt:"01/01/2025" },
      { id:"k5", nome:"KIT 1000KW COM PAINEL DE 7...", kwp:"8,40", preco:"17.890,00", precoPorKwp:"2.129,76", tensao:"127 V", estrutura:"Fibrocimento Est. Ma...", modulos:20, inversores:1, createdAt:"01/01/2025" },
      { id:"k6", nome:"KIT HIBRIDO COMPLETO 300 KW", kwp:"2,90", preco:"14.530,13", precoPorKwp:"5.010,39", tensao:"220 V", estrutura:"Fibrocimento Est. Ma...", modulos:8, inversores:1, createdAt:"01/01/2025" },
      { id:"k7", nome:"kit 6300 kw", kwp:"55,30", preco:"81.218,70", precoPorKwp:"1.468,69", tensao:"220 V", estrutura:"Mini Trilho", modulos:126, inversores:3, createdAt:"01/01/2025" },
      { id:"k8", nome:"KIT 3000 KW TELHADO METALI...", kwp:"25,90", preco:"26.272,62", precoPorKwp:"1.014,39", tensao:"127 V", estrutura:"Mini Trilho", modulos:60, inversores:2, createdAt:"01/01/2025" },
      { id:"k9", nome:"KIT 11 MIL KW ESTRUTURA SO...", kwp:"105,00", preco:"143.662,76", precoPorKwp:"1.368,22", tensao:"127 V", estrutura:"Solo", modulos:240, inversores:6, createdAt:"01/01/2025" },
      { id:"k10", nome:"4000 KW SEM VALOR DE INSTA...", kwp:"21,70", preco:"25.329,28", precoPorKwp:"1.167,25", tensao:"220 V", estrutura:"Mini Trilho", modulos:50, inversores:2, createdAt:"01/01/2025" },
      { id:"k11", nome:"KIT 2500 KW SEM INCLUIR A IN...", kwp:"21,70", preco:"25.329,28", precoPorKwp:"1.167,25", tensao:"127 V", estrutura:"Fibrocimento Est. Ma...", modulos:50, inversores:2, createdAt:"01/01/2025" },
      { id:"k12", nome:"kit 13 fibromadeira", kwp:"114,10", preco:"248.888,38", precoPorKwp:"2.181,32", tensao:"127 V", estrutura:"Fibrocimento Est. Ma...", modulos:260, inversores:7, createdAt:"01/01/2025" },
      { id:"k13", nome:"kit 14 mil kw", kwp:"122,50", preco:"244.850,77", precoPorKwp:"1.998,78", tensao:"127 V", estrutura:"Metálica Ondulada", modulos:280, inversores:8, createdAt:"01/01/2025" },
      { id:"k14", nome:"kit 21 mil kw", kwp:"189,04", preco:"213.982,20", precoPorKwp:"1.131,94", tensao:"127 V", estrutura:"Fibrocimento Est. Ma...", modulos:432, inversores:12, createdAt:"01/01/2025" },
      { id:"k15", nome:"KIT DE 1550 KW COM MODUL...", kwp:"14,00", preco:"27.560,06", precoPorKwp:"1.968,58", tensao:"127 V", estrutura:"Fibrocimento Est. Ma...", modulos:32, inversores:1, createdAt:"01/01/2025" },
    ];
    kitsData.forEach(k => this.kitsMap.set(k.id, k));

    const colaboradoresData: Colaborador[] = [
      { id:"col1", nome:"GUSTAVO GOMES SILVA", cargo:"Vendedor", email:"gustavo@randolisolar.com.br", telefone:"", cpfCnpj:"090.246.191-57", createdAt:"19/01/2026" },
      { id:"col2", nome:"VIVIANE INACIO ALBRING", cargo:"Vendedor", email:"viviane.albring@gmail.com", telefone:"(66) 99239-7086", cpfCnpj:"060.544.481-10", createdAt:"09/06/2025" },
    ];
    colaboradoresData.forEach(c => this.colaboradoresMap.set(c.id, c));

    const contratosData: Contrato[] = [
      { id:"ct1", nome:"Procuração CNPJ", tipo:"template", editadoEm:"09/04/2025 | 15:56", conteudo:"", templateData: null, templateNome: null },
      { id:"ct2", nome:"Contrato de Prestação para CNPJ", tipo:"template", editadoEm:"02/04/2025 | 15:49", conteudo:"", templateData: null, templateNome: null },
      { id:"ct3", nome:"Contrato Prestação para CPF", tipo:"template", editadoEm:"09/04/2025 | 15:35", conteudo:"", templateData: null, templateNome: null },
      { id:"ct4", nome:"PROCURAÇÃO RANDOLI SOLAR", tipo:"template", editadoEm:"03/04/2025 | 10:49", conteudo:"", templateData: null, templateNome: null },
      { id:"ct5", nome:"CONTRATO COM PARCELAMENTO P...", tipo:"template", editadoEm:"18/12/2025 | 15:29", conteudo:"", templateData: null, templateNome: null },
    ];
    contratosData.forEach(c => this.contratosMap.set(c.id, c));

    const projetosData: Projeto[] = [
      { id:"p1", clienteNome:"MARLENE FERREIRA", status:"Em andamento", kwp:"16,80", modulos:40, inversores:2, cidade:"Cuiabá - MT", proprietario:"GERENTE", createdAt:"29/05/2025 | 19:02" },
      { id:"p2", clienteNome:"KIMBERLY SANTOS", status:"Em andamento", kwp:"84,00", modulos:192, inversores:8, cidade:"Várzea Grande - MT", proprietario:"GERENTE", createdAt:"26/05/2025 | 16:36" },
      { id:"p3", clienteNome:"GABRIEL OLIVEIRA", status:"Aguardando aprovação", kwp:"8,40", modulos:20, inversores:1, cidade:"Sinop - MT", proprietario:"GERENTE", createdAt:"26/05/2025 | 09:39" },
    ];
    projetosData.forEach(p => this.projetosMap.set(p.id, p));

    const obrasData: Obra[] = [
      { id:"o1", clienteNome:"KIMBERLY SANTOS", status:"Em execução", kwp:"84,00", cidade:"Várzea Grande - MT", proprietario:"GERENTE", createdAt:"26/05/2025 | 16:36" },
      { id:"o2", clienteNome:"MARLENE FERREIRA", status:"Aguardando material", kwp:"16,80", cidade:"Cuiabá - MT", proprietario:"GERENTE", createdAt:"29/05/2025 | 19:02" },
    ];
    obrasData.forEach(o => this.obrasMap.set(o.id, o));

    const atividadesData: Atividade[] = [
      { id:"a1", clienteNome:"KIMBERLY SANTOS", descricao:"Verificação do sistema instalado", status:"Pendente", tipo:"Manutenção", createdAt:"26/05/2025 | 16:36" },
      { id:"a2", clienteNome:"GABRIEL OLIVEIRA", descricao:"Acompanhamento pós-instalação", status:"Em andamento", tipo:"Visita técnica", createdAt:"26/05/2025 | 09:39" },
    ];
    atividadesData.forEach(a => this.atividadesMap.set(a.id, a));

    const agendaData: AgendaItem[] = [
      { id:"ag1", titulo:"Reunião com Marlene Ferreira", descricao:"Apresentar proposta final", data:"2026-03-10", hora:"10:00", tipo:"Reunião", clienteNome:"MARLENE FERREIRA", createdAt:"06/03/2026 | 08:00" },
      { id:"ag2", titulo:"Visita técnica - Kimberly Santos", descricao:"Vistoria do local de instalação", data:"2026-03-12", hora:"14:00", tipo:"Visita técnica", clienteNome:"KIMBERLY SANTOS", createdAt:"06/03/2026 | 08:00" },
    ];
    agendaData.forEach(a => this.agendaMap.set(a.id, a));

    const propostasData: Proposta[] = [
      { id:"pr1", clienteNome:"FRANCIELE", valor:"17.956,15", kwp:"8,40", status:"ABERTO", visualizacoes:3, createdAt:"18/08/2025 | 13:20" },
      { id:"pr2", clienteNome:"RUANDERSON DANIEL MEYER", valor:"31.034,58", kwp:"12,60", status:"ABERTO", visualizacoes:1, createdAt:"01/08/2025 | 17:59" },
      { id:"pr3", clienteNome:"ROSINEIA", valor:"18.100,00", kwp:"8,40", status:"ABERTO", visualizacoes:2, createdAt:"01/08/2025 | 17:59" },
      { id:"pr4", clienteNome:"CLAUDIO DE LIMA", valor:"7.037,72", kwp:"4,20", status:"PERDIDO", visualizacoes:1, createdAt:"16/06/2025 | 17:02" },
      { id:"pr5", clienteNome:"Alessandro da Silva", valor:"15.799,00", kwp:"8,40", status:"ABERTO", visualizacoes:2, createdAt:"16/06/2025 | 17:02" },
      { id:"pr6", clienteNome:"MARLENE", valor:"33.000,00", kwp:"16,80", status:"ABERTO", visualizacoes:4, createdAt:"29/05/2025 | 19:02" },
      { id:"pr7", clienteNome:"Kimberly", valor:"199.404,87", kwp:"84,00", status:"ABERTO", visualizacoes:8, createdAt:"26/05/2025 | 16:36" },
      { id:"pr8", clienteNome:"GABRIEL", valor:"8.999,00", kwp:"4,20", status:"ABERTO", visualizacoes:5, createdAt:"26/05/2025 | 09:39" },
      { id:"pr9", clienteNome:"IRANY", valor:"15.799,00", kwp:"8,40", status:"ABERTO", visualizacoes:1, createdAt:"16/05/2025 | 03:07" },
      { id:"pr10", clienteNome:"DANIELI PALERMO", valor:"17.435,79", kwp:"8,40", status:"ABERTO", visualizacoes:3, createdAt:"13/05/2025 | 13:25" },
    ];
    propostasData.forEach(p => this.propostasMap.set(p.id, p));
  }

  async getUser(id: string) { return this.users.get(id); }
  async getUserByUsername(username: string) { return Array.from(this.users.values()).find(u => u.username === username); }
  async createUser(u: InsertUser) { const user: User = { ...u, id: randomUUID() }; this.users.set(user.id, user); return user; }

  async getClientes() { return Array.from(this.clientesMap.values()); }
  async getCliente(id: string) { return this.clientesMap.get(id); }
  async createCliente(c: InsertCliente) { const item: Cliente = { ...c, id: randomUUID(), createdAt: now() }; this.clientesMap.set(item.id, item); return item; }
  async updateCliente(id: string, c: Partial<InsertCliente>) { const existing = this.clientesMap.get(id); if (!existing) return undefined; const updated = { ...existing, ...c }; this.clientesMap.set(id, updated); return updated; }
  async deleteCliente(id: string) { this.clientesMap.delete(id); }

  async getVendas() { return Array.from(this.vendasMap.values()); }
  async getVenda(id: string) { return this.vendasMap.get(id); }
  async createVenda(v: InsertVenda) { const item: Venda = { ...v, id: randomUUID(), createdAt: now(), temperatura: v.temperatura ?? "", cpf: v.cpf ?? null, email: v.email ?? null, telefone: v.telefone ?? null, cidade: v.cidade ?? null, endereco: v.endereco ?? null, potencia: v.potencia ?? "0,00", modulos: v.modulos ?? 0, inversores: v.inversores ?? 0, topologiaInv: v.topologiaInv ?? "String", distancia: v.distancia ?? "0,00", propostas: v.propostas ?? 0, visualizacoes: v.visualizacoes ?? 0, notas: v.notas ?? 0, validade: v.validade ?? null }; this.vendasMap.set(item.id, item); return item; }
  async updateVenda(id: string, v: Partial<InsertVenda>) { const existing = this.vendasMap.get(id); if (!existing) return undefined; const updated = { ...existing, ...v }; this.vendasMap.set(id, updated); return updated; }
  async deleteVenda(id: string) { this.vendasMap.delete(id); }

  async getKits() { return Array.from(this.kitsMap.values()); }
  async getKit(id: string) { return this.kitsMap.get(id); }
  async createKit(k: InsertKit) { const item: Kit = { ...k, id: randomUUID(), createdAt: now(), modulos: k.modulos ?? 0, inversores: k.inversores ?? 0, fornecedor: k.fornecedor ?? null, tipoFixacao: k.tipoFixacao ?? null, modulosData: k.modulosData ?? null, inversoresData: k.inversoresData ?? null, adicionaisData: k.adicionaisData ?? null }; this.kitsMap.set(item.id, item); return item; }
  async updateKit(id: string, k: Partial<InsertKit>) { const existing = this.kitsMap.get(id); if (!existing) return undefined; const updated = { ...existing, ...k }; this.kitsMap.set(id, updated); return updated; }
  async deleteKit(id: string) { this.kitsMap.delete(id); }

  async getColaboradores() { return Array.from(this.colaboradoresMap.values()); }
  async getColaborador(id: string) { return this.colaboradoresMap.get(id); }
  async createColaborador(c: InsertColaborador) { const item: Colaborador = { ...c, id: randomUUID(), createdAt: now(), email: c.email ?? null, telefone: c.telefone ?? null, cpfCnpj: c.cpfCnpj ?? null }; this.colaboradoresMap.set(item.id, item); return item; }
  async updateColaborador(id: string, c: Partial<InsertColaborador>) { const existing = this.colaboradoresMap.get(id); if (!existing) return undefined; const updated = { ...existing, ...c }; this.colaboradoresMap.set(id, updated); return updated; }
  async deleteColaborador(id: string) { this.colaboradoresMap.delete(id); }

  async getContratos() { return Array.from(this.contratosMap.values()); }
  async getContrato(id: string) { return this.contratosMap.get(id); }
  async createContrato(c: InsertContrato) { const item: Contrato = { ...c, id: randomUUID(), editadoEm: now(), tipo: c.tipo ?? "template", conteudo: c.conteudo ?? null, templateData: (c as any).templateData ?? null, templateNome: (c as any).templateNome ?? null }; this.contratosMap.set(item.id, item); return item; }
  async updateContrato(id: string, c: Partial<InsertContrato>) { const existing = this.contratosMap.get(id); if (!existing) return undefined; const updated = { ...existing, ...c, editadoEm: now() }; this.contratosMap.set(id, updated); return updated; }
  async deleteContrato(id: string) { this.contratosMap.delete(id); }

  async getProjetos() { return Array.from(this.projetosMap.values()); }
  async getProjeto(id: string) { return this.projetosMap.get(id); }
  async createProjeto(p: InsertProjeto) { const item: Projeto = { ...p, id: randomUUID(), createdAt: now(), status: p.status ?? "Em andamento", kwp: p.kwp ?? "0,00", modulos: p.modulos ?? 0, inversores: p.inversores ?? 0, cidade: p.cidade ?? null, proprietario: p.proprietario ?? "GERENTE" }; this.projetosMap.set(item.id, item); return item; }
  async updateProjeto(id: string, p: Partial<InsertProjeto>) { const existing = this.projetosMap.get(id); if (!existing) return undefined; const updated = { ...existing, ...p }; this.projetosMap.set(id, updated); return updated; }
  async deleteProjeto(id: string) { this.projetosMap.delete(id); }

  async getObras() { return Array.from(this.obrasMap.values()); }
  async getObra(id: string) { return this.obrasMap.get(id); }
  async createObra(o: InsertObra) { const item: Obra = { ...o, id: randomUUID(), createdAt: now(), status: o.status ?? "Em andamento", kwp: o.kwp ?? "0,00", cidade: o.cidade ?? null, proprietario: o.proprietario ?? "GERENTE" }; this.obrasMap.set(item.id, item); return item; }
  async updateObra(id: string, o: Partial<InsertObra>) { const existing = this.obrasMap.get(id); if (!existing) return undefined; const updated = { ...existing, ...o }; this.obrasMap.set(id, updated); return updated; }
  async deleteObra(id: string) { this.obrasMap.delete(id); }

  async getAtividades() { return Array.from(this.atividadesMap.values()); }
  async getAtividade(id: string) { return this.atividadesMap.get(id); }
  async createAtividade(a: InsertAtividade) { const item: Atividade = { ...a, id: randomUUID(), createdAt: now(), status: a.status ?? "Pendente", tipo: a.tipo ?? "Manutenção" }; this.atividadesMap.set(item.id, item); return item; }
  async updateAtividade(id: string, a: Partial<InsertAtividade>) { const existing = this.atividadesMap.get(id); if (!existing) return undefined; const updated = { ...existing, ...a }; this.atividadesMap.set(id, updated); return updated; }
  async deleteAtividade(id: string) { this.atividadesMap.delete(id); }

  async getAgendaItems() { return Array.from(this.agendaMap.values()); }
  async getAgendaItem(id: string) { return this.agendaMap.get(id); }
  async createAgendaItem(a: InsertAgendaItem) { const item: AgendaItem = { ...a, id: randomUUID(), createdAt: now(), descricao: a.descricao ?? null, hora: a.hora ?? null, tipo: a.tipo ?? "Reunião", clienteNome: a.clienteNome ?? null }; this.agendaMap.set(item.id, item); return item; }
  async updateAgendaItem(id: string, a: Partial<InsertAgendaItem>) { const existing = this.agendaMap.get(id); if (!existing) return undefined; const updated = { ...existing, ...a }; this.agendaMap.set(id, updated); return updated; }
  async deleteAgendaItem(id: string) { this.agendaMap.delete(id); }

  async getPropostas() { return Array.from(this.propostasMap.values()); }
  async getProposta(id: string) { return this.propostasMap.get(id); }
  async createProposta(p: InsertProposta) { const item: Proposta = { ...p, id: randomUUID(), createdAt: now(), status: p.status ?? "ABERTO", visualizacoes: p.visualizacoes ?? 0 }; this.propostasMap.set(item.id, item); return item; }
  async updateProposta(id: string, p: Partial<InsertProposta>) { const existing = this.propostasMap.get(id); if (!existing) return undefined; const updated = { ...existing, ...p }; this.propostasMap.set(id, updated); return updated; }
  async deleteProposta(id: string) { this.propostasMap.delete(id); }
}

export const storage = new MemStorage();
