import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Proposta, AgendaItem, Venda } from "@shared/schema";
import { Building2, Users, FileText, Filter, CalendarDays } from "lucide-react";
import { Link } from "wouter";

export default function HomePage() {
  const { data: propostas, isLoading: loadingPropostas } = useQuery<Proposta[]>({ queryKey: ["/api/propostas"] });
  const { data: agendaItems, isLoading: loadingAgenda } = useQuery<AgendaItem[]>({ queryKey: ["/api/agenda"] });
  const { data: vendas, isLoading: loadingVendas } = useQuery<Venda[]>({ queryKey: ["/api/vendas"] });
  const { data: stats } = useQuery<{ totalClientes: number; totalPropostas: number; totalVendas: number; totalVendasValor: string }>({ queryKey: ["/api/stats"] });

  const statusColor: Record<string, string> = {
    ABERTO: "bg-primary text-white",
    PERDIDO: "bg-muted text-muted-foreground",
    GANHO: "bg-green-500 text-white",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 border border-card-border">
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-4 border-primary/20 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-medium tracking-widest uppercase mb-0.5">Empresa</p>
              <p className="font-semibold text-foreground">icaro@randolisolar.com.br</p>
            </div>
            <div className="flex gap-6 w-full justify-center border-t border-border pt-4">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">Clientes:</span>
                <span className="font-bold text-primary">{stats?.totalClientes ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">Propostas:</span>
                <span className="font-bold text-primary">{stats?.totalPropostas ?? "—"}</span>
              </div>
            </div>
            <Button className="w-full" variant="default" data-testid="button-filtros" asChild>
              <Link href="/vendas">
                <Filter className="w-4 h-4 mr-2" />
                FILTROS
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-0 border border-card-border lg:col-span-2 overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground text-sm">Últimas Propostas Visualizadas</h2>
          </div>
          <div className="overflow-auto max-h-72">
            {loadingPropostas ? (
              <div className="p-4 space-y-3">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {(propostas ?? []).map((p) => (
                    <tr key={p.id} data-testid={`row-proposta-${p.id}`} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground">{p.clienteNome}</td>
                      <td className="px-4 py-2.5 text-foreground font-semibold">R$ {p.valor}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-3 py-0.5 rounded text-xs font-bold tracking-wider ${statusColor[p.status] ?? "bg-muted text-muted-foreground"}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs whitespace-nowrap">{p.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      <Card className="border border-card-border">
        <Tabs defaultValue="agenda">
          <div className="border-b border-border px-4">
            <TabsList className="h-auto bg-transparent p-0 gap-0">
              <TabsTrigger value="agenda" data-testid="tab-agenda" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-4 py-3 text-xs font-semibold tracking-widest uppercase bg-transparent">
                AGENDA
              </TabsTrigger>
              <TabsTrigger value="vendas" data-testid="tab-vendas" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-4 py-3 text-xs font-semibold tracking-widest uppercase bg-transparent">
                VENDAS
              </TabsTrigger>
              <TabsTrigger value="financiamentos" data-testid="tab-financiamentos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-4 py-3 text-xs font-semibold tracking-widest uppercase bg-transparent">
                FINANCIAMENTOS
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="agenda" className="p-6 m-0">
            <h3 className="font-semibold text-sm text-foreground mb-4">Próximos Itens da Agenda</h3>
            {loadingAgenda ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : agendaItems && agendaItems.length > 0 ? (
              <div className="space-y-3">
                {agendaItems.map(item => (
                  <div key={item.id} data-testid={`card-agenda-${item.id}`} className="flex items-start gap-3 p-3 rounded-md border border-border bg-card">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{item.titulo}</p>
                      {item.clienteNome && <p className="text-xs text-muted-foreground">{item.clienteNome}</p>}
                      <p className="text-xs text-primary font-medium mt-0.5">{item.data} {item.hora && `às ${item.hora}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-3">
                  <CalendarDays className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">Nenhum item na agenda</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="vendas" className="p-6 m-0">
            <h3 className="font-semibold text-sm text-foreground mb-4">Resumo de Vendas</h3>
            {loadingVendas ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border border-border p-4 bg-card">
                  <p className="text-xs text-muted-foreground mb-1">Total de Vendas</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.totalVendas ?? "—"}</p>
                </div>
                <div className="rounded-lg border border-border p-4 bg-card">
                  <p className="text-xs text-muted-foreground mb-1">Valor Total</p>
                  <p className="text-xl font-bold text-primary">R$ {stats?.totalVendasValor ?? "—"}</p>
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="financiamentos" className="p-6 m-0">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-3">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">Nenhum financiamento registrado</p>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
