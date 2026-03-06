import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertProjetoSchema, type Projeto, type InsertProjeto } from "@shared/schema";
import { Plus, Search, Trash2, FolderKanban, BarChart2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  "Em andamento": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Aguardando aprovação": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Finalizado": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default function ProjetosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const { data: projetos, isLoading } = useQuery<Projeto[]>({ queryKey: ["/api/projetos"] });

  const form = useForm<InsertProjeto>({
    resolver: zodResolver(insertProjetoSchema),
    defaultValues: { clienteNome: "", status: "Em andamento", kwp: "0,00", cidade: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertProjeto) => apiRequest("POST", "/api/projetos", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/projetos"] }); setShowForm(false); form.reset(); toast({ title: "Projeto criado!" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/projetos/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/projetos"] }); toast({ title: "Projeto removido." }); },
  });

  const filtered = (projetos ?? []).filter(p =>
    p.clienteNome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = (data: InsertProjeto) => createMutation.mutate(data);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Quadro de Projetos</h1>
        <Button onClick={() => setShowForm(true)} size="sm" className="gap-1 text-xs font-bold" data-testid="button-novo-projeto">
          <Plus className="w-3.5 h-3.5" /> NOVO PROJETO
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-2">
        <Card className="p-3 text-center border border-card-border">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold text-foreground">{projetos?.length ?? 0}</p>
        </Card>
        <Card className="p-3 text-center border border-card-border">
          <p className="text-xs text-muted-foreground">Em andamento</p>
          <p className="text-2xl font-bold text-primary">{projetos?.filter(p => p.status === "Em andamento").length ?? 0}</p>
        </Card>
        <Card className="p-3 text-center border border-card-border">
          <p className="text-xs text-muted-foreground">Finalizados</p>
          <p className="text-2xl font-bold text-green-600">{projetos?.filter(p => p.status === "Finalizado").length ?? 0}</p>
        </Card>
      </div>

      <div className="flex items-center gap-2 bg-white dark:bg-card border border-border rounded-md px-3 py-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar projeto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border-0 p-0 h-auto focus-visible:ring-0 bg-transparent text-sm" data-testid="input-search-projetos" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <FolderKanban className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhum projeto encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(p => (
            <Card key={p.id} data-testid={`card-projeto-${p.id}`} className="p-4 border border-card-border">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-bold text-sm text-foreground leading-tight">{p.clienteNome}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] ?? "bg-muted text-muted-foreground"}`}>{p.status}</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>Potência: <span className="font-semibold text-foreground">{p.kwp} kWp</span></p>
                {p.cidade && <p>Cidade: <span className="font-semibold text-foreground">{p.cidade}</span></p>}
                <p>Proprietário: <span className="font-semibold text-foreground">{p.proprietario}</span></p>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">{p.createdAt}</span>
                <button onClick={() => deleteMutation.mutate(p.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Projeto</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField control={form.control} name="clienteNome" render={({ field }) => (
                <FormItem><FormLabel>Cliente *</FormLabel><FormControl><Input data-testid="input-cliente-projeto" placeholder="Nome do cliente" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="kwp" render={({ field }) => (
                  <FormItem><FormLabel>Potência (kWp)</FormLabel><FormControl><Input placeholder="0,00" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="cidade" render={({ field }) => (
                  <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="Cidade" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" className="flex-1" data-testid="button-submit-projeto" disabled={createMutation.isPending}>Criar Projeto</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
