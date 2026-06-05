# VerdeChain — 17-Day Development Sprint Plan

> **Target: 55% completion — a robust, contributor-ready foundation with core smart contracts, API scaffolding, frontend shell, SDK, and CI/CD pipelines all wired together.**

---

## Completion Targets by Layer

| Layer | Target % | What "Done" Means |
|---|---|---|
| **Monorepo / Tooling** | 90% | Workspaces, Turborepo, ESLint, Prettier, Docker Compose, `.env.example`, CI workflows |
| **Smart Contracts (Rust/Soroban)** | 70% | ProductRegistry, LifecycleTracker, CarbonOracle complete with tests; Attestation scaffolded; VerifierRegistry + GreenTagCert stubbed |
| **Backend API (NestJS)** | 60% | All 8 modules scaffolded; Products, Supply Chain, Auth, Stellar, IPFS modules functional; Carbon engine (Scope 1-2-3) implemented; certificates module in progress |
| **Frontend (Next.js)** | 40% | App shell, routing, wallet connector, product search, product detail with lifecycle timeline, certificate viewer page |
| **SDK (TypeScript)** | 50% | `VerdeChainClient` with product, lifecycle, carbon methods; types exported; basic tests |
| **CLI (Commander.js)** | 40% | Product, lifecycle, carbon commands functional; verifier, certificate commands stubbed |
| **Infrastructure** | 50% | Docker Compose for local dev, GitHub Actions CI + audit workflows, basic Terraform module stubs |
| **Docs** | 40% | Architecture docs, per-contract README, API reference skeleton, contributor guide |
| **Oracle / Connectors** | 0% | Not started — planned for Phase 2 |

---

## Sprint Calendar (17 Days)

---

### Week 1 — Foundation & Core Contracts

#### Day 1 — Monorepo Scaffolding & Tooling

**Files created:**
- `package.json` — npm workspaces root (`contracts`, `api`, `frontend`, `sdk`, `cli`)
- `turbo.json` — pipeline config (build, test, lint, typecheck)
- `.eslintrc.js` — shared ESLint config (TypeScript + React)
- `.prettierrc` — formatting rules
- `tsconfig.base.json` — shared TypeScript config
- `docker-compose.yml` — PostgreSQL 16, Redis 7, Stellar Quickstart (testnet)
- `docker-compose.test.yml` — isolated test stack
- `.env.example` — all configuration variables with placeholder values
- `.gitignore` — node_modules, target, .env, dist, .turbo
- `sonar-project.properties` — SonarQube quality gates
- `CONTRIBUTING.md` — PR process, commit conventions, test requirements
- `CODE_OF_CONDUCT.md` — Contributor Covenant
- `SECURITY.md` — disclosure policy
- `SUSTAINABILITY.md` — project's own carbon impact report

**Key decisions:**
- Turborepo for build orchestration
- npm workspaces (not pnpm) for broadest compatibility
- All TypeScript projects share `tsconfig.base.json`
- Soroban SDK v21.x pinned in workspace root

**Verification:** `npm install && npm run build` succeeds across all empty packages.

---

#### Day 2 — Shared Contract Infrastructure

**Files created:**
- `contracts/Cargo.toml` — workspace with 6 members:
  - `product_registry`, `lifecycle_tracker`, `attestation`
  - `greentag_cert`, `verifier_registry`, `carbon_oracle`
  - `shared` (library, no contract)
- `contracts/shared/src/types.rs` — shared Soroban types (`ProductStatus`, `LifecycleStage`, `EnergySource`, `AttestationStatus`, `CertType`, `VerifierStatus`)
- `contracts/shared/src/errors.rs` — error enum with codes 100–599:
  - 100–199: General errors (unauthorized, not found, already exists)
  - 200–299: ProductRegistry errors
  - 300–399: LifecycleTracker errors
  - 400–499: Attestation errors
  - 500–599: Certificate / Verifier errors
- `contracts/shared/src/constants.rs` — protocol constants (min stake, thresholds, timing)
- `contracts/shared/src/auth.rs` — `require_admin()` and `require_owner()` helpers
- `contracts/shared/src/lib.rs` — re-exports

**Verification:** `cargo build` compiles the shared library without errors.

---

#### Day 3 — Contract: ProductRegistry (Complete)

**Files created:**
- `contracts/product_registry/src/types.rs` — `ProductMetadata` struct, `ProductStatus` enum
- `contracts/product_registry/src/storage.rs` — persistent state management:
  - `Products` map (`u64 → ProductMetadata`)
  - `OwnerProducts` map (`Address → Vec<u64>`)
  - `NextProductId` counter
  - `TotalProducts` counter
- `contracts/product_registry/src/validation.rs` — input validation:
  - `validate_metadata()` — checks required fields, string lengths, timestamp sanity
  - `validate_transfer()` — checks ownership and authorization
- `contracts/product_registry/src/events.rs` — contract event definitions:
  - `ProductRegistered { product_id, manufacturer, ipfs_hash }`
  - `ProductTransferred { product_id, from, to, timestamp }`
  - `ProductRecalled { product_id, reason, timestamp }`
- `contracts/product_registry/src/lib.rs` — all entry points:
  - `register_product()`, `transfer_product()`, `get_product()`, `get_owner()`
  - `get_products_by_owner()`, `recall_product()`, `total_products()`

**Test files:**
- `contracts/product_registry/tests/unit/test_registration.rs` — 8 test cases
- `contracts/product_registry/tests/unit/test_transfer.rs` — 6 test cases
- `contracts/product_registry/tests/unit/test_recall.rs` — 4 test cases
- `contracts/product_registry/tests/integration/test_cross_contract.rs` — 3 flow tests

**Verification:** `cargo test -p product_registry` — all 21 tests pass.

---

#### Day 4 — Contract: LifecycleTracker (Complete)

**Files created:**
- `contracts/lifecycle_tracker/src/events.rs` — lifecycle event type definitions
- `contracts/lifecycle_tracker/src/emissions.rs` — on-chain emission factor lookups (calls CarbonOracle)
- `contracts/lifecycle_tracker/src/milestones.rs` — configurable lifecycle milestone validator
- `contracts/lifecycle_tracker/src/lib.rs` — all entry points:
  - `record_event()`, `get_lifecycle()`, `get_event()`, `get_event_count()`
  - `get_emissions_summary()`, `batch_record_events()`

**Test files:**
- `contracts/lifecycle_tracker/tests/unit/test_recording.rs` — 10 test cases
- `contracts/lifecycle_tracker/tests/unit/test_batch.rs` — 6 test cases
- `contracts/lifecycle_tracker/tests/integration/test_with_registry.rs` — 4 flow tests

**Verification:** `cargo test -p lifecycle_tracker` — all 20 tests pass. Cross-contract calls to ProductRegistry verified.

---

#### Day 5 — Contract: CarbonOracle (Complete)

**Files created:**
- `contracts/carbon_oracle/src/factors.rs` — emission factor storage and cache:
  - `EmissionFactors` map (`String → EmissionFactor`)
  - Batched factor update support
- `contracts/carbon_oracle/src/methods.rs` — methodology versioning:
  - `get_methodology_version()`, `set_methodology()`
  - Supports: `GHG Protocol 2024`, `IPCC 2024`, `EPA 2024`
- `contracts/carbon_oracle/src/grid.rs` — regional grid intensity:
  - `GridIntensity` map (`String → i128`)
  - Batch update for multiple regions
- `contracts/carbon_oracle/src/lib.rs`:
  - `update_emission_factor()`, `get_emission_factor()`
  - `update_grid_intensity()`, `get_grid_intensity()`
  - `get_methodology_version()`

**Test files:**
- `contracts/carbon_oracle/tests/unit/test_factors.rs` — 8 test cases
- `contracts/carbon_oracle/tests/unit/test_grid.rs` — 5 test cases
- `contracts/carbon_oracle/tests/integration/test_lifecycle_integration.rs` — 4 flow tests

**Verification:** `cargo test -p carbon_oracle` — all 17 tests pass. Verified integration with LifecycleTracker.

---

#### Day 6 — Contracts: Attestation (Scaffolded) + GreenTagCert (Stubbed)

**Files created — Attestation:**
- `contracts/attestation/src/types.rs` — `AttestationRecord`, `AttestationStatus`
- `contracts/attestation/src/escalation.rs` — quorum escalation logic (3 → 5 verifiers)
- `contracts/attestation/src/dissent.rs` — minority opinion recording
- `contracts/attestation/src/lib.rs` — all entry points complete:
  - `submit_for_attestation()`, `approve_attestation()`, `reject_attestation()`
  - `escalate_attestation()`, `get_attestation()`
  - `get_attestations_for_product()`, `get_pending_for_verifier()`

**Test files — Attestation:**
- `contracts/attestation/tests/unit/test_workflow.rs` — 10 test cases (happy path, rejection, threshold)

**Files created — GreenTagCert:**
- `contracts/greentag_cert/src/types.rs` — `CertificateRecord`, `CertType` enum
- `contracts/greentag_cert/src/templates.rs` — template management (stubbed)
- `contracts/greentag_cert/src/verification.rs` — off-chain verification helpers (stubbed)
- `contracts/greentag_cert/src/lib.rs` — entry points implemented:
  - `issue_certificate()`, `verify_certificate()`, `revoke_certificate()`
  - `get_certificate()`, `get_certificates_for_product()`, `get_certificates_by_issuer()`

**Verification:** `cargo test -p attestation` — 10 tests pass. `cargo build -p greentag_cert` succeeds.

---

#### Day 7 — Contract: VerifierRegistry (Scaffolded) + Deploy Scripts

**Files created — VerifierRegistry:**
- `contracts/verifier_registry/src/staking.rs` — stake lock, cooldown, withdrawal:
  - `register_verifier()`, `add_stake()`, `request_stake_withdrawal()`, `complete_stake_withdrawal()`
- `contracts/verifier_registry/src/reputation.rs` — reputation scoring algorithm (weighted: accuracy 40%, timeliness 20%, volume 15%, peer reviews 15%, longevity 10%)
- `contracts/verifier_registry/src/insurance.rs` — verifier insurance pool (stubbed, tracks pool balance)
- `contracts/verifier_registry/src/lib.rs` — all entry points implemented

**Test files — VerifierRegistry:**
- `contracts/verifier_registry/tests/unit/test_staking.rs` — 8 test cases
- `contracts/verifier_registry/tests/unit/test_reputation.rs` — 5 test cases

**Deploy scripts:**
- `contracts/deploy-testnet.sh` — full testnet deployment pipeline:
  - Builds all WASM artifacts
  - Funds admin keypair via Friendbot
  - Deploys contracts in dependency order (shared → ProductRegistry → LifecycleTracker → CarbonOracle → Attestation → GreenTagCert → VerifierRegistry)
  - Writes addresses to `.deployed-testnet.json`
  - Updates `.env` with contract addresses
- `contracts/deploy-mainnet.sh` — multi-sig ceremony wrapper (scaffold)

**Verification:** `cargo test -p verifier_registry` — 13 tests pass. `./deploy-testnet.sh` dry-run validated.

---

### Week 2 — Backend API Core

#### Day 8 — API Scaffold: NestJS + Prisma + Stellar Integration

**Files created:**
- `api/package.json` — dependencies: NestJS 10.x, `@stellar/stellar-sdk` 21.x, Prisma 5.x, class-validator, bullmq, jsonwebtoken, passport, swagger
- `api/tsconfig.json` — extends `tsconfig.base.json`
- `api/src/main.ts` — NestJS bootstrap, Swagger setup (`/v1/docs`), global validation pipe, CORS, Helmet
- `api/src/app.module.ts` — root module with all feature modules registered
- `api/prisma/schema.prisma` — full Prisma schema (12 models):
  - `Manufacturer`, `Facility`, `Product`, `LifecycleEvent`, `MaterialInput`
  - `Certificate`, `CarbonFootprint`, `Verifier`, `AttestationRecord`
  - `Webhook`, `WebhookEvent`, `User` (for SEP-10 role mapping)
- `api/prisma/migrations/001_init.sql` — initial migration
- `api/src/common/` — shared infrastructure:
  - `interfaces/` — `IProductService`, `ILifecycleService`, etc.
  - `decorators/` — `@CurrentUser()`, `@Roles()` decorators
  - `filters/` — `AllExceptionsFilter`, `SorobanExceptionFilter`
  - `interceptors/` — `LoggingInterceptor`, `TimingInterceptor`, `AuditInterceptor`
  - `guards/` — `RateLimitGuard` (token bucket), `RolesGuard`

**Stellar integration:**
- `api/src/stellar/soroban-client.ts` — Soroban RPC client wrapper (connection pool, retry logic)
- `api/src/stellar/horizon-client.ts` — Horizon client for event streaming
- `api/src/stellar/wallet.ts` — Keypair management (generate, fund via Friendbot, sign)
- `api/src/stellar/stellar.service.ts` — unified contract invocation helpers:
  - `callContract()`, `simulateContract()`, `getContractEvents()`
  - `buildTransaction()`, `signAndSend()`

**Verification:** `npm run start:dev` boots API on `:3000`, Swagger UI available at `/v1/docs`.

---

#### Day 9 — Products Module + Supply Chain Module

**Files created — Products:**
- `api/src/products/products.module.ts`
- `api/src/products/dto/create-product.dto.ts` — validation: `@IsString()`, `@IsOptional()`, `@Min(0)`, custom `@IsProductType()`
- `api/src/products/dto/query-product.dto.ts` — pagination, filters (`type`, `origin`, `manufacturer`, `q`, `sort`)
- `api/src/products/products.repository.ts` — Prisma queries with pagination, GIN-indexed JSON filters
- `api/src/products/products.service.ts` — business logic:
  - `create()` — calls `stellarService.contractCall('register_product')`, stores off-chain index
  - `findAll()` — paginated with filters
  - `findOne()` — product detail with manufacturer join
  - `getProvenance()` — builds JSON-LD provenance graph
- `api/src/products/products.controller.ts` — REST endpoints:
  - `GET /products`, `GET /products/:id`, `POST /products`
  - `GET /products/:id/provenance`, `GET /products/:id/lifecycle`
  - `GET /products/:id/carbon`, `GET /products/:id/certificates`
  - `GET /products/owned`, `GET /products/batch/:batch`

**Files created — Supply Chain:**
- `api/src/supply-chain/supply-chain.module.ts`
- `api/src/supply-chain/dto/create-event.dto.ts` — lifecycle event validation
- `api/src/supply-chain/dto/batch-event.dto.ts`
- `api/src/supply-chain/supply-chain.service.ts`:
  - `recordEvent()` — writes to LifecycleTracker contract, indexes off-chain
  - `batchRecord()` — atomic batch via `batch_record_events`
  - `getTimeline()` — chronological with emissions per stage
  - `getParticipants()` — all unique addresses in a product's chain
- `api/src/supply-chain/aggregation.service.ts` — builds provenance graph from events
- `api/src/supply-chain/supply-chain.controller.ts`

**Verification:** `POST /products` creates a product on-chain + off-chain. `GET /products/:id/provenance` returns JSON-LD graph. All endpoints return `201`/`200` with correct shapes.

---

#### Day 10 — Auth Module (SEP-10 + JWT) + IPFS Module

**Files created — Auth:**
- `api/src/auth/auth.module.ts`
- `api/src/auth/strategies/sep10.strategy.ts` — SEP-10 challenge generation:
  - `generateChallenge()` — creates Stellar challenge transaction XDR
  - `verifyChallenge()` — validates signed XDR against Stellar network
  - Extracts `sub` (public key) from verified transaction
- `api/src/auth/strategies/jwt.strategy.ts` — Passport JWT strategy:
  - Validates JWT signature + expiry
  - Loads user roles from PostgreSQL `User` table
  - Attaches `{ sub, roles }` to `req.user`
- `api/src/auth/guards/jwt-auth.guard.ts` — `@UseGuards(JwtAuthGuard)`
- `api/src/auth/guards/roles.guard.ts` — `@Roles('manufacturer')` decorator
- `api/src/auth/auth.service.ts`:
  - `challenge(publicKey)` → returns signed XDR challenge
  - `verify(signedXdr)` → validates + returns JWT
  - `refresh(token)` → validates + reissues
- `api/src/auth/auth.controller.ts`:
  - `POST /auth/challenge` — `{ publicKey } → { challengeXdr }`
  - `POST /auth/verify` — `{ signedXdr } → { jwt, expiresIn }`
  - `POST /auth/refresh` — `{ token } → { jwt, expiresIn }`

**Files created — IPFS:**
- `api/src/ipfs/ipfs.module.ts`
- `api/src/ipfs/ipfs.service.ts`:
  - `upload(buffer, filename)` — pins to Pinata, returns CID
  - `get(cid)` — fetches from IPFS gateway
  - `delete(cid)` — unpins from Pinata
  - `pinJSON(data)` — convenience for JSON metadata

**Verification:** Full SEP-10 flow works with Freighter wallet. `POST /auth/verify` returns valid JWT. `GET /products` with `Authorization: Bearer <jwt>` succeeds. IPFS upload returns a valid CID.

---

#### Day 11 — Carbon Accounting Engine

**Files created:**
- `api/src/carbon-accounting/carbon.module.ts`
- `api/src/carbon-accounting/methodology.ts` — GHG Protocol methodology engine:
  - `getApplicableFactors(event, region)` — selects correct factors by location + stage
  - `computeConfidence(events)` — score 0–100 based on data completeness
  - `getScopeMapping(stage)` — maps lifecycle stage to Scope 1/2/3
- `api/src/carbon-accounting/calculators/scope1.ts` — direct emissions:
  - `calculateDirectEmissions(fuelUse, fleetData)` — fuel combustion
  - `calculateProcessEmissions(chemicalInputs)` — industrial processes
- `api/src/carbon-accounting/calculators/scope2.ts` — energy indirect:
  - `calculateEnergyEmissions(kwh, gridIntensity)` — purchased electricity
  - Uses regional grid intensity from CarbonOracle contract
- `api/src/carbon-accounting/calculators/scope3.ts` — supply chain:
  - `calculateUpstreamEmissions(materials, transport)` — purchased goods
  - `calculateDownstreamEmissions(distribution, use, disposal)` — downstream
- `api/src/carbon-accounting/factors/ipcc.ts` — IPCC emission factor repository:
  - 50+ factors: grid by country, fuel types, industrial processes
- `api/src/carbon-accounting/factors/epa.ts` — EPA emission factors:
  - 30+ factors: US-specific grid, transport, waste
- `api/src/carbon-accounting/factors/grid.ts` — regional grid intensity:
  - 40+ country/region entries with hourly refresh support
- `api/src/carbon-accounting/carbon.service.ts`:
  - `calculateFootprint(productId)` — full cradle-to-grave
  - `getBreakdown(productId)` — by lifecycle stage
  - `compare(productIds)` — side-by-side comparison
  - `getEquivalents(kgCO2e)` — consumer-friendly units (km driven, trees, phones)
- `api/src/carbon-accounting/carbon.controller.ts`:
  - `GET /carbon/footprint/:productId`, `GET /carbon/breakdown/:productId`
  - `GET /carbon/compare?ids=1,2,3`, `GET /carbon/factors`
  - `POST /carbon/factors` (admin), `GET /carbon/grid-intensity/:region`
  - `GET /carbon/methodology`

**Test files:**
- `api/test/unit/carbon/scope1.spec.ts` — 5 test cases
- `api/test/unit/carbon/scope2.spec.ts` — 4 test cases
- `api/test/unit/carbon/scope3.spec.ts` — 5 test cases
- `api/test/unit/carbon/methodology.spec.ts` — 6 test cases
- `api/test/integration/carbon-footprint.spec.ts` — 4 flow tests

**Verification:** `GET /carbon/footprint/1` returns full breakdown with correct totals. All 20 carbon tests pass. Equivalents match expected values.

---

#### Day 12 — Certificates Module + Verifiers Module

**Files created — Certificates:**
- `api/src/certificates/certificates.module.ts`
- `api/src/certificates/dto/issue-certificate.dto.ts`
- `api/src/certificates/generators/pdf-generator.ts` — Puppeteer + Handlebars:
  - `generateCertificate(certData)` — renders template, returns PDF buffer
  - `embedXML(pdf, xml)` — embeds machine-readable XML in PDF/A-3
- `api/src/certificates/generators/jsonld-generator.ts` — JSON-LD provenance export
- `api/src/certificates/generators/html-generator.ts` — web preview
- `api/src/certificates/templates/` — Handlebars templates (certificate-of-origin, carbon-neutral, organic)
- `api/src/certificates/certificates.service.ts`:
  - `issue()` — calls GreenTagCert contract, generates PDF, uploads to IPFS
  - `verify()` — checks on-chain status + hash match
  - `revoke()` — calls contract, updates off-chain index
  - `getCertificatePdf()` — returns stored PDF from IPFS or cache
- `api/src/certificates/certificates.controller.ts`:
  - `GET /certificates`, `GET /certificates/:id`
  - `GET /certificates/:id/pdf` — downloadable PDF
  - `POST /certificates`, `POST /certificates/:id/revoke`
  - `POST /certificates/verify`, `GET /certificates/product/:productId`

**Files created — Verifiers:**
- `api/src/verifiers/verifiers.module.ts`
- `api/src/verifiers/dto/register-verifier.dto.ts`
- `api/src/verifiers/staking.service.ts` — stake management helpers:
  - `calculateMinStake()` — verifies minimum 1000 XLM
  - `getStakeLockPeriod()` — cooldown calculation
- `api/src/verifiers/verifiers.service.ts`:
  - `register()` — calls VerifierRegistry contract
  - `getProfile()` — verifier details + reputation
  - `getPendingAttestations()` — events awaiting review
  - `heartbeat()` — liveness signal
- `api/src/verifiers/verifiers.controller.ts`:
  - `GET /verifiers`, `GET /verifiers/:id`
  - `POST /verifiers/register`, `PUT /verifiers/:id/stake`
  - `GET /verifiers/pending`, `POST /verifiers/:id/heartbeat`

**Verification:** Certificate issuance flow works end-to-end (product → attest → certify). Verifier registration with stake validation passes.

---

#### Day 13 — Indexer + Webhooks + Seed Scripts

**Files created — Indexer:**
- `api/src/indexer/indexer.service.ts` — Horizon event stream consumer:
  - `start()` — begins streaming from last processed ledger
  - `processLedger(seq)` — processes all contract events in a ledger
  - `handleReorg()` — handles Stellar reorgs (rollback + reprocess)
- `api/src/indexer/processors/product-processor.ts` — ProductRegistered, ProductTransferred, ProductRecalled
- `api/src/indexer/processors/lifecycle-processor.ts` — LifecycleEventRecorded
- `api/src/indexer/processors/attestation-processor.ts` — AttestationRequested, Approved, Rejected, Escalated
- `api/src/indexer/processors/certificate-processor.ts` — GreenTagIssued, GreenTagRevoked
- `api/src/indexer/processors/verifier-processor.ts` — VerifierRegistered, VerifierSlashed
- `api/src/indexer/sync.service.ts` — full resync from genesis:
  - `resyncFrom(ledger)` — truncates + re-indexes from specified ledger
  - `verifyConsistency()` — compares on-chain state with off-chain index

**Webhooks:**
- `api/src/webhooks/webhook.service.ts` — event dispatch:
  - `dispatch(eventType, payload)` — fans out to registered webhooks
  - `retry(id)` — exponential backoff (3 attempts)
  - `sign(payload, secret)` — HMAC-SHA256 signature
- Webhook endpoints: `POST /webhooks`, `GET /webhooks`, `DELETE /webhooks/:id`, `POST /webhooks/:id/test`

**Seed scripts:**
- `api/scripts/seed-products.ts` — 10 sample products with lifecycle events
- `api/scripts/seed-verifiers.ts` — 5 sample verifiers with stakes
- `api/scripts/generate-demo-chain.ts` — multi-hop supply chain demo (raw material → manufacturer → logistics → retailer)

**Verification:** Indexer processes testnet events and updates PostgreSQL. Seed scripts populate database with realistic demo data.

---

### Week 3 — Frontend, SDK, CLI & Integration

#### Day 14 — Next.js App Shell + Core Pages

**Files created:**
- `frontend/package.json` — Next.js 14, Tailwind CSS 3, D3.js, `@stellar/freighter-api`, `react-qr-reader`
- `frontend/tsconfig.json`
- `frontend/tailwind.config.ts` — custom theme (green + earth tones)
- `frontend/app/layout.tsx` — root layout:
  - Wallet connector (Freighter)
  - Navigation (products, certificates, explorer, manufacturer dashboard)
  - Global search bar
  - Theme provider (light/dark)
- `frontend/app/page.tsx` — landing page / product scanner:
  - QR code scanner input
  - Search bar with autocomplete
  - Recent products grid
  - Stats bar (products tracked, certificates issued, CO2e accounted)
- `frontend/app/products/page.tsx` — product search + listing:
  - Filter sidebar (type, origin, certification)
  - Sort options
  - Product card grid
  - Pagination
- `frontend/app/products/[id]/page.tsx` — product detail:
  - Product info card (brand, SKU, batch, origin)
  - Lifecycle timeline (chronological)
  - Carbon footprint summary with breakdown
  - Certificates list
  - Provenance graph (placeholder for D3.js)
  - QR code with verification link

**Components created:**
- `frontend/components/ui/` — shadcn/ui primitives:
  - `Button`, `Card`, `Input`, `Badge`, `Tabs`, `Table`, `Dialog`, `Select`, `Skeleton`
- `frontend/components/product-card/index.tsx` — search result card
- `frontend/components/wallet-connector/index.tsx` — Freighter connect button + account display
- `frontend/components/scanner/index.tsx` — QR code scanner using `react-qr-reader`

**Library files:**
- `frontend/lib/stellar.ts` — Stellar SDK browser wrapper (Soroban contract calls)
- `frontend/lib/freighter.ts` — Freighter wallet helpers (`isConnected()`, `getPublicKey()`, `signTransaction()`)
- `frontend/lib/api.ts` — API client (axios, auth token management, error handling)

**Verification:** `npm run dev` in `frontend/` — app loads at `:3001`, wallet connects, product search returns results from API.

---

#### Day 15 — Provenance Graph + Carbon Visualization + Certificate Viewer

**Components created:**
- `frontend/components/provenance-graph/index.tsx` — interactive D3.js force-directed graph:
  - Nodes: participants (manufacturer, supplier, logistics, verifier)
  - Edges: transfers and lifecycle events
  - Color-coded by role
  - Click to expand details
  - Zoom + pan
- `frontend/components/lifecycle-timeline/index.tsx` — chronological lifecycle view:
  - Vertical timeline with stages
  - Emissions per stage (bar chart overlay)
  - Expandable event details (inputs, energy, waste)
- `frontend/components/carbon-breakdown/index.tsx` — emissions visualization:
  - Donut chart (by lifecycle stage)
  - Stacked bar (Scope 1/2/3 breakdown)
  - Equivalents display (km driven, trees, phones)
  - Confidence score indicator
- `frontend/components/certificate-preview/index.tsx` — certificate viewer:
  - PDF preview iframe
  - Certificate details (type, issuer, date, status)
  - Verification status badge
  - Revocation info (if applicable)

**Pages added:**
- `frontend/app/certificates/page.tsx` — certificate search + listing
- `frontend/app/certificates/[id]/page.tsx` — certificate detail + PDF preview
- `frontend/app/explorer/page.tsx` — public provenance explorer (search + browse)
- `frontend/app/manufacturer/page.tsx` — manufacturer dashboard:
  - Products owned
  - Pending attestations
  - Certificates issued
  - Carbon footprint trends
- `frontend/app/verifier/page.tsx` — verifier dashboard (stub):
  - Pending attestations list
  - Approve/reject actions
  - Reputation score
  - Stake overview

**Verification:** All pages render. D3.js graph displays sample provenance data. Carbon chart shows correct breakdown.

---

#### Day 16 — TypeScript SDK + CLI Tool

**Files created — SDK (`sdk/`):**
- `sdk/package.json` — `@verdechain/sdk`, builds to ESM + CJS
- `sdk/src/types.ts` — all TypeScript type definitions:
  - `ProductMetadata`, `LifecycleEvent`, `MaterialInput`
  - `CertificateRecord`, `CertType`, `VerifierRecord`, `ReputationScore`
  - `CarbonFootprint`, `EmissionsBreakdown`, `Equivalents`
  - `AttestationRecord`, `Facility`, `Manufacturer`
- `sdk/src/client.ts` — `VerdeChainClient` main class:
  - Configuration: `apiUrl`, `horizonUrl`, `sorobanRpc`, `networkPassphrase`, `contractAddresses`
  - Constructor validates config
  - `setAuthToken(token)`, `getAuthToken()`
  - Internal `request()` method (axios, auth header, error handling)
- `sdk/src/products.ts`:
  - `getProducts(filters)`, `getProduct(id)`, `registerProduct(data)`
  - `getProvenance(id)`, `getProductsByOwner(publicKey)`, `getProductsByBatch(batch)`
- `sdk/src/lifecycle.ts`:
  - `getEvents(productId)`, `recordEvent(data)`, `batchRecordEvents(events)`
  - `getTimeline(productId)`, `getParticipants(productId)`
- `sdk/src/carbon.ts`:
  - `getFootprint(productId)`, `getBreakdown(productId)`
  - `compare(productIds)`, `getFactors()`, `getGridIntensity(region)`
- `sdk/src/certificates.ts`:
  - `getCertificates(filters)`, `getCertificate(id)`, `getCertificatePdf(id)`
  - `issueCertificate(data)`, `revokeCertificate(id, reason)`, `verifyCertificate(id)`
- `sdk/src/verifiers.ts`:
  - `getVerifiers()`, `getVerifier(id)`, `registerVerifier(data)`
  - `addStake(id, amount)`, `getPendingAttestations()`, `heartbeat(id)`

**Test files — SDK:**
- `sdk/__tests__/client.test.ts` — 4 tests (config validation, auth token management)
- `sdk/__tests__/products.test.ts` — 5 tests (mock API responses)
- `sdk/__tests__/carbon.test.ts` — 3 tests

**Files created — CLI (`cli/`):**
- `cli/package.json` — `@verdechain/cli`, Commander.js, chalk, ora, cli-table3
- `cli/src/index.ts` — program entry point:
  - `verdechain products`, `verdechain lifecycle`, `verdechain carbon`
  - `verdechain certificates`, `verdechain verifiers`, `verdechain doctor`
  - Global flags: `--api-url`, `--network`, `--format` (table/json)
- `cli/src/commands/products.ts`:
  - `verdechain products list [options]`, `verdechain products get <id>`
  - `verdechain products register <json-file>`
- `cli/src/commands/lifecycle.ts`:
  - `verdechain lifecycle list <product-id>`, `verdechain lifecycle record <json-file>`
- `cli/src/commands/carbon.ts`:
  - `verdechain carbon footprint <product-id>`, `verdechain carbon factors`
  - `verdechain carbon grid-intensity <region>`
- `cli/src/commands/certificates.ts` — stubbed (planned for Phase 2)
- `cli/src/commands/verifiers.ts` — stubbed (planned for Phase 2)
- `cli/src/commands/doctor.ts` — environment diagnostics:
  - Checks Node.js version, Rust toolchain, Docker, PostgreSQL, Redis
  - Verifies contract deployment status
  - Validates environment configuration

**Verification:** `npm install -g .` in `sdk/` — SDK imports cleanly. CLI commands produce correct table/json output.

---

#### Day 17 — CI/CD, Infra, Docs & Integration Testing

**CI/CD — GitHub Actions:**
- `.github/workflows/ci.yml` — test + lint on every PR:
  - Matrix: Node 20, Rust 1.75
  - Steps: checkout, cache, install, build contracts, `cargo test`, build API, `npm test`, build frontend, lint (ESLint + clippy), typecheck
- `.github/workflows/audit.yml` — nightly security audit:
  - `cargo audit`, `npm audit`, `trivy` filesystem scan
- `.github/workflows/deploy-testnet.yml` — auto-deploy on merge to main:
  - Builds WASM, deploys to Stellar testnet, runs smoke tests
- `.github/workflows/release.yml` — semantic release on tag:
  - Builds all packages, publishes `@verdechain/sdk` and `@verdechain/cli` to npm
- `.github/CODEOWNERS` — team ownership per directory
- `.github/PULL_REQUEST_TEMPLATE.md` — structured PR template

**Infrastructure (Terraform stubs):**
- `infra/modules/ecs/main.tf` — Fargate cluster + service definition (scaffold)
- `infra/modules/rds/main.tf` — PostgreSQL 16 RDS instance (scaffold)
- `infra/modules/elasticache/main.tf` — Redis 7 ElastiCache (scaffold)
- `infra/modules/cloudfront/main.tf` — CDN for certificate delivery (scaffold)
- `infra/environments/testnet/main.tf` — testnet environment (references modules)
- `infra/environments/mainnet/main.tf` — mainnet environment (placeholder)
- `infra/README.md` — Terraform usage guide

**Scripts:**
- `scripts/bootstrap.sh` — one-click local setup:
  - Verifies prerequisites, installs deps, starts Docker services, runs migrations, funds testnet keys, deploys contracts, seeds data, starts API + frontend
- `scripts/demo.sh` — interactive walkthrough:
  - Register product → record lifecycle → attest → issue GreenTag → scan + verify
- `scripts/seed-testnet.sh` — populate testnet with realistic sample data
- `scripts/rotate-keys.sh` — admin key rotation ceremony (scaffold)

**Docs:**
- `docs/architecture/overview.md` — system architecture with diagrams
- `docs/contracts/product-registry.md` — ProductRegistry reference
- `docs/contracts/lifecycle-tracker.md` — LifecycleTracker reference
- `docs/contracts/carbon-oracle.md` — CarbonOracle reference
- `docs/api/README.md` — API reference skeleton (auto-generated from Swagger)
- `docs/carbon-accounting/methodology.md` — GHG Protocol methodology documentation
- `docs/guides/development.md` — developer environment setup guide
- `docs/guides/contributing.md` — how to contribute guide

**Integration tests:**
- `api/test/e2e/full-flow.spec.ts` — full user journey:
  1. Connect Freighter wallet
  2. Register product
  3. Record lifecycle events (3 stages)
  4. Submit for attestation
  5. Approve attestation
  6. Issue GreenTag certificate
  7. Verify certificate via QR scan
  8. Query carbon footprint

**Final verification:**
- `npm run test` — all tests pass (contracts + API + frontend + SDK)
- `npm run lint` — zero ESLint/clippy warnings
- `npm run typecheck` — zero TypeScript errors
- `cargo build` — all contracts compile to WASM
- `docker-compose up` — full stack boots (PostgreSQL, Redis, API, frontend)
- `./scripts/demo.sh` — interactive demo runs without errors

---

## 55% Completion — What Exists After 17 Days

```
verdechain/
│
├── contracts/                          # ✅ ~70%
│   ├── shared/                         # ✅ Complete (types, errors, constants, auth)
│   ├── product_registry/               # ✅ Complete (5 src files, 21 tests)
│   ├── lifecycle_tracker/              # ✅ Complete (4 src files, 20 tests)
│   ├── carbon_oracle/                  # ✅ Complete (4 src files, 17 tests)
│   ├── attestation/                    # ✅ Complete (4 src files, 10 tests)
│   ├── greentag_cert/                  # ✅ Complete (4 src files, build verified)
│   ├── verifier_registry/              # ✅ Complete (4 src files, 13 tests)
│   ├── deploy-testnet.sh               # ✅ Complete
│   ├── deploy-mainnet.sh               # 🔧 Scaffold (multi-sig ceremony)
│   ├── Cargo.toml                      # ✅ Complete
│   └── Cargo.lock                      # ✅ Generated
│
├── api/                                # ✅ ~60%
│   ├── src/
│   │   ├── main.ts                     # ✅ Complete (bootstrap + Swagger)
│   │   ├── app.module.ts               # ✅ Complete (all modules registered)
│   │   ├── products/                   # ✅ Complete (controller, service, repo, DTOs)
│   │   ├── supply-chain/               # ✅ Complete (controller, service, aggregation)
│   │   ├── certificates/               # ✅ Complete (controller, service, generators, templates)
│   │   ├── verifiers/                  # ✅ Complete (controller, service, staking)
│   │   ├── carbon-accounting/          # ✅ Complete (calculators, factors, methodology)
│   │   ├── auth/                       # ✅ Complete (SEP-10 + JWT strategies, guards)
│   │   ├── stellar/                    # ✅ Complete (Soroban, Horizon, wallet)
│   │   ├── ipfs/                       # ✅ Complete (service + module)
│   │   ├── indexer/                    # ✅ Complete (stream, processors, sync)
│   │   ├── webhooks/                   # ✅ Complete (dispatch, retry, sign)
│   │   └── common/                     # ✅ Complete (guards, interceptors, decorators, filters)
│   ├── prisma/                         # ✅ Complete (schema + initial migration)
│   ├── test/                           # ✅ ~50% (carbon unit tests, integration, E2E)
│   └── scripts/                        # ✅ Complete (seed + demo generation)
│
├── frontend/                           # ✅ ~40%
│   ├── app/
│   │   ├── layout.tsx                  # ✅ Complete (wallet, nav, search, theme)
│   │   ├── page.tsx                    # ✅ Complete (QR scanner, search, stats)
│   │   ├── products/                   # ✅ Complete (list + detail pages)
│   │   ├── certificates/               # ✅ Complete (list + detail + PDF viewer)
│   │   ├── manufacturer/               # ✅ Complete (dashboard)
│   │   ├── verifier/                   # ✅ Complete (dashboard stub)
│   │   └── explorer/                   # ✅ Complete (public explorer)
│   ├── components/
│   │   ├── ui/                         # ✅ Complete (10 primitives)
│   │   ├── provenance-graph/           # ✅ Complete (D3.js interactive)
│   │   ├── lifecycle-timeline/         # ✅ Complete (chronological + emissions)
│   │   ├── carbon-breakdown/           # ✅ Complete (charts + equivalents)
│   │   ├── certificate-preview/        # ✅ Complete (PDF + status)
│   │   ├── product-card/              # ✅ Complete
│   │   ├── scanner/                    # ✅ Complete (QR reader)
│   │   └── wallet-connector/          # ✅ Complete (Freighter)
│   ├── lib/                            # ✅ Complete (stellar, freighter, api)
│   └── package.json                    # ✅ Complete
│
├── sdk/                                # ✅ ~50%
│   ├── src/
│   │   ├── client.ts                   # ✅ Complete (config, auth, request)
│   │   ├── products.ts                 # ✅ Complete (CRUD + provenance)
│   │   ├── lifecycle.ts                # ✅ Complete (events, timeline, participants)
│   │   ├── carbon.ts                   # ✅ Complete (footprint, breakdown, compare)
│   │   ├── certificates.ts            # ✅ Complete (CRUD + verify + PDF)
│   │   ├── verifiers.ts               # ✅ Complete (CRUD + stake + attestations)
│   │   └── types.ts                    # ✅ Complete (all interfaces)
│   └── __tests__/                      # ✅ Basic test suite
│
├── cli/                                # ✅ ~40%
│   ├── src/
│   │   ├── index.ts                    # ✅ Complete (Commander.js program)
│   │   ├── commands/products.ts        # ✅ Complete (list, get, register)
│   │   ├── commands/lifecycle.ts       # ✅ Complete (list, record)
│   │   ├── commands/carbon.ts          # ✅ Complete (footprint, factors, grid)
│   │   ├── commands/certificates.ts    # 🔧 Stubbed
│   │   ├── commands/verifiers.ts       # 🔧 Stubbed
│   │   └── commands/doctor.ts          # ✅ Complete (env diagnostics)
│   └── package.json
│
├── oracle/                             # ❌ Not started (Phase 2)
├── connectors/                         # ❌ Not started (Phase 3)
│
├── infra/                              # ✅ ~50%
│   ├── modules/ (ecs, rds, elasticache, cloudfront)  # 🔧 Scaffolded
│   ├── environments/ (testnet, mainnet)               # 🔧 Scaffolded
│   └── README.md                      # ✅ Complete
│
├── .github/workflows/                  # ✅ Complete
│   ├── ci.yml                          # ✅ Complete
│   ├── audit.yml                       # ✅ Complete
│   ├── deploy-testnet.yml              # ✅ Complete
│   ├── deploy-mainnet.yml              # 🔧 Scaffolded
│   └── release.yml                     # ✅ Complete
│
├── scripts/                            # ✅ Complete
│   ├── bootstrap.sh                    # ✅ One-click setup
│   ├── demo.sh                         # ✅ Interactive demo
│   ├── seed-testnet.sh                 # ✅ Testnet seeder
│   ├── rotate-keys.sh                  # 🔧 Scaffolded
│   └── generate-demo-supply-chain.sh   # ✅ Complete
│
├── docs/                               # ✅ ~40%
│   ├── architecture/                   # ✅ Overview + diagrams
│   ├── contracts/                      # ✅ 3 contract references
│   ├── api/                            # 🔧 Reference skeleton
│   ├── carbon-accounting/              # ✅ Methodology docs
│   ├── integration/                    # ❌ Not started
│   └── guides/                         # ✅ Dev + contributor guides
│
├── docker-compose.yml                  # ✅ Complete
├── docker-compose.test.yml             # ✅ Complete
├── .env.example                        # ✅ Complete
├── package.json                        # ✅ Complete (npm workspaces)
├── turbo.json                          # ✅ Complete
├── .eslintrc.js                        # ✅ Complete
├── .prettierrc                         # ✅ Complete
├── sonar-project.properties            # ✅ Complete
├── CONTRIBUTING.md                     # ✅ Complete
├── SECURITY.md                         # ✅ Complete
├── CODE_OF_CONDUCT.md                  # ✅ Complete
└── SUSTAINABILITY.md                   # ✅ Complete
```

**Legend:** ✅ Complete | 🔧 Scaffolded / In Progress | ❌ Not Started

---

## What's Left for the Remaining 45%

| Area | Remaining Work |
|---|---|
| **Smart Contracts** (30%) | Fuzz testing, formal verification, mainnet-optimized WASM, multi-sig upgrade support |
| **Backend API** (40%) | Webhook retry queue, rate limiting at scale, ERP sync endpoints, admin audit log |
| **Frontend** (60%) | Mobile responsive, accessibility audit, i18n, PWA, push notifications, advanced filtering |
| **SDK/CLI** (50%) | Full certificate + verifier commands, batch operations, offline mode |
| **Oracle** (100%) | IoT MQTT ingestion, emission factor sync cron, grid intensity live poller |
| **Connectors** (100%) | SAP, Oracle EBS, Dynamics, Shopify plugins |
| **Infrastructure** (50%) | Production-ready Terraform, auto-scaling policies, disaster recovery, monitoring dashboards |
| **Testing** (60%) | Load testing (k6), penetration testing, fuzzing, browser E2E tests (Playwright) |
| **Security** (100%) | Third-party audits (Trail of Bits, OpenZeppelin, Halborn), bug bounty program |
| **Docs** (60%) | Video tutorials, interactive API playground, deployment guides, mobile SDK docs |
| **Governance** (100%) | DAO migration, token-weighted voting, treasury management |

---

## Daily Velocity Metrics

| Day | Focus Area | Files Created | Tests Added | Cumulative Pass Rate |
|-----|-----------|--------------|-------------|---------------------|
| 1 | Monorepo + Tooling | ~15 | 0 | — |
| 2 | Shared Contract Infrastructure | ~8 | 0 | — |
| 3 | ProductRegistry Contract | ~7 | 21 | 100% |
| 4 | LifecycleTracker Contract | ~6 | 20 | 100% |
| 5 | CarbonOracle Contract | ~6 | 17 | 100% |
| 6 | Attestation + GreenTagCert | ~10 | 10 | 100% |
| 7 | VerifierRegistry + Deploy Scripts | ~9 | 13 | 100% |
| 8 | API Scaffold + Prisma + Stellar | ~20 | 0 | — |
| 9 | Products + Supply Chain Modules | ~18 | 0 | — |
| 10 | Auth + IPFS Modules | ~12 | 0 | — |
| 11 | Carbon Accounting Engine | ~15 | 20 | 100% |
| 12 | Certificates + Verifiers Modules | ~20 | 0 | — |
| 13 | Indexer + Webhooks + Seed Scripts | ~15 | 0 | — |
| 14 | Next.js App Shell + Core Pages | ~20 | 0 | — |
| 15 | Provenance Graph + Visualization | ~12 | 0 | — |
| 16 | SDK + CLI Tool | ~20 | 12 | 100% |
| 17 | CI/CD + Infra + Docs + Integration | ~25 | 1 (E2E) | 100% |

**Total: ~238 files created, ~114 tests, all passing at sprint end.**

---

## Contributor Onboarding (Post-Sprint)

After the 17-day sprint, a new contributor can:

1. **Run the full stack locally** in 3 commands: `./scripts/bootstrap.sh`
2. **Understand the architecture** from `docs/architecture/overview.md`
3. **Pick a task** from the remaining 45% work items listed above
4. **Follow the pattern** of existing code — all modules follow consistent conventions
5. **Submit a PR** knowing CI will run 114+ tests, lint, and typecheck

The 55% foundation ensures that every new feature has:
- Existing contracts to integrate with (ProductRegistry, LifecycleTracker, CarbonOracle)
- API patterns to follow (controllers → services → repositories → Stellar)
- Frontend components to reuse (ui primitives, wallet connector, provenance graph)
- SDK methods to call (client → product/lifecycle/carbon modules)
- Tests to learn from (test structure, mock patterns, integration fixtures)
