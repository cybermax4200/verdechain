#!/usr/bin/env bash
set -euo pipefail

VERDECHAIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$VERDECHAIN_ROOT"

echo "=== VerdeChain Admin Key Rotation Ceremony ==="
echo ""
echo "WARNING: This script rotates the admin Stellar keypair."
echo "This is a SCAFFOLD — manual review required before execution."
echo ""

# ── Safety checks ──────────────────────────────────────────────────────────
if [ ! -f .env ]; then
  echo "Error: .env file not found"
  exit 1
fi

source .env 2>/dev/null || true

# ── Configuration ──────────────────────────────────────────────────────────
NETWORK="${STELLAR_NETWORK:-testnet}"
OLD_SECRET_KEY="${ADMIN_SECRET_KEY:-}"
HORIZON_URL="${HORIZON_URL:-https://horizon-testnet.stellar.org}"
SOROBAN_RPC_URL="${SOROBAN_RPC_URL:-https://soroban-testnet.stellar.org}"

echo "Network:        $NETWORK"
echo "Horizon URL:    $HORIZON_URL"
echo "Soroban RPC:    $SOROBAN_RPC_URL"
echo ""

# ── Generate new keypair ──────────────────────────────────────────────────
echo "[1/5] Generating new admin keypair..."
echo "  NOTE: In production, this should be done on an air-gapped machine."
echo "  Run: node -e \"const s = require('@stellar/stellar-sdk'); const k = s.Keypair.random(); console.log('Public:', k.publicKey()); console.log('Secret:', k.secret())\""
echo ""

NEW_PUBLIC=""
NEW_SECRET=""

if command -v node >/dev/null 2>&1; then
  # Check if @stellar/stellar-sdk is available
  if [ -d node_modules/@stellar/stellar-sdk ]; then
    KEYPAIR_OUTPUT=$(node -e "
      const s = require('@stellar/stellar-sdk');
      const k = s.Keypair.random();
      console.log(k.publicKey());
      console.log(k.secret());
    " 2>/dev/null || true)

    if [ -n "$KEYPAIR_OUTPUT" ]; then
      NEW_PUBLIC=$(echo "$KEYPAIR_OUTPUT" | head -1)
      NEW_SECRET=$(echo "$KEYPAIR_OUTPUT" | tail -1)
      echo "  New public key: $NEW_PUBLIC"
      echo "  New secret key: (hidden)"
    fi
  fi
fi

if [ -z "$NEW_SECRET" ]; then
  echo "  Could not generate keypair — is @stellar/stellar-sdk installed?"
  echo "  Continuing with placeholder..."
  NEW_PUBLIC="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
  NEW_SECRET="SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
fi
echo ""

# ── Fund new account ─────────────────────────────────────────────────────
echo "[2/5] Funding new account..."
if [ "$NETWORK" = "testnet" ]; then
  if command -v curl >/dev/null 2>&1; then
    FRIENDBOT_RESPONSE=$(curl -sf "https://friendbot.stellar.org?addr=$NEW_PUBLIC" 2>/dev/null || echo "")
    if [ -n "$FRIENDBOT_RESPONSE" ]; then
      echo "  ✅ Account funded via Friendbot"
    else
      echo "  ⚠  Friendbot funding failed — account may already exist"
    fi
  fi
else
  echo "  ⚠  Mainnet: Transfer XLM to new account manually"
fi
echo ""

# ── Verify new account ──────────────────────────────────────────────────
echo "[3/5] Verifying new account..."
if command -v curl >/dev/null 2>&1; then
  ACCOUNT_CHECK=$(curl -sf "$HORIZON_URL/accounts/$NEW_PUBLIC" 2>/dev/null || echo "")
  if [ -n "$ACCOUNT_CHECK" ]; then
    BALANCE=$(echo "$ACCOUNT_CHECK" | grep -o '"balance":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "  ✅ Account exists — Balance: ${BALANCE:-unknown} XLM"
  else
    echo "  ⚠  Account not yet visible on network"
  fi
fi
echo ""

# ── Update .env with new key ────────────────────────────────────────────
echo "[4/5] Updating .env file..."
if [ -f .env ]; then
  # Backup current .env
  cp .env ".env.backup.$(date +%Y%m%d%H%M%S)"
  echo "  ✅ Backup created"

  # Update ADMIN_SECRET_KEY (platform-specific sed)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/ADMIN_SECRET_KEY=.*/ADMIN_SECRET_KEY=$NEW_SECRET/" .env
  else
    sed -i "s/ADMIN_SECRET_KEY=.*/ADMIN_SECRET_KEY=$NEW_SECRET/" .env
  fi
  echo "  ✅ .env updated with new secret key"
else
  echo "  ⚠  .env not found — cannot update"
fi
echo ""

# ── Re-deploy contracts ──────────────────────────────────────────────────
echo "[5/5] Re-deploying contracts with new admin key..."
echo "  NOTE: Re-deployment requires updating contract owners."
echo "  This is a manual process for production environments."
echo ""
echo "  Run the following after verifying the new key:"
echo "    export ADMIN_SECRET_KEY=$NEW_SECRET"
echo "    cd contracts && bash deploy-testnet.sh"
echo ""

# ── Summary ───────────────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Key Rotation Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Old public key: (see previous .env backup)"
echo "  New public key: $NEW_PUBLIC"
echo "  Network:        $NETWORK"
echo ""
echo "  Backup saved to: .env.backup.*"
echo ""
echo "  MANUAL STEPS REQUIRED:"
echo "  1. Verify the new account is funded"
echo "  2. Test new key with a single contract call"
echo "  3. Re-deploy contracts with new admin key"
echo "  4. Update CI/CD secrets with new key"
echo "  5. Inform team members of key rotation"
echo "  6. Destroy old key backup securely"
echo ""
echo "=== Key rotation ceremony (scaffold) complete ==="
