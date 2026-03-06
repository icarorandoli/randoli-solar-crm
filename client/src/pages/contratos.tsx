import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertContratoSchema, type Contrato, type InsertContrato } from "@shared/schema";
import { Plus, Search, Pencil, Trash2, FileText, Copy, Upload, CheckCircle2 } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const TAG_GROUPS = [
  {
    title: "Tags da Minha Empresa",
    tags: [
      { tag: "{nome_empresa}", desc: "Nome da Minha Empresa" },
      { tag: "{cnpj_empresa}", desc: "CNPJ da Minha Empresa" },
      { tag: "{nome_resp_empresa}", desc: "Nome do Responsável pela Minha Empresa" },
      { tag: "{cpf_resp_empresa}", desc: "CPF do Responsável pela Minha Empresa" },
      { tag: "{rg_resp_empresa}", desc: "RG do Responsável pela Minha Empresa" },
      { tag: "{prof_resp_empresa}", desc: "Profissão do Responsável pela Minha Empresa" },
      { tag: "{nac_resp_empresa}", desc: "Nacionalidade do Responsável pela Minha Empresa" },
      { tag: "{endereco_empresa}", desc: "Endereço da Minha Empresa" },
      { tag: "{telefone_empresa}", desc: "Telefone da Minha Empresa" },
      { tag: "{whatsapp_empresa}", desc: "WhatsApp da Minha Empresa" },
    ],
  },
  {
    title: "Tags do Cliente",
    tags: [
      { tag: "{nome_cliente}", desc: "Nome do Cliente" },
      { tag: "{uf_cliente}", desc: "UF do Cliente" },
      { tag: "{cidade_cliente}", desc: "Cidade do Cliente" },
      { tag: "{email_cliente}", desc: "E-mail do Cliente" },
      { tag: "{telefone_cliente}", desc: "Telefone do Cliente" },
      { tag: "{whatsapp_cliente}", desc: "WhatsApp do Cliente" },
      { tag: "{documento_cliente}", desc: "CPF/CNPJ do Cliente" },
      { tag: "{endereco_cliente}", desc: "Endereço do Cliente" },
      { tag: "{rg_cliente}", desc: "RG do cliente (ou responsável)" },
      { tag: "{nac_cliente}", desc: "Nacionalidade do cliente (ou responsável)" },
      { tag: "{prof_cliente}", desc: "Profissão do cliente (ou responsável)" },
      { tag: "{nome_resp_cliente}", desc: "Nome do Responsável Pela Empresa (cliente)" },
      { tag: "{cpf_resp_cliente}", desc: "CPF do Responsável Pela Empresa (cliente)" },
      { tag: "{observacoes_cliente}", desc: "Observações do Cliente" },
    ],
  },
  {
    title: "Tags da Proposta / Venda",
    tags: [
      { tag: "{valor_venda}", desc: "Valor de Venda" },
      { tag: "{potencia_sistema}", desc: "Potência do Sistema" },
      { tag: "{condicoes_de_pagamento}", desc: "Condições de Pagamento (proposta)" },
      { tag: "{condicoes_de_pagamento_venda}", desc: "Condições de Pagamento (ganho da venda)" },
      { tag: "{validade_proposta}", desc: "Validade da Proposta" },
    ],
  },
  {
    title: "Tags Gerais da Proposta",
    tags: [
      { tag: "{numero_da_proposta}", desc: "Número da proposta" },
      { tag: "{data_validade}", desc: "Data de validade da proposta" },
      { tag: "{dias_validade}", desc: "Número de dias de validade da proposta" },
      { tag: "{data_registro}", desc: "Data de registro da proposta" },
      { tag: "{cond_pag}", desc: "Condições de pagamento do sistema proposto" },
      { tag: "{cond_pag_venda}", desc: "Condições de Pagamento (ganho da venda - somente no contrato)" },
      { tag: "{fornecedor}", desc: "Fornecedor do Kit FV" },
      { tag: "{est_fix}", desc: "Estrutura de fixação do Kit FV" },
      { tag: "{cons_finais_t}", desc: "Título das considerações finais" },
      { tag: "{cons_finais_p1}", desc: "Parágrafo 1 das considerações finais" },
      { tag: "{cons_finais_p2}", desc: "Parágrafo 2 das considerações finais" },
      { tag: "{cons_finais_p3}", desc: "Parágrafo 3 das considerações finais" },
      { tag: "{cons_finais_p4}", desc: "Parágrafo 4 das considerações finais" },
      { tag: "{cons_finais_p5}", desc: "Parágrafo 5 das considerações finais" },
      { tag: "{cons_finais_p6}", desc: "Parágrafo 6 das considerações finais" },
    ],
  },
  {
    title: "Tags de Projeto e Instalação",
    tags: [
      { tag: "{cs_m}", desc: "Consumo médio mensal em kWh/mês" },
      { tag: "{cs_m_fp}", desc: "Consumo médio mensal fora ponta em kWh/mês" },
      { tag: "{cs_m_p}", desc: "Consumo médio mensal ponta em kWh/mês" },
      { tag: "{cs_a}", desc: "Consumo médio anual em kWh/ano" },
      { tag: "{cs_a_fp}", desc: "Consumo médio anual fora ponta em kWh/ano" },
      { tag: "{cs_a_p}", desc: "Consumo médio anual ponta em kWh/ano" },
      { tag: "{ger_m}", desc: "Geração média mensal estimada em kWh/mês" },
      { tag: "{ger_a}", desc: "Geração média anual estimada em kWh/ano" },
      { tag: "{co2}", desc: "Redução de CO² em kg/ano" },
      { tag: "{arvores}", desc: "Árvores salvas" },
      { tag: "{carros}", desc: "Anos de um carro fora de circulação" },
    ],
  },
  {
    title: "Tags de Distribuição de Energia (Loop)",
    tags: [
      { tag: "{#ucs_dist}", desc: "Início do loop de distribuição entre UCs" },
      { tag: "{/ucs_dist}", desc: "Final do loop de distribuição entre UCs" },
      { tag: "{nome_uc}", desc: "Nome da UC" },
      { tag: "{ger_uc}", desc: "Quantidade em kWh consumida da geração pela UC" },
      { tag: "{ger_perc_uc}", desc: "Quantidade em % consumida da geração pela UC" },
      { tag: "{c_ss_uc}", desc: "Valor mensal da conta SEM sistema da UC" },
      { tag: "{c_cs_uc}", desc: "Valor mensal da conta COM sistema da UC" },
      { tag: "{ec_uc}", desc: "Economia mensal da UC" },
    ],
  },
  {
    title: "Tags de Informações do Sistema",
    tags: [
      { tag: "{potencia}", desc: "Potência real do sistema em kWp" },
      { tag: "{potencia_calc}", desc: "Potência ideal calculada do sistema em kWp" },
      { tag: "{area}", desc: "Área mínima requerida pelo sistema em m²" },
      { tag: "{peso_dist}", desc: "Peso distribuído do sistema em kg/m²" },
      { tag: "{irr}", desc: "Irradiação solar média anual em kWh/m².dia" },
      { tag: "{sobre_eqps}", desc: "Sobre os equipamentos" },
    ],
  },
  {
    title: "Tags de Módulos Fotovoltaicos (Loop)",
    tags: [
      { tag: "{#modulos}", desc: "Início do loop de módulos fotovoltaicos" },
      { tag: "{/modulos}", desc: "Final do loop de módulos fotovoltaicos" },
      { tag: "{mod_fab}", desc: "Fabricante do módulo" },
      { tag: "{mod_pot}", desc: "Potência do módulo em Wp" },
      { tag: "{mod_gar_def}", desc: "Garantia do módulo contra defeitos em anos" },
      { tag: "{mod_gar_ef}", desc: "Garantia de eficiência de 80% do módulo em anos" },
      { tag: "{mod_qtd}", desc: "Quantidade de módulos" },
    ],
  },
  {
    title: "Tags de Inversores (Loop)",
    tags: [
      { tag: "{#inversores}", desc: "Início do loop de inversores" },
      { tag: "{/inversores}", desc: "Final do loop de inversores" },
      { tag: "{inv_mod}", desc: "Modelo do inversor" },
      { tag: "{inv_fab}", desc: "Fabricante do inversor" },
      { tag: "{inv_pot}", desc: "Potência do inversor em W" },
      { tag: "{inv_gar}", desc: "Garantia do inversor em anos" },
      { tag: "{inv_monit}", desc: "Tipo de monitoramento do inversor" },
      { tag: "{inv_qtd}", desc: "Quantidade de inversores" },
    ],
  },
  {
    title: "Tags de Itens Complementares (Loop)",
    tags: [
      { tag: "{#adicionais}", desc: "Início do loop de itens complementares" },
      { tag: "{/adicionais}", desc: "Final do loop de itens complementares" },
      { tag: "{item_adc_nome}", desc: "Nome/descrição do item complementar" },
      { tag: "{item_adc_fab}", desc: "Fabricante do item complementar" },
      { tag: "{item_adc_qtd}", desc: "Quantidade do item complementar" },
      { tag: "{item_adc_det}", desc: "Detalhe do item complementar" },
    ],
  },
  {
    title: "Tags da Análise de Viabilidade — Ano 1",
    tags: [
      { tag: "{cust_tot_ss}", desc: "Custo da conta de energia SEM sistema" },
      { tag: "{cust_c_fp_ss}", desc: "Custo do CONSUMO FORA PONTA SEM sistema" },
      { tag: "{cust_d_fp_ss}", desc: "Custo da DEMANDA FORA PONTA" },
      { tag: "{cust_c_p_ss}", desc: "Custo do CONSUMO PONTA SEM sistema" },
      { tag: "{cust_d_p_ss}", desc: "Custo da DEMANDA PONTA" },
      { tag: "{cust_d_ger_ss}", desc: "Custo da DEMANDA GERAÇÃO" },
      { tag: "{cust_tot_cs}", desc: "Custo da conta COM sistema" },
      { tag: "{cust_c_fp_abt}", desc: "Custo ABATIDO do CONSUMO FORA PONTA" },
      { tag: "{cust_c_p_abt}", desc: "Custo ABATIDO do CONSUMO PONTA" },
      { tag: "{cust_a1_ss}", desc: "Custo estimado do primeiro ano SEM sistema" },
      { tag: "{cust_a1_cs}", desc: "Custo estimado do primeiro ano COM sistema" },
      { tag: "{ecn_a1_am}", desc: "Economia média mensal estimada no primeiro ano" },
      { tag: "{ecn_a1_aa}", desc: "Economia total estimada no primeiro ano" },
    ],
  },
  {
    title: "Tags de Indicadores da Análise de Viabilidade",
    tags: [
      { tag: "{preco_sist}", desc: "Preço do sistema em R$" },
      { tag: "{preco_sist_por_extenso}", desc: "Preço do sistema escrito por extenso" },
      { tag: "{preco_servico}", desc: "Preço do serviço em R$" },
      { tag: "{preco_servico_por_extenso}", desc: "Preço do serviço escrito por extenso" },
      { tag: "{preco_equipamentos}", desc: "Preço dos equipamentos em R$" },
      { tag: "{preco_equipamentos_por_extenso}", desc: "Preço dos equipamentos escrito por extenso" },
      { tag: "{infl_en}", desc: "Reajuste anual de energia em %" },
      { tag: "{payback_aa}", desc: "Anos do payback" },
      { tag: "{payback_mm}", desc: "Meses do payback" },
      { tag: "{roi}", desc: "Retorno sobre o investimento (ROI)" },
      { tag: "{tir}", desc: "Taxa interna de retorno (TIR)" },
      { tag: "{vl_sist_fv}", desc: "Valor do kWh com o sistema FV" },
      { tag: "{vl_ecn_sist_fv}", desc: "Valor economizado por kWh com o sistema FV" },
      { tag: "{ecn_tot}", desc: "Economia total nos 25 anos da análise financeira" },
    ],
  },
  {
    title: "Outras Tags",
    tags: [
      { tag: "{n_contrato}", desc: "Número do Contrato" },
      { tag: "{data_do_dia}", desc: "Data do Dia da Geração do Contrato" },
    ],
  },
];

export default function ContratosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [tagSearch, setTagSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: contratos, isLoading } = useQuery<Contrato[]>({ queryKey: ["/api/contratos"] });

  const form = useForm<InsertContrato>({
    resolver: zodResolver(insertContratoSchema),
    defaultValues: { nome: "", tipo: "template", conteudo: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertContrato) => apiRequest("POST", "/api/contratos", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/contratos"] }); setShowForm(false); form.reset(); toast({ title: "Modelo criado!" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/contratos/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/contratos"] }); toast({ title: "Modelo removido." }); },
  });

  const handleUploadClick = (contratoId: string) => {
    setUploadingId(contratoId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingId) return;
    if (!file.name.endsWith(".docx")) {
      toast({ title: "Apenas arquivos .docx são aceitos", variant: "destructive" });
      e.target.value = "";
      return;
    }
    const formData = new FormData();
    formData.append("template", file);
    try {
      const res = await fetch(`/api/contratos/${uploadingId}/upload`, { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/contratos"] });
      toast({ title: "Modelo Word anexado com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar arquivo", description: err.message, variant: "destructive" });
    } finally {
      e.target.value = "";
      setUploadingId(null);
    }
  };

  const filtered = (contratos ?? []).filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTags = TAG_GROUPS.map(group => ({
    ...group,
    tags: group.tags.filter(t =>
      t.tag.toLowerCase().includes(tagSearch.toLowerCase()) ||
      t.desc.toLowerCase().includes(tagSearch.toLowerCase())
    ),
  })).filter(group => group.tags.length > 0);

  const onSubmit = (data: InsertContrato) => createMutation.mutate(data);

  return (
    <div className="p-6 space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx"
        className="hidden"
        onChange={handleFileChange}
        data-testid="input-file-template"
      />

      <Card className="p-6 border border-card-border">
        <h2 className="text-center font-semibold text-foreground mb-4">Cadastro e Edição de Modelos de Contratos</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => { form.reset(); setShowForm(true); }}
            className="h-20 flex-col gap-2 text-xs font-bold tracking-widest"
            data-testid="button-novo-contrato"
          >
            <Plus className="w-6 h-6" />
            NOVO MODELO DE CONTRATO
          </Button>
          <Button
            className="h-20 flex-col gap-2 text-xs font-bold tracking-widest"
            data-testid="button-pesquisar-contrato"
            onClick={() => document.getElementById("search-contratos")?.focus()}
          >
            <Search className="w-6 h-6" />
            PESQUISAR MODELO CONTRATO
          </Button>
        </div>
      </Card>

      <div className="flex items-center gap-2 bg-white dark:bg-card border border-border rounded-md px-3 py-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          id="search-contratos"
          placeholder="Buscar modelo de contrato..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 p-0 h-auto focus-visible:ring-0 bg-transparent text-sm"
          data-testid="input-search-contratos"
        />
      </div>

      <Card className="border border-card-border overflow-hidden">
        <Tabs defaultValue="templates">
          <div className="border-b border-border px-4">
            <TabsList className="h-auto bg-transparent p-0 gap-0">
              <TabsTrigger value="templates" data-testid="tab-templates" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-6 py-3 text-xs font-bold tracking-widest uppercase bg-transparent">
                TEMPLATES
              </TabsTrigger>
              <TabsTrigger value="tags" data-testid="tab-tags" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-6 py-3 text-xs font-bold tracking-widest uppercase bg-transparent">
                TAGS
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="templates" className="p-4 m-0">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <FileText className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">Nenhum modelo encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map(c => (
                  <Card key={c.id} data-testid={`card-contrato-${c.id}`} className="p-4 border border-card-border">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground leading-tight flex-1">
                        <span className="font-bold">Nome:</span> {c.nome}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      <span className="font-semibold">Editado em:</span> {c.editadoEm}
                    </p>

                    {(c as any).templateNome ? (
                      <div className="flex items-center gap-1 mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        <span className="text-xs text-green-600 truncate">{(c as any).templateNome}</span>
                      </div>
                    ) : (
                      <div className="mb-2">
                        <span className="text-xs text-muted-foreground italic">Sem modelo Word anexado</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 px-2"
                        data-testid={`button-upload-contrato-${c.id}`}
                        onClick={() => handleUploadClick(c.id)}
                      >
                        <Upload className="w-3 h-3" />
                        {(c as any).templateNome ? "Substituir Word" : "Anexar Word"}
                      </Button>
                      <div className="flex gap-2">
                        <button className="text-muted-foreground hover:text-primary transition-colors">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button className="text-muted-foreground hover:text-primary transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          data-testid={`button-delete-contrato-${c.id}`}
                          onClick={() => deleteMutation.mutate(c.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tags" className="p-4 m-0">
            <div className="mb-4 flex items-center gap-2 bg-muted/40 border border-border rounded-md px-3 py-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tag..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="border-0 p-0 h-auto focus-visible:ring-0 bg-transparent text-sm"
                data-testid="input-search-tags"
              />
            </div>

            <div className="space-y-5">
              {filteredTags.map((group) => (
                <div key={group.title}>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2 pb-1 border-b border-primary/20">
                    {group.title}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {group.tags.map(({ tag, desc }) => (
                      <div
                        key={tag}
                        data-testid={`tag-item-${tag.replace(/[{}#/]/g, "")}`}
                        className="flex items-start gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer"
                        onClick={() => {
                          navigator.clipboard.writeText(tag);
                        }}
                        title="Clique para copiar"
                      >
                        <Badge variant="outline" className="font-mono text-xs text-primary border-primary/40 shrink-0 px-1.5 py-0">
                          {tag}
                        </Badge>
                        <span className="text-xs text-muted-foreground leading-tight">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) form.reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Modelo de Contrato</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField control={form.control} name="nome" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Modelo *</FormLabel>
                  <FormControl><Input data-testid="input-nome-contrato" placeholder="Ex: Contrato de Prestação para CPF" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <p className="text-xs text-muted-foreground">
                Após criar o modelo, clique em "Anexar Word" para enviar o arquivo .docx com as tags.
              </p>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" className="flex-1" data-testid="button-submit-contrato" disabled={createMutation.isPending}>Criar Modelo</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
