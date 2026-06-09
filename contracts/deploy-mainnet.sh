#!/usr/bin/env bash
set -euo pipefail

# ── Mainnet Deployment Script (Multi-sig Ceremony Wrapper) ─────────────────
#
# This script is a scaffold for mainnet deployment with multi-sig support.
# It prepares the WASM artifacts and deployment manifests for manual
# multi-sig signing using Stellar Laboratory or GOTO asset tooling.
#
# Usage:
#   ./contracts/deploy-mainnet.sh [--prepare-only] [--verify]
#
# Prerequisites:
#   - Stellar CLI with mainnet endpoint configured
#   - Multi-sig signer set with 3-of-5 threshold
#   - ADMIN_SECRET must be a multi-sig key (not a single signer)
#
# Security notes:
#   - NEVER store mainnet secrets in .env
#   - Use hardware wallet or GOTO Assured for signing
#   - Deploy in stages: dry-run → simulate → execute

VERDECHAIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$VERDECHAIN_ROOT"

NETWORK="mainnet"
RPC_URL="${RPC_URL:-https://soroban-mainnet.stellar.org}"
HORIZON_URL="${HORIZON_URL:-https://horizon.stellar.org}"
NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"

OUTPUT_FILE="$VERDECHAIN_ROOT/.deployed-mainnet.json"

info()  { echo "  [INFO]  $*"; }
ok()    { echo "  [OK]    $*"; }
err()   { echo "  [ERROR] $*" >&2; exit 1; }

echo ""
echo "=== VerdeChain Mainnet Deployment (Multi-sig) ==="
echo "  Network:    $NETWORK"
echo "  RPC URL:    $RPC_URL"
echo "  Horizon:    $HORIZON_URL"
echo ""
echo "WARNING: Mainnet deployment requires multi-sig signing."
echo "This script prepares artifacts and generates manifests."
echo ""

# ── Build WASM artifacts ────────────────────────────────────────────────────
echo "[1/3] Building release WASM artifacts..."
cargo build --target wasm32-unknown-unknown --release \
  -p product_registry \
  -p lifecycle_tracker \
  -p carbon_oracle \
  -p attestation \
  -p greentag_cert \
  -p verifier_registry
ok "WASM builds complete"

# ── Generate deployment manifest ───────────────────────────────────────────
echo ""
echo "[2/3] Generating deployment manifest..."

TARGET_DIR="$VERDECHAIN_ROOT/contracts/target/wasm32-unknown-unknown/release"

cat > "$OUTPUT_FILE" <<EOF
{
  "network": "$NETWORK",
  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deploy_order": [
    "product_registry",
    "lifecycle_tracker",
    "carbon_oracle",
    "attestation",
    "greentag_cert",
    "verifier_registry"
  ],
  "wasm_artifacts": {
    "product_registry":     { "path": "$TARGET_DIR/product_registry.wasm",     "hash": "$(sha256sum "$TARGET_DIR/product_registry.wasm" | cut -d' ' -f1)" },
    "lifecycle_tracker":    { "path": "$TARGET_DIR/lifecycle_tracker.wasm",    "hash": "$(sha256sum "$TARGET_DIR/lifecycle_tracker.wasm" | cut -d' ' -f1)" },
    "carbon_oracle":        { "path": "$TARGET_DIR/carbon_oracle.wasm",        "hash": "$(sha256sum "$TARGET_DIR/carbon_oracle.wasm" | cut -d' ' -f1)" },
    "attestation":          { "path": "$TARGET_DIR/attestation.wasm",          "hash": "$(sha256sum "$TARGET_DIR/attestation.wasm" | cut -d' ' -f1)" },
    "greentag_cert":        { "path": "$TARGET_DIR/greentag_cert.wasm",       "hash": "$(sha256sum "$TARGET_DIR/greentag_cert.wasm" | cut -d' ' -f1)" },
    "verifier_registry":    { "path": "$TARGET_DIR/verifier_registry.wasm",    "hash": "$(sha256sum "$TARGET_DIR/verifier_registry.wasm" | cut -d' ' -f1)" }
  },
  "multi_sig": {
    "threshold": "3-of-5",
    "status": "pending"
  }
}
EOF

ok "Manifest written to $OUTPUT_FILE"

# ── Verification instructions ──────────────────────────────────────────────
echo ""
echo "[3/3] Next steps for multi-sig deployment:"
echo ""
echo "  1. Review deployment manifest:  cat $OUTPUT_FILE"
echo "  2. For each contract, create a tx via Stellar Laboratory:"
echo "     - Upload WASM (host function: upload_contract_wasm)"
echo "     - Deploy contract (host function: create_contract)"
echo "  3. Submit each transaction for multi-sig signing"
echo "  4. After all contracts deployed, update .env with addresses"
echo "  5. Run verification:  ./contracts/deploy-mainnet.sh --verify"
echo ""
echo "=== Mainnet deployment manifest generated ==="
