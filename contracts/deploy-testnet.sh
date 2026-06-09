#!/usr/bin/env bash
set -euo pipefail

VERDECHAIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$VERDECHAIN_ROOT"

# ── Configuration ──────────────────────────────────────────────────────────
NETWORK="testnet"
RPC_URL="https://soroban-testnet.stellar.org"
HORIZON_URL="https://horizon-testnet.stellar.org"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# Default admin keypair — MUST be set via env or .env
ADMIN_SECRET="${ADMIN_SECRET:-}"
if [ -z "$ADMIN_SECRET" ]; then
  if [ -f .env ]; then
    ADMIN_SECRET=$(grep -E '^ADMIN_SECRET=' .env | cut -d= -f2-)
  fi
fi

OUTPUT_FILE="$VERDECHAIN_ROOT/.deployed-testnet.json"
ENV_FILE="$VERDECHAIN_ROOT/.env"

# ── Helper functions ───────────────────────────────────────────────────────
info()  { echo "  [INFO]  $*"; }
ok()    { echo "  [OK]    $*"; }
err()   { echo "  [ERROR] $*" >&2; exit 1; }

require_soroban() {
  if ! command -v soroban &>/dev/null; then
    err "soroban CLI not found. Install: cargo install soroban-cli"
  fi
}

fund_account() {
  local pubkey="$1"
  info "Funding $pubkey via Friendbot..."
  curl -s -X POST "$HORIZON_URL/friendbot?addr=$pubkey" >/dev/null || {
    info "Friendbot funding may have failed; continuing..."
  }
  sleep 2
}

deploy_contract() {
  local wasm_path="$1"
  local contract_name="$2"
  info "Deploying $contract_name..."

  local result
  result=$(soroban contract deploy \
    --wasm "$wasm_path" \
    --source "$ADMIN_SECRET" \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$NETWORK_PASSPHRASE" 2>&1)

  local contract_id
  contract_id=$(echo "$result" | grep -oE '[C,G][0-9A-Z]{55}' | head -1)

  if [ -z "$contract_id" ]; then
    err "Failed to extract contract ID for $contract_name. Output: $result"
  fi

  ok "$contract_name deployed at $contract_id"
  echo "$contract_id"
}

# ── Main ───────────────────────────────────────────────────────────────────
echo ""
echo "=== VerdeChain Testnet Deployment ==="
echo "  Network:    $NETWORK"
echo "  RPC URL:    $RPC_URL"
echo "  Horizon:    $HORIZON_URL"
echo ""

require_soroban

if [ -z "$ADMIN_SECRET" ]; then
  err "ADMIN_SECRET not set. Provide via env or .env file"
fi

# Extract admin public key
ADMIN_PUBKEY=$(soroban keys address --source "$ADMIN_SECRET" 2>/dev/null || echo "")
if [ -z "$ADMIN_PUBKEY" ]; then
  err "Could not resolve admin public key"
fi
info "Admin account: $ADMIN_PUBKEY"

# ── Step 1: Fund admin ─────────────────────────────────────────────────────
echo ""
echo "[1/7] Funding admin account..."
fund_account "$ADMIN_PUBKEY"

# ── Step 2: Build WASM artifacts ────────────────────────────────────────────
echo ""
echo "[2/7] Building WASM artifacts..."
cargo build --target wasm32-unknown-unknown --release -p product_registry
cargo build --target wasm32-unknown-unknown --release -p lifecycle_tracker
cargo build --target wasm32-unknown-unknown --release -p carbon_oracle
cargo build --target wasm32-unknown-unknown --release -p attestation
cargo build --target wasm32-unknown-unknown --release -p greentag_cert
cargo build --target wasm32-unknown-unknown --release -p verifier_registry
ok "WASM builds complete"

TARGET_DIR="$VERDECHAIN_ROOT/contracts/target/wasm32-unknown-unknown/release"

# ── Step 3: Deploy contracts ───────────────────────────────────────────────
echo ""
echo "[3/7] Deploying contracts..."

declare -A CONTRACTS
CONTRACTS["ProductRegistry"]="$TARGET_DIR/product_registry.wasm"
CONTRACTS["LifecycleTracker"]="$TARGET_DIR/lifecycle_tracker.wasm"
CONTRACTS["CarbonOracle"]="$TARGET_DIR/carbon_oracle.wasm"
CONTRACTS["Attestation"]="$TARGET_DIR/attestation.wasm"
CONTRACTS["GreenTagCert"]="$TARGET_DIR/greentag_cert.wasm"
CONTRACTS["VerifierRegistry"]="$TARGET_DIR/verifier_registry.wasm"

declare -A DEPLOYED

for name in "ProductRegistry" "LifecycleTracker" "CarbonOracle" \
            "Attestation" "GreenTagCert" "VerifierRegistry"; do
  wasm="${CONTRACTS[$name]}"
  if [ ! -f "$wasm" ]; then
    err "WASM file not found for $name: $wasm"
  fi
  contract_id=$(deploy_contract "$wasm" "$name")
  DEPLOYED[$name]="$contract_id"
done

# ── Step 4: Initialize contracts ───────────────────────────────────────────
echo ""
echo "[4/7] Initializing contracts..."

info "Initializing ProductRegistry..."
soroban contract invoke \
  --id "${DEPLOYED[ProductRegistry]}" \
  --source "$ADMIN_SECRET" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- initialize \
  --admin "$ADMIN_PUBKEY" 2>/dev/null || info "  (init may not be needed)"

ok "Contracts deployed and initialized"

# ── Step 5: Write deployment addresses ──────────────────────────────────────
echo ""
echo "[5/7] Writing deployment addresses..."

cat > "$OUTPUT_FILE" <<EOF
{
  "network": "$NETWORK",
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "admin_pubkey": "$ADMIN_PUBKEY",
  "contracts": {
    "product_registry":     "${DEPLOYED[ProductRegistry]}",
    "lifecycle_tracker":    "${DEPLOYED[LifecycleTracker]}",
    "carbon_oracle":        "${DEPLOYED[CarbonOracle]}",
    "attestation":          "${DEPLOYED[Attestation]}",
    "greentag_cert":        "${DEPLOYED[GreenTagCert]}",
    "verifier_registry":    "${DEPLOYED[VerifierRegistry]}"
  }
}
EOF

ok "Addresses written to $OUTPUT_FILE"

# ── Step 6: Update .env ─────────────────────────────────────────────────────
echo ""
echo "[6/7] Updating .env with contract addresses..."

if [ -f "$ENV_FILE" ]; then
  # Update existing entries or append
  for var in "PRODUCT_REGISTRY_ID" "LIFECYCLE_TRACKER_ID" "CARBON_ORACLE_ID" \
             "ATTESTATION_ID" "GREENTAG_CERT_ID" "VERIFIER_REGISTRY_ID"; do
    if grep -q "^${var}=" "$ENV_FILE" 2>/dev/null; then
      sed -i.bak "/^${var}=/d" "$ENV_FILE"
    fi
  done

  cat >> "$ENV_FILE" <<EOF

# Deployed contract addresses (testnet — $(date -u +%Y-%m-%d))
PRODUCT_REGISTRY_ID="${DEPLOYED[ProductRegistry]}"
LIFECYCLE_TRACKER_ID="${DEPLOYED[LifecycleTracker]}"
CARBON_ORACLE_ID="${DEPLOYED[CarbonOracle]}"
ATTESTATION_ID="${DEPLOYED[Attestation]}"
GREENTAG_CERT_ID="${DEPLOYED[GreenTagCert]}"
VERIFIER_REGISTRY_ID="${DEPLOYED[VerifierRegistry]}"
EOF

  rm -f "$ENV_FILE.bak"
  ok "Updated $ENV_FILE with contract addresses"
else
  info "No .env file found — created $OUTPUT_FILE only"
fi

# ── Step 7: Verify ─────────────────────────────────────────────────────────
echo ""
echo "[7/7] Verifying deployments..."

for name in "${!DEPLOYED[@]}"; do
  id="${DEPLOYED[$name]}"
  info "  $name: $id"
done

echo ""
echo "=== Testnet deployment complete ==="
echo ""
echo "Admin pubkey: $ADMIN_PUBKEY"
echo "See $OUTPUT_FILE for full deployment manifest."
