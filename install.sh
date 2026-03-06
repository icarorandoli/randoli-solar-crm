#!/bin/bash
# ================================================================
#  RANDOLI SOLAR CRM — Instalador Interativo v2.1
#  Compatível com: bash install.sh  E  curl URL | bash
# ================================================================
set -e

# --- Cores ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# --- Funções de output (sempre para stderr para não poluir capturas) ---
ok()    { echo -e "${GREEN}  ✔  $1${NC}" >&2; }
info()  { echo -e "${CYAN}  →  $1${NC}" >&2; }
warn()  { echo -e "${YELLOW}  ⚠  $1${NC}" >&2; }
error() { echo -e "${RED}  ✘  $1${NC}" >&2; }
sep()   { echo -e "${CYAN}────────────────────────────────────────────────────${NC}" >&2; }
br()    { echo "" >&2; }

# ----------------------------------------------------------------
# Leitura interativa — SEMPRE de /dev/tty, prompt para stderr
# ----------------------------------------------------------------
ask_input() {
  # Uso: ask_input "Pergunta" "padrão"  → imprime valor em stdout
  local prompt="$1"
  local default="$2"
  local result

  if [ -n "$default" ]; then
    printf "${BOLD}  → %s [%s]: ${NC}" "$prompt" "$default" >&2
  else
    printf "${BOLD}  → %s: ${NC}" "$prompt" >&2
  fi

  read -r result < /dev/tty
  printf '%s' "${result:-$default}"
}

ask_password() {
  # Uso: ask_password "Pergunta"  → imprime valor em stdout
  local prompt="$1"
  local result

  printf "${BOLD}  → %s: ${NC}" "$prompt" >&2
  read -rs result < /dev/tty
  echo "" >&2
  printf '%s' "$result"
}

ask_yesno() {
  # Uso: ask_yesno "Pergunta"  → retorna 0 (sim) ou 1 (não)
  local prompt="$1"
  local default="${2:-s}"
  local result

  printf "${BOLD}  → %s [S/n]: ${NC}" "$prompt" >&2
  read -r result < /dev/tty
  result="${result:-$default}"
  [[ "$result" =~ ^[Ss]$ ]]
}

# --- Validações ---
validate_domain() {
  echo "$1" | grep -qP '^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$' 2>/dev/null || \
  echo "$1" | grep -qE '^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$'
}
validate_email() {
  echo "$1" | grep -qE '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
}
validate_port() {
  [[ "$1" =~ ^[0-9]+$ ]] && [ "$1" -ge 1024 ] && [ "$1" -le 65535 ]
}

# ================================================================
#  BANNER
# ================================================================
clear
echo -e "${CYAN}${BOLD}" >&2
echo "  ██████╗  █████╗ ███╗   ██╗██████╗  ██████╗ ██╗     ██╗" >&2
echo "  ██╔══██╗██╔══██╗████╗  ██║██╔══██╗██╔═══██╗██║     ██║" >&2
echo "  ██████╔╝███████║██╔██╗ ██║██║  ██║██║   ██║██║     ██║" >&2
echo "  ██╔══██╗██╔══██║██║╚██╗██║██║  ██║██║   ██║██║     ██║" >&2
echo "  ██║  ██║██║  ██║██║ ╚████║██████╔╝╚██████╔╝███████╗██║" >&2
echo "  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝  ╚═════╝ ╚══════╝╚═╝" >&2
echo -e "${NC}" >&2
echo -e "${BOLD}         ☀  SOLAR CRM — Instalador Interativo v2.1${NC}" >&2
br

# ================================================================
#  ETAPA 1 — CONFIGURAÇÃO DA APLICAÇÃO
# ================================================================
echo -e "${BOLD}${YELLOW}[1/4] CONFIGURAÇÃO DA APLICAÇÃO${NC}" >&2
br

# Nome da aplicação
APP_NAME=$(ask_input "Nome da aplicação (sem espaços)" "randoli-crm")
APP_NAME=$(echo "$APP_NAME" | sed 's/ /-/g' | tr '[:upper:]' '[:lower:]')
ok "Nome: $APP_NAME"

# Diretório
INSTALL_DIR=$(ask_input "Diretório de instalação" "/var/www/$APP_NAME")
ok "Diretório: $INSTALL_DIR"

# Porta
PORT=""
while true; do
  PORT=$(ask_input "Porta do servidor (use 5001+ se já tem outro sistema na 5000)" "5001")
  if validate_port "$PORT"; then
    ok "Porta: $PORT"
    break
  else
    error "Porta inválida. Use um número entre 1024 e 65535."
  fi
done

# URL do repositório
REPO_URL=$(ask_input "URL do repositório Git" "https://github.com/icarorandoli/randoli-solar-crm.git")
ok "Repositório: $REPO_URL"

br

# ================================================================
#  ETAPA 2 — DOMÍNIO E SSL
# ================================================================
echo -e "${BOLD}${YELLOW}[2/4] DOMÍNIO E SSL${NC}" >&2
br

DOMAIN=""
while true; do
  DOMAIN=$(ask_input "Domínio (ex: crm.randolisolar.com.br) — Enter para pular" "")
  if [ -z "$DOMAIN" ]; then
    warn "Sem domínio. Acesso disponível por IP:$PORT"
    break
  elif validate_domain "$DOMAIN"; then
    ok "Domínio: $DOMAIN"
    break
  else
    error "Domínio inválido. Formato esperado: subdominio.seudominio.com.br"
  fi
done

CONFIGURE_SSL="n"
SSL_EMAIL=""
if [ -n "$DOMAIN" ]; then
  if ask_yesno "Configurar SSL gratuito (Let's Encrypt)?"; then
    CONFIGURE_SSL="s"
    while true; do
      SSL_EMAIL=$(ask_input "E-mail para o certificado SSL" "contato@randolisolar.com.br")
      if validate_email "$SSL_EMAIL"; then
        ok "E-mail SSL: $SSL_EMAIL"
        break
      else
        error "E-mail inválido."
      fi
    done
  else
    warn "SSL não será configurado agora."
  fi
fi

br

# ================================================================
#  ETAPA 3 — SEGURANÇA
# ================================================================
echo -e "${BOLD}${YELLOW}[3/4] SEGURANÇA${NC}" >&2
br

AUTO_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null \
  || openssl rand -hex 32 2>/dev/null \
  || cat /dev/urandom | tr -dc 'a-f0-9' | head -c 64)

echo -e "  ${CYAN}Chave secreta gerada: ${YELLOW}${AUTO_SECRET:0:16}...${NC}" >&2

SESSION_SECRET="$AUTO_SECRET"
if ! ask_yesno "Usar chave gerada automaticamente? (recomendado)"; then
  while true; do
    SESSION_SECRET=$(ask_password "Digite sua chave secreta (mínimo 32 caracteres)")
    if [ ${#SESSION_SECRET} -ge 32 ]; then
      ok "Chave secreta: configurada manualmente"
      break
    else
      error "A chave precisa ter pelo menos 32 caracteres (você digitou ${#SESSION_SECRET})."
    fi
  done
else
  ok "Chave secreta: gerada automaticamente"
fi

br

# ================================================================
#  RESUMO E CONFIRMAÇÃO
# ================================================================
sep
echo -e "${BOLD}${YELLOW}  RESUMO DA INSTALAÇÃO${NC}" >&2
sep
br
echo -e "  ${BOLD}Aplicação:${NC}   $APP_NAME" >&2
echo -e "  ${BOLD}Diretório:${NC}   $INSTALL_DIR" >&2
echo -e "  ${BOLD}Porta:${NC}       $PORT" >&2
echo -e "  ${BOLD}Repositório:${NC} $REPO_URL" >&2
if [ -n "$DOMAIN" ]; then
  echo -e "  ${BOLD}Domínio:${NC}     $DOMAIN" >&2
  echo -e "  ${BOLD}SSL:${NC}         $([ "$CONFIGURE_SSL" = "s" ] && echo "Sim — $SSL_EMAIL" || echo "Não")" >&2
else
  echo -e "  ${BOLD}Domínio:${NC}     não configurado (IP:$PORT)" >&2
fi
echo -e "  ${BOLD}Secret:${NC}      ${SESSION_SECRET:0:8}...${SESSION_SECRET: -8}" >&2
br
sep
br

if ! ask_yesno "Confirmar e iniciar instalação?"; then
  warn "Instalação cancelada."
  exit 0
fi

br
echo -e "${BOLD}${CYAN}[4/4] INSTALANDO...${NC}" >&2
br

# ================================================================
#  INSTALAÇÃO
# ================================================================

# --- Node.js ---
if ! command -v node &> /dev/null; then
  info "Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
  sudo apt-get install -y nodejs > /dev/null 2>&1
  ok "Node.js $(node --version) instalado"
else
  ok "Node.js $(node --version) já instalado"
fi

# --- PM2 ---
if ! command -v pm2 &> /dev/null; then
  info "Instalando PM2..."
  sudo npm install -g pm2 > /dev/null 2>&1
  ok "PM2 instalado"
else
  ok "PM2 $(pm2 --version) já instalado"
fi

# --- Nginx ---
if [ -n "$DOMAIN" ] && ! command -v nginx &> /dev/null; then
  info "Instalando Nginx..."
  sudo apt-get install -y nginx > /dev/null 2>&1
  ok "Nginx instalado"
fi

# --- Clonar/Atualizar repositório ---
if [ -d "$INSTALL_DIR/.git" ]; then
  info "Atualizando código existente..."
  cd "$INSTALL_DIR"
  git pull origin main > /dev/null 2>&1 && ok "Código atualizado" || warn "Falha ao atualizar — usando versão atual"
else
  info "Clonando repositório..."
  sudo mkdir -p "$INSTALL_DIR"
  sudo chown "$USER:$USER" "$INSTALL_DIR"
  if git clone "$REPO_URL" "$INSTALL_DIR" > /dev/null 2>&1; then
    ok "Repositório clonado"
  else
    error "Falha ao clonar. Para repositório privado use:"
    echo "  git clone https://SEU_TOKEN@github.com/icarorandoli/randoli-solar-crm.git $INSTALL_DIR" >&2
    exit 1
  fi
fi

cd "$INSTALL_DIR"

# --- Arquivo .env ---
info "Criando arquivo de configuração..."
cat > .env <<EOF
# Randoli Solar CRM — gerado em $(date '+%d/%m/%Y %H:%M')
PORT=$PORT
NODE_ENV=production
SESSION_SECRET=$SESSION_SECRET
APP_DOMAIN=${DOMAIN:-localhost}
EOF
ok ".env criado"

# --- Dependências e build ---
info "Instalando dependências (1–2 min)..."
npm install --production=false > /dev/null 2>&1
ok "Dependências instaladas"

info "Compilando aplicação..."
npm run build > /dev/null 2>&1
ok "Build concluído"

# --- PM2 ---
info "Iniciando com PM2..."
pm2 delete "$APP_NAME" > /dev/null 2>&1 || true
pm2 start npm --name "$APP_NAME" -- start > /dev/null 2>&1
pm2 save > /dev/null 2>&1
PM2_CMD=$(pm2 startup 2>&1 | grep "sudo env" | head -1)
[ -n "$PM2_CMD" ] && eval "$PM2_CMD" > /dev/null 2>&1 || true
ok "Aplicação rodando com PM2"

# --- Nginx + SSL ---
if [ -n "$DOMAIN" ] && command -v nginx &> /dev/null; then
  info "Configurando Nginx para $DOMAIN..."
  NGINX_CONF="/etc/nginx/sites-available/$APP_NAME"

  sudo tee "$NGINX_CONF" > /dev/null <<NGINXEOF
server {
    listen 80;
    server_name $DOMAIN;
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
NGINXEOF

  sudo ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/$APP_NAME"

  if sudo nginx -t > /dev/null 2>&1; then
    sudo systemctl reload nginx
    ok "Nginx configurado para $DOMAIN"

    if [ "$CONFIGURE_SSL" = "s" ]; then
      info "Configurando SSL (Let's Encrypt)..."
      command -v certbot &> /dev/null || sudo apt-get install -y certbot python3-certbot-nginx > /dev/null 2>&1
      if sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$SSL_EMAIL" > /dev/null 2>&1; then
        ok "HTTPS ativo em https://$DOMAIN"
      else
        warn "SSL falhou — o DNS do domínio precisa apontar para este servidor."
        warn "Execute depois: sudo certbot --nginx -d $DOMAIN"
      fi
    fi
  else
    warn "Erro no Nginx. Verifique: sudo nginx -t"
  fi
fi

# ================================================================
#  RESULTADO FINAL
# ================================================================
br
sep
echo -e "${BOLD}${GREEN}  ✅  INSTALAÇÃO CONCLUÍDA!${NC}" >&2
sep
br
[ -n "$DOMAIN" ] && [ "$CONFIGURE_SSL" = "s" ] && echo -e "  ${BOLD}Acesse:${NC}  ${GREEN}https://$DOMAIN${NC}" >&2
[ -n "$DOMAIN" ] && [ "$CONFIGURE_SSL" != "s" ] && echo -e "  ${BOLD}Acesse:${NC}  ${CYAN}http://$DOMAIN${NC}" >&2
echo -e "  ${BOLD}Local:${NC}   http://localhost:$PORT" >&2
br
echo -e "  ${BOLD}Gerenciar:${NC}" >&2
echo -e "    pm2 status              → status" >&2
echo -e "    pm2 logs $APP_NAME      → logs" >&2
echo -e "    pm2 restart $APP_NAME   → reiniciar" >&2
echo -e "    pm2 stop $APP_NAME      → parar" >&2
br
echo -e "  ${BOLD}Configuração:${NC} $INSTALL_DIR/.env" >&2
br
sep
