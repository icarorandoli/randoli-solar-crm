import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { type Proposta } from "@shared/schema";
import { Plus, Search, Trash2, FileText, Eye, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  ABERTO: "bg-primary text-white",
  PERDIDO: "bg-muted-foreground text-white",
  GANHO: "bg-green-500 text-white",
};

export default function PropostasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: propostas, isLoading } = useQuery<Proposta[]>({ queryKey: ["/api/propostas"] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/propostas/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/propostas"] }); toast({ title: "Proposta removida." }); },
  });

  const filtered = (propostas ?? []).filter(p =>
    p.clienteNome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <Card className="p-6 border border-card-border">
        <h2 className="text-center font-semibold text-foreground mb-4">Minhas Propostas</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => navigate("/propostas/nova")} className="h-20 flex-col gap-2 text-xs font-bold tracking-widest" data-testid="button-gerar-proposta">
            <Plus className="w-6 h-6" />
            GERAR PROPOSTA
          </Button>
          <Button className="h-20 flex-col gap-2 text-xs font-bold tracking-widest" data-testid="button-pesquisar-proposta" onClick={() => document.getElementById("search-propostas")?.focus()}>
            <Search className="w-6 h-6" />
            PESQUISAR PROPOSTA
          </Button>
        </div>
      </Card>

      <div className="flex items-center gap-2 bg-white dark:bg-card border border-border rounded-md px-3 py-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input id="search-propostas" placeholder="Buscar proposta..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border-0 p-0 h-auto focus-visible:ring-0 bg-transparent text-sm" data-testid="input-search-propostas" />
      </div>

      <div className="text-sm text-muted-foreground font-medium">Total: <span className="text-primary font-bold">{propostas?.length ?? 0}</span> proposta(s)</div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <FileText className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhuma proposta encontrada</p>
        </div>
      ) : (
        <Card className="border border-card-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">kWp</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visualizações</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} data-testid={`row-proposta-${p.id}`} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{p.clienteNome}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">R$ {p.valor}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.kwp} kWp</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold tracking-wider", STATUS_COLORS[p.status] ?? "bg-muted text-muted-foreground")}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="w-3.5 h-3.5" />
                      <span className="text-xs">{p.visualizacoes}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{p.createdAt}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button data-testid={`button-ver-proposta-${p.id}`} onClick={() => navigate(`/proposta/${p.id}`)} className="text-muted-foreground hover:text-primary transition-colors" title="Ver proposta">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button data-testid={`button-delete-proposta-${p.id}`} onClick={() => deleteMutation.mutate(p.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Excluir proposta">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

    </div>
  );
}
