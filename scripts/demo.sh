#!/usr/bin/env bash
set -euo pipefail

VERDECHAIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$VERDECHAIN_ROOT"

echo "============================================"
echo "  VerdeChain Interactive Demo"
echo "  Full Supply Chain Traceability Walkthrough"
echo "============================================"
echo ""

# ── Check prerequisites ───────────────────────────────────────────────────
echo "Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "Error: Node.js required"; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "Error: curl required"; exit 1; }

API_URL="${API_URL:-http://localhost:3000}"
echo "  API URL: $API_URL"
echo ""

# ── Step 1: Health check ─────────────────────────────────────────────────
echo "▶ Step 1: Checking API health..."
HEALTH=$(curl -sf "$API_URL/health" 2>/dev/null || echo "")
if [ -z "$HEALTH" ]; then
  echo "  ⚠  API is not running — start it with 'npm run dev'"
  echo "  Continuing in dry-run mode..."
  DRY_RUN=true
else
  echo "  ✅ API is healthy"
  DRY_RUN=false
fi
echo ""

if [ "$DRY_RUN" = true ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  DRY-RUN DEMO (no API available)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "  The full demo flow would:"
  echo "   1. Register a product (POST /products)"
  echo "   2. Record lifecycle events (POST /supply-chain/events)"
  echo "   3. View lifecycle timeline (GET /products/:id/lifecycle)"
  echo "   4. Calculate carbon footprint (GET /carbon/footprint/:id)"
  echo "   5. Submit for attestation"
  echo "   6. Issue GreenTag certificate (POST /certificates)"
  echo "   7. Verify certificate (POST /certificates/verify)"
  echo "   8. View provenance graph (GET /products/:id/provenance)"
  echo ""
  echo "  Start the API and re-run this script for a live demo."
  echo ""
  exit 0
fi

# ── Step 2: Register a product ────────────────────────────────────────────
echo "▶ Step 2: Registering a sustainable product..."

PRODUCT_PAYLOAD='{
  "name": "Eco-Friendly Bamboo T-Shirt",
  "description": "Organic bamboo fabric t-shirt, low-impact dyes",
  "sku": "BAM-001-GRN",
  "productType": "APPAREL",
  "originCountry": "PT",
  "batchNumber": "BATCH-2024-001"
}'

PRODUCT_RESPONSE=$(curl -sf -X POST "$API_URL/products" \
  -H "Content-Type: application/json" \
  -d "$PRODUCT_PAYLOAD" 2>/dev/null || echo "")

if [ -z "$PRODUCT_RESPONSE" ]; then
  echo "  ⚠  Failed to register product"
  PRODUCT_ID="1"
  echo "  Using mock product ID: $PRODUCT_ID"
else
  PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "  ✅ Product registered with ID: $PRODUCT_ID"
fi
echo ""

# ── Step 3: Record lifecycle events ──────────────────────────────────────
echo "▶ Step 3: Recording lifecycle events..."

for EVENT in \
  '{"productId":"'"$PRODUCT_ID"'","stage":"RAW_MATERIAL_EXTRACTION","description":"Harvested organic bamboo","location":"cn","timestamp":"2024-01-15T00:00:00Z","fuelUsed":200,"fuelType":"diesel"}' \
  '{"productId":"'"$PRODUCT_ID"'","stage":"MANUFACTURING","description":"Fabric weaving and garment assembly","location":"pt","timestamp":"2024-02-01T00:00:00Z","energyKwh":5000,"fuelUsed":1000,"fuelType":"natural_gas"}' \
  '{"productId":"'"$PRODUCT_ID"'","stage":"TRANSPORT_TO_DISTRIBUTOR","description":"Shipping to European distribution center","location":"de","timestamp":"2024-02-15T00:00:00Z","fuelUsed":800,"fuelType":"diesel"}'; do

  RESPONSE=$(curl -sf -X POST "$API_URL/supply-chain/events" \
    -H "Content-Type: application/json" \
    -d "$EVENT" 2>/dev/null || echo "")
  if [ -n "$RESPONSE" ]; then
    echo "  ✅ Event recorded"
  else
    echo "  ⚠  Failed to record event"
  fi
done
echo ""

# ── Step 4: View lifecycle timeline ──────────────────────────────────────
echo "▶ Step 4: Fetching lifecycle timeline..."
TIMELINE=$(curl -sf "$API_URL/products/$PRODUCT_ID/lifecycle" 2>/dev/null || echo "")
if [ -n "$TIMELINE" ]; then
  echo "  ✅ Timeline retrieved"
  echo "  $TIMELINE" | python3 -m json.tool 2>/dev/null || echo "  $TIMELINE"
else
  echo "  ⚠  Could not fetch timeline"
fi
echo ""

# ── Step 5: Calculate carbon footprint ───────────────────────────────────
echo "▶ Step 5: Calculating carbon footprint..."
FOOTPRINT=$(curl -sf "$API_URL/carbon/footprint/$PRODUCT_ID" 2>/dev/null || echo "")
if [ -n "$FOOTPRINT" ]; then
  TOTAL=$(echo "$FOOTPRINT" | grep -o '"totalFootprint":[0-9.]*' | cut -d: -f2)
  echo "  ✅ Carbon footprint calculated"
  echo "  Total: ${TOTAL:-N/A} kg CO₂e"
else
  echo "  ⚠  Could not calculate footprint"
fi
echo ""

# ── Step 6: Submit for attestation ───────────────────────────────────────
echo "▶ Step 6: Submitting for attestation..."
echo "  (Requires manufacturer wallet — feature in progress)"
echo "  ⏩  Skipping..."
echo ""

# ── Step 7: Issue GreenTag certificate ───────────────────────────────────
echo "▶ Step 7: Issuing GreenTag certificate..."
echo "  (Requires attestation approval — feature in progress)"
echo "  ⏩  Skipping..."
echo ""

# ── Step 8: View provenance ──────────────────────────────────────────────
echo "▶ Step 8: Fetching provenance graph..."
PROVENANCE=$(curl -sf "$API_URL/products/$PRODUCT_ID/provenance" 2>/dev/null || echo "")
if [ -n "$PROVENANCE" ]; then
  echo "  ✅ Provenance graph retrieved"
  echo "  $PROVENANCE" | python3 -m json.tool 2>/dev/null || echo "  $PROVENANCE"
else
  echo "  ⚠  Could not fetch provenance"
fi
echo ""

# ── Summary ───────────────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Demo Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Product ID:      $PRODUCT_ID"
echo "  Events Recorded:  3"
echo "  API Base URL:    $API_URL"
echo ""
echo "  Try these links in your browser:"
echo "  - Product Detail:  $API_URL/products/$PRODUCT_ID"
echo "  - Lifecycle:       $API_URL/products/$PRODUCT_ID/lifecycle"
echo "  - Carbon:          $API_URL/carbon/footprint/$PRODUCT_ID"
echo "  - Provenance:      $API_URL/products/$PRODUCT_ID/provenance"
echo ""
echo "  Frontend:        http://localhost:3001"
echo ""
echo "============================================"
echo "  Demo complete!"
echo "============================================"
