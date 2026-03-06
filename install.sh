#!/bin/bash
set -e

# ============================================================
# RANDOLI SOLAR CRM — Script de Instalação
# Uso: bash install.sh [--port=5001] [--domain=crm.seudominio.com]
# ============================================================

# --- Argumentos opcionais ---
PORT=5000
DOMAIN=""

for arg in "$@"; do
  case $arg in
    --port=*) PORT="${arg#*=}" ;;
    --domain=*) DOMAIN="${arg#*=}" ;;
  esac
done

INSTALL_DIR="/var/www/randoli-crm"
APP_NAME="randoli-crm"

echo ""
echo "=================================================="
echo "  RANDOLI SOLAR CRM — Instalação"
echo "  Porta: $PORT"
if [ -n "$DOMAIN" ]; then
  echo "  Domínio: $DOMAIN"
fi
echo "=================================================="
echo ""

# --- 1. Verificar Node.js ---
if ! command -v node &> /dev/null; then
  echo "[1/6] Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "[1/6] Node.js já instalado: $(node --version)"
fi

# --- 2. Verificar npm ---
echo "[2/6] Verificando npm: $(npm --version)"

# --- 3. Instalar PM2 ---
if ! command -v pm2 &> /dev/null; then
  echo "[3/6] Instalando PM2..."
  sudo npm install -g pm2
else
  echo "[3/6] PM2 já instalado: $(pm2 --version)"
fi

# --- 4. Clonar/Atualizar repositório ---
if [ -d "$INSTALL_DIR/.git" ]; then
  echo "[4/6] Atualizando repositório existente..."
  cd "$INSTALL_DIR"
  git pull origin main
else
  echo "[4/6] Clonando repositório..."
  sudo mkdir -p "$INSTALL_DIR"
  sudo chown "$USER:$USER" "$INSTALL_DIR"
  git clone . "$INSTALL_DIR" 2>/dev/null || {
    echo "  ATENÇÃO: Clone falhou. Certifique-se de estar na pasta do projeto ou informar a URL do git."
    echo "  Usando diretório atual como base..."
    INSTALL_DIR="$(pwd)"
  }
fi

cd "$INSTALL_DIR"

# --- 5. Instalar dependências e compilar ---
echo "[5/6] Instalando dependências e compilando..."
npm install --production=false
npm run build

# --- 6. Configurar variáveis de ambiente ---
if [ ! -f ".env" ]; then
  echo "[6/6] Criando arquivo .env..."
  SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  cat > .env <<EOF
PORT=$PORT
NODE_ENV=production
SESSION_SECRET=$SECRET
EOF
  echo "  .env criado com SESSION_SECRET aleatório e PORT=$PORT"
else
  echo "[6/6] .env já existe — mantendo configuração existente"
  # Atualiza porta se diferente
  if ! grep -q "PORT=" .env; then
    echo "PORT=$PORT" >> .env
  fi
fi

# --- Iniciar com PM2 ---
echo ""
echo "Iniciando aplicação com PM2..."
pm2 delete "$APP_NAME" 2>/dev/null || true
pm2 start npm --name "$APP_NAME" -- start
pm2 save

# --- Configurar Nginx (se domínio informado) ---
if [ -n "$DOMAIN" ] && command -v nginx &> /dev/null; then
  echo ""
  echo "Configurando Nginx para domínio: $DOMAIN"
  
  NGINX_CONF="/etc/nginx/sites-available/$APP_NAME"
  sudo tee "$NGINX_CONF" > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }
}
EOF

  sudo ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/$APP_NAME"
  
  if sudo nginx -t; then
    sudo systemctl reload nginx
    echo "  Nginx configurado com sucesso para $DOMAIN"
    
    # Tentar SSL com certbot
    if command -v certbot &> /dev/null; then
      echo "  Configurando SSL com Let's Encrypt..."
      sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN" 2>/dev/null && \
        echo "  SSL configurado com sucesso!" || \
        echo "  SSL falhou — configure manualmente com: sudo certbot --nginx -d $DOMAIN"
    else
      echo "  Certbot não encontrado. Para SSL: sudo apt install certbot python3-certbot-nginx && sudo certbot --nginx -d $DOMAIN"
    fi
  else
    echo "  Erro na configuração do Nginx. Verifique manualmente."
  fi
fi

# --- Resultado Final ---
echo ""
echo "=================================================="
echo "  INSTALAÇÃO CONCLUÍDA!"
echo ""
echo "  App rodando em: http://localhost:$PORT"
if [ -n "$DOMAIN" ]; then
  echo "  Domínio: https://$DOMAIN"
fi
echo ""
echo "  Comandos úteis:"
echo "    pm2 status           — Ver status"
echo "    pm2 logs $APP_NAME   — Ver logs"
echo "    pm2 restart $APP_NAME — Reiniciar"
echo "    pm2 stop $APP_NAME   — Parar"
echo "=================================================="
