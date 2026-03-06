# Azume Solar CRM — Randoli Solar

Sistema CRM completo para empresas de energia solar, desenvolvido para a **Randoli Solar**. Clone funcional do Azume CRM.

## Funcionalidades

- **Dashboard** — Visão geral com estatísticas, propostas recentes e agenda
- **Clientes** — Cadastro completo com todos os campos (CPF, WhatsApp, CEP, Origem, etc.)
- **Propostas** — Wizard de 6 etapas com geração de PDF imprimível
- **Funil de Vendas** — Kanban board com pipeline de vendas
- **Kits Solares** — Catálogo com cadastro detalhado (módulos, inversores, acessórios)
- **Contratos** — Templates Word (.docx) com preenchimento automático de tags
- **Projetos / Obras / Pós-Venda** — Gestão de operações
- **Agenda** — Agendamento de visitas e reuniões
- **Colaboradores** — Gestão de equipe
- **Minha Conta** — Dados da empresa, configurações e suporte

## Tecnologias

- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + ShadCN UI
- **Backend:** Node.js + Express.js
- **Estado:** TanStack Query v5
- **Roteamento:** Wouter
- **Armazenamento:** In-memory (MemStorage)

## Instalação Rápida (Uma linha)

```bash
curl -fsSL https://raw.githubusercontent.com/icarorandoli/randoli-solar-crm/main/install.sh | bash
```

> **Nota:** Substitua `icarorandoli` pelo seu nome de usuário do GitHub após criar o repositório.

## Instalação Manual

### Pré-requisitos

- Node.js 20+ (recomendado: usar nvm)
- npm 9+
- Git

### Passos

```bash
# 1. Clonar o repositório
git clone https://github.com/icarorandoli/randoli-solar-crm.git
cd randoli-solar-crm

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# 4. Iniciar o servidor
npm run dev        # Modo desenvolvimento
# ou
npm run build && npm start  # Modo produção
```

O sistema estará disponível em: `http://localhost:5000`

## Instalação em VPS (com Nginx + PM2)

### Instalação completa em um comando:

```bash
curl -fsSL https://raw.githubusercontent.com/icarorandoli/randoli-solar-crm/main/install.sh | bash -s -- --port=5001 --domain=crm.seudominio.com.br
```

### Instalação manual na VPS:

```bash
# 1. Instalar Node.js (se não tiver)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Instalar PM2 globalmente
sudo npm install -g pm2

# 3. Clonar e instalar
git clone https://github.com/icarorandoli/randoli-solar-crm.git /var/www/randoli-crm
cd /var/www/randoli-crm
npm install
npm run build

# 4. Iniciar com PM2 (porta 5001 para não conflitar)
PORT=5001 pm2 start npm --name "randoli-crm" -- start
pm2 save
pm2 startup

# 5. Configurar Nginx (proxy reverso)
sudo nano /etc/nginx/sites-available/randoli-crm
```

**Configuração Nginx (`/etc/nginx/sites-available/randoli-crm`):**

```nginx
server {
    listen 80;
    server_name crm.seudominio.com.br;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Ativar o site
sudo ln -s /etc/nginx/sites-available/randoli-crm /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL com Let's Encrypt (opcional)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d crm.seudominio.com.br
```

### Mesma VPS com outro sistema?

**Sim!** Basta usar uma porta diferente (ex: 5001, 5002) e configurar o Nginx com diferentes `server_name` (subdomínios diferentes). Cada aplicação roda na sua própria porta, e o Nginx roteia o tráfego pelos domínios.

## Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor | `5000` |
| `NODE_ENV` | Ambiente (`development`/`production`) | `development` |
| `SESSION_SECRET` | Chave secreta para sessões | Obrigatório |

## Estrutura do Projeto

```
├── client/              # Frontend React
│   ├── src/
│   │   ├── pages/       # Páginas da aplicação
│   │   ├── components/  # Componentes reutilizáveis
│   │   └── assets/      # Imagens e recursos estáticos
├── server/              # Backend Express
│   ├── routes.ts        # Rotas da API
│   ├── storage.ts       # Armazenamento (in-memory)
│   └── index.ts         # Ponto de entrada
└── shared/
    └── schema.ts        # Schema compartilhado (tipos, validação)
```

## Scripts Disponíveis

```bash
npm run dev      # Inicia em modo desenvolvimento (porta 5000)
npm run build    # Compila para produção
npm start        # Inicia em modo produção
```

## Personalização

Para adaptar para outra empresa:
1. Substitua o logo em `client/src/assets/randoli-solar-logo.png`
2. Atualize os dados da empresa em `server/routes.ts` (função `buildTagData`)
3. Atualize os dados em `client/src/pages/conta.tsx` (estado inicial do formulário)

## Licença

Uso privado — Randoli Solar © 2026
