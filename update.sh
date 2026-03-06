#!/usr/bin/env bash
# ============================================================
#  update.sh — Atualiza o Randoli Solar CRM na VPS
#  Uso: bash update.sh
# ============================================================
set -eo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC} $*"; }
fail() { echo -e "${RED}✗${NC} $*"; exit 1; }
info() { echo -e "${CYAN}→${NC} $*"; }

INSTALL_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$INSTALL_DIR"

echo ""
echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo -e "${CYAN}   Randoli Solar CRM — Atualização        ${NC}"
echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo ""

# ── 1. Git pull ──────────────────────────────────────────────
info "Baixando atualizações do GitHub..."
git pull origin main && ok "Código atualizado" || warn "Falha no git pull — continuando com versão atual"

# ── 2. npm install ───────────────────────────────────────────
info "Instalando dependências..."
npm install --production=false > /tmp/update-npm.log 2>&1 && ok "Dependências OK" || fail "Erro no npm install. Ver: /tmp/update-npm.log"

# ── 3. Build ─────────────────────────────────────────────────
info "Compilando aplicação..."
npm run build > /tmp/update-build.log 2>&1 && ok "Build concluído" || { fail "Erro no build."; tail -20 /tmp/update-build.log; exit 1; }

[ -f "dist/index.cjs" ] || fail "dist/index.cjs não encontrado após o build."

# ── 4. Ler .env ──────────────────────────────────────────────
if [ -f ".env" ]; then
  PORT_VAL=$(grep "^PORT=" .env | cut -d= -f2 | tr -d '[:space:]') || true
  SECRET_VAL=$(grep "^SESSION_SECRET=" .env | cut -d= -f2 | tr -d '[:space:]') || true
  DOMAIN_VAL=$(grep "^APP_DOMAIN=" .env | cut -d= -f2 | tr -d '[:space:]') || true
else
  warn ".env não encontrado — usando porta 5001 e secret padrão"
  PORT_VAL="5001"
  SECRET_VAL="randoli-crm-secret-$(openssl rand -hex 16)"
  DOMAIN_VAL="localhost"
fi

PORT_VAL="${PORT_VAL:-5001}"
SECRET_VAL="${SECRET_VAL:-randoli-crm-secret}"
DOMAIN_VAL="${DOMAIN_VAL:-localhost}"

# ── 5. Detectar nome do app no PM2 ───────────────────────────
APP_NAME=""
# 1) Tenta ler do ecosystem.config.cjs existente (mais confiável)
if [ -f "ecosystem.config.cjs" ]; then
  APP_NAME=$(grep -oP "name: '[^']+'" ecosystem.config.cjs 2>/dev/null | head -1 | grep -oP "'[^']+'" | tr -d "'" || true)
fi
# 2) Fallback: detecta pelo CWD no PM2 (não confunde com outros apps)
if [ -z "$APP_NAME" ] && command -v pm2 &>/dev/null; then
  APP_NAME=$(pm2 jlist 2>/dev/null | python3 -c "
import json,sys
try:
  apps=json.load(sys.stdin)
  for a in apps:
    if a.get('pm2_env',{}).get('pm_cwd','') == '${INSTALL_DIR}':
      print(a.get('name',''))
      break
except: pass
" 2>/dev/null || true)
fi
# 3) Default seguro
APP_NAME="${APP_NAME:-randoli-crm}"

# ── 6. Recriar ecosystem.config.cjs ──────────────────────────
info "Recriando ecosystem.config.cjs (app: $APP_NAME, porta: $PORT_VAL)..."
cat > ecosystem.config.cjs << ECOEOF
module.exports = {
  apps: [{
    name: '${APP_NAME}',
    script: 'dist/index.cjs',
    cwd: '${INSTALL_DIR}',
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: '${PORT_VAL}',
      SESSION_SECRET: '${SECRET_VAL}',
      APP_DOMAIN: '${DOMAIN_VAL}'
    }
  }]
}
ECOEOF
ok "ecosystem.config.cjs criado"

# ── 7. Reiniciar PM2 ─────────────────────────────────────────
info "Reiniciando PM2..."
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 delete "$APP_NAME" > /dev/null 2>&1 || true
fi
pm2 start ecosystem.config.cjs > /dev/null 2>&1
pm2 save > /dev/null 2>&1
ok "App PM2 '$APP_NAME' iniciado"

sleep 3
if pm2 describe "$APP_NAME" 2>/dev/null | grep -q "online"; then
  ok "App rodando com sucesso!"
else
  warn "App pode não ter iniciado. Verifique: pm2 logs $APP_NAME"
fi

echo ""
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo -e "${GREEN}   Atualização concluída!                 ${NC}"
echo -e "${GREEN}   Usuário: icaro                        ${NC}"
echo -e "${GREEN}   Senha:   Randoli@2024                 ${NC}"
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo ""
