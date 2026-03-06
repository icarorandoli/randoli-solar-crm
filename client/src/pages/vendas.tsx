import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertVendaSchema, type Venda, type InsertVenda, type Contrato } from "@shared/schema";
import { z } from "zod";
import { Plus, Filter, MoreHorizontal, FileText, X, DollarSign, Download, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const FUNIL_COLUMNS = [
  { id: "objetivo do cliente", label: "objetivo do cliente" },
  { id: "solicitar a conta de luz", label: "solicitar a conta de luz" },
  { id: "envio de proposta", label: "envio de proposta" },
  { id: "Aguardando Entrega dos Materiais", label: "Aguardando Entrega dos Materiais" },
  { id: "Instalação", label: "Instalação" },
  { id: "Finalizado", label: "Finalizado" },
];

const formSchema = insertVendaSchema.extend({ valor: z.string().min(1), kwp: z.string().min(1) });

export default function VendasPage() {
  const [selectedVenda, setSelectedVenda] = useState<Venda | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedContratoId, setSelectedContratoId] = useState<string>("");
  const [gerandoContrato, setGerandoContrato] = useState(false);
  const { toast } = useToast();

  const { data: vendas, isLoading } = useQuery<Venda[]>({ queryKey: ["/api/vendas"] });
  const { data: contratos } = useQuery<Contrato[]>({ queryKey: ["/api/contratos"] });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { clienteNome: "", valor: "", kwp: "", status: "objetivo do cliente", proprietario: "GERENTE" },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertVenda) => apiRequest("POST", "/api/vendas", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/vendas"] }); setShowNewForm(false); form.reset(); toast({ title: "Venda criada!" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertVenda> }) => apiRequest("PATCH", `/api/vendas/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/vendas"] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/vendas/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/vendas"] }); setSelectedVenda(null); toast({ title: "Venda removida." }); },
  });

  const handleGerarContrato = async () => {
    if (!selectedVenda || !selectedContratoId) return;
    const contrato = contratos?.find(c => c.id === selectedContratoId);
    if (!contrato) return;
    if (!(contrato as any).templateData) {
      toast({ title: "Modelo sem arquivo Word", description: "Acesse Contratos e faça o upload do arquivo .docx para este modelo.", variant: "destructive" });
      return;
    }
    setGerandoContrato(true);
    try {
      const res = await fetch(`/api/contratos/${selectedContratoId}/gerar/${selectedVenda.id}`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';\r\n]+)/i);
      const filename = match ? decodeURIComponent(match[1].replace(/^["']|["']$/g, "")) : `Contrato_${selectedVenda.clienteNome}.docx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Contrato gerado com sucesso!", description: `Arquivo: ${filename}` });
    } catch (err: any) {
      toast({ title: "Erro ao gerar contrato", description: err.message, variant: "destructive" });
    } finally {
      setGerandoContrato(false);
    }
  };

  const getColumnVendas = (col: string) => (vendas ?? []).filter(v => v.status === col);
  const getColumnTotal = (col: string) => {
    const items = getColumnVendas(col);
    const total = items.reduce((acc, v) => acc + parseFloat(v.valor.replace(/\./g, "").replace(",", ".")), 0);
    return { count: items.length, total: total.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) };
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => createMutation.mutate(data as InsertVenda);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border bg-white dark:bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-xs font-semibold" data-testid="button-filtros-vendas">
            <Filter className="w-3.5 h-3.5" /> Filtros
          </Button>
          <div className="w-5 h-5 border-2 border-border rounded" />
        </div>
        <Button onClick={() => setShowNewForm(true)} size="sm" className="gap-1 text-xs font-bold" data-testid="button-nova-venda">
          <Plus className="w-3.5 h-3.5" /> NOVA VENDA
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto kanban-scroll p-4">
        {isLoading ? (
          <div className="flex gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="w-64 h-96 shrink-0" />)}
          </div>
        ) : (
          <div className="flex gap-4 min-w-max pb-4">
            {FUNIL_COLUMNS.map(col => {
              const { count, total } = getColumnTotal(col.id);
              const items = getColumnVendas(col.id);
              return (
                <div key={col.id} className="w-64 shrink-0 flex flex-col gap-2">
                  <div className="bg-primary text-white rounded-t-md px-3 py-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide truncate">{col.label}</span>
                    <button className="ml-2 opacity-70 hover:opacity-100"><MoreHorizontal className="w-4 h-4" /></button>
                  </div>
                  <div className="bg-white dark:bg-card border border-border rounded-b-md px-3 py-2 mb-1">
                    <p className="text-xs text-muted-foreground">Vendas: <span className="font-bold text-foreground">{count}</span></p>
                    <p className="text-xs text-muted-foreground">Valor Total: <span className="font-bold text-foreground">R${total}</span></p>
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    {items.map(v => (
                      <Card
                        key={v.id}
                        data-testid={`card-venda-${v.id}`}
                        className="p-3 border border-card-border cursor-pointer hover:border-primary/40 transition-colors"
                        onClick={() => { setSelectedVenda(v); setSelectedContratoId(""); }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex gap-1">
                            <button className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-primary"><FileText className="w-3 h-3" /></button>
                            <button className="w-5 h-5 rounded bg-destructive/10 flex items-center justify-center text-destructive"><X className="w-3 h-3" /></button>
                          </div>
                          <div className="flex gap-1">
                            <button className="text-muted-foreground"><FileText className="w-3.5 h-3.5" /></button>
                            <button className="text-muted-foreground"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-foreground leading-tight">Venda de {v.clienteNome}</p>
                        <p className="text-sm font-bold text-destructive mt-0.5">R${v.valor}</p>
                        <p className="text-xs text-muted-foreground">{v.kwp} kWp</p>
                        <p className="text-xs font-semibold text-foreground uppercase mt-0.5">{v.proprietario}</p>
                      </Card>
                    ))}
                    {items.length === 0 && (
                      <div className="border-2 border-dashed border-border rounded-md p-4 text-center">
                        <p className="text-xs text-muted-foreground">Sem vendas</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedVenda && (
        <Dialog open={!!selectedVenda} onOpenChange={() => setSelectedVenda(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <DialogTitle className="text-base font-bold">Venda de {selectedVenda.clienteNome}</DialogTitle>
                <div className="flex gap-1">
                  <button className="p-1 rounded bg-primary/10 text-primary"><DollarSign className="w-4 h-4" /></button>
                  <button className="p-1 rounded bg-muted text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
              </div>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1">
                <h3 className="font-semibold text-sm text-foreground mb-3">Informações</h3>
                <div className="space-y-2 text-sm">
                  <InfoRow label="Valor" value={`R$ ${selectedVenda.valor}`} />
                  <InfoRow label="Temperatura" value={selectedVenda.temperatura ?? "—"} />
                  <InfoRow label="Cliente" value={selectedVenda.clienteNome} highlight />
                  <InfoRow label="E-mail" value={selectedVenda.email ?? "—"} />
                  <InfoRow label="Telefone" value={selectedVenda.telefone ?? "—"} />
                  <InfoRow label="CPF" value={selectedVenda.cpf ?? "—"} />
                  <InfoRow label="Cidade" value={selectedVenda.cidade ?? "—"} />
                  <InfoRow label="Endereço" value={selectedVenda.endereco ?? "—"} />
                  <InfoRow label="Potência" value={`${selectedVenda.potencia} kWp`} />
                  <InfoRow label="Módulos" value={`${selectedVenda.modulos} Módulo(s)`} />
                  <InfoRow label="Inversores" value={`${selectedVenda.inversores} Inversor(es)`} />
                  <InfoRow label="Distância" value={`${selectedVenda.distancia} km`} />
                  <InfoRow label="Proprietários" value={selectedVenda.proprietario} />
                  <InfoRow label="Validade" value={selectedVenda.validade ?? "—"} />
                  <InfoRow label="Registro" value={selectedVenda.createdAt} />
                </div>
              </div>
              <div className="col-span-2">
                <Tabs defaultValue="notas">
                  <TabsList className="h-auto bg-transparent p-0 gap-0 border-b border-border w-full justify-start rounded-none">
                    {["NOTAS", "PROPOSTAS", "CONTRATOS", "ARQUIVOS", "FINANCIAMENTOS", "HISTÓRICO"].map(t => (
                      <TabsTrigger key={t} value={t.toLowerCase()} data-testid={`tab-venda-${t.toLowerCase()}`} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-3 py-2 text-xs font-bold tracking-wider bg-transparent">
                        {t}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {["notas", "propostas", "arquivos", "financiamentos", "histórico"].map(t => (
                    <TabsContent key={t} value={t} className="mt-4">
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                          <FileText className="w-7 h-7 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">Nenhum {t} registrado</p>
                      </div>
                    </TabsContent>
                  ))}

                  <TabsContent value="contratos" className="mt-4">
                    <div className="space-y-4">
                      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-foreground">Gerar Contrato Automático</h4>
                        <p className="text-xs text-muted-foreground">
                          Selecione um modelo de contrato com arquivo Word (.docx) anexado. O sistema irá preencher automaticamente as tags com os dados desta venda e do cliente.
                        </p>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-foreground">Selecionar modelo de contrato</label>
                          <Select
                            value={selectedContratoId}
                            onValueChange={setSelectedContratoId}
                          >
                            <SelectTrigger data-testid="select-contrato" className="text-sm">
                              <SelectValue placeholder="Selecione um modelo..." />
                            </SelectTrigger>
                            <SelectContent>
                              {(contratos ?? []).map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                  <span className="flex items-center gap-2">
                                    {(c as any).templateData ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                    ) : (
                                      <AlertCircle className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                    )}
                                    {c.nome}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedContratoId && (() => {
                          const c = contratos?.find(x => x.id === selectedContratoId);
                          if (!c) return null;
                          return (c as any).templateData ? (
                            <div className="flex items-center gap-1.5 text-xs text-green-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Arquivo Word anexado: <strong>{(c as any).templateNome}</strong></span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-orange-500">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Este modelo não possui arquivo Word. Vá em <strong>Contratos</strong> e clique em <strong>Anexar Word</strong>.</span>
                            </div>
                          );
                        })()}

                        <Button
                          className="w-full gap-2"
                          data-testid="button-gerar-contrato"
                          disabled={!selectedContratoId || gerandoContrato}
                          onClick={handleGerarContrato}
                        >
                          {gerandoContrato ? (
                            <>Gerando...</>
                          ) : (
                            <><Download className="w-4 h-4" /> GERAR CONTRATO</>
                          )}
                        </Button>
                      </div>

                      <div className="border-t border-border pt-3">
                        <p className="text-xs text-muted-foreground text-center">
                          Os dados preenchidos automaticamente incluem: dados do cliente, valor da venda, potência do sistema, data de geração e demais tags disponíveis.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-border">
              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(selectedVenda.id)} disabled={deleteMutation.isPending}>
                Excluir venda
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Venda</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField control={form.control} name="clienteNome" render={({ field }) => (
                <FormItem><FormLabel>Nome do Cliente *</FormLabel><FormControl><Input placeholder="Nome do cliente" data-testid="input-cliente-venda" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="valor" render={({ field }) => (
                  <FormItem><FormLabel>Valor (R$) *</FormLabel><FormControl><Input placeholder="0,00" data-testid="input-valor-venda" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="kwp" render={({ field }) => (
                  <FormItem><FormLabel>kWp *</FormLabel><FormControl><Input placeholder="0,00" data-testid="input-kwp-venda" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowNewForm(false)}>Cancelar</Button>
                <Button type="submit" className="flex-1" data-testid="button-submit-venda" disabled={createMutation.isPending}>Criar Venda</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex gap-1">
      <span className="text-muted-foreground w-28 shrink-0">{label}</span>
      <span className={cn("font-medium", highlight ? "text-primary" : "text-foreground")}>{value}</span>
    </div>
  );
}
