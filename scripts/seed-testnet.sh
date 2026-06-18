#!/usr/bin/env bash
set -euo pipefail

VERDECHAIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$VERDECHAIN_ROOT"

echo "=== VerdeChain Testnet Seeder ==="
echo ""

# ── Configuration ──────────────────────────────────────────────────────────
API_URL="${API_URL:-http://localhost:3000}"
MANUFACTURER_KEY="${MANUFACTURER_KEY:-}"
SAMPLE_COUNT=${SAMPLE_COUNT:-10}

if [ -z "$MANUFACTURER_KEY" ]; then
  echo "Warning: MANUFACTURER_KEY not set — using anonymous mode"
fi

echo "  API URL:       $API_URL"
echo "  Sample count:  $SAMPLE_COUNT"
echo ""

# ── Check API availability ────────────────────────────────────────────────
echo "[1/4] Checking API availability..."
if ! curl -sf "$API_URL/health" > /dev/null 2>&1; then
  echo "  Error: API is not available at $API_URL"
  echo "  Start the API with 'npm run dev' and try again."
  exit 1
fi
echo "  ✅ API is healthy"
echo ""

# ── Seed products ─────────────────────────────────────────────────────────
echo "[2/4] Seeding products..."

PRODUCTS=(
  '{"name":"Organic Cotton Tote","description":"Fair-trade organic cotton shopping bag","sku":"COT-001","productType":"TEXTILE","originCountry":"IN","batchNumber":"BATCH-COT-001"}'
  '{"name":"Bamboo Toothbrush","description":"Biodegradable bamboo toothbrush","sku":"BAM-001","productType":"PERSONAL_CARE","originCountry":"CN","batchNumber":"BATCH-BAM-001"}'
  '{"name":"Recycled Aluminum Bottle","description":"100% recycled aluminum water bottle","sku":"ALU-001","productType":"DRINKWARE","originCountry":"DE","batchNumber":"BATCH-ALU-001"}'
  '{"name":"Hemp Rope Dog Leash","description":"Natural hemp dog leash with recycled carabiner","sku":"HEM-001","productType":"PET_SUPPLIES","originCountry":"US","batchNumber":"BATCH-HEM-001"}'
  '{"name":"Cork Yoga Mat","description":"Natural cork yoga mat, non-toxic","sku":"CRK-001","productType":"FITNESS","originCountry":"PT","batchNumber":"BATCH-CRK-001"}'
  '{"name":"Solar-Powered Charger","description":"Portable solar charger for mobile devices","sku":"SOL-001","productType":"ELECTRONICS","originCountry":"CN","batchNumber":"BATCH-SOL-001"}'
  '{"name":"Wool Blanket","description":"Ethically sourced merino wool blanket","sku":"WOL-001","productType":"HOME_GOODS","originCountry":"NZ","batchNumber":"BATCH-WOL-001"}'
  '{"name":"Biodegradable Phone Case","description":"Plant-based biodegradable phone case","sku":"BIO-001","productType":"ACCESSORIES","originCountry":"US","batchNumber":"BATCH-BIO-001"}'
  '{"name":"Reusable Beeswax Wraps","description":"Organic cotton beeswax food wraps","sku":"BEE-001","productType":"KITCHEN","originCountry":"FR","batchNumber":"BATCH-BEE-001"}'
  '{"name":"Coconut Bowl Set","description":"Handcrafted coconut shell bowls","sku":"COC-001","productType":"KITCHEN","originCountry":"VN","batchNumber":"BATCH-COC-001"}'
)

REGISTERED_IDS=()
for PRODUCT in "${PRODUCTS[@]}"; do
  if [ "$SAMPLE_COUNT" -le "${#REGISTERED_IDS[@]}" ]; then
    break
  fi
  RESPONSE=$(curl -sf -X POST "$API_URL/products" \
    -H "Content-Type: application/json" \
    -d "$PRODUCT" 2>/dev/null || echo "")
  if [ -n "$RESPONSE" ]; then
    ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    NAME=$(echo "$PRODUCT" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
    REGISTERED_IDS+=("$ID")
    echo "  ✅ Registered: $NAME (ID: $ID)"
  else
    echo "  ⚠  Failed to register product"
  fi
done
echo "  Registered ${#REGISTERED_IDS[@]} products"
echo ""

# ── Seed lifecycle events ─────────────────────────────────────────────────
echo "[3/4] Seeding lifecycle events..."

STAGES=("RAW_MATERIAL_EXTRACTION" "MANUFACTURING" "TRANSPORT_TO_DISTRIBUTOR" "RETAIL" "END_OF_LIFE")
FUEL_TYPES=("diesel" "natural_gas" "gasoline")
REGIONS=("us" "cn" "eu" "in" "br")

for PRODUCT_ID in "${REGISTERED_IDS[@]}"; do
  for i in $(seq 0 $((${#STAGES[@]} - 1))); do
    STAGE="${STAGES[$i]}"
    REGION="${REGIONS[$((RANDOM % ${#REGIONS[@]}))]}"
    FUEL="${FUEL_TYPES[$((RANDOM % ${#FUEL_TYPES[@]}))]}"
    FUEL_AMOUNT=$((RANDOM % 1000 + 100))
    ENERGY=$((RANDOM % 10000 + 500))

    case $STAGE in
      "RAW_MATERIAL_EXTRACTION")
        DESC="Extracted raw materials for production"
        ;;
      "MANUFACTURING")
        DESC="Manufacturing and assembly"
        ;;
      "TRANSPORT_TO_DISTRIBUTOR")
        DESC="Shipped to regional distribution center"
        ;;
      "RETAIL")
        DESC="Arrived at retail location"
        ;;
      "END_OF_LIFE")
        DESC="End-of-life processing"
        ;;
    esac

    PAYLOAD="{\"productId\":\"$PRODUCT_ID\",\"stage\":\"$STAGE\",\"description\":\"$DESC\",\"location\":\"$REGION\",\"timestamp\":\"$(date -u -d "-$((3 * i)) days" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo "2024-01-01T00:00:00Z")\",\"energyKwh\":$ENERGY,\"fuelUsed\":$FUEL_AMOUNT,\"fuelType\":\"$FUEL\"}"

    RESPONSE=$(curl -sf -X POST "$API_URL/supply-chain/events" \
      -H "Content-Type: application/json" \
      -d "$PAYLOAD" 2>/dev/null || echo "")
    if [ -z "$RESPONSE" ]; then
      echo "  ⚠  Failed to record event for product $PRODUCT_ID"
    fi
  done
  echo "  ✅ Events recorded for product $PRODUCT_ID"
done
echo ""

# ── Summary ───────────────────────────────────────────────────────────────
echo "[4/4] Done!"
echo "  Products registered:   ${#REGISTERED_IDS[@]}"
echo "  Events recorded:       $((${#REGISTERED_IDS[@]} * ${#STAGES[@]}))"
echo ""
echo "Testnet seeding complete!"
echo ""

# Print registered product IDs for reference
echo "Registered Product IDs:"
for ID in "${REGISTERED_IDS[@]}"; do
  echo "  - $ID"
done
echo ""
echo "View products: $API_URL/products"
