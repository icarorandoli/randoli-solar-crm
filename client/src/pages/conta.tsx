import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Building2, DollarSign, Settings, HelpCircle, Ticket, LogOut, ExternalLink, Upload } from "lucide-react";
import logoPath from "@/assets/randoli-solar-logo.png";
import { cn } from "@/lib/utils";

type Section = "empresa" | "financeiro" | "configuracoes" | "suporte" | "tickets";

const MENU_ITEMS = [
  { id: "empresa" as Section, label: "DADOS DA EMPRESA", icon: Building2 },
  { id: "financeiro" as Section, label: "FINANCEIRO", icon: DollarSign },
  { id: "configuracoes" as Section, label: "CONFIGURAÇÕES", icon: Settings },
  { id: "suporte" as Section, label: "CHAMAR SUPORTE", icon: HelpCircle },
  { id: "tickets" as Section, label: "TICKETS DE SUPORTE", icon: Ticket },
];

const CONFIG_ITEMS = [
  { label: "AZUME FINANCEIRO", icon: "💰" },
  { label: "ORIGENS DE CLIENTES", icon: "📣" },
  { label: "MOTIVOS DE PERDAS", icon: "📉" },
  { label: "REPROVAS DE PROJETOS", icon: "👎" },
  { label: "FORMAS DE PAGAMENTO", icon: "💳" },
  { label: "CARGOS DE COLABORADORES", icon: "💼" },
  { label: "PASTAS PADRÕES DE ARQUIVOS", icon: "📁" },
  { label: "TIPOS DE NOTAS", icon: "📝" },
  { label: "TIPO DE PRECIFICAÇÃO", icon: "🔍" },
  { label: "REGRAS DE PRECIFICAÇÃO", icon: "💲" },
  { label: "SIMULAÇÕES DE FINANCIAMENTO", icon: "📊" },
  { label: "CHECKLISTS", icon: "✅" },
  { label: "PREFERÊNCIAS", icon: "⚙️" },
  { label: "PERMISSÕES GERAIS", icon: "🔒" },
  { label: "LINK DA PROPOSTA", icon: "🔗" },
  { label: "TARIFAS DE ENERGIA", icon: "⚡" },
  { label: "INTERFACE", icon: "🖥️" },
  { label: "FORNECEDORES INTEGRADOS", icon: "🔌" },
  { label: "EQUIPES", icon: "👥" },
  { label: "INTEGRAÇÕES WEBHOOKS", icon: "🔀" },
];

function FloatField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative border border-border rounded bg-white">
      <span className="absolute top-0.5 left-2 text-[10px] text-muted-foreground leading-none">{label}</span>
      <div className="pt-5 pb-2 px-2">{children}</div>
    </div>
  );
}

export default function ContaPage() {
  const [section, setSection] = useState<Section>("empresa");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [empresa, setEmpresa] = useState({
    nome: "RANDOLI SOLAR",
    gerente: "ICARO RANDOLI",
    endereco: "RUA HATSUE SAKAGUSCHI Nº 599 SINOP-MT",
    telefone: "(66) 99239-7086",
    whatsapp: "(66) 99239-7086",
    website: "randolisolar.com.br",
    facebook: "RandoliSolarSinop",
    instagram: "randolisolarsinop",
    cnpj: "43.201.226/0001-63",
    nomeResponsavel: "ICARO RANDOLI E SILVA",
    cpfResponsavel: "018.516.701-22",
    rgResponsavel: "13827626",
    nacionalidadeResponsavel: "BRASILEIRO",
    profissaoResponsavel: "TEC ELETROTECNICO",
  });

  const upd = (field: string, value: string) => setEmpresa(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    toast({ title: "Dados atualizados com sucesso!" });
  };

  return (
    <div className="flex min-h-full bg-background">
      <div className="w-64 flex-shrink-0 bg-white border-r border-border">
        <div className="p-4 border-b border-border">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl mx-auto mb-2">
            IR
          </div>
          <p className="text-center text-sm font-semibold text-foreground">ICARO RANDOLI</p>
          <p className="text-center text-xs text-muted-foreground">GERENTE · RANDOLI SOLAR</p>
        </div>
        <nav className="p-2">
          {MENU_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              data-testid={`menu-conta-${id}`}
              onClick={() => setSection(id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-sm font-medium transition-colors mb-1",
                section === id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
          <button
            data-testid="menu-conta-sair"
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            SAIR
          </button>
        </nav>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {section === "empresa" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-900 flex items-center justify-center overflow-hidden cursor-pointer border-4 border-white shadow-lg">
                    <img src={logoPath} alt="Randoli Solar" className="w-full h-full object-contain p-1" />
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white shadow-sm hover:bg-primary/90 transition-colors">
                    <Upload className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <FloatField label="Nome da Empresa">
                  <Input value={empresa.nome} onChange={e => upd("nome", e.target.value)} className="border-0 p-0 h-5 text-sm focus-visible:ring-0" data-testid="input-nome-empresa" />
                </FloatField>
                <FloatField label="Nome do Gerente">
                  <Input value={empresa.gerente} onChange={e => upd("gerente", e.target.value)} className="border-0 p-0 h-5 text-sm focus-visible:ring-0" data-testid="input-nome-gerente" />
                </FloatField>
              </div>

              <div className="mb-3">
                <FloatField label="Endereço">
                  <Input value={empresa.endereco} onChange={e => upd("endereco", e.target.value)} className="border-0 p-0 h-5 text-sm focus-visible:ring-0" />
                </FloatField>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <FloatField label="Telefone">
                  <Input value={empresa.telefone} onChange={e => upd("telefone", e.target.value)} className="border-0 p-0 h-5 text-sm focus-visible:ring-0" />
                </FloatField>
                <FloatField label="Whatsapp">
                  <Input value={empresa.whatsapp} onChange={e => upd("whatsapp", e.target.value)} className="border-0 p-0 h-5 text-sm focus-visible:ring-0" />
                </FloatField>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-1">
                <FloatField label="Website">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">www.</span>
                    <Input value={empresa.website} onChange={e => upd("website", e.target.value)} className="border-0 p-0 h-5 text-sm focus-visible:ring-0 flex-1" />
                  </div>
                </FloatField>
                <FloatField label="Facebook">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">@</span>
                    <Input value={empresa.facebook} onChange={e => upd("facebook", e.target.value)} className="border-0 p-0 h-5 text-sm focus-visible:ring-0 flex-1" />
                  </div>
                </FloatField>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button onClick={() => window.open(`https://${empresa.website}`, "_blank")} className="text-xs text-primary text-center hover:underline flex items-center justify-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Testar link do website
                </button>
                <button onClick={() => window.open(`https://facebook.com/${empresa.facebook}`, "_blank")} className="text-xs text-primary text-center hover:underline flex items-center justify-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Testar link do Facebook
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-1">
                <FloatField label="Instagram">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">@</span>
                    <Input value={empresa.instagram} onChange={e => upd("instagram", e.target.value)} className="border-0 p-0 h-5 text-sm focus-visible:ring-0 flex-1" />
                  </div>
                </FloatField>
                <FloatField label="CNPJ">
                  <Input value={empresa.cnpj} onChange={e => upd("cnpj", e.target.value)} className="border-0 p-0 h-5 text-sm focus-visible:ring-0" />
                </FloatField>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button onClick={() => window.open(`https://instagram.com/${empresa.instagram}`, "_blank")} className="text-xs text-primary text-center hover:underline flex items-center justify-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Testar link do Instagram
                </button>
                <div />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <FloatField label="Nome do Responsável">
                  <Input value={empresa.nomeResponsavel} onChange={e => upd("nomeResponsavel", e.target.value)} className="border-0 p-0 h-5 text-sm focus-visible:ring-0" />
                </FloatField>
                <FloatField label="CPF do Responsável">
                  <Input value={empresa.cpfResponsavel} onChange={e => upd("cpfResponsavel", e.target.value)} className="border-0 p-0 h-5 text-sm focus-visible:ring-0" />
                </FloatField>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <FloatField label="RG do Responsável">
                  <Input value={empresa.rgResponsavel} onChange={e => upd("rgResponsavel", e.target.value)} className="border-0 p-0 h-5 text-sm focus-visible:ring-0" />
                </FloatField>
                <FloatField label="Nacionalidade do Responsável">
                  <Input value={empresa.nacionalidadeResponsavel} onChange={e => upd("nacionalidadeResponsavel", e.target.value)} className="border-0 p-0 h-5 text-sm focus-visible:ring-0" />
                </FloatField>
              </div>

              <div className="mb-4">
                <FloatField label="Profissão do Responsável">
                  <Input value={empresa.profissaoResponsavel} onChange={e => upd("profissaoResponsavel", e.target.value)} className="border-0 p-0 h-5 text-sm focus-visible:ring-0" />
                </FloatField>
              </div>

              <Button onClick={handleSave} className="w-full font-bold tracking-widest" data-testid="button-atualizar-empresa">
                ATUALIZAR
              </Button>
              <button className="w-full text-center text-sm text-primary hover:underline mt-3 block" onClick={() => toast({ title: "Funcionalidade de alteração de senha em breve" })}>
                Clique aqui para atualizar sua senha
              </button>
            </div>
          </div>
        )}

        {section === "financeiro" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-border rounded-xl p-8 shadow-sm text-center">
              <DollarSign className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground mb-2">Financeiro</h3>
              <p className="text-muted-foreground text-sm">Configure os parâmetros financeiros da empresa aqui.</p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                <FloatField label="Markup Padrão %">
                  <Input defaultValue="20" className="border-0 p-0 h-5 text-sm focus-visible:ring-0" />
                </FloatField>
                <FloatField label="Impostos %">
                  <Input defaultValue="3" className="border-0 p-0 h-5 text-sm focus-visible:ring-0" />
                </FloatField>
              </div>
              <Button className="w-full mt-4 font-bold tracking-widest" onClick={() => toast({ title: "Dados financeiros salvos!" })}>
                SALVAR
              </Button>
            </div>
          </div>
        )}

        {section === "configuracoes" && (
          <div>
            <h3 className="text-center text-lg font-semibold text-foreground mb-6">Escolha qual configuração você quer editar</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
              {CONFIG_ITEMS.map(({ label, icon }) => (
                <button
                  key={label}
                  data-testid={`config-${label.toLowerCase().replace(/ /g, "-")}`}
                  onClick={() => toast({ title: `${label} em breve`, description: "Esta configuração será disponibilizada em breve." })}
                  className="bg-primary hover:bg-primary/90 text-white rounded-lg p-4 flex flex-col items-center gap-2 transition-colors"
                >
                  <span className="text-2xl">{icon}</span>
                  <span className="text-[10px] font-bold tracking-wider text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {section === "suporte" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-border rounded-xl p-8 shadow-sm text-center">
              <HelpCircle className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground mb-2">Chamar Suporte</h3>
              <p className="text-muted-foreground text-sm mb-6">Entre em contato com nossa equipe de suporte.</p>
              <Button className="font-bold tracking-widest" onClick={() => window.open("https://wa.me/5566992397086", "_blank")}>
                CONTATAR VIA WHATSAPP
              </Button>
            </div>
          </div>
        )}

        {section === "tickets" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-border rounded-xl p-8 shadow-sm text-center">
              <Ticket className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground mb-2">Tickets de Suporte</h3>
              <p className="text-muted-foreground text-sm">Nenhum ticket aberto no momento.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
