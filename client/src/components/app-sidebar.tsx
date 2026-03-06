import { Link, useLocation } from "wouter";
import {
  Home, Users, FileText, DollarSign,
  FolderKanban, HardHat, RefreshCw,
  Calendar, Package, UserCheck,
  ScrollText, User, ChevronDown, ChevronRight,
  Plus, LayoutGrid, List,
} from "lucide-react";
import { useState } from "react";
import {
  Sidebar, SidebarContent, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarGroup, SidebarGroupContent,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import logoPath from "@/assets/randoli-solar-logo.png";

type NavItem = {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
};

const navItems: NavItem[] = [
  { label: "INÍCIO", href: "/", icon: Home },
  {
    label: "CLIENTES", icon: Users,
    children: [
      { label: "MEUS CLIENTES", href: "/clientes", icon: Users },
      { label: "REGISTRAR CLIENTE", href: "/clientes", icon: Plus },
    ]
  },
  {
    label: "PROPOSTAS", icon: FileText,
    children: [
      { label: "MINHAS PROPOSTAS", href: "/propostas", icon: List },
      { label: "GERAR PROPOSTA", href: "/propostas/nova", icon: Plus },
    ]
  },
  {
    label: "VENDAS", icon: DollarSign,
    children: [
      { label: "FUNIL DE VENDAS", href: "/vendas", icon: LayoutGrid },
    ]
  },
  {
    label: "PROJETOS", icon: FolderKanban,
    children: [
      { label: "QUADRO DE PROJETOS", href: "/projetos", icon: LayoutGrid },
    ]
  },
  {
    label: "OBRAS", icon: HardHat,
    children: [
      { label: "QUADRO DE OBRAS", href: "/obras", icon: LayoutGrid },
    ]
  },
  {
    label: "PÓS-VENDA", icon: RefreshCw,
    children: [
      { label: "QUADRO DE ATIVIDADES", href: "/pos-venda", icon: LayoutGrid },
    ]
  },
  { label: "AGENDA", href: "/agenda", icon: Calendar },
  {
    label: "KITS", icon: Package,
    children: [
      { label: "MEUS KITS", href: "/kits", icon: Package },
      { label: "REGISTRAR KIT", href: "/kits", icon: Plus },
    ]
  },
  { label: "COLABORADORES", href: "/colaboradores", icon: UserCheck },
  { label: "CONTRATOS", href: "/contratos", icon: ScrollText },
  { label: "MINHA CONTA", href: "/conta", icon: User },
];

export function AppSidebar() {
  const [location] = useLocation();
  const [expanded, setExpanded] = useState<string[]>(["CLIENTES", "VENDAS"]);

  const toggle = (label: string) => {
    setExpanded(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };

  const isActive = (href: string) => location === href;

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border bg-gray-950 p-0">
        <div className="flex items-center justify-center py-2 px-3">
          <img src={logoPath} alt="Randoli Solar" className="h-14 w-auto object-contain" />
        </div>
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                if (!item.children) {
                  const Icon = item.icon!;
                  const active = item.href ? isActive(item.href) : false;
                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton asChild data-active={active}>
                        <Link href={item.href!}>
                          <Icon className={cn("w-4 h-4", active ? "text-primary" : "text-muted-foreground")} />
                          <span className={cn("text-xs font-semibold tracking-wide", active ? "text-primary" : "text-sidebar-foreground")}>
                            {item.label}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                const isOpen = expanded.includes(item.label);
                const Icon = item.icon!;
                const anyChildActive = item.children.some(c => isActive(c.href));

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      onClick={() => toggle(item.label)}
                      className="cursor-pointer"
                      data-active={anyChildActive}
                    >
                      <Icon className={cn("w-4 h-4", anyChildActive ? "text-primary" : "text-muted-foreground")} />
                      <span className={cn("text-xs font-semibold tracking-wide flex-1", anyChildActive ? "text-primary" : "text-sidebar-foreground")}>
                        {item.label}
                      </span>
                      {isOpen
                        ? <ChevronDown className="w-3 h-3 text-muted-foreground" />
                        : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                    </SidebarMenuButton>
                    {isOpen && (
                      <div className="ml-2 border-l border-sidebar-border pl-2 mt-0.5 mb-1">
                        {item.children.map(child => {
                          const ChildIcon = child.icon;
                          const childActive = isActive(child.href);
                          return (
                            <Link key={`${child.href}-${child.label}`} href={child.href}>
                              <div className={cn(
                                "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-xs tracking-wide font-medium transition-colors",
                                childActive
                                  ? "text-primary bg-primary/10"
                                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                              )}>
                                <ChildIcon className={cn("w-3.5 h-3.5", childActive ? "text-primary" : "")} />
                                {child.label}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
