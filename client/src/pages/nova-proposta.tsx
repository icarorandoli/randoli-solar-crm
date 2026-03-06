import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronLeft, Plus, Minus, ShoppingCart, FileEdit, Package, Zap, Sun } from "lucide-react";
import type { Cliente, Venda, Kit } from "@shared/schema";

const STEPS = [
  { label: "Cadastro UCs", id: 1 },
  { label: "Kit FV", id: 2 },
  { label: "Precificação", id: 3 },
  { label: "Validação", id: 4 },
  { label: "Financiamento", id: 5 },
  { label: "Finalização", id: 6 },
];

const CONCESSIONARIAS = ["ENERGISA MT","CELPA","CEMIG","COPEL","COELBA","ELEKTRO","ENEL SP","ENEL RJ","ENEL CE","CELPE","COSERN","COELCE","CEMAT","ELETROACRE","AME","BOA VISTA ENERGIA","CEAL","CEB","CELESC","CERON","CFLO","CHESP","CPFL PAULISTA","CPFL PIRATININGA","DEMEI","DMED","EBO","EDEVP","EMS","ENERSUL","ESS","LIGHT","MOCELIN","RGE","SULGIPE","UHENPAL","OUTRO"];
const REDES = ["Monofásica","Bifásica","Trifásica"];
const TIPOS_UC = ["Residencial","Comercial","Industrial","Rural","Poder Público","Iluminação Pública"];
const MODALIDADES = ["Grupo B (Baixa Tensão)","Grupo A (Alta Tensão) - A1","Grupo A (Alta Tensão) - A2","Grupo A (Alta Tensão) - A3","Grupo A (Alta Tensão) - A4"];
const TEMAS = ["#0d9488","#f59e0b","#f97316","#ef4444","#8b5cf6","#3b82f6","#06b6d4","#10b981","#ec4899","#6366f1","#d97706","#64748b","#374151","#92400e","#000000"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center mb-6 overflow-x-auto">
      <div className="flex items-center gap-0 min-w-max">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all",
                current > s.id ? "bg-primary border-primary text-white" : current === s.id ? "bg-primary border-primary text-white" : "bg-white border-border text-muted-foreground"
              )}>
                {current > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
              </div>
              <span className={cn("text-[10px] mt-1 font-medium whitespace-nowrap", current === s.id ? "text-primary" : "text-muted-foreground")}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={cn("w-12 h-0.5 mb-4 mx-1", current > s.id ? "bg-primary" : "bg-border")} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-primary font-bold text-base mb-3">{children}</h3>;
}

function FieldGroup({ children, cols = 1 }: { children: React.ReactNode; cols?: number }) {
  return <div className={cn("grid gap-3 mb-4", cols === 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-3" : "grid-cols-1")}>{children}</div>;
}

function FloatLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative border border-border rounded bg-white dark:bg-card">
      <span className="absolute top-0.5 left-2 text-[10px] text-muted-foreground leading-none">{label}</span>
      <div className="pt-4 px-2 pb-1">{children}</div>
    </div>
  );
}

export default function NovaProposta() {
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [kitView, setKitView] = useState<"options" | "list">("options");

  const [d, setD] = useState({
    clienteNome: "", email: "", uf: "MT", cidade: "", endereco: "", latitude: "", longitude: "", deslocamento: "",
    modalidadeTarifaria: "Grupo B (Baixa Tensão)", nomeUc: "", tipoUc: "Residencial",
    concessionaria: "ENERGISA MT", valorKwh: "1,08", taxaIlumPub: "19,00", rede: "Bifásica",
    consumoMensal: "1000", percGeracao: "100", percPerdas: "25",
    fatorSimult: "30", valorFioB: "0,18", percFioB: "17",
    kitId: "", kitNome: "", kitKwp: "0", kitValor: "0",
    kitModulos: "", kitInversores: "",
    vendaId: "",
    potCalculada: "0",
    descontoKit: "0,00", valorKit: "0,00", areaObra: "0,00",
    precMode: "" as "" | "auto" | "manual",
    custoServico1Nome: "Projeto", custoServico1Valor: "0,00",
    custoServico2Nome: "Instalação", custoServico2Valor: "0,00",
    custoServico3Nome: "Material CA", custoServico3Valor: "0,00",
    custosExtra: [] as { nome: string; valor: string }[],
    percImpostos: "3,00", percMargem: "20,82",
    receitaAdicional: "0,00", inflacaoAnual: "10",
    descontoNegociacao: "0",
    condicoesPagamento: "",
    tema: "#0d9488", validade: "15",
  });

  const upd = (field: string, value: string) => setD(prev => ({ ...prev, [field]: value }));

  const { data: clientes } = useQuery<Cliente[]>({ queryKey: ["/api/clientes"] });

  useEffect(() => {
    if (!clientes || !searchStr) return;
    const params = new URLSearchParams(searchStr);
    const clienteId = params.get("clienteId");
    if (!clienteId) return;
    const c = clientes.find(x => x.id === clienteId);
    if (!c) return;
    setD(prev => ({
      ...prev,
      clienteNome: c.nome ?? prev.clienteNome,
      email: c.email ?? prev.email,
      cidade: c.cidade ?? prev.cidade,
      uf: c.estado ?? prev.uf,
      endereco: c.endereco ?? prev.endereco,
    }));
  }, [clientes, searchStr]);

  const handleClienteNomeChange = (value: string) => {
    upd("clienteNome", value);
    const match = (clientes || []).find(c => c.nome.toLowerCase() === value.toLowerCase());
    if (match) {
      setD(prev => ({
        ...prev,
        clienteNome: match.nome,
        email: (match as any).email ?? prev.email,
        cidade: (match as any).cidade ?? prev.cidade,
        uf: (match as any).estado ?? prev.uf,
        endereco: (match as any).endereco ?? prev.endereco,
        latitude: (match as any).latitude ?? prev.latitude,
        longitude: (match as any).longitude ?? prev.longitude,
      }));
    }
  };
  const { data: vendas } = useQuery<Venda[]>({ queryKey: ["/api/vendas"] });
  const { data: kits } = useQuery<Kit[]>({ queryKey: ["/api/kits"] });

  const parseBRL = (v: string) => parseFloat((v || "0").replace(/\./g, "").replace(",", ".")) || 0;

  const handleDescontoKit = (value: string) => {
    const desc = parseFloat(value.replace(",", ".")) || 0;
    const originalPrice = parseBRL(d.kitValor || d.valorKit);
    if (originalPrice > 0) {
      const newPrice = originalPrice * (1 - desc / 100);
      setD(prev => ({ ...prev, descontoKit: value, valorKit: newPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }));
    } else {
      upd("descontoKit", value);
    }
  };

  const geracaoMensal = () => {
    const p = parseFloat(d.potCalculada) || 0;
    const perc = parseFloat(d.percPerdas) || 25;
    const fator = (100 - perc) / 100;
    return (p * 167 * fator).toFixed(2);
  };

  const valorFinal = () => {
    const kit = parseBRL(d.valorKit);
    const s1 = parseBRL(d.custoServico1Valor);
    const s2 = parseBRL(d.custoServico2Valor);
    const s3 = parseBRL(d.custoServico3Valor);
    const extra = d.custosExtra.reduce((s, c) => s + parseBRL(c.valor), 0);
    const total = kit + s1 + s2 + s3 + extra;
    const imposto = 1 - parseBRL(d.percImpostos) / 100;
    const margem = 1 + parseBRL(d.percMargem) / 100;
    const rec = parseBRL(d.receitaAdicional);
    const desc = 1 - (parseFloat(d.descontoNegociacao) || 0) / 100;
    return (total / (imposto > 0 ? imposto : 1) * margem + rec) * desc;
  };

  const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const kwpNum = parseFloat(d.potCalculada) || 0;
  const vFinal = valorFinal();
  const vFinalPerKwp = kwpNum > 0 ? vFinal / kwpNum : 0;
  const kitValorNum = parseBRL(d.valorKit);
  const servsTotal = parseBRL(d.custoServico1Valor) + parseBRL(d.custoServico2Valor) + parseBRL(d.custoServico3Valor) +
    d.custosExtra.reduce((s, c) => s + parseBRL(c.valor), 0);

  const dataValidadeFmt = () => {
    const days = parseInt(d.validade) || 15;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString("pt-BR");
  };

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => apiRequest("POST", "/api/propostas", payload),
    onSuccess: async (res) => {
      const data = await res.json();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/propostas"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/vendas"] }),
        queryClient.refetchQueries({ queryKey: ["/api/vendas"] }),
      ]);
      toast({
        title: "Proposta gerada com sucesso!",
        description: 'Card criado no funil na coluna "envio de proposta".',
      });
      navigate(`/proposta/${data.id}`);
    },
    onError: () => toast({ title: "Erro ao gerar proposta", variant: "destructive" }),
  });

  const gerarProposta = () => {
    const vf = valorFinal();
    createMutation.mutate({
      clienteNome: d.clienteNome || "Cliente",
      valor: fmtBRL(vf),
      kwp: (parseFloat(d.potCalculada) || 0).toFixed(2),
      status: "ABERTO",
      vendaId: d.vendaId || null,
      kitId: d.kitId || null,
      kitNome: d.kitNome || null,
      email: d.email || null,
      cidade: d.cidade || null,
      uf: d.uf || null,
      endereco: d.endereco || null,
      latitude: d.latitude || null,
      longitude: d.longitude || null,
      deslocamento: d.deslocamento || null,
      concessionaria: d.concessionaria || null,
      valorKwh: d.valorKwh || null,
      taxaIlumPub: d.taxaIlumPub || null,
      rede: d.rede || null,
      consumoMensal: d.consumoMensal || null,
      percGeracao: d.percGeracao || null,
      percPerdas: d.percPerdas || null,
      modalidadeTarifaria: d.modalidadeTarifaria || null,
      nomeUc: d.nomeUc || null,
      tipoUc: d.tipoUc || null,
      potCalculada: d.potCalculada || null,
      valorKit: d.valorKit || null,
      descontoKit: d.descontoKit || null,
      areaObra: d.areaObra || null,
      custosServico: JSON.stringify([
        { nome: d.custoServico1Nome, valor: d.custoServico1Valor },
        { nome: d.custoServico2Nome, valor: d.custoServico2Valor },
        { nome: d.custoServico3Nome, valor: d.custoServico3Valor },
        ...d.custosExtra,
      ]),
      percImpostos: d.percImpostos || null,
      percMargem: d.percMargem || null,
      receitaAdicional: d.receitaAdicional || null,
      inflacaoAnual: d.inflacaoAnual || null,
      condicoesPagamento: d.condicoesPagamento || null,
      descontoNegociacao: d.descontoNegociacao || null,
      totalFinal: fmtBRL(vf),
      validade: d.validade || null,
      dataValidade: dataValidadeFmt(),
      tema: d.tema || null,
    });
  };

  const selectKit = (kit: Kit) => {
    const modulosData = (() => { try { return JSON.parse(kit.modulosData || "[]"); } catch { return []; } })();
    const inversoresData = (() => { try { return JSON.parse(kit.inversoresData || "[]"); } catch { return []; } })();
    const potKwp = kit.kwp || "0";
    const valor = kit.preco || "0";
    const modNomes = modulosData.map((m: { marca?: string; potencia?: string }) => `${m.marca || ""} ${m.potencia || ""}Wp`).join(", ");
    const invNomes = inversoresData.map((inv: { marca?: string; modelo?: string }) => `${inv.marca || ""} ${inv.modelo || ""}`).join(", ");

    setD(prev => ({
      ...prev,
      kitId: kit.id,
      kitNome: kit.nome,
      kitKwp: potKwp,
      kitValor: valor,
      potCalculada: potKwp,
      valorKit: valor,
      kitModulos: modNomes,
      kitInversores: invNomes,
    }));
    setKitView("options");
    toast({ title: `Kit "${kit.nome}" selecionado!` });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 pb-16">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/propostas")} data-testid="button-voltar-propostas">
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <h2 className="text-foreground font-semibold">Gerar Proposta</h2>
      </div>

      <div className="bg-white dark:bg-card border border-border rounded-lg p-4">
        <StepIndicator current={step} />

        {step === 1 && (
          <div>
            <SectionTitle>Dados do Cliente</SectionTitle>
            <FieldGroup>
              <FloatLabel label="Nome">
                <Input
                  data-testid="input-cliente-nome-wizard"
                  className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent"
                  value={d.clienteNome}
                  onChange={e => handleClienteNomeChange(e.target.value)}
                  list="clientes-list"
                  placeholder="Nome do cliente"
                />
                <datalist id="clientes-list">
                  {(clientes || []).map(c => <option key={c.id} value={c.nome} />)}
                </datalist>
              </FloatLabel>
            </FieldGroup>
            <FieldGroup>
              <FloatLabel label="Email">
                <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.email} onChange={e => upd("email", e.target.value)} placeholder="email@exemplo.com" />
              </FloatLabel>
            </FieldGroup>
            <FieldGroup cols={2}>
              <FloatLabel label="UF">
                <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.uf} onChange={e => upd("uf", e.target.value)} maxLength={2} />
              </FloatLabel>
              <FloatLabel label="Cidade">
                <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.cidade} onChange={e => upd("cidade", e.target.value)} placeholder="Cidade" />
              </FloatLabel>
            </FieldGroup>
            <FieldGroup cols={2}>
              <FloatLabel label="Latitude">
                <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.latitude} onChange={e => upd("latitude", e.target.value)} placeholder="-15.73" />
              </FloatLabel>
              <FloatLabel label="Longitude">
                <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.longitude} onChange={e => upd("longitude", e.target.value)} placeholder="-51.83" />
              </FloatLabel>
            </FieldGroup>
            <FieldGroup cols={2}>
              <FloatLabel label="Endereço">
                <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.endereco} onChange={e => upd("endereco", e.target.value)} placeholder="Rua, número, bairro" />
              </FloatLabel>
              <FloatLabel label="Deslocamento (km)">
                <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.deslocamento} onChange={e => upd("deslocamento", e.target.value)} placeholder="km" type="number" />
              </FloatLabel>
            </FieldGroup>

            <div className="mb-4">
              <Button variant="outline" size="sm" className="w-full text-primary border-primary/40 text-xs font-bold tracking-widest">
                MOSTRAR DADOS DE IRRADIAÇÃO
              </Button>
            </div>

            <SectionTitle>Modalidade Tarifária</SectionTitle>
            <FieldGroup>
              <FloatLabel label="Modalidade Tarifária">
                <select className="w-full bg-transparent text-sm border-0 outline-none h-6" value={d.modalidadeTarifaria} onChange={e => upd("modalidadeTarifaria", e.target.value)}>
                  {MODALIDADES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </FloatLabel>
            </FieldGroup>

            <SectionTitle>Unidade Consumidora</SectionTitle>
            <FieldGroup cols={2}>
              <FloatLabel label="Nome da UC">
                <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.nomeUc} onChange={e => upd("nomeUc", e.target.value)} placeholder="Nome da UC (opcional)" />
              </FloatLabel>
              <FloatLabel label="Tipo de UC">
                <select className="w-full bg-transparent text-sm border-0 outline-none h-6" value={d.tipoUc} onChange={e => upd("tipoUc", e.target.value)}>
                  {TIPOS_UC.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FloatLabel>
            </FieldGroup>

            <SectionTitle>Cadastro UCs</SectionTitle>
            <FieldGroup>
              <FloatLabel label="Concessionária">
                <select className="w-full bg-transparent text-sm border-0 outline-none h-6" value={d.concessionaria} onChange={e => upd("concessionaria", e.target.value)}>
                  {CONCESSIONARIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FloatLabel>
            </FieldGroup>
            <FieldGroup cols={3}>
              <FloatLabel label="Valor kWh R$">
                <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.valorKwh} onChange={e => upd("valorKwh", e.target.value)} />
              </FloatLabel>
              <FloatLabel label="Taxa Ilum. Púb. R$">
                <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.taxaIlumPub} onChange={e => upd("taxaIlumPub", e.target.value)} />
              </FloatLabel>
              <FloatLabel label="Rede">
                <select className="w-full bg-transparent text-sm border-0 outline-none h-6" value={d.rede} onChange={e => upd("rede", e.target.value)}>
                  {REDES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </FloatLabel>
            </FieldGroup>

            <SectionTitle>Consumo Mensal</SectionTitle>
            <FieldGroup cols={2}>
              <FloatLabel label="Média kWh/mês">
                <Input data-testid="input-consumo-mensal" className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.consumoMensal} onChange={e => upd("consumoMensal", e.target.value)} type="number" />
              </FloatLabel>
              <div />
            </FieldGroup>

            <SectionTitle>Dimensionamento</SectionTitle>
            <FieldGroup cols={2}>
              <FloatLabel label="% Geração">
                <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.percGeracao} onChange={e => upd("percGeracao", e.target.value)} type="number" />
              </FloatLabel>
              <FloatLabel label="% Perdas">
                <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.percPerdas} onChange={e => upd("percPerdas", e.target.value)} type="number" />
              </FloatLabel>
            </FieldGroup>

            <SectionTitle>Análise de Viabilidade</SectionTitle>
            <FieldGroup cols={3}>
              <FloatLabel label="Fator Simult. %">
                <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.fatorSimult} onChange={e => upd("fatorSimult", e.target.value)} type="number" />
              </FloatLabel>
              <FloatLabel label="Valor Fio B R$">
                <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.valorFioB} onChange={e => upd("valorFioB", e.target.value)} />
              </FloatLabel>
              <FloatLabel label="Percentual Fio B %">
                <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.percFioB} onChange={e => upd("percFioB", e.target.value)} type="number" />
              </FloatLabel>
            </FieldGroup>

            <div className="flex flex-col gap-2 mt-6">
              <Button data-testid="button-continuar-step1" className="w-full text-xs font-bold tracking-widest" onClick={() => setStep(2)}>
                ATUALIZAR E CONTINUAR
              </Button>
              <Button variant="outline" className="w-full text-xs font-bold tracking-widest border-orange-400 text-orange-500 hover:bg-orange-50">
                + UC
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="bg-muted/30 rounded-lg p-3 mb-4 text-center">
              <span className="text-sm font-medium text-muted-foreground">Pot. Calculada: </span>
              <span className="text-primary font-bold">{d.potCalculada} kWp</span>
            </div>

            <div className="bg-muted/30 rounded-lg p-3 mb-4">
              <h4 className="text-sm font-semibold text-foreground text-center mb-3">Prévia de Geração</h4>
              <div className="flex items-center justify-center gap-3 text-sm">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Potência</div>
                  <Input className="w-20 text-center text-sm h-7" value={d.potCalculada} onChange={e => upd("potCalculada", e.target.value)} />
                </div>
                <span className="text-muted-foreground font-bold">×</span>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Perdas %</div>
                  <Input className="w-20 text-center text-sm h-7" value={d.percPerdas} onChange={e => upd("percPerdas", e.target.value)} />
                </div>
                <span className="text-primary text-sm font-semibold">≈ {geracaoMensal()} kWh/mês</span>
              </div>
            </div>

            <div className="mb-4">
              <FloatLabel label="Venda da Proposta">
                <select
                  data-testid="select-venda-proposta"
                  className="w-full bg-transparent text-sm border-0 outline-none h-6"
                  value={d.vendaId}
                  onChange={e => {
                    upd("vendaId", e.target.value);
                    const venda = (vendas || []).find(v => v.id === e.target.value);
                    if (venda) upd("clienteNome", venda.clienteNome);
                  }}
                >
                  <option value="">Selecionar venda...</option>
                  {(vendas || []).map(v => (
                    <option key={v.id} value={v.id}>Venda de {v.clienteNome}</option>
                  ))}
                  <option value="nova">NOVA VENDA</option>
                </select>
              </FloatLabel>
            </div>

            {kitView === "options" && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    data-testid="button-criar-kit"
                    className="border-2 border-primary bg-primary text-white rounded-lg p-4 flex flex-col items-center gap-2 hover:bg-primary/90 transition-colors"
                    onClick={() => navigate("/kits")}
                  >
                    <FileEdit className="w-6 h-6" />
                    <span className="text-xs font-bold tracking-wider">CRIAR OU EDITAR UM KIT</span>
                  </button>
                  <button
                    data-testid="button-escolher-kit"
                    className="border-2 border-primary bg-primary text-white rounded-lg p-4 flex flex-col items-center gap-2 hover:bg-primary/90 transition-colors"
                    onClick={() => setKitView("list")}
                  >
                    <ShoppingCart className="w-6 h-6" />
                    <span className="text-xs font-bold tracking-wider">ESCOLHER KIT REGISTRADO</span>
                  </button>
                </div>
                <button
                  className="w-full border-2 border-primary bg-primary text-white rounded-lg p-4 flex flex-col items-center gap-2 hover:bg-primary/90 transition-colors"
                  onClick={() => toast({ title: "Funcionalidade em breve" })}
                >
                  <Package className="w-6 h-6" />
                  <span className="text-xs font-bold tracking-wider">KITS DE FORNECEDORES</span>
                </button>
                {d.kitId && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                    <strong>Kit selecionado:</strong> {d.kitNome} ({d.potCalculada} kWp)
                  </div>
                )}
              </div>
            )}

            {kitView === "list" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-foreground">Escolher Kit Registrado</h4>
                  <Button variant="ghost" size="sm" onClick={() => setKitView("options")}>Voltar</Button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(kits || []).map(kit => (
                    <div
                      key={kit.id}
                      data-testid={`kit-option-${kit.id}`}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                        d.kitId === kit.id ? "border-primary bg-primary/5" : "border-border"
                      )}
                      onClick={() => selectKit(kit)}
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{kit.nome}</div>
                        <div className="text-xs text-muted-foreground">{kit.kwp} kWp · R$ {kit.preco}</div>
                        <div className="text-xs text-muted-foreground">{kit.tensao || "—"} · {kit.tipoFixacao || "—"}</div>
                      </div>
                      {d.kitId === kit.id && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 text-xs font-bold tracking-widest border-red-400 text-red-500 hover:bg-red-50">
                VOLTAR
              </Button>
              <Button data-testid="button-continuar-step2" className="flex-1 text-xs font-bold tracking-widest" onClick={() => setStep(3)}>
                CONTINUAR
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="bg-muted/30 rounded-lg p-3 mb-4 text-sm">
              <div><span className="text-muted-foreground">Potência dos Módulos: </span><span className="text-primary font-bold">{d.potCalculada} kWp</span></div>
              {d.kitInversores && <div><span className="text-muted-foreground">Inversores: </span><span className="text-primary font-bold">{d.kitInversores}</span></div>}
            </div>

            <div className="text-center text-sm font-semibold text-foreground mb-4">Deseja Precificar Automaticamente ou Editar os Valores?</div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                data-testid="button-calcular-preco"
                onClick={() => upd("precMode", "auto")}
                className={cn("rounded-lg p-4 flex flex-col items-center gap-2 border-2 transition-colors", d.precMode === "auto" ? "bg-primary border-primary text-white" : "bg-primary/10 border-primary text-primary hover:bg-primary/20")}
              >
                <span className="text-2xl">💲</span>
                <span className="text-xs font-bold tracking-wider">CALCULAR PREÇO</span>
              </button>
              <button
                data-testid="button-editar-sem-recalcular"
                onClick={() => upd("precMode", "manual")}
                className={cn("rounded-lg p-4 flex flex-col items-center gap-2 border-2 transition-colors", d.precMode === "manual" ? "bg-muted border-border text-foreground" : "bg-muted/50 border-border text-muted-foreground hover:bg-muted")}
              >
                <FileEdit className="w-6 h-6" />
                <span className="text-xs font-bold tracking-wider">EDITAR SEM RECALCULAR</span>
              </button>
            </div>

            {(d.precMode === "auto" || d.precMode === "manual") && (
              <div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <FloatLabel label="Desconto no Kit %">
                    <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.descontoKit} onChange={e => handleDescontoKit(e.target.value)} />
                  </FloatLabel>
                  <FloatLabel label="Valor do Kit R$">
                    <Input data-testid="input-valor-kit-proposta" className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.valorKit} onChange={e => upd("valorKit", e.target.value)} />
                  </FloatLabel>
                </div>
                <FieldGroup>
                  <FloatLabel label="Área da Obra m²">
                    <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.areaObra} onChange={e => upd("areaObra", e.target.value)} />
                  </FloatLabel>
                </FieldGroup>

                <div className="bg-muted/30 rounded-lg p-3 mb-4">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Resumo do Sistema</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Pot. Real kWp: </span><span className="font-semibold">{d.potCalculada} kWp</span></div>
                    <div><span className="text-muted-foreground">Ger. Anual kWh: </span><span className="font-semibold">{(parseFloat(geracaoMensal()) * 12).toFixed(0)}</span></div>
                    <div><span className="text-muted-foreground">Área Requerida: </span><span className="font-semibold">{d.areaObra} m²</span></div>
                  </div>
                </div>

                <SectionTitle>Custo de Kit</SectionTitle>
                <div className="bg-muted/30 rounded-lg p-3 mb-4">
                  <div className="text-sm text-muted-foreground">Valor: <span className="font-semibold text-foreground">R$ {d.valorKit}</span></div>
                </div>

                <SectionTitle>Custos de Serviço</SectionTitle>
                {[
                  { nKey: "custoServico1Nome", vKey: "custoServico1Valor" },
                  { nKey: "custoServico2Nome", vKey: "custoServico2Valor" },
                  { nKey: "custoServico3Nome", vKey: "custoServico3Valor" },
                ].map(({ nKey, vKey }, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 mb-2">
                    <FloatLabel label={`Nome Custo ${i + 1}`}>
                      <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={(d as Record<string, string>)[nKey]} onChange={e => upd(nKey, e.target.value)} />
                    </FloatLabel>
                    <FloatLabel label="Valor Custo R$">
                      <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={(d as Record<string, string>)[vKey]} onChange={e => upd(vKey, e.target.value)} />
                    </FloatLabel>
                  </div>
                ))}
                {d.custosExtra.map((c, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 mb-2">
                    <FloatLabel label={`Nome Custo ${i + 4}`}>
                      <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={c.nome} onChange={e => setD(prev => { const ex = [...prev.custosExtra]; ex[i].nome = e.target.value; return { ...prev, custosExtra: ex }; })} />
                    </FloatLabel>
                    <FloatLabel label="Valor Custo R$">
                      <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={c.valor} onChange={e => setD(prev => { const ex = [...prev.custosExtra]; ex[i].valor = e.target.value; return { ...prev, custosExtra: ex }; })} />
                    </FloatLabel>
                  </div>
                ))}
                <div className="flex gap-2 mb-4">
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => setD(prev => ({ ...prev, custosExtra: [...prev.custosExtra, { nome: "", valor: "0,00" }] }))}>
                    <Plus className="w-3 h-3 mr-1" /> CUSTO
                  </Button>
                  {d.custosExtra.length > 0 && (
                    <Button variant="outline" size="sm" className="text-xs text-destructive border-destructive/30" onClick={() => setD(prev => ({ ...prev, custosExtra: prev.custosExtra.slice(0, -1) }))}>
                      <Minus className="w-3 h-3 mr-1" /> CUSTO
                    </Button>
                  )}
                </div>

                <SectionTitle>Percentual de Custo sobre Valor Final</SectionTitle>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <FloatLabel label="Nome Perc. 1">
                    <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" defaultValue="Impostos" readOnly />
                  </FloatLabel>
                  <FloatLabel label="Valor Perc. %">
                    <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.percImpostos} onChange={e => upd("percImpostos", e.target.value)} />
                  </FloatLabel>
                </div>

                <SectionTitle>Percentual de Receita sobre Valor Final</SectionTitle>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <FloatLabel label="Nome Perc. 1">
                    <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" defaultValue="Margem de Receita" readOnly />
                  </FloatLabel>
                  <FloatLabel label="Valor Perc. %">
                    <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.percMargem} onChange={e => upd("percMargem", e.target.value)} />
                  </FloatLabel>
                </div>

                <SectionTitle>Receita Adicional</SectionTitle>
                <FloatLabel label="Receita Bruta Adicional R$">
                  <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.receitaAdicional} onChange={e => upd("receitaAdicional", e.target.value)} />
                </FloatLabel>

                <div className="mt-4 mb-4">
                  <SectionTitle>Análise Financeira</SectionTitle>
                  <FloatLabel label="Inflação Anual %">
                    <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.inflacaoAnual} onChange={e => upd("inflacaoAnual", e.target.value)} type="number" />
                  </FloatLabel>
                </div>

                <SectionTitle>Negociação</SectionTitle>
                <div className="mb-4">
                  <FloatLabel label="Desconto de Negociação %">
                    <div className="flex items-center gap-3 pb-1">
                      <input type="range" min="0" max="50" step="5" value={d.descontoNegociacao} onChange={e => upd("descontoNegociacao", e.target.value)} className="flex-1 accent-primary" />
                      <span className="text-sm font-semibold text-foreground w-12 text-right">{d.descontoNegociacao}%</span>
                    </div>
                  </FloatLabel>
                </div>

                <div className="bg-muted/30 rounded-lg p-4 mb-4">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Resumo Dados Financeiros</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-white dark:bg-card border border-border rounded p-2">
                      <div className="text-xs text-muted-foreground">Total Equipamentos</div>
                      <div className="font-bold text-foreground">R$ {fmtBRL(kitValorNum)}</div>
                    </div>
                    <div className="bg-white dark:bg-card border border-border rounded p-2">
                      <div className="text-xs text-muted-foreground">Total Mão de Obra</div>
                      <div className="font-bold text-foreground">R$ {fmtBRL(servsTotal)}</div>
                    </div>
                    <div className="bg-white dark:bg-card border border-border rounded p-2">
                      <div className="text-xs text-muted-foreground">Valor por kWp</div>
                      <div className="font-bold text-foreground">R$ {fmtBRL(vFinalPerKwp)}/kWp</div>
                    </div>
                    <div className="bg-white dark:bg-card border border-border rounded p-2">
                      <div className="text-xs text-muted-foreground">Total Final</div>
                      <div className="font-bold text-primary">R$ {fmtBRL(vFinal)}</div>
                    </div>
                  </div>
                </div>

                <SectionTitle>Condições de Pagamento</SectionTitle>
                <Textarea
                  data-testid="textarea-condicoes-pagamento"
                  placeholder="Descreva as condições de pagamento aqui. Este texto será usado no contrato."
                  className="min-h-24 text-sm resize-none"
                  value={d.condicoesPagamento}
                  onChange={e => upd("condicoesPagamento", e.target.value)}
                />
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1 text-xs font-bold tracking-widest border-red-400 text-red-500 hover:bg-red-50">
                VOLTAR
              </Button>
              <Button data-testid="button-continuar-step3" className="flex-1 text-xs font-bold tracking-widest" onClick={() => setStep(4)} disabled={!d.precMode}>
                ATUALIZAR E CONTINUAR
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">Aplicar Inflação</span>
              <button
                onClick={() => {}}
                className="w-9 h-5 rounded-full bg-primary relative transition-colors flex items-center px-0.5"
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm ml-auto" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border mb-4">
              <table className="w-full text-xs min-w-max">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-2 py-2 text-left font-semibold text-muted-foreground sticky left-0 bg-muted/50">Ano</th>
                    <th className="px-2 py-2 text-right font-semibold text-muted-foreground">Geração (kWh)</th>
                    <th className="px-2 py-2 text-right font-semibold text-muted-foreground">Consumo (kWh)</th>
                    <th className="px-2 py-2 text-right font-semibold text-muted-foreground">Créd. Acum. (kWh)</th>
                    <th className="px-2 py-2 text-right font-semibold text-muted-foreground">Compensação (kWh)</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 25 }, (_, i) => {
                    const ano = i + 1;
                    const consumo = parseFloat(d.consumoMensal) * 12 || 12000;
                    const degradacao = Math.pow(0.995, i);
                    const geracao = parseFloat(d.potCalculada) * 118 * 12 * ((100 - parseFloat(d.percPerdas)) / 100) * degradacao || 36000 * degradacao;
                    const saldo = geracao - consumo;
                    const compensacao = Math.min(geracao, consumo);
                    return (
                      <tr key={ano} className={cn("border-t border-border", ano === 3 ? "bg-primary/5 font-semibold" : "")}>
                        <td className="px-2 py-1.5 sticky left-0 bg-white dark:bg-card font-medium">{ano}</td>
                        <td className={cn("px-2 py-1.5 text-right", ano === 3 ? "text-primary" : "")}>{geracao.toFixed(2)}</td>
                        <td className={cn("px-2 py-1.5 text-right", ano === 3 ? "text-primary" : "")}>{consumo.toFixed(2)}</td>
                        <td className={cn("px-2 py-1.5 text-right", ano === 3 ? "text-primary" : "")}>{Math.max(0, saldo).toFixed(2)}</td>
                        <td className={cn("px-2 py-1.5 text-right", ano === 3 ? "text-primary" : "")}>{compensacao.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1 text-xs font-bold tracking-widest border-red-400 text-red-500 hover:bg-red-50">
                VOLTAR
              </Button>
              <Button data-testid="button-continuar-step4" className="flex-1 text-xs font-bold tracking-widest" onClick={() => setStep(5)}>
                CONTINUAR
              </Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <div className="text-center py-8">
              <Sun className="w-12 h-12 text-primary mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Adicione opções de financiamento para o cliente</p>
            </div>
            <Button variant="outline" className="w-full text-xs font-bold tracking-widest border-primary text-primary mb-3" onClick={() => toast({ title: "Financiamento em breve" })}>
              <Plus className="w-4 h-4 mr-2" /> FINANCIAMENTO
            </Button>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(4)} className="flex-1 text-xs font-bold tracking-widest border-red-400 text-red-500 hover:bg-red-50">
                VOLTAR
              </Button>
              <Button data-testid="button-continuar-step5" className="flex-1 text-xs font-bold tracking-widest" onClick={() => setStep(6)}>
                CONTINUAR
              </Button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div>
            <SectionTitle>Tema da Proposta</SectionTitle>
            <div className="flex flex-wrap gap-2 mb-4">
              {TEMAS.map(cor => (
                <button
                  key={cor}
                  data-testid={`tema-${cor}`}
                  className={cn("w-7 h-7 rounded-full border-2 transition-all", d.tema === cor ? "border-foreground scale-110" : "border-transparent")}
                  style={{ backgroundColor: cor }}
                  onClick={() => upd("tema", cor)}
                />
              ))}
            </div>

            <div className="border border-border rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: d.tema }}>
                  RS
                </div>
                <span className="font-bold text-foreground">RANDOLI SOLAR</span>
              </div>
              <div className="font-semibold mb-1" style={{ color: d.tema }}>Título da Seção</div>
              <p className="text-xs text-muted-foreground mb-3">Esta é uma prévia das cores que serão usadas na apresentação da proposta.</p>
              <div className="text-xs font-semibold mb-1" style={{ color: d.tema }}>Dimensão × Dimensão</div>
              <div className="text-xs text-muted-foreground mb-2">Prévia do design dos gráficos.</div>
              <div className="flex items-end gap-1 h-16">
                {[3, 7, 5, 4].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t" style={{ height: `${h * 10}px`, backgroundColor: d.tema }} />
                ))}
              </div>
            </div>

            <SectionTitle>Seções Extra</SectionTitle>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3].map(n => (
                <button key={n} className="w-9 h-9 border-2 border-border rounded font-semibold text-sm text-foreground hover:border-primary hover:text-primary transition-colors">{n}</button>
              ))}
            </div>

            <SectionTitle>Venda da Proposta</SectionTitle>
            <div className="mb-4">
              <FloatLabel label="Escolha de Venda">
                <select
                  className="w-full bg-transparent text-sm border-0 outline-none h-6"
                  value={d.vendaId}
                  onChange={e => upd("vendaId", e.target.value)}
                >
                  <option value="">Sem venda</option>
                  {(vendas || []).map(v => (
                    <option key={v.id} value={v.id}>Venda de {v.clienteNome}</option>
                  ))}
                </select>
              </FloatLabel>
            </div>

            <SectionTitle>Validade da Proposta</SectionTitle>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <FloatLabel label="Validade (dias)">
                <Input data-testid="input-validade-proposta" className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent" value={d.validade} onChange={e => upd("validade", e.target.value)} type="number" />
              </FloatLabel>
              <FloatLabel label="Data Válida">
                <Input className="border-0 p-0 h-6 text-sm focus-visible:ring-0 bg-transparent bg-muted/30" value={dataValidadeFmt()} readOnly />
              </FloatLabel>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                data-testid="button-gerar-proposta-final"
                className="w-full text-xs font-bold tracking-widest"
                onClick={gerarProposta}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "GERANDO..." : "GERAR PROPOSTA"}
              </Button>
              <Button variant="outline" onClick={() => setStep(5)} className="w-full text-xs font-bold tracking-widest border-red-400 text-red-500 hover:bg-red-50">
                VOLTAR
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
