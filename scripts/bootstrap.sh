#!/usr/bin/env bash
set -euo pipefail

VERDECHAIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$VERDECHAIN_ROOT"

echo "=== VerdeChain Bootstrap ==="
echo ""

# ── Prerequisites ──────────────────────────────────────────────────────────
echo "[1/7] Checking prerequisites..."

command -v node >/dev/null 2>&1 || { echo "Error: Node.js 20+ is required"; exit 1; }
command -v npm  >/dev/null 2>&1 || { echo "Error: npm 10+ is required"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Error: Docker is required"; exit 1; }

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "Error: Node.js 20+ required (found: $(node -v))"; exit 1;
fi
echo "  Node.js $(node -v) — OK"
echo "  npm $(npm -v) — OK"
echo "  Docker $(docker -v) — OK"

# ── Install dependencies ───────────────────────────────────────────────────
echo ""
echo "[2/7] Installing npm dependencies..."
npm install --ignore-scripts --no-audit --no-fund

# ── Start infrastructure ───────────────────────────────────────────────────
echo ""
echo "[3/7] Starting infrastructure services (PostgreSQL, Redis, Stellar)..."
docker compose up -d
echo "  Waiting for services to be healthy..."
sleep 5

# ── Migrate database ───────────────────────────────────────────────────────
echo ""
echo "[4/7] Running database migrations..."
echo "  (Skipped — API module not yet implemented)"

# ── Fund testnet keypair ───────────────────────────────────────────────────
echo ""
echo "[5/7] Funding Stellar testnet keypair..."
echo "  (Skipped — deploy contracts not yet implemented)"

# ── Seed data ──────────────────────────────────────────────────────────────
echo ""
echo "[6/7] Seeding sample data..."
echo "  (Skipped — seed scripts not yet implemented)"

# ── Start dev servers ─────────────────────────────────────────────────────
echo ""
echo "[7/7] Starting development servers..."
echo "  Run: npm run dev"
echo ""

echo "=== Bootstrap complete ==="
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env and fill in secrets"
echo "  2. Run 'npm run dev' to start API + frontend"
echo "  3. Visit http://localhost:3000 (API) or http://localhost:3001 (Frontend)"
