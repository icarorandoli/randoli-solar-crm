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
import { insertColaboradorSchema, type Colaborador, type InsertColaborador } from "@shared/schema";
import { UserPlus, Search, Pencil, Trash2, Shield, UserCheck } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ColaboradoresPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editColaborador, setEditColaborador] = useState<Colaborador | null>(null);
  const { toast } = useToast();

  const { data: colaboradores, isLoading } = useQuery<Colaborador[]>({ queryKey: ["/api/colaboradores"] });

  const form = useForm<InsertColaborador>({
    resolver: zodResolver(insertColaboradorSchema),
    defaultValues: { nome: "", cargo: "", email: "", telefone: "", cpfCnpj: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertColaborador) => apiRequest("POST", "/api/colaboradores", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/colaboradores"] }); setShowForm(false); form.reset(); toast({ title: "Colaborador cadastrado!" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertColaborador> }) => apiRequest("PATCH", `/api/colaboradores/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/colaboradores"] }); setEditColaborador(null); setShowForm(false); toast({ title: "Colaborador atualizado!" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/colaboradores/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/colaboradores"] }); toast({ title: "Colaborador removido." }); },
  });

  const filtered = (colaboradores ?? []).filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEdit = (c: Colaborador) => {
    setEditColaborador(c);
    form.reset({ nome: c.nome, cargo: c.cargo, email: c.email ?? "", telefone: c.telefone ?? "", cpfCnpj: c.cpfCnpj ?? "" });
    setShowForm(true);
  };

  const onSubmit = (data: InsertColaborador) => {
    if (editColaborador) updateMutation.mutate({ id: editColaborador.id, data });
    else createMutation.mutate(data);
  };

  return (
    <div className="p-6 space-y-4">
      {colaboradores && (
        <Card className="p-4 border border-card-border text-center">
          <p className="text-sm text-foreground">
            Colaboradores cadastrados:{" "}
            <span className="font-bold text-primary">{colaboradores.length} / {colaboradores.length}</span>
          </p>
        </Card>
      )}

      <Card className="p-6 border border-card-border">
        <h2 className="text-center font-semibold text-foreground mb-4">Cadastro e edição de colaboradores</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => { setEditColaborador(null); form.reset(); setShowForm(true); }}
            className="h-20 flex-col gap-2 text-xs font-bold tracking-widest"
            data-testid="button-cadastrar-colaborador"
          >
            <UserPlus className="w-6 h-6" />
            CADASTRAR COLABORADOR
          </Button>
          <Button
            className="h-20 flex-col gap-2 text-xs font-bold tracking-widest"
            data-testid="button-pesquisar-colaborador"
            onClick={() => document.getElementById("search-col")?.focus()}
          >
            <Search className="w-6 h-6" />
            PESQUISAR COLABORADOR
          </Button>
        </div>
      </Card>

      <div className="flex items-center gap-2 bg-white dark:bg-card border border-border rounded-md px-3 py-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          id="search-col"
          placeholder="Buscar colaborador..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 p-0 h-auto focus-visible:ring-0 bg-transparent text-sm"
          data-testid="input-search-colaboradores"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <UserCheck className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhum colaborador encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(c => (
            <Card key={c.id} data-testid={`card-colaborador-${c.id}`} className="p-4 border border-card-border">
              <div className="space-y-1 text-sm">
                <p><span className="font-semibold">Nome:</span> <span className="font-bold">{c.nome}</span></p>
                <p><span className="font-semibold">Cargo:</span> {c.cargo}</p>
                {c.email && <p><span className="font-semibold">E-mail:</span> {c.email}</p>}
                {c.telefone && <p><span className="font-semibold">Telefone:</span> {c.telefone}</p>}
                {c.cpfCnpj && <p><span className="font-semibold">CPF/CNPJ:</span> {c.cpfCnpj}</p>}
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <button data-testid={`button-edit-col-${c.id}`} onClick={() => openEdit(c)} className="p-1 hover:text-primary text-muted-foreground transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button className="p-1 hover:text-primary text-muted-foreground transition-colors">
                    <Shield className="w-4 h-4" />
                  </button>
                  <button data-testid={`button-delete-col-${c.id}`} onClick={() => deleteMutation.mutate(c.id)} className="p-1 hover:text-destructive text-muted-foreground transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground">{c.createdAt}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) { setEditColaborador(null); form.reset(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editColaborador ? "Editar Colaborador" : "Cadastrar Colaborador"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField control={form.control} name="nome" render={({ field }) => (
                <FormItem><FormLabel>Nome *</FormLabel><FormControl><Input data-testid="input-nome-col" placeholder="Nome completo" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="cargo" render={({ field }) => (
                <FormItem><FormLabel>Cargo *</FormLabel><FormControl><Input data-testid="input-cargo-col" placeholder="Ex: Vendedor, Técnico..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input data-testid="input-email-col" placeholder="email@exemplo.com" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="telefone" render={({ field }) => (
                  <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input data-testid="input-telefone-col" placeholder="(00) 00000-0000" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="cpfCnpj" render={({ field }) => (
                <FormItem><FormLabel>CPF/CNPJ</FormLabel><FormControl><Input data-testid="input-cpf-col" placeholder="000.000.000-00" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowForm(false); setEditColaborador(null); }}>Cancelar</Button>
                <Button type="submit" className="flex-1" data-testid="button-submit-col" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editColaborador ? "Salvar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
