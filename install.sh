#!/bin/bash
# ============================================================
#  RANDOLI SOLAR CRM — Instalador Completo v4.0
#  Compatível com: bash install.sh   |   curl URL | bash
# ============================================================
set -eo pipefail

# ---- Cores ------------------------------------------------
R='\033[0;31m'
G='\033[0;32m'
Y='\033[1;33m'
C='\033[0;36m'
B='\033[1m'
N='\033[0m'

ok()   { echo -e "${G}  ✔  ${1}${N}"; }
fail() { echo -e "${R}  ✘  ${1}${N}"; }
info() { echo -e "${C}  ▶  ${1}${N}"; }
warn() { echo -e "${Y}  ⚠  ${1}${N}"; }
step() { echo -e "\n${B}${Y}━━━  ${1}  ━━━${N}\n"; }
line() { echo -e "${C}──────────────────────────────────────────────────${N}"; }

# Prompt direto do terminal — funciona com curl | bash
prompt() {
  local msg="$1" def="$2" var="$3" val
  if [ -n "$def" ]; then
    printf "${B}  ➤  %s [%s]: ${N}" "$msg" "$def" > /dev/tty
  else
    printf "${B}  ➤  %s: ${N}" "$msg" > /dev/tty
  fi
  read -r val < /dev/tty
  val="${val:-$def}"
  eval "${var}='${val}'"
}

prompt_secret() {
  local msg="$1" var="$2" val
  printf "${B}  ➤  %s: ${N}" "$msg" > /dev/tty
  read -rs val < /dev/tty
  echo "" > /dev/tty
  eval "${var}='${val}'"
}

prompt_yn() {
  local msg="$1" def="${2:-s}" val
  printf "${B}  ➤  %s [S/n]: ${N}" "$msg" > /dev/tty
  read -r val < /dev/tty
  val="${val:-$def}"
  [[ "$val" =~ ^[Ss]$ ]]
}

check_port_free() {
  ! ss -tlnp 2>/dev/null | grep -q ":${1} " && \
  ! lsof -i ":${1}" 2>/dev/null | grep -q LISTEN
}

# Encontra configs do Nginx que já usam um determinado domínio
nginx_find_conflict() {
  local domain="$1"
  grep -rl "server_name.*${domain}" /etc/nginx/sites-enabled/ 2>/dev/null || true
}

# ============================================================
#  BANNER
# ============================================================
clear
echo ""
echo -e "${C}${B}"
echo "   ┌─────────────────────────────────────────────────┐"
echo "   │       ☀  RANDOLI SOLAR CRM                      │"
echo "   │       Instalador Completo v4.0                   │"
echo "   └─────────────────────────────────────────────────┘"
echo -e "${N}"
line

# ============================================================
#  PRÉ-VERIFICAÇÃO
# ============================================================
step "PRÉ-VERIFICAÇÃO DO SISTEMA"

if [ -f /etc/os-release ]; then
  . /etc/os-release
  info "Sistema: $PRETTY_NAME"
fi

if ! sudo -n true 2>/dev/null; then
  warn "Precisamos de acesso sudo."
  sudo -v || { fail "Sem acesso sudo. Abortando."; exit 1; }
fi
ok "Permissão sudo OK"

DISK_FREE=$(df / | awk 'NR==2 {print $4}')
if [ "$DISK_FREE" -lt 2097152 ]; then
  warn "Menos de 2GB livres em disco."
else
  ok "Espaço em disco: $(( DISK_FREE / 1024 ))MB livres"
fi

USED_PORTS=$(ss -tlnp 2>/dev/null | grep -oP '(?<=:)\d+(?= )' 2>/dev/null | sort -n | tr '\n' ' ' || true)
[ -n "$USED_PORTS" ] && info "Portas em uso: $USED_PORTS" || info "Sem portas detectadas"

PM2_APPS=""
if command -v pm2 &>/dev/null; then
  PM2_APPS=$(pm2 list 2>/dev/null | grep -oP '│\s+\K[a-zA-Z0-9_-]+(?=\s+│\s+\w+\s+│\s+online)' 2>/dev/null | tr '\n' ', ' || true)
  [ -n "$PM2_APPS" ] && info "Apps PM2 ativos: ${PM2_APPS%,}" || info "PM2 instalado, sem apps ativos"
fi

# ============================================================
#  LIMPEZA DE INSTALAÇÃO ANTERIOR
# ============================================================
step "LIMPEZA (instalação anterior)"

echo ""
info "Se já tentou instalar antes e quer começar do zero, informe"
info "os dados da instalação anterior para removê-la completamente."
echo ""
if prompt_yn "Deseja remover uma instalação anterior do CRM antes de continuar?"; then
  prompt "Nome PM2 da instalação anterior" "crm-randoli" OLD_APP
  prompt "Diretório da instalação anterior" "/home/crm-randoli" OLD_DIR
  prompt "Domínio Nginx da instalação anterior (Enter para pular)" "" OLD_DOMAIN

  echo ""
  info "Removendo instalação anterior..."

  # Parar e remover do PM2
  if command -v pm2 &>/dev/null && pm2 describe "$OLD_APP" > /dev/null 2>&1; then
    pm2 delete "$OLD_APP" > /dev/null 2>&1 && ok "PM2: app '$OLD_APP' removido" || true
    pm2 save > /dev/null 2>&1 || true
  else
    warn "App PM2 '$OLD_APP' não encontrado (ignorado)"
  fi

  # Remover diretório
  if [ -d "$OLD_DIR" ]; then
    sudo rm -rf "$OLD_DIR"
    ok "Diretório '$OLD_DIR' removido"
  else
    warn "Diretório '$OLD_DIR' não encontrado (ignorado)"
  fi

  # Remover configs Nginx desta instalação (pelo nome do app)
  OLD_NGINX_BY_NAME="/etc/nginx/sites-available/$OLD_APP"
  if [ -f "$OLD_NGINX_BY_NAME" ]; then
    sudo rm -f "/etc/nginx/sites-enabled/$OLD_APP" 2>/dev/null || true
    sudo rm -f "$OLD_NGINX_BY_NAME"
    ok "Nginx: config '$OLD_APP' removida"
  fi

  # Remover configs que contenham o domínio antigo
  if [ -n "$OLD_DOMAIN" ] && command -v nginx &>/dev/null; then
    CONFLICTING=$(nginx_find_conflict "$OLD_DOMAIN")
    if [ -n "$CONFLICTING" ]; then
      echo ""
      warn "Encontrei config(s) Nginx com o domínio '$OLD_DOMAIN':"
      echo "$CONFLICTING" | while read -r f; do
        echo -e "    ${R}$f${N}"
        BASENAME=$(basename "$f")
        warn "Desativar '$BASENAME'? (necessário para novo domínio funcionar)"
        if prompt_yn "Desativar '$BASENAME'?"; then
          sudo rm -f "$f"
          sudo rm -f "/etc/nginx/sites-available/$BASENAME" 2>/dev/null || true
          ok "Config '$BASENAME' removida"
        else
          warn "Mantida. O domínio pode continuar abrindo o sistema antigo."
        fi
      done
    else
      ok "Nenhum conflito Nginx encontrado para '$OLD_DOMAIN'"
    fi
    sudo nginx -t > /dev/null 2>&1 && sudo systemctl reload nginx 2>/dev/null || true
  fi

  echo ""
  ok "Limpeza concluída. Continuando com instalação limpa..."
else
  info "Pulando limpeza. Continuando com nova instalação."
fi

# ============================================================
#  PASSO 1 — CONFIGURAÇÃO DA APLICAÇÃO
# ============================================================
step "PASSO 1/5 — CONFIGURAÇÃO DA APLICAÇÃO"

prompt "Nome da aplicação (sem espaços, sem acentos)" "randoli-crm" APP_NAME
APP_NAME=$(echo "$APP_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-')
[ -z "$APP_NAME" ] && APP_NAME="randoli-crm"
ok "Nome: $APP_NAME"

prompt "Diretório de instalação" "/var/www/$APP_NAME" INSTALL_DIR
ok "Diretório: $INSTALL_DIR"

echo "" > /dev/tty
info "Dica: se já tem outro sistema na porta 5000, use 5001 ou outra livre."
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

prompt "URL do repositório Git" "https://github.com/icarorandoli/randoli-solar-crm.git" REPO_URL
ok "Repositório: $REPO_URL"

echo ""
info "Para repositório privado, informe seu Personal Access Token do GitHub."
info "Deixe em branco se for público."
prompt "GitHub Token (vazio se público)" "" GIT_TOKEN
if [ -n "$GIT_TOKEN" ]; then
  REPO_DOMAIN=$(echo "$REPO_URL" | sed 's|https://github.com/|github.com/|')
  REPO_URL="https://${GIT_TOKEN}@${REPO_DOMAIN}"
  ok "Token GitHub configurado"
else
  ok "Repositório público"
fi

# ============================================================
#  PASSO 2 — DOMÍNIO E SSL
# ============================================================
step "PASSO 2/5 — DOMÍNIO E SSL"

info "Informe o domínio que aponta para este servidor."
info "Ex: crm.randolisolar.com.br"
echo ""

DOMAIN=""
while true; do
  prompt "Domínio (Enter para pular)" "" DOMAIN
  if [ -z "$DOMAIN" ]; then
    warn "Sem domínio. Acesso via http://IP:${PORT}"
    break
  elif echo "$DOMAIN" | grep -qE '^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$'; then
    # Verificar conflito ANTES de prosseguir
    if command -v nginx &>/dev/null; then
      CONFLICT=$(nginx_find_conflict "$DOMAIN")
      if [ -n "$CONFLICT" ]; then
        echo ""
        warn "ATENÇÃO: o domínio '$DOMAIN' já está configurado em outro site Nginx:"
        echo "$CONFLICT" | while read -r f; do echo -e "    ${R}$f${N}"; done
        echo ""
        warn "Se continuar sem remover, o sistema ANTIGO vai continuar abrindo."
        echo ""
        if prompt_yn "Remover a(s) config(s) conflitante(s) acima agora?"; then
          echo "$CONFLICT" | while read -r f; do
            BNAME=$(basename "$f")
            sudo rm -f "$f"
            sudo rm -f "/etc/nginx/sites-available/$BNAME" 2>/dev/null || true
            ok "Config '$BNAME' removida"
          done
          sudo nginx -t > /dev/null 2>&1 && sudo systemctl reload nginx 2>/dev/null || true
          ok "Domínio '$DOMAIN' agora está livre"
        else
          warn "Conflito mantido. O antigo sistema continuará abrindo neste domínio."
        fi
      else
        ok "Domínio: $DOMAIN (sem conflito)"
      fi
    else
      ok "Domínio: $DOMAIN"
    fi
    break
  else
    fail "Domínio inválido. Formato esperado: crm.seudominio.com.br"
  fi
done

CONFIGURE_SSL="n"
SSL_EMAIL=""
if [ -n "$DOMAIN" ]; then
  echo ""
  info "ATENÇÃO: Para o SSL funcionar, o DNS já precisa estar apontando para este servidor."
  info "Verifique em: https://whatsmydns.net/#A/$DOMAIN"
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
    warn "SSL não configurado agora."
    warn "Execute depois: sudo certbot --nginx -d $DOMAIN"
  fi
fi

# ============================================================
#  PASSO 3 — SEGURANÇA
# ============================================================
step "PASSO 3/5 — SEGURANÇA"

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
      fail "Chave muito curta ($LEN chars). Mínimo: 32."
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
echo -e "  ${B}Aplicação:${N}   $APP_NAME"
echo -e "  ${B}Diretório:${N}   $INSTALL_DIR"
echo -e "  ${B}Porta:${N}       $PORT"
if [ -n "$DOMAIN" ]; then
  echo -e "  ${B}Domínio:${N}     $DOMAIN"
  echo -e "  ${B}SSL:${N}         $([ "$CONFIGURE_SSL" = "s" ] && echo "Sim ($SSL_EMAIL)" || echo "Não")"
else
  echo -e "  ${B}Domínio:${N}     Não configurado (IP:$PORT)"
fi
echo -e "  ${B}Secret:${N}      ${SESSION_SECRET:0:8}...${SESSION_SECRET: -8}"
echo ""
line
echo ""
echo -e "${Y}  Sistemas existentes no PM2 e Nginx NÃO serão afetados.${N}"
echo ""

if ! prompt_yn "Confirmar e iniciar instalação?"; then
  warn "Instalação cancelada."
  exit 0
fi

# ============================================================
#  PASSO 4 — DEPENDÊNCIAS DO SISTEMA
# ============================================================
step "PASSO 4/5 — INSTALANDO DEPENDÊNCIAS DO SISTEMA"

info "Atualizando lista de pacotes..."
sudo apt-get update -qq > /dev/null 2>&1
ok "Lista de pacotes atualizada"

# Node.js 20+
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
ok "npm $(npm --version) disponível"

# PM2
if command -v pm2 &>/dev/null; then
  ok "PM2 $(pm2 --version) já instalado"
else
  info "Instalando PM2..."
  sudo npm install -g pm2 > /dev/null 2>&1
  ok "PM2 instalado"
fi

# Git
if command -v git &>/dev/null; then
  ok "Git já instalado"
else
  info "Instalando Git..."
  sudo apt-get install -y git > /dev/null 2>&1
  ok "Git instalado"
fi

# Nginx
if command -v nginx &>/dev/null; then
  ok "Nginx já instalado"
elif [ -n "$DOMAIN" ]; then
  info "Instalando Nginx..."
  sudo apt-get install -y nginx > /dev/null 2>&1
  sudo systemctl enable nginx > /dev/null 2>&1
  sudo systemctl start nginx > /dev/null 2>&1
  ok "Nginx instalado"
fi

# Certbot
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

# Clonar ou atualizar
if [ -d "$INSTALL_DIR/.git" ]; then
  info "Atualizando código existente..."
  cd "$INSTALL_DIR"
  git pull origin main > /dev/null 2>&1 && ok "Código atualizado" || warn "Falha ao atualizar — usando versão atual"
else
  info "Clonando repositório..."
  sudo mkdir -p "$(dirname "$INSTALL_DIR")"
  sudo chown -R "$USER:$USER" "$(dirname "$INSTALL_DIR")" 2>/dev/null || true
  if git clone "$REPO_URL" "$INSTALL_DIR" > /dev/null 2>&1; then
    ok "Repositório clonado em $INSTALL_DIR"
  else
    fail "Falha ao clonar o repositório."
    echo ""
    echo "  Verifique:"
    echo "  1. URL correta: $REPO_URL"
    echo "  2. Repositório público OU token informado corretamente"
    echo "  3. Conexão com a internet"
    exit 1
  fi
fi

cd "$INSTALL_DIR"

# Arquivo .env
info "Criando arquivo de configuração (.env)..."
cat > .env <<ENVEOF
# Randoli Solar CRM — gerado em $(date '+%d/%m/%Y às %H:%M')
PORT=$PORT
NODE_ENV=production
SESSION_SECRET=$SESSION_SECRET
APP_DOMAIN=${DOMAIN:-localhost}
ENVEOF
ok ".env criado"

# npm install
info "Instalando dependências npm (2–3 minutos)..."
if npm install --production=false > /tmp/npm-install-${APP_NAME}.log 2>&1; then
  ok "Dependências instaladas"
else
  fail "Erro ao instalar dependências."
  tail -20 "/tmp/npm-install-${APP_NAME}.log"
  exit 1
fi

# Build
info "Compilando aplicação para produção..."
if npm run build > /tmp/build-${APP_NAME}.log 2>&1; then
  ok "Build concluído"
else
  fail "Erro no build."
  tail -20 "/tmp/build-${APP_NAME}.log"
  exit 1
fi

if [ ! -f "$INSTALL_DIR/dist/index.cjs" ]; then
  fail "dist/index.cjs não encontrado após o build."
  exit 1
fi
ok "Binário de produção: dist/index.cjs ✔"

# Criar diretório de dados persistentes
mkdir -p "$INSTALL_DIR/data"
ok "Diretório de dados criado: $INSTALL_DIR/data"

# PM2
info "Configurando PM2..."

# Criar arquivo de configuração do PM2 (garante variáveis de ambiente corretas)
cat > "$INSTALL_DIR/ecosystem.config.cjs" <<ECOEOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'dist/index.cjs',
    cwd: '$INSTALL_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: '$PORT',
      SESSION_SECRET: '$SESSION_SECRET',
      APP_DOMAIN: '${DOMAIN:-localhost}'
    }
  }]
}
ECOEOF

# Remover instância anterior apenas se for do mesmo diretório (segurança)
if command -v pm2 &>/dev/null && pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  EXISTING_CWD=$(pm2 jlist 2>/dev/null | python3 -c "
import json,sys
try:
  apps=json.load(sys.stdin)
  for a in apps:
    if a.get('name','') == '${APP_NAME}':
      print(a.get('pm2_env',{}).get('pm_cwd',''))
      break
except: pass
" 2>/dev/null || true)
  if [ -n "$EXISTING_CWD" ] && [ "$EXISTING_CWD" != "$INSTALL_DIR" ]; then
    echo ""
    warn "ATENÇÃO: Já existe um app PM2 chamado '$APP_NAME' rodando em:"
    warn "  $EXISTING_CWD"
    warn "Esse parece ser um sistema DIFERENTE do CRM."
    echo ""
    if ! prompt_yn "Tem CERTEZA que deseja substituí-lo? (isso vai parar o outro sistema)"; then
      fail "Instalação cancelada para proteger o outro sistema."
      echo ""
      info "Dica: Execute novamente e escolha um nome diferente para o CRM (ex: randoli-crm)"
      exit 1
    fi
  fi
  pm2 delete "$APP_NAME" > /dev/null 2>&1 || true
fi

# Iniciar com o ecosystem file (variáveis de ambiente explícitas)
pm2 start "$INSTALL_DIR/ecosystem.config.cjs" > /dev/null 2>&1
ok "App PM2 '$APP_NAME' iniciado (porta $PORT)"
pm2 save > /dev/null 2>&1

PM2_STARTUP=$(pm2 startup 2>&1 | grep "^sudo" | head -1 || true)
if [ -n "$PM2_STARTUP" ]; then
  eval "$PM2_STARTUP" > /dev/null 2>&1 && ok "PM2 auto-start configurado" || true
else
  ok "PM2 auto-start já configurado"
fi

sleep 3
if pm2 describe "$APP_NAME" 2>/dev/null | grep -q "online"; then
  ok "App rodando: http://localhost:$PORT"
else
  warn "App pode não ter subido. Verifique: pm2 logs $APP_NAME"
fi

# Nginx
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

  sudo ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/$APP_NAME"

  if sudo nginx -t > /dev/null 2>&1; then
    sudo systemctl reload nginx
    ok "Nginx configurado para $DOMAIN"

    if [ "$CONFIGURE_SSL" = "s" ]; then
      info "Obtendo certificado SSL (Let's Encrypt)..."
      if sudo certbot --nginx -d "$DOMAIN" \
          --non-interactive --agree-tos -m "$SSL_EMAIL" \
          --redirect > /tmp/certbot-${APP_NAME}.log 2>&1; then
        ok "HTTPS ativo! Certificado SSL instalado."
      else
        warn "Certbot falhou. Provavelmente o DNS ainda não propagou."
        warn "Quando o DNS propagar, execute:"
        warn "  sudo certbot --nginx -d $DOMAIN"
      fi
    fi
  else
    warn "Erro no Nginx:"
    sudo nginx -t 2>&1 | grep -i error || true
  fi
fi

# Firewall
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

PUB_IP=$(curl -s -4 ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "SEU_IP")

echo ""
[ -n "$DOMAIN" ] && [ "$CONFIGURE_SSL" = "s" ] && echo -e "  ${B}Acesse:${N}  ${G}https://$DOMAIN${N}"
[ -n "$DOMAIN" ]                                  && echo -e "  ${B}HTTP:${N}    http://$DOMAIN"
echo -e "  ${B}Direto:${N}  http://${PUB_IP}:${PORT}"
echo ""
echo -e "  ${B}App:${N}  $APP_NAME   ${B}Porta:${N} $PORT   ${B}Dir:${N} $INSTALL_DIR"
echo ""
line
echo ""
echo -e "  ${B}Gerenciar:${N}"
echo -e "    pm2 status                  → todos os apps"
echo -e "    pm2 logs $APP_NAME          → logs em tempo real"
echo -e "    pm2 restart $APP_NAME       → reiniciar"
echo -e "    pm2 stop $APP_NAME          → parar"
echo ""
echo -e "  ${B}Atualizar (nova versão):${N}"
echo -e "    cd $INSTALL_DIR && git pull && npm install && npm run build && pm2 restart $APP_NAME"
echo ""
line
