import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { type Kit } from "@shared/schema";
import { Filter, Plus, Package, Pencil, Trash2, Search, ArrowLeft, Zap, Settings, CirclePlus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const TENSAO_OPTIONS = ["127 V", "220 V", "380 V", "127/220 V", "220/380 V"];
const FIXACAO_OPTIONS = [
  "Fibrocimento Est. Metálica",
  "Fibrocimento Est. Madeira",
  "Metálica Ondulada",
  "Mini Trilho",
  "Solo",
  "Cerâmica Est. Metálica",
  "Cerâmica Est. Madeira",
  "Laje",
];
const MONITORAMENTO_OPTIONS = ["Wi-Fi", "Bluetooth", "RS485", "Sem Monitoramento"];

const KIT_ICON_COLORS = [
  "bg-purple-500", "bg-primary", "bg-orange-500", "bg-green-500",
  "bg-pink-500", "bg-blue-500", "bg-teal-500", "bg-indigo-500",
];

interface Modulo {
  potencia: string;
  marca: string;
  qtd: string;
  peso: string;
  comprimento: string;
  largura: string;
  garDefeito: string;
  garEficiencia: string;
}

interface Inversor {
  marca: string;
  modelo: string;
  monitoramento: string;
  potencia: string;
  qtd: string;
  garantia: string;
  isMicroinversor: boolean;
}

interface Adicional {
  nome: string;
  fabricante: string;
  qtd: string;
  detalhe: string;
}

function defaultModulo(): Modulo {
  return { potencia: "", marca: "", qtd: "", peso: "", comprimento: "", largura: "", garDefeito: "10", garEficiencia: "25" };
}
function defaultInversor(): Inversor {
  return { marca: "", modelo: "", monitoramento: "Wi-Fi", potencia: "", qtd: "", garantia: "5", isMicroinversor: false };
}
function defaultAdicional(): Adicional {
  return { nome: "", fabricante: "", qtd: "", detalhe: "" };
}

function calcKwp(modulos: Modulo[]): string {
  const total = modulos.reduce((acc, m) => {
    const p = parseFloat(m.potencia) || 0;
    const q = parseInt(m.qtd) || 0;
    return acc + (p * q);
  }, 0);
  if (total === 0) return "0,00";
  return (total / 1000).toFixed(2).replace(".", ",");
}

function calcModulosTotal(modulos: Modulo[]): number {
  return modulos.reduce((acc, m) => acc + (parseInt(m.qtd) || 0), 0);
}
function calcInversoresTotal(inversores: Inversor[]): number {
  return inversores.reduce((acc, i) => acc + (parseInt(i.qtd) || 0), 0);
}

export default function KitsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editKit, setEditKit] = useState<Kit | null>(null);
  const { toast } = useToast();

  const [nomeKit, setNomeKit] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [valorKit, setValorKit] = useState("0,00");
  const [tensao, setTensao] = useState("220 V");
  const [tipoFixacao, setTipoFixacao] = useState("");
  const [modulos, setModulos] = useState<Modulo[]>([defaultModulo()]);
  const [inversores, setInversores] = useState<Inversor[]>([defaultInversor()]);
  const [adicionais, setAdicionais] = useState<Adicional[]>([defaultAdicional()]);

  const { data: kits, isLoading } = useQuery<Kit[]>({ queryKey: ["/api/kits"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/kits", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/kits"] }); closeForm(); toast({ title: "Kit cadastrado!" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/kits/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/kits"] }); closeForm(); toast({ title: "Kit atualizado!" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/kits/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/kits"] }); toast({ title: "Kit removido." }); },
  });

  const resetForm = () => {
    setNomeKit(""); setFornecedor(""); setValorKit("0,00"); setTensao("220 V"); setTipoFixacao("");
    setModulos([defaultModulo()]); setInversores([defaultInversor()]); setAdicionais([defaultAdicional()]);
  };

  const closeForm = () => { setShowForm(false); setEditKit(null); resetForm(); };

  const openNew = () => { resetForm(); setEditKit(null); setShowForm(true); };

  const openEdit = (k: Kit) => {
    setEditKit(k);
    setNomeKit(k.nome);
    setFornecedor((k as any).fornecedor ?? "");
    setValorKit(k.preco);
    setTensao(k.tensao);
    setTipoFixacao((k as any).tipoFixacao ?? k.estrutura);
    try { setModulos(JSON.parse((k as any).modulosData ?? "null") || [defaultModulo()]); } catch { setModulos([defaultModulo()]); }
    try { setInversores(JSON.parse((k as any).inversoresData ?? "null") || [defaultInversor()]); } catch { setInversores([defaultInversor()]); }
    try { setAdicionais(JSON.parse((k as any).adicionaisData ?? "null") || [defaultAdicional()]); } catch { setAdicionais([defaultAdicional()]); }
    setShowForm(true);
  };

  const handleSave = () => {
    if (!nomeKit.trim()) { toast({ title: "Informe o nome do kit", variant: "destructive" }); return; }
    const kwp = calcKwp(modulos);
    const modCount = calcModulosTotal(modulos);
    const invCount = calcInversoresTotal(inversores);
    const precoPorKwp = kwp !== "0,00"
      ? (parseFloat(valorKit.replace(/\./g, "").replace(",", ".")) / parseFloat(kwp.replace(",", "."))).toFixed(2).replace(".", ",")
      : "0,00";

    const data = {
      nome: nomeKit,
      kwp,
      preco: valorKit,
      precoPorKwp,
      tensao,
      estrutura: tipoFixacao || "—",
      modulos: modCount,
      inversores: invCount,
      fornecedor: fornecedor || null,
      tipoFixacao: tipoFixacao || null,
      modulosData: JSON.stringify(modulos),
      inversoresData: JSON.stringify(inversores),
      adicionaisData: JSON.stringify(adicionais),
    };

    if (editKit) updateMutation.mutate({ id: editKit.id, data });
    else createMutation.mutate(data);
  };

  const filtered = (kits ?? []).filter(k =>
    k.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateModulo = (i: number, field: keyof Modulo, val: string) => {
    setModulos(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  };
  const updateInversor = (i: number, field: keyof Inversor, val: any) => {
    setInversores(prev => prev.map((inv, idx) => idx === i ? { ...inv, [field]: val } : inv));
  };
  const updateAdicional = (i: number, field: keyof Adicional, val: string) => {
    setAdicionais(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a));
  };

  if (showForm) {
    const isPending = createMutation.isPending || updateMutation.isPending;
    return (
      <div className="min-h-full bg-background">
        <div className="sticky top-0 z-10 bg-white dark:bg-card border-b border-border px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={closeForm} className="gap-1 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
            <h2 className="font-semibold text-foreground">{editKit ? "Editar Kit" : "Registrar Kit"}</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={closeForm}>Cancelar</Button>
            <Button size="sm" data-testid="button-save-kit" onClick={handleSave} disabled={isPending}>
              {isPending ? "Salvando..." : editKit ? "Salvar Alterações" : "Registrar Kit"}
            </Button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
          <Card className="p-5 border border-card-border">
            <div className="space-y-1 mb-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Nome do Kit</label>
              <Input
                data-testid="input-nome-kit"
                placeholder="Ex: KIT DE 1000KW COM PAINEL T..."
                value={nomeKit}
                onChange={e => setNomeKit(e.target.value)}
              />
            </div>

            <h3 className="text-sm font-bold text-primary mb-3">Valor do Kit</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Input
                  data-testid="input-fornecedor"
                  placeholder="Fornecedor"
                  value={fornecedor}
                  onChange={e => setFornecedor(e.target.value)}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <Input
                  data-testid="input-valor-kit"
                  placeholder="0,00"
                  value={valorKit}
                  onChange={e => setValorKit(e.target.value)}
                  className="pl-10"
                />
                <span className="absolute -top-2 left-3 text-[10px] text-muted-foreground bg-white dark:bg-card px-0.5">Valor do Kit</span>
              </div>
            </div>

            <h3 className="text-sm font-bold text-primary mt-5 mb-3">Dados Adicionais</h3>
            <div className="grid grid-cols-2 gap-3">
              <Select value={tensao} onValueChange={setTensao}>
                <SelectTrigger data-testid="select-tensao">
                  <SelectValue placeholder="Tensão de Saída" />
                </SelectTrigger>
                <SelectContent>
                  {TENSAO_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={tipoFixacao} onValueChange={setTipoFixacao}>
                <SelectTrigger data-testid="select-fixacao">
                  <SelectValue placeholder="Tipo de Fixação" />
                </SelectTrigger>
                <SelectContent>
                  {FIXACAO_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="p-5 border border-card-border">
            <h3 className="text-sm font-bold text-primary mb-4">Módulos Fotovoltaicos</h3>
            <div className="space-y-5">
              {modulos.map((mod, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">Módulo {i + 1}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FloatInput label={`Potência Mód. ${i + 1}`} placeholder="Wp" value={mod.potencia} onChange={v => updateModulo(i, "potencia", v)} testId={`input-mod-potencia-${i}`} />
                    <FloatInput label={`Marca Mód. ${i + 1}`} placeholder="Marca" value={mod.marca} onChange={v => updateModulo(i, "marca", v)} testId={`input-mod-marca-${i}`} />
                    <FloatInput label={`Qtd. Mód. ${i + 1}`} placeholder="Qtd" value={mod.qtd} onChange={v => updateModulo(i, "qtd", v)} testId={`input-mod-qtd-${i}`} />
                    <FloatInput label={`Peso Mód. ${i + 1}`} placeholder="kg" value={mod.peso} onChange={v => updateModulo(i, "peso", v)} testId={`input-mod-peso-${i}`} />
                    <FloatInput label={`Comp. Mód. ${i + 1}`} placeholder="mm" value={mod.comprimento} onChange={v => updateModulo(i, "comprimento", v)} testId={`input-mod-comp-${i}`} />
                    <FloatInput label={`Larg. Mód. ${i + 1}`} placeholder="mm" value={mod.largura} onChange={v => updateModulo(i, "largura", v)} testId={`input-mod-larg-${i}`} />
                    <FloatInput label={`Gar. Def. Mód. ${i + 1}`} placeholder="Anos 10" value={mod.garDefeito} prefix="Anos" onChange={v => updateModulo(i, "garDefeito", v)} testId={`input-mod-gar-def-${i}`} />
                    <FloatInput label={`Gar. Efic. Mód. ${i + 1}`} placeholder="Anos 25" value={mod.garEficiencia} prefix="Anos" onChange={v => updateModulo(i, "garEficiencia", v)} testId={`input-mod-gar-ef-${i}`} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 pt-3 border-t border-border">
              <button
                type="button"
                data-testid="button-add-modulo"
                onClick={() => setModulos(prev => [...prev, defaultModulo()])}
                className="text-primary text-xs font-semibold hover:underline"
              >
                + MÓDULO
              </button>
              <button
                type="button"
                data-testid="button-remove-modulo"
                onClick={() => setModulos(prev => prev.length > 1 ? prev.slice(0, -1) : prev)}
                className="text-muted-foreground text-xs font-semibold hover:underline"
              >
                - MÓDULO
              </button>
            </div>
          </Card>

          <Card className="p-5 border border-card-border">
            <h3 className="text-sm font-bold text-primary mb-4">Inversores</h3>
            <div className="space-y-5">
              {inversores.map((inv, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                      <Settings className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">Inversor {i + 1}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FloatInput label={`Marca Inv. ${i + 1}`} placeholder="Marca" value={inv.marca} onChange={v => updateInversor(i, "marca", v)} testId={`input-inv-marca-${i}`} />
                    <FloatInput label={`Modelo Inv. ${i + 1}`} placeholder="Modelo" value={inv.modelo} onChange={v => updateInversor(i, "modelo", v)} testId={`input-inv-modelo-${i}`} />
                    <div className="space-y-1 relative">
                      <span className="absolute -top-2 left-3 text-[10px] text-muted-foreground bg-white dark:bg-card px-0.5 z-10">
                        Monitoramento {i + 1}
                      </span>
                      <Select value={inv.monitoramento} onValueChange={v => updateInversor(i, "monitoramento", v)}>
                        <SelectTrigger data-testid={`select-monitoramento-${i}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONITORAMENTO_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <FloatInput label={`Potência Inv. ${i + 1}`} placeholder="W" value={inv.potencia} onChange={v => updateInversor(i, "potencia", v)} testId={`input-inv-potencia-${i}`} />
                    <FloatInput label={`Qtd. Inv. ${i + 1}`} placeholder="Qtd" value={inv.qtd} onChange={v => updateInversor(i, "qtd", v)} testId={`input-inv-qtd-${i}`} />
                    <FloatInput label={`Garantia Inv. ${i + 1}`} placeholder="Anos 5" prefix="Anos" value={inv.garantia} onChange={v => updateInversor(i, "garantia", v)} testId={`input-inv-garantia-${i}`} />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Checkbox
                      id={`microinversor-${i}`}
                      checked={inv.isMicroinversor}
                      onCheckedChange={v => updateInversor(i, "isMicroinversor", !!v)}
                      data-testid={`checkbox-microinversor-${i}`}
                    />
                    <Label htmlFor={`microinversor-${i}`} className="text-xs text-muted-foreground cursor-pointer">
                      Microinversor {i + 1}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 pt-3 border-t border-border">
              <button
                type="button"
                data-testid="button-add-inversor"
                onClick={() => setInversores(prev => [...prev, defaultInversor()])}
                className="text-primary text-xs font-semibold hover:underline"
              >
                + INVERSOR
              </button>
              <button
                type="button"
                data-testid="button-remove-inversor"
                onClick={() => setInversores(prev => prev.length > 1 ? prev.slice(0, -1) : prev)}
                className="text-muted-foreground text-xs font-semibold hover:underline"
              >
                - INVERSOR
              </button>
            </div>
          </Card>

          <Card className="p-5 border border-card-border">
            <h3 className="text-sm font-bold text-primary mb-4">Itens Complementares</h3>
            <div className="space-y-5">
              {adicionais.map((adc, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                      <CirclePlus className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">Item {i + 1}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FloatInput label={`Nome/Descrição ${i + 1}`} placeholder="Nome do item" value={adc.nome} onChange={v => updateAdicional(i, "nome", v)} testId={`input-adc-nome-${i}`} />
                    <FloatInput label={`Fabricante ${i + 1}`} placeholder="Fabricante" value={adc.fabricante} onChange={v => updateAdicional(i, "fabricante", v)} testId={`input-adc-fab-${i}`} />
                    <FloatInput label={`Qtd. ${i + 1}`} placeholder="Qtd" value={adc.qtd} onChange={v => updateAdicional(i, "qtd", v)} testId={`input-adc-qtd-${i}`} />
                    <FloatInput label={`Detalhe ${i + 1}`} placeholder="Detalhe" value={adc.detalhe} onChange={v => updateAdicional(i, "detalhe", v)} testId={`input-adc-det-${i}`} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 pt-3 border-t border-border">
              <button
                type="button"
                data-testid="button-add-adicional"
                onClick={() => setAdicionais(prev => [...prev, defaultAdicional()])}
                className="text-primary text-xs font-semibold hover:underline"
              >
                + ITEM
              </button>
              <button
                type="button"
                data-testid="button-remove-adicional"
                onClick={() => setAdicionais(prev => prev.length > 1 ? prev.slice(0, -1) : prev)}
                className="text-muted-foreground text-xs font-semibold hover:underline"
              >
                - ITEM
              </button>
            </div>
          </Card>

          <div className="flex gap-3 pb-8">
            <Button variant="outline" className="flex-1" onClick={closeForm}>Cancelar</Button>
            <Button className="flex-1" data-testid="button-save-kit-bottom" onClick={handleSave} disabled={isPending}>
              {isPending ? "Salvando..." : editKit ? "Salvar Alterações" : "Registrar Kit"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-2 text-xs font-semibold" data-testid="button-filtros-kits">
          <Filter className="w-3.5 h-3.5" /> Filtros
        </Button>
        <div className="w-4 h-4 border-2 border-border rounded" />
        <div className="flex-1" />
        <Button onClick={openNew} size="sm" className="gap-1 text-xs font-bold" data-testid="button-registrar-kit">
          <Plus className="w-3.5 h-3.5" /> REGISTRAR KIT
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-white dark:bg-card border border-border rounded-md px-3 py-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar kit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 p-0 h-auto focus-visible:ring-0 bg-transparent text-sm"
          data-testid="input-search-kits"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(9)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Package className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhum kit encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((kit, idx) => {
            const colorClass = KIT_ICON_COLORS[idx % KIT_ICON_COLORS.length];
            return (
              <Card key={kit.id} data-testid={`card-kit-${kit.id}`} className="p-3 border border-card-border">
                <div className="flex items-start gap-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded ${colorClass} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground leading-tight truncate">{kit.nome}</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{kit.kwp} kWp</p>
                      <p className="text-sm font-semibold text-foreground">R$ {kit.preco}</p>
                      <p className="text-xs text-muted-foreground">R$ {kit.precoPorKwp} / kWp</p>
                      <p className="text-xs text-muted-foreground">{kit.tensao} | {kit.estrutura}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(kit)} data-testid={`button-edit-kit-${kit.id}`} className="text-muted-foreground hover:text-primary transition-colors p-0.5">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border">
                  <button onClick={() => openEdit(kit)} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                    <Pencil className="w-3 h-3" /> Editar
                  </button>
                  <button onClick={() => deleteMutation.mutate(kit.id)} data-testid={`button-delete-kit-${kit.id}`} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FloatInput({ label, placeholder, value, onChange, prefix, testId }: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; prefix?: string; testId?: string;
}) {
  return (
    <div className="relative">
      <span className="absolute -top-2 left-3 text-[10px] text-muted-foreground bg-white dark:bg-card px-0.5 z-10">
        {label}
      </span>
      <div className="flex">
        {prefix && (
          <span className="flex items-center px-2 text-xs text-muted-foreground border border-r-0 border-input rounded-l-md bg-muted/40">
            {prefix}
          </span>
        )}
        <Input
          data-testid={testId}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={prefix ? "rounded-l-none" : ""}
        />
      </div>
    </div>
  );
}
