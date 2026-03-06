# Azume Solar CRM Clone

A full-featured CRM for solar energy companies, cloned from Azume.com.br.

## Architecture

**Frontend:** React + TypeScript + Vite + TailwindCSS + ShadCN UI
**Backend:** Express.js with in-memory storage (MemStorage)
**State Management:** TanStack Query v5
**Routing:** Wouter

## Features

### Pages / Modules
- **Dashboard (Início)** - Company overview, latest proposals, agenda, vendas, financiamentos
- **Clientes** - Customer management with full-page form matching Azume: profile photo upload, CPF toggle, WhatsApp, CEP, UF/Cidade, Origem do Cliente, dataNascimento, RG, Nacionalidade, Profissão, Renda Mensal, Observações, "REGISTRAR E GERAR PROPOSTA" button (creates client then opens wizard)
- **Minha Conta (/conta)** - Account page with left sidebar: Dados da Empresa (logo, company info, social links, CNPJ, responsible person), Financeiro, Configurações (20 config tiles), Chamar Suporte, Tickets de Suporte, Sair
- **Propostas** - Sales proposals (list view + 6-step wizard + printable view at /proposta/:id)
  - Step 1: Cadastro UCs (client data, concessionária, consumo mensal, dimensionamento)
  - Step 2: Kit FV (select registered kit, link to venda)
  - Step 3: Precificação (auto/manual pricing, custos, Condições de Pagamento → fed into contracts)
  - Step 4: Validação (25-year projection table)
  - Step 5: Financiamento (placeholder)
  - Step 6: Finalização (theme color picker, validity, GERAR PROPOSTA → creates record + navigates to printable view)
  - Printable view: /proposta/:id — shows company header, system summary, kit details, 25-year table, payment conditions, print button
  - Auto-fills from registered clients: selecting a name from datalist populates email, cidade, uf, endereco
- **Vendas** - Sales funnel (Kanban board with drag-free status columns)
- **Kits** - Solar kit catalog with full-page wizard form (modules, inverters, complementary items)
- **Colaboradores** - Team member management
- **Contratos** - Contract templates with .docx upload, Tags tab (100+ tags), auto-fill generation
- **Projetos** - Project management board
- **Obras** - Construction management board
- **Pós-Venda** - Post-sale activity tracking
- **Agenda** - Calendar events/appointments
- **Financiamentos** - Financing (placeholder)

### Design
- Teal/cyan primary color matching Azume brand (#00A9C0 equivalent)
- White sidebar with collapsible navigation
- Card-based layout throughout
- Responsive grid layouts
- Status badges with color coding

## API Routes

All prefixed with `/api/`:
- `/clientes` - CRUD
- `/vendas` - CRUD
- `/kits` - CRUD
- `/colaboradores` - CRUD
- `/contratos` - CRUD
- `/projetos` - CRUD
- `/obras` - CRUD
- `/atividades` - CRUD (pós-venda)
- `/agenda` - CRUD
- `/propostas` - CRUD
- `/stats` - Dashboard statistics

## Seed Data

Pre-populated with realistic Brazilian solar company data:
- 12 clients
- 8 sales in the funnel
- 15 solar kits
- 2 collaborators
- 5 contract templates
- 3 projects, 2 constructions, 2 post-sale activities
- 2 agenda items, 10 proposals
