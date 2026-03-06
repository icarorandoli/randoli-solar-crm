#!/bin/bash
# ============================================================
#  RANDOLI SOLAR CRM — Instalador Completo v3.0
#  Compatível com: bash install.sh   |   curl URL | bash
# ============================================================
#
#  O que este script instala:
#    • Node.js 20 (se não instalado)
#    • PM2 (gerenciador de processos)
#    • Nginx (proxy reverso)
#    • Certbot (SSL gratuito — opcional)
#    • Randoli Solar CRM (clone + build + start)
#
#  Funciona em paralelo com outros sistemas na mesma VPS.
# ============================================================

set -eo pipefail

# ---- Cores ------------------------------------------------
R='\033[0;31m'   # vermelho
G='\033[0;32m'   # verde
Y='\033[1;33m'   # amarelo
C='\033[0;36m'   # ciano
B='\033[1m'      # negrito
N='\033[0m'      # reset

# ---- Helpers ----------------------------------------------
ok()   { echo -e "${G}  ✔  ${1}${N}"; }
fail() { echo -e "${R}  ✘  ${1}${N}"; }
info() { echo -e "${C}  ▶  ${1}${N}"; }
warn() { echo -e "${Y}  ⚠  ${1}${N}"; }
step() { echo -e "\n${B}${Y}━━━  ${1}  ━━━${N}\n"; }
line() { echo -e "${C}──────────────────────────────────────────────────${N}"; }

# Prompt direto do terminal (funciona com curl | bash)
prompt() {
  # uso: prompt "Mensagem" "padrão" VARIAVEL
  local msg="$1" def="$2" var="$3"
  if [ -n "$def" ]; then
    printf "${B}  ➤  %s [%s]: ${N}" "$msg" "$def" > /dev/tty
  else
    printf "${B}  ➤  %s: ${N}" "$msg" > /dev/tty
  fi
  local val
  read -r val < /dev/tty
  val="${val:-$def}"
  eval "$var='$val'"
}

prompt_secret() {
  local msg="$1" var="$2"
  printf "${B}  ➤  %s: ${N}" "$msg" > /dev/tty
  local val
  read -rs val < /dev/tty
  echo "" > /dev/tty
  eval "$var='$val'"
}

prompt_yn() {
  # Retorna 0=sim 1=não
  local msg="$1" def="${2:-s}"
  printf "${B}  ➤  %s [S/n]: ${N}" "$msg" > /dev/tty
  local val
  read -r val < /dev/tty
  val="${val:-$def}"
  [[ "$val" =~ ^[Ss]$ ]]
}

check_port_free() {
  ! ss -tlnp 2>/dev/null | grep -q ":${1} " && \
  ! lsof -i ":${1}" 2>/dev/null | grep -q LISTEN
}

# ============================================================
#  BANNER
# ============================================================
clear
echo ""
echo -e "${C}${B}"
echo "   ┌─────────────────────────────────────────────────┐"
echo "   │       ☀  RANDOLI SOLAR CRM                      │"
echo "   │       Instalador Completo v3.0                   │"
echo "   │       Sistema de CRM para Energia Solar          │"
echo "   └─────────────────────────────────────────────────┘"
echo -e "${N}"
echo -e "  Node.js 20 + Express + React + PM2 + Nginx + SSL"
echo ""
line

# ============================================================
#  PRÉ-VERIFICAÇÃO DO SISTEMA
# ============================================================
step "PRÉ-VERIFICAÇÃO"

# Verificar SO
if [ -f /etc/os-release ]; then
  . /etc/os-release
  info "Sistema: $PRETTY_NAME"
else
  warn "Não foi possível identificar o SO. Continuando..."
fi

# Verificar sudo
if ! sudo -n true 2>/dev/null; then
  warn "Este script precisa de permissão sudo."
  echo ""
  sudo -v || { fail "Sem acesso sudo. Abortando."; exit 1; }
fi
ok "Permissão sudo OK"

# Verificar espaço em disco (mínimo 2GB)
DISK_FREE=$(df / | awk 'NR==2 {print $4}')
if [ "$DISK_FREE" -lt 2097152 ]; then
  warn "Menos de 2GB livres em disco. Pode causar problemas."
else
  ok "Espaço em disco OK ($(( DISK_FREE / 1024 ))MB livres)"
fi

# Verificar sistemas já rodando
USED_PORTS=$(ss -tlnp 2>/dev/null | grep -oP '(?<=:)\d+(?= )' 2>/dev/null | sort -n | tr '\n' ' ' || true)
[ -n "$USED_PORTS" ] && info "Portas em uso: $USED_PORTS" || info "Nenhuma porta em uso detectada"

# Verificar PM2 já instalado
PM2_APPS=""
if command -v pm2 &>/dev/null; then
  PM2_APPS=$(pm2 list 2>/dev/null | grep -oP '│\s+\K[a-zA-Z0-9_-]+(?=\s+│\s+\w+\s+│\s+online)' 2>/dev/null | tr '\n' ', ' || true)
  [ -n "$PM2_APPS" ] && info "Apps PM2 rodando: ${PM2_APPS%,}" || info "PM2 instalado, sem apps ativos"
fi

echo ""

# ============================================================
#  PASSO 1 — CONFIGURAÇÃO DA APLICAÇÃO
# ============================================================
step "PASSO 1/5 — CONFIGURAÇÃO DA APLICAÇÃO"

# Nome da aplicação
prompt "Nome da aplicação (sem espaços, sem acentos)" "randoli-crm" APP_NAME
APP_NAME=$(echo "$APP_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-')
[ -z "$APP_NAME" ] && APP_NAME="randoli-crm"
ok "Nome: $APP_NAME"

# Diretório de instalação
prompt "Diretório de instalação" "/var/www/$APP_NAME" INSTALL_DIR
ok "Diretório: $INSTALL_DIR"

# Porta (verificar se está livre)
echo "" > /dev/tty
info "Dica: se já tem outro sistema rodando na porta 5000, use 5001 ou outra livre."
while true; do
  prompt "Porta do servidor" "5001" PORT
  if [[ "$PORT" =~ ^[0-9]+$ ]] && [ "$PORT" -ge 1024 ] && [ "$PORT" -le 65535 ]; then
    if check_port_free "$PORT"; then
      ok "Porta $PORT está livre ✔"
      break
    else
      fail "Porta $PORT já está em uso! Escolha outra."
    fi
  else
    fail "Porta inválida. Use um número entre 1024 e 65535."
  fi
done

# URL do repositório Git
prompt "URL do repositório Git" "https://github.com/icarorandoli/randoli-solar-crm.git" REPO_URL
ok "Repositório: $REPO_URL"

# Token Git (para repositório privado)
echo ""
info "Se o repositório for privado, informe seu Personal Access Token do GitHub."
info "Deixe em branco se for público ou se já configurou git credentials."
prompt "GitHub Token (deixe vazio se público)" "" GIT_TOKEN
if [ -n "$GIT_TOKEN" ]; then
  # Embutir token na URL
  REPO_DOMAIN=$(echo "$REPO_URL" | sed 's|https://github.com/|github.com/|')
  REPO_URL="https://${GIT_TOKEN}@${REPO_DOMAIN}"
  ok "Token GitHub configurado"
else
  ok "Repositório público (sem token)"
fi

# ============================================================
#  PASSO 2 — DOMÍNIO E SSL
# ============================================================
step "PASSO 2/5 — DOMÍNIO E SSL"

info "Informe o domínio que vai apontar para este servidor."
info "Ex: crm.randolisolar.com.br"
info "Deixe vazio para acessar apenas por IP (pode configurar depois)."
echo ""

DOMAIN=""
while true; do
  prompt "Domínio (Enter para pular)" "" DOMAIN
  if [ -z "$DOMAIN" ]; then
    warn "Sem domínio. Acesso via http://SEU_IP:${PORT}"
    break
  elif echo "$DOMAIN" | grep -qE '^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$'; then
    ok "Domínio: $DOMAIN"
    break
  else
    fail "Domínio inválido. Formato esperado: crm.seudominio.com.br"
  fi
done

CONFIGURE_SSL="n"
SSL_EMAIL=""
if [ -n "$DOMAIN" ]; then
  echo ""
  info "O SSL (HTTPS) é gratuito via Let's Encrypt."
  info "ATENÇÃO: O domínio precisa já estar apontando para este servidor (DNS configurado)."
  echo ""
  if prompt_yn "Configurar SSL gratuito (Let's Encrypt)?"; then
    CONFIGURE_SSL="s"
    while true; do
      prompt "E-mail para o certificado SSL" "contato@randolisolar.com.br" SSL_EMAIL
      if echo "$SSL_EMAIL" | grep -qE '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'; then
        ok "E-mail SSL: $SSL_EMAIL"
        break
      else
        fail "E-mail inválido."
      fi
    done
  else
    warn "SSL não configurado agora. Configure depois com: sudo certbot --nginx -d $DOMAIN"
  fi
fi

# ============================================================
#  PASSO 3 — SEGURANÇA
# ============================================================
step "PASSO 3/5 — SEGURANÇA"

# Gerar SESSION_SECRET automático
AUTO_SECRET=$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null \
  || openssl rand -hex 32 2>/dev/null \
  || (cat /dev/urandom | tr -dc 'a-f0-9' | head -c 64; echo))

echo ""
info "Chave secreta gerada: ${AUTO_SECRET:0:12}...${AUTO_SECRET: -8}"
echo ""
if prompt_yn "Usar chave gerada automaticamente? (recomendado)"; then
  SESSION_SECRET="$AUTO_SECRET"
  ok "Chave secreta: automática"
else
  while true; do
    prompt_secret "Digite sua chave secreta (mínimo 32 caracteres)" SESSION_SECRET
    LEN=${#SESSION_SECRET}
    if [ "$LEN" -ge 32 ]; then
      ok "Chave secreta: configurada ($LEN caracteres)"
      break
    else
      fail "Chave muito curta ($LEN caracteres). Mínimo: 32."
    fi
  done
fi

# ============================================================
#  RESUMO — CONFIRMAÇÃO
# ============================================================
echo ""
line
echo -e "${B}${Y}  RESUMO DA INSTALAÇÃO${N}"
line
echo ""
echo -e "  ${B}Aplicação:${N}      $APP_NAME"
echo -e "  ${B}Diretório:${N}      $INSTALL_DIR"
echo -e "  ${B}Porta:${N}          $PORT"
if [ -n "$DOMAIN" ]; then
  echo -e "  ${B}Domínio:${N}        $DOMAIN"
  echo -e "  ${B}SSL:${N}            $([ "$CONFIGURE_SSL" = "s" ] && echo "Sim (Let's Encrypt — $SSL_EMAIL)" || echo "Não")"
else
  echo -e "  ${B}Domínio:${N}        Não configurado (acesso por IP:$PORT)"
fi
echo -e "  ${B}Session Secret:${N} ${SESSION_SECRET:0:8}...${SESSION_SECRET: -8}"
echo ""
line
echo ""
echo -e "${Y}  Nenhum sistema existente será interrompido.${N}"
echo -e "${Y}  Um novo processo PM2 e um novo site Nginx serão criados.${N}"
echo ""

if ! prompt_yn "Confirmar e iniciar instalação?"; then
  warn "Instalação cancelada pelo usuário."
  exit 0
fi

# ============================================================
#  PASSO 4 — INSTALAÇÃO DAS DEPENDÊNCIAS
# ============================================================
step "PASSO 4/5 — INSTALANDO DEPENDÊNCIAS DO SISTEMA"

# Atualizar lista de pacotes (silencioso)
info "Atualizando lista de pacotes..."
sudo apt-get update -qq > /dev/null 2>&1
ok "Lista de pacotes atualizada"

# --- Node.js 20 ---
if command -v node &>/dev/null && node -e "process.exit(parseInt(process.version.slice(1)) >= 20 ? 0 : 1)" 2>/dev/null; then
  ok "Node.js $(node --version) já instalado (v20+)"
else
  info "Instalando Node.js 20..."
  sudo apt-get install -y ca-certificates curl gnupg > /dev/null 2>&1
  sudo mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg 2>/dev/null
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
    | sudo tee /etc/apt/sources.list.d/nodesource.list > /dev/null
  sudo apt-get update -qq > /dev/null 2>&1
  sudo apt-get install -y nodejs > /dev/null 2>&1
  ok "Node.js $(node --version) instalado"
fi

# --- npm ---
ok "npm $(npm --version) disponível"

# --- PM2 ---
if command -v pm2 &>/dev/null; then
  ok "PM2 $(pm2 --version) já instalado"
else
  info "Instalando PM2..."
  sudo npm install -g pm2 > /dev/null 2>&1
  ok "PM2 $(pm2 --version) instalado"
fi

# --- Git ---
if command -v git &>/dev/null; then
  ok "Git $(git --version | cut -d' ' -f3) já instalado"
else
  info "Instalando Git..."
  sudo apt-get install -y git > /dev/null 2>&1
  ok "Git instalado"
fi

# --- Nginx ---
if command -v nginx &>/dev/null; then
  ok "Nginx já instalado"
elif [ -n "$DOMAIN" ]; then
  info "Instalando Nginx..."
  sudo apt-get install -y nginx > /dev/null 2>&1
  sudo systemctl enable nginx > /dev/null 2>&1
  sudo systemctl start nginx > /dev/null 2>&1
  ok "Nginx instalado e iniciado"
fi

# --- Certbot (SSL) ---
if [ "$CONFIGURE_SSL" = "s" ]; then
  if command -v certbot &>/dev/null; then
    ok "Certbot já instalado"
  else
    info "Instalando Certbot..."
    sudo apt-get install -y certbot python3-certbot-nginx > /dev/null 2>&1
    ok "Certbot instalado"
  fi
fi

# ============================================================
#  PASSO 5 — INSTALAÇÃO DA APLICAÇÃO
# ============================================================
step "PASSO 5/5 — INSTALANDO RANDOLI SOLAR CRM"

# --- Clonar ou Atualizar ---
if [ -d "$INSTALL_DIR/.git" ]; then
  info "Diretório já existe — atualizando código..."
  cd "$INSTALL_DIR"
  if git pull origin main > /dev/null 2>&1; then
    ok "Código atualizado do repositório"
  else
    warn "Falha ao atualizar. Continuando com versão atual."
  fi
else
  info "Clonando repositório..."
  sudo mkdir -p "$(dirname "$INSTALL_DIR")"
  sudo chown -R "$USER:$USER" "$(dirname "$INSTALL_DIR")" 2>/dev/null || true

  if git clone "$REPO_URL" "$INSTALL_DIR" > /dev/null 2>&1; then
    ok "Repositório clonado em $INSTALL_DIR"
  else
    fail "Falha ao clonar o repositório."
    echo ""
    echo "  Verifique se:"
    echo "  1. A URL está correta: $REPO_URL"
    echo "  2. O repositório é público OU você informou o token correto"
    echo "  3. Há conexão com a internet"
    echo ""
    echo "  Para clonar manualmente:"
    echo "  git clone SUA_URL $INSTALL_DIR"
    exit 1
  fi
fi

cd "$INSTALL_DIR"

# --- Arquivo .env ---
info "Criando arquivo de configuração (.env)..."
cat > .env <<ENVEOF
# Randoli Solar CRM — Configuração de Produção
# Gerado em: $(date '+%d/%m/%Y às %H:%M')
# NÃO compartilhe este arquivo!

# Porta do servidor (deve ser única na VPS)
PORT=$PORT

# Ambiente
NODE_ENV=production

# Chave secreta para sessões (não altere em produção sem reiniciar)
SESSION_SECRET=$SESSION_SECRET

# Domínio configurado
APP_DOMAIN=${DOMAIN:-localhost}
ENVEOF
ok ".env criado"

# --- npm install ---
info "Instalando dependências npm (pode levar 2-3 minutos)..."
if npm install --production=false > /tmp/npm-install-${APP_NAME}.log 2>&1; then
  ok "Dependências instaladas"
else
  fail "Erro ao instalar dependências. Log: /tmp/npm-install-${APP_NAME}.log"
  tail -20 "/tmp/npm-install-${APP_NAME}.log"
  exit 1
fi

# --- Build de produção ---
info "Compilando aplicação para produção..."
if npm run build > /tmp/build-${APP_NAME}.log 2>&1; then
  ok "Build concluído com sucesso"
else
  fail "Erro no build. Log: /tmp/build-${APP_NAME}.log"
  tail -20 "/tmp/build-${APP_NAME}.log"
  exit 1
fi

# Verificar se o build gerou os arquivos esperados
if [ ! -f "$INSTALL_DIR/dist/index.cjs" ]; then
  fail "Arquivo dist/index.cjs não encontrado após o build."
  exit 1
fi
ok "Binário de produção: dist/index.cjs ✔"

# --- PM2: iniciar nova instância sem parar as existentes ---
info "Configurando PM2..."
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  # App já existe no PM2 — reiniciar
  pm2 restart "$APP_NAME" > /dev/null 2>&1
  ok "App PM2 '$APP_NAME' reiniciado"
else
  # Nova instância — não para nenhum app existente
  pm2 start node \
    --name "$APP_NAME" \
    --cwd "$INSTALL_DIR" \
    -- dist/index.cjs > /dev/null 2>&1
  ok "App PM2 '$APP_NAME' iniciado (porta $PORT)"
fi
pm2 save > /dev/null 2>&1

# Configurar PM2 para iniciar com o sistema (apenas se não estiver configurado)
PM2_STARTUP=$(pm2 startup 2>&1 | grep "^sudo" | head -1 || true)
if [ -n "$PM2_STARTUP" ]; then
  eval "$PM2_STARTUP" > /dev/null 2>&1 && ok "PM2 configurado para auto-start" || true
else
  ok "PM2 auto-start já configurado"
fi

# Aguardar app subir
sleep 3
if pm2 describe "$APP_NAME" 2>/dev/null | grep -q "online"; then
  ok "App rodando: http://localhost:$PORT"
else
  warn "App pode não ter subido. Verifique: pm2 logs $APP_NAME"
fi

# --- Nginx ---
if [ -n "$DOMAIN" ] && command -v nginx &>/dev/null; then
  info "Configurando Nginx para $DOMAIN..."
  NGINX_CONF="/etc/nginx/sites-available/$APP_NAME"

  sudo tee "$NGINX_CONF" > /dev/null <<NGINXEOF
# Randoli Solar CRM — $DOMAIN
# Gerado em: $(date '+%d/%m/%Y')
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    client_max_body_size 50M;
    keepalive_timeout 65;

    # Logs específicos desta aplicação
    access_log /var/log/nginx/${APP_NAME}-access.log;
    error_log  /var/log/nginx/${APP_NAME}-error.log;

    location / {
        proxy_pass         http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade          \$http_upgrade;
        proxy_set_header   Connection       'upgrade';
        proxy_set_header   Host             \$host;
        proxy_set_header   X-Real-IP        \$remote_addr;
        proxy_set_header   X-Forwarded-For  \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400s;
        proxy_buffering    off;
    }
}
NGINXEOF

  # Ativar site (sem afetar outros sites)
  sudo ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/$APP_NAME"

  if sudo nginx -t > /dev/null 2>&1; then
    sudo systemctl reload nginx
    ok "Nginx configurado para $DOMAIN"

    # --- SSL ---
    if [ "$CONFIGURE_SSL" = "s" ]; then
      info "Obtendo certificado SSL para $DOMAIN..."
      if sudo certbot --nginx -d "$DOMAIN" \
          --non-interactive --agree-tos -m "$SSL_EMAIL" \
          --redirect > /tmp/certbot-${APP_NAME}.log 2>&1; then
        ok "HTTPS ativo! Certificado SSL instalado."
      else
        warn "Certbot falhou. Causas possíveis:"
        warn "  1. O DNS do domínio ainda não aponta para este servidor"
        warn "  2. Firewall bloqueando porta 80"
        warn "Execute depois: sudo certbot --nginx -d $DOMAIN"
      fi
    fi
  else
    warn "Configuração do Nginx tem erros. Verifique: sudo nginx -t"
    sudo nginx -t 2>&1 | grep -i error || true
  fi
fi

# Firewall: liberar porta (se ufw estiver ativo)
if command -v ufw &>/dev/null && sudo ufw status 2>/dev/null | grep -q "Status: active"; then
  if [ -n "$DOMAIN" ]; then
    sudo ufw allow 'Nginx Full' > /dev/null 2>&1 && ok "Firewall: Nginx Full liberado" || true
  else
    sudo ufw allow "$PORT/tcp" > /dev/null 2>&1 && ok "Firewall: porta $PORT liberada" || true
  fi
fi

# ============================================================
#  RESULTADO FINAL
# ============================================================
echo ""
line
echo -e "${G}${B}"
echo "   ╔══════════════════════════════════════════════════╗"
echo "   ║   ✅  INSTALAÇÃO CONCLUÍDA COM SUCESSO!          ║"
echo "   ╚══════════════════════════════════════════════════╝"
echo -e "${N}"
echo ""

if [ -n "$DOMAIN" ] && [ "$CONFIGURE_SSL" = "s" ]; then
  echo -e "  ${B}Acesse o sistema:${N}  ${G}https://$DOMAIN${N}"
elif [ -n "$DOMAIN" ]; then
  echo -e "  ${B}Acesse o sistema:${N}  ${C}http://$DOMAIN${N}"
fi

# Obter IP público
PUB_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "SEU_IP")
echo -e "  ${B}Acesso direto:${N}    http://${PUB_IP}:${PORT}"
echo ""
echo -e "  ${B}Aplicação:${N}  $APP_NAME   |   ${B}Porta:${N} $PORT"
echo -e "  ${B}Diretório:${N}  $INSTALL_DIR"
echo -e "  ${B}Config:${N}     $INSTALL_DIR/.env"
echo ""
line
echo ""
echo -e "  ${B}Gerenciar a aplicação:${N}"
echo -e "    pm2 status                    → ver todos os apps"
echo -e "    pm2 logs $APP_NAME            → logs em tempo real"
echo -e "    pm2 restart $APP_NAME         → reiniciar"
echo -e "    pm2 stop $APP_NAME            → parar"
echo -e "    pm2 delete $APP_NAME          → remover do PM2"
echo ""
echo -e "  ${B}Atualizar sistema (nova versão):${N}"
echo -e "    cd $INSTALL_DIR"
echo -e "    git pull origin main"
echo -e "    npm install && npm run build"
echo -e "    pm2 restart $APP_NAME"
echo ""
line
echo ""
