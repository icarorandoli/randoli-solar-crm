import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { type Cliente } from "@shared/schema";
import { Search, Plus, Pencil, Trash2, User, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ORIGENS = ["Indicação", "Facebook", "Instagram", "Google", "Site", "Outdoor", "Panfleto", "WhatsApp", "Outro"];
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

interface FormData {
  nome: string; email: string; proprietario: string; cpf: string;
  telefone: string; whatsapp: string; cep: string; endereco: string;
  estado: string; cidade: string; origemCliente: string; dataNascimento: string;
  rg: string; nacionalidade: string; profissao: string; rendaMensal: string;
  observacoes: string;
}

const emptyForm: FormData = {
  nome: "", email: "", proprietario: "GERENTE", cpf: "",
  telefone: "", whatsapp: "", cep: "", endereco: "",
  estado: "", cidade: "", origemCliente: "", dataNascimento: "",
  rg: "", nacionalidade: "", profissao: "", rendaMensal: "",
  observacoes: "",
};

function FieldBox({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative border border-border rounded-sm bg-white", className)}>
      <span className="absolute top-0.5 left-2 text-[9px] text-muted-foreground leading-none pointer-events-none">{label}</span>
      <div className="pt-4 pb-1 px-2">{children}</div>
    </div>
  );
}

function maskCPF(v: string) {
  return v.replace(/\D/g, "").substring(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editCliente, setEditCliente] = useState<Cliente | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [cepLoading, setCepLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: clientes, isLoading } = useQuery<Cliente[]>({ queryKey: ["/api/clientes"] });

  const upd = (field: keyof FormData, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleCepChange = async (value: string) => {
    upd("cep", value);
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length === 8) {
      setCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setForm(prev => ({
            ...prev,
            cep: value,
            endereco: `${data.logradouro}${data.bairro ? ", " + data.bairro : ""}`,
            cidade: data.localidade ?? prev.cidade,
            estado: data.uf ?? prev.estado,
          }));
        }
      } catch { }
      setCepLoading(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("POST", "/api/clientes", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/clientes"] }); setShowForm(false); setForm(emptyForm); toast({ title: "Cliente cadastrado com sucesso!" }); },
    onError: () => toast({ title: "Erro ao cadastrar cliente", variant: "destructive" }),
  });

  const createAndProposeMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/clientes", data);
      return res.json();
    },
    onSuccess: (cliente: any) => { queryClient.invalidateQueries({ queryKey: ["/api/clientes"] }); setShowForm(false); setForm(emptyForm); navigate(`/propostas/nova?clienteId=${cliente.id}`); toast({ title: "Cliente cadastrado! Abrindo proposta..." }); },
    onError: () => toast({ title: "Erro ao cadastrar cliente", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => apiRequest("PATCH", `/api/clientes/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/clientes"] }); setShowForm(false); setEditCliente(null); setForm(emptyForm); toast({ title: "Cliente atualizado!" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/clientes/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/clientes"] }); toast({ title: "Cliente removido." }); },
  });

  const filtered = (clientes ?? []).filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.cpf ?? "").includes(searchTerm)
  );

  const openNew = () => { setEditCliente(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (c: Cliente) => {
    setEditCliente(c);
    setForm({
      nome: c.nome ?? "", email: c.email ?? "", proprietario: (c as any).proprietario ?? "GERENTE",
      cpf: c.cpf ?? "", telefone: c.telefone ?? "", whatsapp: (c as any).whatsapp ?? "",
      cep: (c as any).cep ?? "", endereco: c.endereco ?? "", estado: c.estado ?? "",
      cidade: c.cidade ?? "", origemCliente: (c as any).origemCliente ?? "",
      dataNascimento: (c as any).dataNascimento ?? "", rg: (c as any).rg ?? "",
      nacionalidade: (c as any).nacionalidade ?? "", profissao: (c as any).profissao ?? "",
      rendaMensal: (c as any).rendaMensal ?? "", observacoes: (c as any).observacoes ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.nome.trim()) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }
    if (editCliente) { updateMutation.mutate({ id: editCliente.id, data: form }); }
    else { createMutation.mutate(form); }
  };

  const handleSubmitAndPropose = () => {
    if (!form.nome.trim()) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }
    createAndProposeMutation.mutate(form);
  };

  if (showForm) {
    const isLoading = createMutation.isPending || updateMutation.isPending || createAndProposeMutation.isPending;
    return (
      <div className="max-w-xl mx-auto p-4 pb-16">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditCliente(null); setForm(emptyForm); }}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <h2 className="text-foreground font-semibold">{editCliente ? "Editar Cliente" : "Cadastrar Cliente"}</h2>
        </div>

        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <div className="mb-5">
            <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <Input data-testid="input-nome-cliente" placeholder="Nome" value={form.nome} onChange={e => upd("nome", e.target.value)} className="text-sm" />
            <Input data-testid="input-email-cliente" placeholder="Email" type="email" value={form.email} onChange={e => upd("email", e.target.value)} className="text-sm" />
          </div>

          <div className="mb-2">
            <FieldBox label="Proprietários">
              <div className="flex items-center gap-2">
                <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded">GERENTE</span>
                <select className="flex-1 text-sm border-0 outline-none bg-transparent" value={form.proprietario} onChange={e => upd("proprietario", e.target.value)}>
                  <option value="GERENTE">GERENTE</option>
                  <option value="VENDEDOR">VENDEDOR</option>
                  <option value="OUTRO">OUTRO</option>
                </select>
              </div>
            </FieldBox>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <button
              className="w-9 h-5 rounded-full bg-primary relative flex items-center px-0.5 flex-shrink-0"
              onClick={() => {}}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-sm ml-auto" />
            </button>
            <span className="text-sm font-medium text-foreground">CPF</span>
            <Input data-testid="input-cpf-cliente" placeholder="000.000.000-00" value={form.cpf} onChange={e => upd("cpf", maskCPF(e.target.value))} className="flex-1 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <Input data-testid="input-telefone-cliente" placeholder="Telefone" value={form.telefone} onChange={e => upd("telefone", e.target.value)} className="text-sm" />
            <Input placeholder="Whatsapp" value={form.whatsapp} onChange={e => upd("whatsapp", e.target.value)} className="text-sm" />
          </div>

          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="relative">
              <Input placeholder="CEP" value={form.cep} onChange={e => handleCepChange(e.target.value)} className="text-sm" />
              {cepLoading && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">...</span>}
            </div>
            <Input placeholder="Endereço" value={form.endereco} onChange={e => upd("endereco", e.target.value)} className="text-sm col-span-2" />
          </div>

          <div className="grid grid-cols-3 gap-2 mb-2">
            <FieldBox label="UF">
              <select className="w-full text-sm border-0 outline-none bg-transparent" value={form.estado} onChange={e => upd("estado", e.target.value)}>
                <option value="">UF</option>
                {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </FieldBox>
            <FieldBox label="Cidade" className="col-span-2">
              <Input placeholder="Cidade" value={form.cidade} onChange={e => upd("cidade", e.target.value)} className="border-0 p-0 h-5 text-sm focus-visible:ring-0 bg-transparent" data-testid="input-cidade-cliente" />
            </FieldBox>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <FieldBox label="Origem do Cliente">
              <select className="w-full text-sm border-0 outline-none bg-transparent" value={form.origemCliente} onChange={e => upd("origemCliente", e.target.value)}>
                <option value="">Selecionar...</option>
                {ORIGENS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </FieldBox>
            <FieldBox label="Data de Nascimento">
              <Input type="date" value={form.dataNascimento} onChange={e => upd("dataNascimento", e.target.value)} className="border-0 p-0 h-5 text-sm focus-visible:ring-0 bg-transparent" />
            </FieldBox>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <Input placeholder="RG" value={form.rg} onChange={e => upd("rg", e.target.value)} className="text-sm" />
            <Input placeholder="Nacionalidade" value={form.nacionalidade} onChange={e => upd("nacionalidade", e.target.value)} className="text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <Input placeholder="Profissão" value={form.profissao} onChange={e => upd("profissao", e.target.value)} className="text-sm" />
            <FieldBox label="Renda Mensal">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs">R$</span>
                <Input placeholder="0,00" value={form.rendaMensal} onChange={e => upd("rendaMensal", e.target.value)} className="border-0 p-0 h-5 text-sm focus-visible:ring-0 bg-transparent" />
              </div>
            </FieldBox>
          </div>

          <Textarea
            placeholder="Observações"
            value={form.observacoes}
            onChange={e => upd("observacoes", e.target.value)}
            className="mb-3 text-sm resize-none min-h-20"
          />

          <Button
            variant="outline"
            className="w-full mb-2 text-xs font-bold tracking-widest border-pink-400 text-pink-500 hover:bg-pink-50"
            onClick={() => toast({ title: "Preencha todos os campos obrigatórios corretamente" })}
          >
            O QUE HÁ DE ERRADO?
          </Button>

          <Button
            data-testid="button-registrar-gerar-proposta"
            className="w-full text-xs font-bold tracking-widest mb-2"
            onClick={handleSubmitAndPropose}
            disabled={isLoading || !form.nome.trim()}
          >
            {createAndProposeMutation.isPending ? "SALVANDO..." : "REGISTRAR E GERAR PROPOSTA"}
          </Button>

          <Button
            data-testid="button-submit-cliente"
            variant="outline"
            className="w-full text-xs font-bold tracking-widest"
            onClick={handleSubmit}
            disabled={isLoading || !form.nome.trim()}
          >
            {editCliente ? "SALVAR ALTERAÇÕES" : "REGISTRAR CLIENTE"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <Card className="p-6 border border-card-border">
        <h2 className="text-center font-semibold text-foreground mb-4">Cadastro e Edição de Clientes</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={openNew} className="h-20 flex-col gap-2 text-xs font-bold tracking-widest" data-testid="button-cadastrar-cliente">
            <Plus className="w-6 h-6" />
            CADASTRAR CLIENTE
          </Button>
          <Button className="h-20 flex-col gap-2 text-xs font-bold tracking-widest" data-testid="button-pesquisar-cliente" onClick={() => document.getElementById("search-clientes")?.focus()}>
            <Search className="w-6 h-6" />
            PESQUISAR CLIENTE
          </Button>
        </div>
      </Card>

      <div className="flex items-center gap-2 bg-white dark:bg-card border border-border rounded-md px-3 py-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          id="search-clientes"
          placeholder="Buscar cliente por nome, email ou CPF..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 p-0 h-auto focus-visible:ring-0 bg-transparent text-sm"
          data-testid="input-search-clientes"
        />
      </div>

      <div className="text-sm text-muted-foreground font-medium">
        Clientes cadastrados: <span className="text-primary font-bold">{clientes?.length ?? 0}</span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
            <User className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(c => (
            <Card key={c.id} data-testid={`card-cliente-${c.id}`} className="p-4 border border-card-border hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5 text-sm">
                  <p className="font-bold text-foreground truncate">{c.nome}</p>
                  {c.email && <p className="text-muted-foreground text-xs truncate">{c.email}</p>}
                  {(c.telefone || (c as any).whatsapp) && (
                    <p className="text-muted-foreground text-xs">{c.telefone || (c as any).whatsapp}</p>
                  )}
                  {c.cpf && <p className="text-muted-foreground text-xs">CPF: {c.cpf}</p>}
                  {(c.cidade || c.estado) && (
                    <p className="text-muted-foreground text-xs">{c.cidade}{c.cidade && c.estado ? " - " : ""}{c.estado}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">{c.createdAt}</span>
                <div className="flex items-center gap-1">
                  <button data-testid={`button-edit-cliente-${c.id}`} onClick={() => openEdit(c)} className="p-1.5 hover:text-primary text-muted-foreground transition-colors hover:bg-muted rounded">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button data-testid={`button-delete-cliente-${c.id}`} onClick={() => deleteMutation.mutate(c.id)} className="p-1.5 hover:text-destructive text-muted-foreground transition-colors hover:bg-muted rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
