import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, hashPassword, verifyPassword } from "./storage";
import multer from "multer";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { insertClienteSchema, insertVendaSchema, insertKitSchema, insertColaboradorSchema, insertContratoSchema, insertProjetoSchema, insertObraSchema, insertAtividadeSchema, insertAgendaItemSchema, insertPropostaSchema } from "@shared/schema";
import type { Venda } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

const MemStore = MemoryStore(session);

declare global {
  namespace Express {
    interface User { id: string; username: string; nome: string; cargo: string; }
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Não autenticado" });
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

function buildTagData(venda: Venda): Record<string, any> {
  const hoje = new Date().toLocaleDateString("pt-BR");
  const cidade = (venda.cidade ?? "").split(" - ");
  const cidadeNome = cidade[0] ?? "";
  const uf = cidade[1] ?? "";

  return {
    nome_empresa: "RANDOLI SOLAR",
    cnpj_empresa: "43.201.226/0001-63",
    nome_resp_empresa: "ÍCARO RANDOLI E SILVA",
    cpf_resp_empresa: "018.516.701-22",
    rg_resp_empresa: "13827626",
    prof_resp_empresa: "TEC ELETROTECNICO",
    nac_resp_empresa: "Brasileiro",
    endereco_empresa: "RUA HATSUE SAKAGUSCHI Nº 599 SINOP-MT",
    telefone_empresa: "(66) 99239-7086",
    whatsapp_empresa: "(66) 99239-7086",

    nome_cliente: venda.clienteNome ?? "",
    uf_cliente: uf,
    cidade_cliente: cidadeNome,
    email_cliente: venda.email ?? "",
    telefone_cliente: venda.telefone ?? "",
    whatsapp_cliente: venda.telefone ?? "",
    documento_cliente: venda.cpf ?? "",
    endereco_cliente: venda.endereco ?? "",
    rg_cliente: "",
    nac_cliente: "Brasileiro(a)",
    prof_cliente: "",
    nome_resp_cliente: venda.clienteNome ?? "",
    cpf_resp_cliente: venda.cpf ?? "",
    observacoes_cliente: "",

    valor_venda: `R$ ${venda.valor}`,
    potencia_sistema: `${venda.kwp} kWp`,
    condicoes_de_pagamento: "",
    condicoes_de_pagamento_venda: "",
    validade_proposta: venda.validade ?? "",

    numero_da_proposta: venda.id.substring(0, 6).toUpperCase(),
    data_validade: venda.validade ?? "",
    dias_validade: "30",
    data_registro: (venda.createdAt ?? "").split(" | ")[0] ?? "",
    cond_pag: "",
    cond_pag_venda: "",
    fornecedor: "",
    est_fix: "",

    cs_m: "",
    cs_m_fp: "",
    cs_m_p: "",
    cs_a: "",
    cs_a_fp: "",
    cs_a_p: "",
    ger_m: "",
    ger_a: "",
    co2: "",
    arvores: "",
    carros: "",

    potencia: venda.kwp ?? "",
    potencia_calc: venda.kwp ?? "",
    area: "",
    peso_dist: "",
    irr: "",

    sobre_eqps: "",

    modulos: Array.from({ length: venda.modulos ?? 0 }, (_, i) => ({
      mod_fab: "",
      mod_pot: "",
      mod_gar_def: "10",
      mod_gar_ef: "25",
      mod_qtd: String(venda.modulos ?? 0),
    })).slice(0, 1),

    inversores: Array.from({ length: 1 }, () => ({
      inv_mod: "",
      inv_fab: "",
      inv_pot: "",
      inv_gar: "5",
      inv_monit: "Wi-Fi",
      inv_qtd: String(venda.inversores ?? 0),
    })),

    adicionais: [],

    ucs_dist: [],

    cust_tot_ss: "",
    cust_c_fp_ss: "",
    cust_d_fp_ss: "",
    cust_c_p_ss: "",
    cust_d_p_ss: "",
    cust_d_ger_ss: "",
    cust_tot_cs: "",
    cust_c_fp_abt: "",
    cust_c_p_abt: "",
    cust_a1_ss: "",
    cust_a1_cs: "",
    ecn_a1_am: "",
    ecn_a1_aa: "",

    preco_sist: `R$ ${venda.valor}`,
    preco_sist_por_extenso: "",
    preco_servico: "",
    preco_servico_por_extenso: "",
    preco_equipamentos: "",
    preco_equipamentos_por_extenso: "",
    infl_en: "5%",
    payback_aa: "",
    payback_mm: "",
    roi: "",
    tir: "",
    vl_sist_fv: "",
    vl_ecn_sist_fv: "",
    ecn_tot: "",

    n_contrato: "",
    data_do_dia: hoje,

    cons_finais_t: "",
    cons_finais_p1: "",
    cons_finais_p2: "",
    cons_finais_p3: "",
    cons_finais_p4: "",
    cons_finais_p5: "",
    cons_finais_p6: "",
  };
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // ── Sessão ──────────────────────────────────────────────
  app.use(session({
    secret: process.env.SESSION_SECRET || "randoli-crm-dev-secret",
    resave: false,
    saveUninitialized: false,
    store: new MemStore({ checkPeriod: 86400000 }),
    cookie: { maxAge: 8 * 60 * 60 * 1000, httpOnly: true, sameSite: "lax" },
  }));

  // ── Passport ─────────────────────────────────────────────
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username.toLowerCase().trim());
      if (!user) return done(null, false, { message: "Usuário não encontrado" });
      if (!verifyPassword(password, user.password)) return done(null, false, { message: "Senha incorreta" });
      return done(null, { id: user.id, username: user.username, nome: user.nome, cargo: user.cargo });
    } catch (e) { return done(e); }
  }));
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) return done(null, false);
      done(null, { id: user.id, username: user.username, nome: user.nome, cargo: user.cargo });
    } catch (e) { done(e); }
  });
  app.use(passport.initialize());
  app.use(passport.session());

  // ── Rotas de autenticação (públicas) ─────────────────────
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Credenciais inválidas" });
      req.logIn(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.json({ id: user.id, username: user.username, nome: user.nome, cargo: user.cargo });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autenticado" });
    const u = req.user!;
    res.json({ id: u.id, username: u.username, nome: u.nome, cargo: u.cargo });
  });

  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    const { senhaAtual, novaSenha } = req.body;
    if (!senhaAtual || !novaSenha) return res.status(400).json({ message: "Campos obrigatórios" });
    if (novaSenha.length < 6) return res.status(400).json({ message: "Senha mínima de 6 caracteres" });
    const user = await storage.getUser(req.user!.id);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    if (!verifyPassword(senhaAtual, user.password)) return res.status(401).json({ message: "Senha atual incorreta" });
    await storage.updateUser(user.id, { password: hashPassword(novaSenha) });
    res.json({ success: true });
  });

  // ── Gestão de usuários/colaboradores (admin) ─────────────
  app.get("/api/users", requireAuth, async (_req, res) => {
    const users = await storage.listUsers();
    res.json(users.map(u => ({ id: u.id, username: u.username, nome: u.nome, cargo: u.cargo })));
  });

  app.post("/api/users", requireAuth, async (req, res) => {
    const { username, password, nome, cargo } = req.body;
    if (!username || !password || !nome) return res.status(400).json({ message: "username, password e nome são obrigatórios" });
    const existing = await storage.getUserByUsername(username.toLowerCase().trim());
    if (existing) return res.status(409).json({ message: "Username já em uso" });
    const user = await storage.createUser({
      username: username.toLowerCase().trim(),
      password: hashPassword(password),
      nome: nome.toUpperCase(),
      cargo: cargo || "Colaborador",
    });
    res.json({ id: user.id, username: user.username, nome: user.nome, cargo: user.cargo });
  });

  app.patch("/api/users/:id", requireAuth, async (req, res) => {
    const { nome, cargo, username } = req.body;
    const updated = await storage.updateUser(req.params.id, { ...(nome && { nome: nome.toUpperCase() }), ...(cargo && { cargo }), ...(username && { username: username.toLowerCase().trim() }) });
    updated ? res.json({ id: updated.id, username: updated.username, nome: updated.nome, cargo: updated.cargo }) : res.status(404).json({ message: "Not found" });
  });

  app.delete("/api/users/:id", requireAuth, async (req, res) => {
    if (req.params.id === req.user!.id) return res.status(400).json({ message: "Não é possível excluir sua própria conta" });
    await storage.deleteUser(req.params.id);
    res.json({ success: true });
  });

  // ── Proteção global: todas as rotas /api/* (exceto /api/auth/*) ──
  app.use("/api", (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/auth/")) return next();
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Não autenticado" });
  });

  app.get("/api/clientes", async (_req, res) => res.json(await storage.getClientes()));
  app.get("/api/clientes/:id", async (req, res) => { const c = await storage.getCliente(req.params.id); c ? res.json(c) : res.status(404).json({ message: "Not found" }); });
  app.post("/api/clientes", async (req, res) => { const r = insertClienteSchema.safeParse(req.body); if (!r.success) return res.status(400).json({ message: r.error.message }); res.json(await storage.createCliente(r.data)); });
  app.patch("/api/clientes/:id", async (req, res) => { const r = insertClienteSchema.partial().safeParse(req.body); if (!r.success) return res.status(400).json({ message: r.error.message }); const c = await storage.updateCliente(req.params.id, r.data); c ? res.json(c) : res.status(404).json({ message: "Not found" }); });
  app.delete("/api/clientes/:id", async (req, res) => { await storage.deleteCliente(req.params.id); res.json({ success: true }); });

  app.get("/api/vendas", async (_req, res) => res.json(await storage.getVendas()));
  app.get("/api/vendas/:id", async (req, res) => { const v = await storage.getVenda(req.params.id); v ? res.json(v) : res.status(404).json({ message: "Not found" }); });
  app.post("/api/vendas", async (req, res) => { const r = insertVendaSchema.safeParse(req.body); if (!r.success) return res.status(400).json({ message: r.error.message }); res.json(await storage.createVenda(r.data)); });
  app.patch("/api/vendas/:id", async (req, res) => { const r = insertVendaSchema.partial().safeParse(req.body); if (!r.success) return res.status(400).json({ message: r.error.message }); const v = await storage.updateVenda(req.params.id, r.data); v ? res.json(v) : res.status(404).json({ message: "Not found" }); });
  app.delete("/api/vendas/:id", async (req, res) => { await storage.deleteVenda(req.params.id); res.json({ success: true }); });

  app.get("/api/kits", async (_req, res) => res.json(await storage.getKits()));
  app.get("/api/kits/:id", async (req, res) => { const k = await storage.getKit(req.params.id); k ? res.json(k) : res.status(404).json({ message: "Not found" }); });
  app.post("/api/kits", async (req, res) => { const r = insertKitSchema.safeParse(req.body); if (!r.success) return res.status(400).json({ message: r.error.message }); res.json(await storage.createKit(r.data)); });
  app.patch("/api/kits/:id", async (req, res) => { const r = insertKitSchema.partial().safeParse(req.body); if (!r.success) return res.status(400).json({ message: r.error.message }); const k = await storage.updateKit(req.params.id, r.data); k ? res.json(k) : res.status(404).json({ message: "Not found" }); });
  app.delete("/api/kits/:id", async (req, res) => { await storage.deleteKit(req.params.id); res.json({ success: true }); });

  app.get("/api/colaboradores", async (_req, res) => res.json(await storage.getColaboradores()));
  app.get("/api/colaboradores/:id", async (req, res) => { const c = await storage.getColaborador(req.params.id); c ? res.json(c) : res.status(404).json({ message: "Not found" }); });
  app.post("/api/colaboradores", async (req, res) => { const r = insertColaboradorSchema.safeParse(req.body); if (!r.success) return res.status(400).json({ message: r.error.message }); res.json(await storage.createColaborador(r.data)); });
  app.patch("/api/colaboradores/:id", async (req, res) => { const r = insertColaboradorSchema.partial().safeParse(req.body); if (!r.success) return res.status(400).json({ message: r.error.message }); const c = await storage.updateColaborador(req.params.id, r.data); c ? res.json(c) : res.status(404).json({ message: "Not found" }); });
  app.delete("/api/colaboradores/:id", async (req, res) => { await storage.deleteColaborador(req.params.id); res.json({ success: true }); });

  app.get("/api/contratos", async (_req, res) => res.json(await storage.getContratos()));
  app.get("/api/contratos/:id", async (req, res) => { const c = await storage.getContrato(req.params.id); c ? res.json(c) : res.status(404).json({ message: "Not found" }); });
  app.post("/api/contratos", async (req, res) => { const r = insertContratoSchema.safeParse(req.body); if (!r.success) return res.status(400).json({ message: r.error.message }); res.json(await storage.createContrato(r.data)); });
  app.patch("/api/contratos/:id", async (req, res) => { const r = insertContratoSchema.partial().safeParse(req.body); if (!r.success) return res.status(400).json({ message: r.error.message }); const c = await storage.updateContrato(req.params.id, r.data); c ? res.json(c) : res.status(404).json({ message: "Not found" }); });
  app.delete("/api/contratos/:id", async (req, res) => { await storage.deleteContrato(req.params.id); res.json({ success: true }); });

  app.post("/api/contratos/:id/upload", upload.single("template"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const contrato = await storage.getContrato(id);
      if (!contrato) return res.status(404).json({ message: "Contrato não encontrado" });
      if (!req.file) return res.status(400).json({ message: "Nenhum arquivo enviado" });
      if (!req.file.originalname.endsWith(".docx")) return res.status(400).json({ message: "Apenas arquivos .docx são aceitos" });

      const templateData = req.file.buffer.toString("base64");
      const updated = await storage.updateContrato(id, { ...(contrato as any), templateData, templateNome: req.file.originalname } as any);
      res.json({ success: true, contrato: updated });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Erro ao fazer upload do arquivo" });
    }
  });

  app.post("/api/contratos/:id/gerar/:vendaId", async (req: Request, res: Response) => {
    try {
      const { id, vendaId } = req.params;
      const [contrato, venda] = await Promise.all([
        storage.getContrato(id),
        storage.getVenda(vendaId),
      ]);

      if (!contrato) return res.status(404).json({ message: "Contrato não encontrado" });
      if (!venda) return res.status(404).json({ message: "Venda não encontrada" });
      if (!contrato.templateData) return res.status(400).json({ message: "Este contrato não possui um modelo Word anexado. Faça o upload do arquivo .docx primeiro." });

      const buffer = Buffer.from(contrato.templateData, "base64");
      const zip = new PizZip(buffer);

      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        errorLogging: false,
        nullGetter: () => "",
      });

      const tagData = buildTagData(venda);
      doc.render(tagData);

      const output = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
      const nomeArquivo = `${contrato.nome.replace(/[^a-zA-Z0-9\s]/g, "")}_${venda.clienteNome.replace(/[^a-zA-Z0-9\s]/g, "").substring(0, 30)}.docx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(nomeArquivo)}"`);
      res.send(output);
    } catch (error: any) {
      console.error("Generation error:", error);
      const msg = error?.properties?.errors?.map((e: any) => e.message).join(", ") || error.message || "Erro desconhecido";
      res.status(500).json({ message: `Erro ao gerar contrato: ${msg}` });
    }
  });

  app.get("/api/projetos", async (_req, res) => res.json(await storage.getProjetos()));
  app.post("/api/projetos", async (req, res) => { const r = insertProjetoSchema.safeParse(req.body); if (!r.success) return res.status(400).json({ message: r.error.message }); res.json(await storage.createProjeto(r.data)); });
  app.patch("/api/projetos/:id", async (req, res) => { const r = insertProjetoSchema.partial().safeParse(req.body); if (!r.success) return res.status(400).json({ message: r.error.message }); const p = await storage.updateProjeto(req.params.id, r.data); p ? res.json(p) : res.status(404).json({ message: "Not found" }); });
  app.delete("/api/projetos/:id", async (req, res) => { await storage.deleteProjeto(req.params.id); res.json({ success: true }); });

  app.get("/api/obras", async (_req, res) => res.json(await storage.getObras()));
  app.post("/api/obras", async (req, res) => { const r = insertObraSchema.safeParse(req.body); if (!r.success) return res.status(400).json({ message: r.error.message }); res.json(await storage.createObra(r.data)); });
  app.patch("/api/obras/:id", async (req, res) => { const r = insertObraSchema.partial().safeParse(req.body); if (!r.success) return res.status(400).json({ message: r.error.message }); const o = await storage.updateObra(req.params.id, r.data); o ? res.json(o) : res.status(404).json({ message: "Not found" }); });
  app.delete("/api/obras/:id", async (req, res) => { await storage.deleteObra(req.params.id); res.json({ success: true }); });

  app.get("/api/atividades", async (_req, res) => res.json(await storage.getAtividades()));
  app.post("/api/atividades", async (req, res) => { const r = insertAtividadeSchema.safeParse(req.body); if (!r.success) return res.status(400).json({ message: r.error.message }); res.json(await storage.createAtividade(r.data)); });
  app.patch("/api/atividades/:id", async (req, res) => { const r = insertAtividadeSchema.partial().safeParse(req.body); if (!r.success) return res.status(400).json({ message: r.error.message }); const a = await storage.updateAtividade(req.params.id, r.data); a ? res.json(a) : res.status(404).json({ message: "Not found" }); });
  app.delete("/api/atividades/:id", async (req, res) => { await storage.deleteAtividade(req.params.id); res.json({ success: true }); });

  app.get("/api/agenda", async (_req, res) => res.json(await storage.getAgendaItems()));
  app.post("/api/agenda", async (req, res) => { const r = insertAgendaItemSchema.safeParse(req.body); if (!r.success) return res.status(400).json({ message: r.error.message }); res.json(await storage.createAgendaItem(r.data)); });
  app.patch("/api/agenda/:id", async (req, res) => { const r = insertAgendaItemSchema.partial().safeParse(req.body); if (!r.success) return res.status(400).json({ message: r.error.message }); const a = await storage.updateAgendaItem(req.params.id, r.data); a ? res.json(a) : res.status(404).json({ message: "Not found" }); });
  app.delete("/api/agenda/:id", async (req, res) => { await storage.deleteAgendaItem(req.params.id); res.json({ success: true }); });

  app.get("/api/propostas", async (_req, res) => res.json(await storage.getPropostas()));
  app.get("/api/propostas/:id", async (req, res) => { const p = await storage.getProposta(req.params.id); p ? res.json(p) : res.status(404).json({ message: "Not found" }); });
  app.post("/api/propostas", async (req, res) => {
    const r = insertPropostaSchema.safeParse(req.body);
    if (!r.success) return res.status(400).json({ message: r.error.message });
    let data = r.data;
    if (!data.vendaId) {
      const kit = data.kitId ? await storage.getKit(data.kitId) : null;
      const venda = await storage.createVenda({
        clienteNome: data.clienteNome,
        valor: data.totalFinal || data.valor,
        kwp: data.potCalculada || data.kwp || "0,00",
        status: "envio de proposta",
        proprietario: "GERENTE",
        email: data.email ?? undefined,
        cidade: data.cidade ? `${data.cidade}${data.uf ? ` - ${data.uf}` : ""}` : undefined,
        endereco: data.endereco ?? undefined,
        potencia: data.potCalculada ?? "0,00",
        modulos: kit?.modulos ?? 0,
        inversores: kit?.inversores ?? 0,
        propostas: 1,
      });
      data = { ...data, vendaId: venda.id };
    } else {
      const venda = await storage.getVenda(data.vendaId);
      if (venda) {
        await storage.updateVenda(data.vendaId, {
          propostas: (venda.propostas ?? 0) + 1,
          status: "envio de proposta",
          valor: data.totalFinal || data.valor || venda.valor,
          kwp: data.potCalculada || data.kwp || venda.kwp,
          potencia: data.potCalculada || venda.potencia,
          email: data.email ?? venda.email,
          cidade: data.cidade ?? venda.cidade,
          endereco: data.endereco ?? venda.endereco,
        });
      }
    }
    res.json(await storage.createProposta(data));
  });
  app.patch("/api/propostas/:id", async (req, res) => { const r = insertPropostaSchema.partial().safeParse(req.body); if (!r.success) return res.status(400).json({ message: r.error.message }); const p = await storage.updateProposta(req.params.id, r.data); p ? res.json(p) : res.status(404).json({ message: "Not found" }); });
  app.delete("/api/propostas/:id", async (req, res) => { await storage.deleteProposta(req.params.id); res.json({ success: true }); });

  app.get("/api/stats", async (_req, res) => {
    const [clientes, vendas, propostas] = await Promise.all([
      storage.getClientes(),
      storage.getVendas(),
      storage.getPropostas(),
    ]);
    const totalVendasValor = vendas.reduce((acc, v) => acc + parseFloat(v.valor.replace(/\./g, "").replace(",", ".")), 0);
    res.json({
      totalClientes: clientes.length,
      totalPropostas: propostas.length,
      totalVendas: vendas.length,
      totalVendasValor: totalVendasValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
    });
  });

  return httpServer;
}
