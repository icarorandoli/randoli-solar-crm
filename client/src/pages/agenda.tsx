import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertAgendaItemSchema, type AgendaItem, type InsertAgendaItem } from "@shared/schema";
import { Plus, Search, Trash2, CalendarDays, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const TIPO_COLORS: Record<string, string> = {
  "Reunião": "bg-blue-100 text-blue-700",
  "Visita técnica": "bg-purple-100 text-purple-700",
  "Ligação": "bg-green-100 text-green-700",
  "Outro": "bg-gray-100 text-gray-700",
};

export default function AgendaPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const { data: agendaItems, isLoading } = useQuery<AgendaItem[]>({ queryKey: ["/api/agenda"] });

  const form = useForm<InsertAgendaItem>({
    resolver: zodResolver(insertAgendaItemSchema),
    defaultValues: { titulo: "", descricao: "", data: "", hora: "", tipo: "Reunião", clienteNome: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertAgendaItem) => apiRequest("POST", "/api/agenda", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/agenda"] }); setShowForm(false); form.reset(); toast({ title: "Evento adicionado!" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/agenda/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/agenda"] }); toast({ title: "Evento removido." }); },
  });

  const filtered = (agendaItems ?? []).filter(a =>
    a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.clienteNome ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Agenda</h1>
        <Button onClick={() => setShowForm(true)} size="sm" className="gap-1 text-xs font-bold" data-testid="button-novo-evento">
          <Plus className="w-3.5 h-3.5" /> NOVO EVENTO
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-white dark:bg-card border border-border rounded-md px-3 py-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar evento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border-0 p-0 h-auto focus-visible:ring-0 bg-transparent text-sm" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <CalendarDays className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhum evento na agenda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <Card key={a.id} data-testid={`card-agenda-${a.id}`} className="p-4 border border-card-border">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm text-foreground">{a.titulo}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${TIPO_COLORS[a.tipo] ?? "bg-muted text-muted-foreground"}`}>{a.tipo}</span>
                  </div>
                  {a.clienteNome && <p className="text-xs text-muted-foreground mt-0.5">{a.clienteNome}</p>}
                  {a.descricao && <p className="text-xs text-muted-foreground mt-1">{a.descricao}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-xs text-primary font-medium">
                      <CalendarDays className="w-3 h-3" />
                      {a.data}
                    </div>
                    {a.hora && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {a.hora}
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => deleteMutation.mutate(a.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Evento</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-3">
              <FormField control={form.control} name="titulo" render={({ field }) => (
                <FormItem><FormLabel>Título *</FormLabel><FormControl><Input data-testid="input-titulo-evento" placeholder="Título do evento" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="clienteNome" render={({ field }) => (
                <FormItem><FormLabel>Cliente</FormLabel><FormControl><Input placeholder="Nome do cliente" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="data" render={({ field }) => (
                  <FormItem><FormLabel>Data *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="hora" render={({ field }) => (
                  <FormItem><FormLabel>Hora</FormLabel><FormControl><Input type="time" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="tipo" render={({ field }) => (
                <FormItem><FormLabel>Tipo</FormLabel><FormControl><Input placeholder="Ex: Reunião, Visita técnica..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="descricao" render={({ field }) => (
                <FormItem><FormLabel>Descrição</FormLabel><FormControl><Input placeholder="Descrição do evento" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" className="flex-1" data-testid="button-submit-evento" disabled={createMutation.isPending}>Adicionar</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
