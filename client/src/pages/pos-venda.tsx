import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertAtividadeSchema, type Atividade, type InsertAtividade } from "@shared/schema";
import { Plus, Search, Trash2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  "Pendente": "bg-yellow-100 text-yellow-700",
  "Em andamento": "bg-blue-100 text-blue-700",
  "Finalizado": "bg-green-100 text-green-700",
};

export default function PosVendaPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const { data: atividades, isLoading } = useQuery<Atividade[]>({ queryKey: ["/api/atividades"] });

  const form = useForm<InsertAtividade>({
    resolver: zodResolver(insertAtividadeSchema),
    defaultValues: { clienteNome: "", descricao: "", status: "Pendente", tipo: "Manutenção" },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertAtividade) => apiRequest("POST", "/api/atividades", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/atividades"] }); setShowForm(false); form.reset(); toast({ title: "Atividade criada!" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/atividades/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/atividades"] }); toast({ title: "Atividade removida." }); },
  });

  const filtered = (atividades ?? []).filter(a =>
    a.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Quadro de Atividades - Pós-Venda</h1>
        <Button onClick={() => setShowForm(true)} size="sm" className="gap-1 text-xs font-bold" data-testid="button-nova-atividade">
          <Plus className="w-3.5 h-3.5" /> NOVA ATIVIDADE
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-2">
        <Card className="p-3 text-center border border-card-border"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold text-foreground">{atividades?.length ?? 0}</p></Card>
        <Card className="p-3 text-center border border-card-border"><p className="text-xs text-muted-foreground">Pendentes</p><p className="text-2xl font-bold text-yellow-600">{atividades?.filter(a => a.status === "Pendente").length ?? 0}</p></Card>
        <Card className="p-3 text-center border border-card-border"><p className="text-xs text-muted-foreground">Finalizadas</p><p className="text-2xl font-bold text-green-600">{atividades?.filter(a => a.status === "Finalizado").length ?? 0}</p></Card>
      </div>

      <div className="flex items-center gap-2 bg-white dark:bg-card border border-border rounded-md px-3 py-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar atividade..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border-0 p-0 h-auto focus-visible:ring-0 bg-transparent text-sm" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16"><RefreshCw className="w-12 h-12 text-muted-foreground mb-3" /><p className="text-muted-foreground">Nenhuma atividade encontrada</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(a => (
            <Card key={a.id} data-testid={`card-atividade-${a.id}`} className="p-4 border border-card-border">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-bold text-sm text-foreground">{a.clienteNome}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status] ?? "bg-muted text-muted-foreground"}`}>{a.status}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{a.descricao}</p>
              <p className="text-xs text-primary font-medium">{a.tipo}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">{a.createdAt}</span>
                <button onClick={() => deleteMutation.mutate(a.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Atividade</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-3">
              <FormField control={form.control} name="clienteNome" render={({ field }) => (
                <FormItem><FormLabel>Cliente *</FormLabel><FormControl><Input data-testid="input-cliente-atividade" placeholder="Nome do cliente" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="tipo" render={({ field }) => (
                <FormItem><FormLabel>Tipo *</FormLabel><FormControl><Input placeholder="Ex: Manutenção, Visita técnica..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="descricao" render={({ field }) => (
                <FormItem><FormLabel>Descrição *</FormLabel><FormControl><Textarea placeholder="Descreva a atividade..." className="resize-none" rows={3} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" className="flex-1" data-testid="button-submit-atividade" disabled={createMutation.isPending}>Criar Atividade</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
