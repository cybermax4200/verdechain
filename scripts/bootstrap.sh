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

if command -v rustc >/dev/null 2>&1; then
  echo "  Rust $(rustc --version) — OK"
else
  echo "  Warning: Rust not found — contract compilation will be skipped"
fi

echo "  Node.js $(node -v) — OK"
echo "  npm $(npm -v) — OK"
echo "  Docker $(docker -v) — OK"

# ── Environment file ────────────────────────────────────────────────────────
echo ""
echo "[1.5/7] Checking environment configuration..."
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "  Created .env from .env.example — please review and update secrets"
  else
    echo "  Warning: No .env.example found, skipping"
  fi
else
  echo "  .env already exists — OK"
fi

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

# ── Generate Prisma client ─────────────────────────────────────────────────
echo ""
echo "[3.5/7] Generating Prisma client..."
if [ -f api/prisma/schema.prisma ]; then
  cd api && npx prisma generate && cd ..
  echo "  Prisma client generated — OK"
else
  echo "  Skipped — no Prisma schema found"
fi

# ── Migrate database ───────────────────────────────────────────────────────
echo ""
echo "[4/7] Running database migrations..."
if [ -f api/prisma/schema.prisma ]; then
  cd api && npx prisma migrate deploy && cd ..
  echo "  Migrations applied — OK"
else
  echo "  Skipped — no Prisma schema found"
fi

# ── Build contracts ────────────────────────────────────────────────────────
echo ""
echo "[4.5/7] Building smart contracts..."
if command -v rustc >/dev/null 2>&1 && [ -f contracts/Cargo.toml ]; then
  cd contracts && cargo build --target wasm32-unknown-unknown --release 2>/dev/null && cd ..
  echo "  Contracts built — OK"
else
  echo "  Skipped — Rust toolchain or contract directory not found"
fi

# ── Fund testnet keypair ──────────────────────────────────────────────────
echo ""
echo "[5/7] Funding Stellar testnet keypair..."
if [ -f contracts/deploy-testnet.sh ]; then
  echo "  Running deploy-testnet.sh..."
  cd contracts && bash deploy-testnet.sh && cd ..
  echo "  Testnet contracts deployed — OK"
else
  echo "  Skipped — deploy-testnet.sh not found"
fi

# ── Seed data ──────────────────────────────────────────────────────────────
echo ""
echo "[6/7] Seeding sample data..."
if [ -f api/scripts/seed-products.ts ]; then
  cd api && npx ts-node scripts/seed-products.ts && cd ..
  echo "  Products seeded — OK"
else
  echo "  Skipped — seed scripts not found"
fi

if [ -f api/scripts/seed-verifiers.ts ]; then
  cd api && npx ts-node scripts/seed-verifiers.ts && cd ..
  echo "  Verifiers seeded — OK"
fi

# ── Start dev servers ─────────────────────────────────────────────────────
echo ""
echo "[7/7] Starting development servers..."
echo "  Run: npm run dev"
echo ""

echo "=== Bootstrap complete ==="
echo ""
echo "Your VerdeChain development environment is ready."
echo ""
echo "Quick links:"
echo "  API:        http://localhost:3000"
echo "  API Docs:   http://localhost:3000/v1/docs"
echo "  Frontend:   http://localhost:3001"
echo "  Prisma Studio: npm run db:studio -w api"
echo ""
echo "Next steps:"
echo "  1. Review .env and update any secrets"
echo "  2. Run 'npm run dev' to start API and frontend"
echo "  3. Run 'npm run test' to verify everything works"
