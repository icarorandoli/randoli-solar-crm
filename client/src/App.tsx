import { Switch, Route, Redirect } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import HomePage from "@/pages/home";
import ClientesPage from "@/pages/clientes";
import VendasPage from "@/pages/vendas";
import KitsPage from "@/pages/kits";
import ColaboradoresPage from "@/pages/colaboradores";
import ContratosPage from "@/pages/contratos";
import PropostasPage from "@/pages/propostas";
import NovaProposta from "@/pages/nova-proposta";
import PropostaView from "@/pages/proposta-view";
import ContaPage from "@/pages/conta";
import ProjetosPage from "@/pages/projetos";
import ObrasPage from "@/pages/obras";
import PosVendaPage from "@/pages/pos-venda";
import AgendaPage from "@/pages/agenda";
import LoginPage from "@/pages/login";
import { Bell, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface AuthUser { id: string; username: string; nome: string; cargo: string; }

function useAuth() {
  return useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

function getInitials(nome: string) {
  return nome.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/clientes" component={ClientesPage} />
      <Route path="/clientes/novo" component={ClientesPage} />
      <Route path="/propostas" component={PropostasPage} />
      <Route path="/propostas/nova" component={NovaProposta} />
      <Route path="/proposta/:id" component={PropostaView} />
      <Route path="/vendas" component={VendasPage} />
      <Route path="/kits" component={KitsPage} />
      <Route path="/colaboradores" component={ColaboradoresPage} />
      <Route path="/contratos" component={ContratosPage} />
      <Route path="/projetos" component={ProjetosPage} />
      <Route path="/obras" component={ObrasPage} />
      <Route path="/pos-venda" component={PosVendaPage} />
      <Route path="/agenda" component={AgendaPage} />
      <Route path="/conta" component={ContaPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

const style = { "--sidebar-width": "15rem", "--sidebar-width-icon": "3rem" };

function AppHeader({ user }: { user: AuthUser }) {
  const [location, navigate] = useLocation();
  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
      navigate("/login");
    },
  });

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-white dark:bg-card border-b border-border h-12 shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger data-testid="button-sidebar-toggle" className="text-muted-foreground" />
        <nav className="flex items-center gap-4 text-sm font-semibold">
          <span
            onClick={() => navigate("/")}
            className="text-primary tracking-wide cursor-pointer border-b-2 border-primary pb-0.5"
          >INÍCIO</span>
          <span
            onClick={() => navigate("/vendas")}
            className="text-muted-foreground tracking-wide cursor-pointer hover:text-foreground transition-colors"
          >NEGÓCIOS</span>
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost" data-testid="button-notifications" className="text-muted-foreground">
          <Bell className="w-5 h-5" />
        </Button>
        <div
          data-testid="avatar-user"
          onClick={() => navigate("/conta")}
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-xs cursor-pointer hover:bg-primary/90 transition-colors"
          title={user.nome}
        >
          {getInitials(user.nome)}
        </div>
        <Button
          size="icon"
          variant="ghost"
          data-testid="button-logout"
          title="Sair"
          className="text-muted-foreground"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}

function ProtectedApp() {
  const { data: user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <AppHeader user={user} />
          <main className="flex-1 overflow-auto bg-background">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          <Route path="/login" component={LoginPage} />
          <Route>
            <ProtectedApp />
          </Route>
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
