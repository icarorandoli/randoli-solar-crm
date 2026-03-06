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
import { insertColaboradorSchema, type Colaborador, type InsertColaborador, type User } from "@shared/schema";
import { UserPlus, Search, Pencil, Trash2, Shield, UserCheck, KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ColaboradoresPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editColaborador, setEditColaborador] = useState<Colaborador | null>(null);
  const [acessoColaborador, setAcessoColaborador] = useState<Colaborador | null>(null);
  const [showSenha, setShowSenha] = useState(false);
  const [showSenha2, setShowSenha2] = useState(false);
  const [novoUsername, setNovoUsername] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [novaSenha2, setNovaSenha2] = useState("");
  const { toast } = useToast();

  const { data: colaboradores, isLoading } = useQuery<Colaborador[]>({ queryKey: ["/api/colaboradores"] });
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });

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

  const createUserMutation = useMutation({
    mutationFn: (data: { username: string; password: string; nome: string; cargo: string }) =>
      apiRequest("POST", "/api/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Acesso criado com sucesso!", description: `Usuário "${novoUsername}" pode fazer login agora.` });
      setAcessoColaborador(null);
      setNovoUsername(""); setNovaSenha(""); setNovaSenha2("");
    },
    onError: () => toast({ title: "Erro ao criar acesso", variant: "destructive" }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Acesso removido." });
    },
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

  const openAcesso = (c: Colaborador) => {
    setAcessoColaborador(c);
    setNovoUsername(c.nome.toLowerCase().replace(/\s+/g, ".").normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    setNovaSenha(""); setNovaSenha2("");
  };

  const handleCriarAcesso = () => {
    if (!acessoColaborador) return;
    if (!novoUsername.trim()) { toast({ title: "Usuário é obrigatório", variant: "destructive" }); return; }
    if (novaSenha.length < 6) { toast({ title: "Senha deve ter ao menos 6 caracteres", variant: "destructive" }); return; }
    if (novaSenha !== novaSenha2) { toast({ title: "As senhas não coincidem", variant: "destructive" }); return; }
    const existingUser = (users ?? []).find(u => u.username === novoUsername);
    if (existingUser) { toast({ title: "Usuário já existe. Escolha outro nome de usuário.", variant: "destructive" }); return; }
    createUserMutation.mutate({ username: novoUsername, password: novaSenha, nome: acessoColaborador.nome, cargo: acessoColaborador.cargo });
  };

  const getColabUser = (c: Colaborador) =>
    (users ?? []).find(u => u.nome.toLowerCase() === c.nome.toLowerCase());

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
          {filtered.map(c => {
            const colabUser = getColabUser(c);
            return (
              <Card key={c.id} data-testid={`card-colaborador-${c.id}`} className="p-4 border border-card-border">
                <div className="space-y-1 text-sm">
                  <p><span className="font-semibold">Nome:</span> <span className="font-bold">{c.nome}</span></p>
                  <p><span className="font-semibold">Cargo:</span> {c.cargo}</p>
                  {c.email && <p><span className="font-semibold">E-mail:</span> {c.email}</p>}
                  {c.telefone && <p><span className="font-semibold">Telefone:</span> {c.telefone}</p>}
                  {c.cpfCnpj && <p><span className="font-semibold">CPF/CNPJ:</span> {c.cpfCnpj}</p>}
                  {colabUser ? (
                    <div className="flex items-center gap-1 text-green-600 text-xs font-medium pt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Acesso: <strong>@{colabUser.username}</strong></span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground pt-0.5">Sem acesso ao sistema</p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <button data-testid={`button-edit-col-${c.id}`} onClick={() => openEdit(c)} className="p-1 hover:text-primary text-muted-foreground transition-colors" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      data-testid={`button-acesso-col-${c.id}`}
                      onClick={() => openAcesso(c)}
                      className={`p-1 transition-colors ${colabUser ? "text-green-600 hover:text-green-700" : "hover:text-primary text-muted-foreground"}`}
                      title={colabUser ? "Gerenciar acesso" : "Criar acesso ao sistema"}
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                    <button data-testid={`button-delete-col-${c.id}`} onClick={() => deleteMutation.mutate(c.id)} className="p-1 hover:text-destructive text-muted-foreground transition-colors" title="Remover">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">{c.createdAt}</span>
                </div>
              </Card>
            );
          })}
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

      <Dialog open={!!acessoColaborador} onOpenChange={(open) => { if (!open) setAcessoColaborador(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Acesso ao Sistema — {acessoColaborador?.nome}
            </DialogTitle>
          </DialogHeader>

          {acessoColaborador && (() => {
            const colabUser = getColabUser(acessoColaborador);
            return (
              <div className="space-y-4">
                {colabUser ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Acesso ativo
                    </div>
                    <p className="text-sm text-foreground">Usuário: <strong>@{colabUser.username}</strong></p>
                    <p className="text-sm text-foreground">Cargo: {colabUser.cargo}</p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => deleteUserMutation.mutate(colabUser.id)}
                      disabled={deleteUserMutation.isPending}
                      data-testid="button-remover-acesso"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {deleteUserMutation.isPending ? "Removendo..." : "Remover Acesso"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Crie um login para <strong>{acessoColaborador.nome}</strong> acessar o sistema.
                    </p>

                    <div>
                      <label className="text-sm font-medium block mb-1">Nome de usuário</label>
                      <Input
                        placeholder="ex: joao.silva"
                        value={novoUsername}
                        onChange={e => setNovoUsername(e.target.value.toLowerCase().replace(/\s+/g, "."))}
                        data-testid="input-username-acesso"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-1">Senha</label>
                      <div className="relative">
                        <Input
                          type={showSenha ? "text" : "password"}
                          placeholder="Mínimo 6 caracteres"
                          value={novaSenha}
                          onChange={e => setNovaSenha(e.target.value)}
                          data-testid="input-senha-acesso"
                          className="pr-9"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                          onClick={() => setShowSenha(!showSenha)}
                        >
                          {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-1">Confirmar senha</label>
                      <div className="relative">
                        <Input
                          type={showSenha2 ? "text" : "password"}
                          placeholder="Repita a senha"
                          value={novaSenha2}
                          onChange={e => setNovaSenha2(e.target.value)}
                          data-testid="input-senha2-acesso"
                          className="pr-9"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                          onClick={() => setShowSenha2(!showSenha2)}
                        >
                          {showSenha2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" className="flex-1" onClick={() => setAcessoColaborador(null)}>Cancelar</Button>
                      <Button
                        className="flex-1"
                        onClick={handleCriarAcesso}
                        disabled={createUserMutation.isPending}
                        data-testid="button-criar-acesso"
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        {createUserMutation.isPending ? "Criando..." : "Criar Acesso"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
