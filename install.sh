#!/bin/bash
# ================================================================
#  RANDOLI SOLAR CRM — Instalador Interativo
#  Versão 2.0
# ================================================================

# Redireciona stdin para o terminal mesmo quando executado via pipe (curl | bash)
exec < /dev/tty

set -e

# --- Cores ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # Sem cor

# --- Funções auxiliares ---
ok()    { echo -e "${GREEN}  ✔  $1${NC}"; }
info()  { echo -e "${CYAN}  →  $1${NC}"; }
warn()  { echo -e "${YELLOW}  ⚠  $1${NC}"; }
error() { echo -e "${RED}  ✘  $1${NC}"; }
ask()   { echo -e "${BOLD}${BLUE}$1${NC}"; }
sep()   { echo -e "${CYAN}────────────────────────────────────────────────────${NC}"; }

# Validar domínio (ex: crm.randolisolar.com.br)
validate_domain() {
  echo "$1" | grep -qP '^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$'
}

# Validar e-mail
validate_email() {
  echo "$1" | grep -qP '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
}

# Validar porta (1024–65535)
validate_port() {
  [[ "$1" =~ ^[0-9]+$ ]] && [ "$1" -ge 1024 ] && [ "$1" -le 65535 ]
}

# Leitura com valor padrão
read_default() {
  local prompt="$1"
  local default="$2"
  local result
  if [ -n "$default" ]; then
    read -rp "$(echo -e "${BOLD}  → ${prompt} [${default}]: ${NC}")" result
    echo "${result:-$default}"
  else
    read -rp "$(echo -e "${BOLD}  → ${prompt}: ${NC}")" result
    echo "$result"
  fi
}

# Leitura de senha (sem eco)
read_password() {
  local prompt="$1"
  local result
  read -rsp "$(echo -e "${BOLD}  → ${prompt}: ${NC}")" result
  echo ""
  echo "$result"
}

# ================================================================
#  BANNER
# ================================================================
clear
echo ""
echo -e "${CYAN}${BOLD}"
echo "  ██████╗  █████╗ ███╗   ██╗██████╗  ██████╗ ██╗     ██╗"
echo "  ██╔══██╗██╔══██╗████╗  ██║██╔══██╗██╔═══██╗██║     ██║"
echo "  ██████╔╝███████║██╔██╗ ██║██║  ██║██║   ██║██║     ██║"
echo "  ██╔══██╗██╔══██║██║╚██╗██║██║  ██║██║   ██║██║     ██║"
echo "  ██║  ██║██║  ██║██║ ╚████║██████╔╝╚██████╔╝███████╗██║"
echo "  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝  ╚═════╝ ╚══════╝╚═╝"
echo -e "${NC}"
echo -e "${BOLD}         ☀  SOLAR CRM — Instalador Interativo v2.0${NC}"
echo ""
sep
echo ""

# ================================================================
#  ETAPA 1 — CONFIGURAÇÃO DA APLICAÇÃO
# ================================================================
echo -e "${BOLD}${YELLOW}[1/4] CONFIGURAÇÃO DA APLICAÇÃO${NC}"
echo ""

# Nome identificador da aplicação
APP_NAME=$(read_default "Nome da aplicação (sem espaços)" "randoli-crm")
APP_NAME=$(echo "$APP_NAME" | tr ' ' '-' | tr '[:upper:]' '[:lower:]')
ok "Nome da aplicação: $APP_NAME"

# Diretório de instalação
INSTALL_DIR=$(read_default "Diretório de instalação" "/var/www/$APP_NAME")
ok "Diretório: $INSTALL_DIR"

# Porta
while true; do
  PORT=$(read_default "Porta do servidor (use 5001+ se já tem outro sistema na 5000)" "5001")
  if validate_port "$PORT"; then
    ok "Porta: $PORT"
    break
  else
    error "Porta inválida. Use um número entre 1024 e 65535."
  fi
done

# URL do repositório Git
REPO_URL=$(read_default "URL do repositório Git" "https://github.com/icarorandoli/randoli-solar-crm.git")
ok "Repositório: $REPO_URL"

echo ""

# ================================================================
#  ETAPA 2 — DOMÍNIO E SSL
# ================================================================
echo -e "${BOLD}${YELLOW}[2/4] DOMÍNIO E SSL${NC}"
echo ""

# Domínio
DOMAIN=""
while true; do
  DOMAIN=$(read_default "Domínio (ex: crm.randolisolar.com.br) — deixe vazio para pular" "")
  if [ -z "$DOMAIN" ]; then
    warn "Sem domínio configurado. O sistema ficará acessível apenas por IP:porta."
    break
  elif validate_domain "$DOMAIN"; then
    ok "Domínio: $DOMAIN"
    break
  else
    error "Domínio inválido. Use o formato: subdominio.seudominio.com.br"
  fi
done

# SSL
CONFIGURE_SSL="n"
SSL_EMAIL=""
if [ -n "$DOMAIN" ]; then
  read -rp "$(echo -e "${BOLD}  → Configurar SSL gratuito (Let's Encrypt)? [S/n]: ${NC}")" SSL_RESP
  SSL_RESP="${SSL_RESP:-s}"
  if [[ "$SSL_RESP" =~ ^[Ss]$ ]]; then
    CONFIGURE_SSL="s"
    while true; do
      SSL_EMAIL=$(read_default "E-mail para o certificado SSL" "contato@randolisolar.com.br")
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

echo ""

# ================================================================
#  ETAPA 3 — SEGURANÇA E BANCO DE DADOS
# ================================================================
echo -e "${BOLD}${YELLOW}[3/4] SEGURANÇA${NC}"
echo ""

# Session Secret
AUTO_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || openssl rand -hex 32)
echo -e "  ${CYAN}Chave secreta gerada automaticamente: ${YELLOW}${AUTO_SECRET:0:16}...${NC}"
read -rp "$(echo -e "${BOLD}  → Usar chave gerada automaticamente? [S/n]: ${NC}")" USE_AUTO
USE_AUTO="${USE_AUTO:-s}"

if [[ "$USE_AUTO" =~ ^[Ss]$ ]]; then
  SESSION_SECRET="$AUTO_SECRET"
  ok "Chave secreta: gerada automaticamente"
else
  while true; do
    SESSION_SECRET=$(read_password "Digite sua chave secreta (mínimo 32 caracteres)")
    if [ ${#SESSION_SECRET} -ge 32 ]; then
      ok "Chave secreta: configurada"
      break
    else
      error "A chave precisa ter pelo menos 32 caracteres."
    fi
  done
fi

echo ""

# ================================================================
#  RESUMO E CONFIRMAÇÃO
# ================================================================
echo ""
sep
echo -e "${BOLD}${YELLOW}  RESUMO DA INSTALAÇÃO${NC}"
sep
echo ""
echo -e "  ${BOLD}Aplicação:${NC}      $APP_NAME"
echo -e "  ${BOLD}Diretório:${NC}      $INSTALL_DIR"
echo -e "  ${BOLD}Porta:${NC}          $PORT"
echo -e "  ${BOLD}Repositório:${NC}    $REPO_URL"
if [ -n "$DOMAIN" ]; then
  echo -e "  ${BOLD}Domínio:${NC}        $DOMAIN"
  echo -e "  ${BOLD}SSL:${NC}            $([ "$CONFIGURE_SSL" = "s" ] && echo "Sim (Let's Encrypt)" || echo "Não")"
  if [ "$CONFIGURE_SSL" = "s" ]; then
    echo -e "  ${BOLD}E-mail SSL:${NC}     $SSL_EMAIL"
  fi
else
  echo -e "  ${BOLD}Domínio:${NC}        não configurado (acesso por IP:$PORT)"
fi
echo -e "  ${BOLD}Session Secret:${NC} ${SESSION_SECRET:0:8}...${SESSION_SECRET: -8}"
echo ""
sep
echo ""

read -rp "$(echo -e "${BOLD}${GREEN}  Confirmar instalação? [S/n]: ${NC}")" CONFIRM
CONFIRM="${CONFIRM:-s}"
if [[ ! "$CONFIRM" =~ ^[Ss]$ ]]; then
  echo ""
  warn "Instalação cancelada."
  exit 0
fi

echo ""
echo -e "${BOLD}${CYAN}[4/4] INSTALANDO...${NC}"
echo ""

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
  info "Atualizando repositório existente..."
  cd "$INSTALL_DIR"
  git pull origin main > /dev/null 2>&1 && ok "Código atualizado" || warn "Falha ao atualizar — continuando com versão atual"
else
  info "Clonando repositório..."
  sudo mkdir -p "$INSTALL_DIR"
  sudo chown "$USER:$USER" "$INSTALL_DIR"
  if git clone "$REPO_URL" "$INSTALL_DIR" > /dev/null 2>&1; then
    ok "Repositório clonado"
  else
    error "Falha ao clonar. Verifique a URL e suas credenciais."
    echo ""
    echo "  Se for repositório privado, use:"
    echo "  git clone https://SEU_TOKEN@github.com/icarorandoli/randoli-solar-crm.git $INSTALL_DIR"
    exit 1
  fi
fi

cd "$INSTALL_DIR"

# --- Configurar .env ---
info "Configurando variáveis de ambiente..."
cat > .env <<EOF
# Randoli Solar CRM — Configuração de Produção
# Gerado em: $(date '+%d/%m/%Y %H:%M')

# Servidor
PORT=$PORT
NODE_ENV=production

# Segurança
SESSION_SECRET=$SESSION_SECRET

# Domínio (informativo)
APP_DOMAIN=${DOMAIN:-localhost}
EOF
ok ".env criado"

# --- Instalar dependências e compilar ---
info "Instalando dependências (pode levar 1–2 min)..."
npm install --production=false > /dev/null 2>&1
ok "Dependências instaladas"

info "Compilando para produção..."
npm run build > /dev/null 2>&1
ok "Build concluído"

# --- PM2 ---
info "Iniciando aplicação com PM2..."
pm2 delete "$APP_NAME" > /dev/null 2>&1 || true
pm2 start npm --name "$APP_NAME" -- start > /dev/null 2>&1
pm2 save > /dev/null 2>&1

# Configurar PM2 para iniciar com o sistema
if ! pm2 startup 2>/dev/null | grep -q "already"; then
  PM2_STARTUP=$(pm2 startup 2>&1 | grep "sudo" | tail -1)
  if [ -n "$PM2_STARTUP" ]; then
    eval "$PM2_STARTUP" > /dev/null 2>&1 && ok "PM2 configurado para iniciar com o sistema" || true
  fi
fi
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
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }
}
NGINXEOF

  sudo ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/$APP_NAME"

  if sudo nginx -t > /dev/null 2>&1; then
    sudo systemctl reload nginx
    ok "Nginx configurado para $DOMAIN"

    if [ "$CONFIGURE_SSL" = "s" ]; then
      info "Configurando SSL com Let's Encrypt..."
      if ! command -v certbot &> /dev/null; then
        sudo apt-get install -y certbot python3-certbot-nginx > /dev/null 2>&1
      fi
      if sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$SSL_EMAIL" > /dev/null 2>&1; then
        ok "SSL configurado — HTTPS ativo em https://$DOMAIN"
      else
        warn "SSL falhou — o domínio precisa apontar para este servidor para o Let's Encrypt funcionar."
        warn "Execute depois: sudo certbot --nginx -d $DOMAIN"
      fi
    fi
  else
    warn "Erro na configuração do Nginx. Verifique: sudo nginx -t"
  fi
fi

# ================================================================
#  RESULTADO FINAL
# ================================================================
echo ""
sep
echo -e "${BOLD}${GREEN}  ✅  INSTALAÇÃO CONCLUÍDA COM SUCESSO!${NC}"
sep
echo ""
if [ -n "$DOMAIN" ] && [ "$CONFIGURE_SSL" = "s" ]; then
  echo -e "  ${BOLD}Acesse:${NC}   ${GREEN}https://$DOMAIN${NC}"
elif [ -n "$DOMAIN" ]; then
  echo -e "  ${BOLD}Acesse:${NC}   ${CYAN}http://$DOMAIN${NC}"
fi
echo -e "  ${BOLD}Local:${NC}    http://localhost:$PORT"
echo ""
echo -e "  ${BOLD}Comandos úteis:${NC}"
echo -e "    pm2 status                  — Ver status da aplicação"
echo -e "    pm2 logs $APP_NAME          — Ver logs em tempo real"
echo -e "    pm2 restart $APP_NAME       — Reiniciar a aplicação"
echo -e "    pm2 stop $APP_NAME          — Parar a aplicação"
echo ""
echo -e "  ${BOLD}Arquivo de configuração:${NC}"
echo -e "    $INSTALL_DIR/.env"
echo ""
sep
echo ""
