import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Printer, ArrowLeft, CheckCircle2, Sun, Zap, BarChart3, TrendingUp, FileText, KanbanSquare, Download, AlertCircle, FileSignature, Pencil } from "lucide-react";
import type { Proposta, Kit, Contrato } from "@shared/schema";
import { cn } from "@/lib/utils";
import logoPath from "@/assets/randoli-solar-logo.png";
import { useState } from "react";

export default function PropostaView() {
  const [, params] = useRoute("/proposta/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const id = params?.id;

  const [showContratoDialog, setShowContratoDialog] = useState(false);
  const [selectedContratoId, setSelectedContratoId] = useState("");
  const [gerandoContrato, setGerandoContrato] = useState(false);

  const { data: proposta, isLoading } = useQuery<Proposta>({
    queryKey: ["/api/propostas", id],
    enabled: !!id,
  });

  const { data: kit } = useQuery<Kit>({
    queryKey: ["/api/kits", proposta?.kitId],
    enabled: !!proposta?.kitId,
  });

  const { data: contratos } = useQuery<Contrato[]>({
    queryKey: ["/api/contratos"],
    enabled: showContratoDialog,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Proposta>) => apiRequest("PATCH", `/api/propostas/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/propostas", id] }),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!proposta) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <FileText className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-4">Proposta não encontrada</p>
        <Button onClick={() => navigate("/propostas")}>Voltar às Propostas</Button>
      </div>
    );
  }

  const cor = proposta.tema || "#0d9488";
  const kwp = parseFloat(proposta.kwp) || 0;
  const consumoMensal = parseFloat(proposta.consumoMensal || "1000") || 1000;
  const percPerdas = parseFloat(proposta.percPerdas || "25") || 25;
  const geracaoMensal = (kwp * 118 * ((100 - percPerdas) / 100)).toFixed(0);
  const geracaoAnual = (parseFloat(geracaoMensal) * 12).toFixed(0);
  const parseBRL = (v: string | null | undefined) => parseFloat((v || "0").replace(/\./g, "").replace(",", ".")) || 0;
  const totalFinalNum = parseBRL(proposta.totalFinal);
  const valorKwhNum = parseFloat((proposta.valorKwh || "0.5").replace(",", ".")) || 0.5;
  const geracaoAnualNum = parseFloat(geracaoAnual) || 1;
  const fatorRetorno = totalFinalNum > 0 ? Math.ceil(totalFinalNum / (valorKwhNum * geracaoAnualNum) * 12) : 0;

  const modulosData = (() => { try { return JSON.parse(kit?.modulosData || "[]"); } catch { return []; } })();
  const inversoresData = (() => { try { return JSON.parse(kit?.inversoresData || "[]"); } catch { return []; } })();

  const handlePrint = () => {
    updateMutation.mutate({ visualizacoes: (proposta.visualizacoes || 0) + 1 });
    window.print();
  };

  const contratoSelecionado = contratos?.find(c => c.id === selectedContratoId);

  const handleGerarContrato = async () => {
    if (!selectedContratoId) return;
    if (!(contratoSelecionado as any)?.templateData) {
      toast({ title: "Modelo sem arquivo Word", description: "Acesse Contratos e faça o upload do .docx para este modelo.", variant: "destructive" });
      return;
    }
    setGerandoContrato(true);
    try {
      const res = await fetch(`/api/contratos/${selectedContratoId}/gerar-proposta/${id}`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';\r\n]+)/i);
      const filename = match ? decodeURIComponent(match[1].replace(/^["']|["']$/g, "")) : `Contrato_${proposta.clienteNome}.docx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Contrato gerado com sucesso!", description: `Arquivo: ${filename}` });
      setShowContratoDialog(false);
      setSelectedContratoId("");
    } catch (err: any) {
      toast({ title: "Erro ao gerar contrato", description: err.message, variant: "destructive" });
    } finally {
      setGerandoContrato(false);
    }
  };

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto p-4 pb-16">
        <div className="flex items-center justify-between mb-4 no-print">
          <Button variant="ghost" size="sm" onClick={() => navigate("/propostas")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className="text-xs text-muted-foreground">{proposta.visualizacoes ?? 0} visualização(ões)</span>
            {proposta.vendaId && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/vendas?highlight=${proposta.vendaId}`)}
                data-testid="button-ver-funil"
                className="gap-1"
              >
                <KanbanSquare className="w-4 h-4" /> Ver no Funil
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/propostas/nova?edit=${id}`)}
              data-testid="button-editar-proposta"
              className="gap-1"
            >
              <Pencil className="w-4 h-4" /> Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowContratoDialog(true)}
              data-testid="button-gerar-contrato"
              className="gap-1"
            >
              <FileSignature className="w-4 h-4" /> Gerar Contrato
            </Button>
            <Button size="sm" onClick={handlePrint} data-testid="button-imprimir-proposta">
              <Printer className="w-4 h-4 mr-1" /> Imprimir / PDF
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="p-6" style={{ borderTop: `6px solid ${cor}` }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gray-950 rounded-lg p-1">
                  <img src={logoPath} alt="Randoli Solar" className="h-12 w-auto object-contain" />
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Proposta nº</div>
                <div className="font-bold text-foreground">{id?.slice(0, 8).toUpperCase()}</div>
                <div className="text-xs text-muted-foreground mt-1">Válida até: {proposta.dataValidade || "—"}</div>
              </div>
            </div>

            <div className="mb-6 p-4 rounded-lg bg-muted/30">
              <div className="font-bold text-foreground text-lg">{proposta.clienteNome}</div>
              {proposta.email && <div className="text-sm text-muted-foreground">{proposta.email}</div>}
              {(proposta.cidade || proposta.uf) && <div className="text-sm text-muted-foreground">{proposta.cidade}{proposta.cidade && proposta.uf ? " - " : ""}{proposta.uf}</div>}
              {proposta.endereco && <div className="text-sm text-muted-foreground">{proposta.endereco}</div>}
            </div>

            <h2 className="text-base font-bold mb-3" style={{ color: cor }}>Resumo do Sistema</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { icon: <Zap className="w-5 h-5" />, label: "Potência", value: `${proposta.kwp} kWp` },
                { icon: <Sun className="w-5 h-5" />, label: "Geração Mensal", value: `${geracaoMensal} kWh` },
                { icon: <BarChart3 className="w-5 h-5" />, label: "Geração Anual", value: `${geracaoAnual} kWh` },
                { icon: <TrendingUp className="w-5 h-5" />, label: "Retorno Aprox.", value: `${fatorRetorno > 0 ? `${Math.floor(fatorRetorno / 12)} a ${fatorRetorno % 12} m` : "—"}` },
              ].map(({ icon, label, value }, i) => (
                <div key={i} className="flex flex-col items-center p-3 rounded-lg border border-border text-center">
                  <div style={{ color: cor }}>{icon}</div>
                  <div className="text-xs text-muted-foreground mt-1">{label}</div>
                  <div className="font-bold text-foreground text-sm mt-0.5">{value}</div>
                </div>
              ))}
            </div>

            {proposta.kitNome && (
              <>
                <h2 className="text-base font-bold mb-3" style={{ color: cor }}>Kit Fotovoltaico</h2>
                <div className="p-4 rounded-lg border border-border mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{proposta.kitNome}</div>
                      <div className="text-xs text-muted-foreground">{proposta.kwp} kWp</div>
                    </div>
                  </div>
                  {modulosData.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Módulos Fotovoltaicos</div>
                      {modulosData.map((m: { potencia?: string; marca?: string; qtd?: string; garantiaEfic?: string }, i: number) => (
                        <div key={i} className="text-sm text-foreground flex gap-4 py-1 border-b border-border last:border-0">
                          <span className="font-medium">{m.marca || "—"}</span>
                          <span className="text-muted-foreground">{m.potencia} Wp</span>
                          <span className="text-muted-foreground">Qtd: {m.qtd}</span>
                          {m.garantiaEfic && <span className="text-muted-foreground">Gar: {m.garantiaEfic} anos</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {inversoresData.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Inversores</div>
                      {inversoresData.map((inv: { marca?: string; modelo?: string; qtd?: string; garantia?: string }, i: number) => (
                        <div key={i} className="text-sm text-foreground flex gap-4 py-1 border-b border-border last:border-0">
                          <span className="font-medium">{inv.marca || "—"}</span>
                          <span className="text-muted-foreground">{inv.modelo}</span>
                          <span className="text-muted-foreground">Qtd: {inv.qtd}</span>
                          {inv.garantia && <span className="text-muted-foreground">Gar: {inv.garantia} anos</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <h2 className="text-base font-bold mb-3" style={{ color: cor }}>Dados da Unidade Consumidora</h2>
            <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
              {[
                { label: "Concessionária", value: proposta.concessionaria },
                { label: "Modalidade Tarifária", value: proposta.modalidadeTarifaria },
                { label: "Consumo Mensal Médio", value: proposta.consumoMensal ? `${proposta.consumoMensal} kWh` : null },
                { label: "Valor do kWh", value: proposta.valorKwh ? `R$ ${proposta.valorKwh}` : null },
                { label: "Rede", value: proposta.rede },
                { label: "Tipo UC", value: proposta.tipoUc },
              ].filter(x => x.value).map(({ label, value }, i) => (
                <div key={i}>
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="font-medium text-foreground">{value}</div>
                </div>
              ))}
            </div>

            <h2 className="text-base font-bold mb-3" style={{ color: cor }}>Análise Financeira – 25 Anos</h2>
            <div className="overflow-x-auto rounded-lg border border-border mb-6">
              <table className="w-full text-xs min-w-max">
                <thead>
                  <tr className="border-b border-border" style={{ backgroundColor: `${cor}15` }}>
                    <th className="px-2 py-2 text-left font-semibold" style={{ color: cor }}>Ano</th>
                    <th className="px-2 py-2 text-right font-semibold" style={{ color: cor }}>Geração (kWh)</th>
                    <th className="px-2 py-2 text-right font-semibold" style={{ color: cor }}>Consumo (kWh)</th>
                    <th className="px-2 py-2 text-right font-semibold" style={{ color: cor }}>Compensação (kWh)</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 25 }, (_, i) => {
                    const ano = i + 1;
                    const consumo = consumoMensal * 12;
                    const degradacao = Math.pow(0.995, i);
                    const geracao = kwp * 118 * 12 * ((100 - percPerdas) / 100) * degradacao;
                    const compensacao = Math.min(geracao, consumo);
                    return (
                      <tr key={ano} className={cn("border-t border-border", ano % 2 === 0 ? "bg-muted/20" : "")}>
                        <td className="px-2 py-1 font-medium">{ano}</td>
                        <td className="px-2 py-1 text-right">{geracao.toFixed(2)}</td>
                        <td className="px-2 py-1 text-right">{consumo.toFixed(2)}</td>
                        <td className="px-2 py-1 text-right">{compensacao.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {proposta.condicoesPagamento && (
              <>
                <h2 className="text-base font-bold mb-3" style={{ color: cor }}>Condições de Pagamento</h2>
                <div className="p-4 rounded-lg border border-border mb-6 whitespace-pre-wrap text-sm text-foreground">
                  {proposta.condicoesPagamento}
                </div>
              </>
            )}

            <div className="p-4 rounded-lg mb-4 text-center" style={{ backgroundColor: `${cor}15`, borderTop: `3px solid ${cor}` }}>
              <div className="text-xs text-muted-foreground mb-1">INVESTIMENTO TOTAL</div>
              <div className="text-3xl font-bold" style={{ color: cor }}>R$ {proposta.totalFinal || proposta.valor}</div>
              {kwp > 0 && totalFinalNum > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  R$ {(totalFinalNum / kwp).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/kWp
                </div>
              )}
            </div>

            <div className="text-center text-xs text-muted-foreground space-y-1">
              <div className="flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span>Proposta válida por {proposta.validade || 15} dias até {proposta.dataValidade || "—"}</span>
              </div>
              <div>RANDOLI SOLAR · Sinop - MT · (66) 99239-7086 · randolisolar.com.br</div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4 no-print">
          <Button variant="outline" className="flex-1" onClick={() => navigate("/propostas")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Minhas Propostas
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setShowContratoDialog(true)}>
            <FileSignature className="w-4 h-4 mr-1" /> Gerar Contrato
          </Button>
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1" /> Imprimir / PDF
          </Button>
        </div>
      </div>

      <Dialog open={showContratoDialog} onOpenChange={(open) => { setShowContratoDialog(open); if (!open) setSelectedContratoId(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-primary" />
              Gerar Contrato — {proposta.clienteNome}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecione um modelo de contrato Word (.docx). O sistema preencherá automaticamente os dados do cliente e da proposta.
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium">Modelo de contrato</label>
                <Select value={selectedContratoId} onValueChange={setSelectedContratoId}>
                  <SelectTrigger data-testid="select-contrato-proposta">
                    <SelectValue placeholder="Selecione um modelo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(contratos ?? []).length === 0 && (
                      <SelectItem value="_none" disabled>Nenhum modelo cadastrado</SelectItem>
                    )}
                    {(contratos ?? []).map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">
                          {(c as any).templateData
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            : <AlertCircle className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                          {c.nome}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedContratoId && contratoSelecionado && (
                (contratoSelecionado as any).templateData ? (
                  <div className="flex items-center gap-1.5 text-xs text-green-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Arquivo: <strong>{(contratoSelecionado as any).templateNome}</strong></span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-orange-500">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Este modelo não tem arquivo .docx. Vá em <strong>Contratos</strong> e clique em <strong>Anexar Word</strong>.</span>
                  </div>
                )
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setShowContratoDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1 gap-2"
                  data-testid="button-confirmar-contrato"
                  disabled={!selectedContratoId || gerandoContrato}
                  onClick={handleGerarContrato}
                >
                  {gerandoContrato ? "Gerando..." : <><Download className="w-4 h-4" /> Gerar e Baixar</>}
                </Button>
              </div>
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
