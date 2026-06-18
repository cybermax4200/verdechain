# VerdeChain 🌱

> **Transparent, tamper-proof green supply chain traceability — built on Stellar Soroban.**

VerdeChain is an open-source, blockchain-native supply chain traceability platform that enables manufacturers, suppliers, auditors, and consumers to verify the full lifecycle provenance of any product — from raw material extraction to final disposal. Every sustainability claim, carbon offset, and certificate of origin is cryptographically anchored to the Stellar ledger, eliminating greenwashing and creating a trust-minimized record of environmental impact.

---

## Table of Contents

1. [The Problem](#the-problem)
2. [The VerdeChain Solution](#the-verdechain-solution)
3. [Core Features](#core-features)
4. [Architecture](#architecture)
5. [Tech Stack](#tech-stack)
6. [Repository Structure](#repository-structure)
7. [Quick Start](#quick-start)
8. [Environment Configuration](#environment-configuration)
9. [Smart Contracts](#smart-contracts)
10. [Backend API](#backend-api)
11. [Frontend Application](#frontend-application)
12. [GreenTag Certificates](#greentag-certificates)
13. [Data Models](#data-models)
14. [Authentication & Authorization](#authentication--authorization)
15. [Verifier Network](#verifier-network)
16. [Carbon Accounting Engine](#carbon-accounting-engine)
17. [Testing](#testing)
18. [Deployment](#deployment)
19. [Security](#security)
20. [Roadmap](#roadmap)
21. [Contributing](#contributing)
22. [License](#license)

---

## The Problem

### Greenwashing Is Epidemic

Despite 92% of Fortune 500 companies publishing sustainability reports, independent audits reveal that **67% of environmental claims are misleading or outright false** (European Commission, 2024). Consumers, regulators, and investors cannot distinguish genuinely sustainable products from marketing spin.

**Key failures in today's supply chains:**

| Issue                             | Description                                                                                                                               |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Opaque Provenance**             | Raw material origins are buried in paper trails, PDFs, and siloed ERP systems — impossible for end consumers to verify                    |
| **Fragmented Certifications**     | Organic, Fair Trade, Rainforest Alliance, Carbon Neutral — dozens of labels with no interoperable verification layer                      |
| **Double Counting Offsets**       | The same carbon offset is sold to multiple buyers; there is no global deduplication layer                                                 |
| **Forged Certificates of Origin** | PDF certificates are trivially reproducible; no cryptographic binding exists between a certificate and the underlying supply chain data   |
| **Manual Audits**                 | Sustainability audits cost $50k–$200k per facility and occur annually at best — leaving 11 months of unverified operations                |
| **Regulatory Fragmentation**      | EU CBAM, SEC climate rules, UK SDR, Japan's Green Transformation — each mandates different data formats with no cross-compliance standard |
| **Consumer Distrust**             | 74% of consumers say they would pay more for sustainable products, but only 12% trust current green labels (Deloitte, 2024)               |

---

## The VerdeChain Solution

VerdeChain solves these problems by turning every product into a **transparent, traceable digital twin** on the Stellar blockchain. The core idea is simple:

1. **Each product unit is represented as a digital asset** on Stellar with immutable metadata covering its entire lifecycle — raw material sourcing, manufacturing, logistics, usage, and end-of-life.
2. **Every sustainability claim is attested by a network of independent verifiers** — certification bodies, auditors, IoT sensors, and satellite imagery oracles — each signing their assertion on-chain.
3. **GreenTag certificates** are cryptographically bound to the underlying on-chain record — a consumer scans a QR code and sees the full, verifiable provenance graph, not a marketing PDF.
4. **Carbon accounting is automated** — the contract calculates cradle-to-gate and cradle-to-grave emissions from attested data points, eliminating manual reporting.

### Who It Serves

| Role                       | What VerdeChain Gives Them                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Manufacturers & Brands** | Immutable proof of sustainable sourcing; automated ESG reporting; green premium monetization            |
| **Suppliers & Producers**  | Verifiable chain of custody for raw materials; access to green finance based on attested provenance     |
| **Certification Bodies**   | On-chain verifier workflow with multi-sig attestation; reduced audit overhead via continuous monitoring |
| **Logistics Providers**    | Smart-contract-enforced carbon-aware routing; tamper-proof shipping emissions records                   |
| **Consumers**              | Scan-to-verify provenance; trust-minimized assurance that green claims are real                         |
| **Regulators**             | Standardized, machine-readable compliance data; cross-jurisdictional data sharing via open protocol     |
| **Impact Investors**       | Real-time visibility into the actual environmental performance of portfolio companies                   |

---

## Core Features

### 🔗 Product Lifecycle Traceability

Every product is a unique digital asset carrying a complete, traversable lifecycle record:

- Raw material extraction — origin (GPS coordinates), date, lot, supplier, sustainability certification
- Processing & manufacturing — facility ID, energy source, water usage, waste generation
- Logistics — shipping mode, route, fuel type, distance, emissions per leg
- Usage phase — expected energy consumption, repairability score, estimated lifespan
- End-of-life — recyclability percentage, take-back program enrollment, actual disposal method

Each lifecycle event is a signed attestation from an authorized participant — creating a chain of custody that is auditable from any point in time.

### ✅ Multi-Stakeholder Attestation

No lifecycle event is recorded in isolation. Each requires one or more attestations:

- **Supplier attestation** — raw material origin and sustainability certification
- **Manufacturer attestation** — production inputs, energy mix, waste management
- **Logistics attestation** — shipping emissions, cold chain compliance
- **Verifier attestation** — independent third-party validation of claims
- **IoT oracle attestation** — real-time sensor data (energy meters, GPS trackers, emissions monitors)

The attestation threshold is configurable per product category — high-risk categories may require 3-of-5 independent verifiers.

### 🔥 Tamper-Proof GreenTag Certificates

Each certificate is a cryptographic commitment to a specific on-chain state:

- Digital certificate of origin (ISO 20400-aligned)
- Carbon neutrality declaration with full emissions breakdown
- Circular economy score (recycled content, repairability, recycled at end-of-life)
- Water stewardship certification
- Biodiversity impact assessment

Certificates are:

- PDF/A-3 format with embedded machine-readable XML
- QR code linking directly to the Stellar transaction
- Digitally signed with the issuer's Stellar keypair
- Certificate hash stored on-chain for integrity verification

### 📊 Automated Carbon Accounting Engine

The platform calculates carbon footprints automatically from attested data:

- **Cradle-to-Gate** — raw material extraction through manufacturing (Scope 1, 2, and upstream Scope 3)
- **Cradle-to-Grave** — full lifecycle including logistics, usage, and end-of-life
- **Cradle-to-Cradle** — circular economy accounting with recycled content credits

Emission factors are sourced from:

- IPCC guidelines
- EPA Emission Factors Hub
- GHG Protocol Scope 3 guidance
- Regional grid emissions databases (EIA, ENTSO-E, IEA)

The accounting logic runs entirely off-chain (in the API layer) but is deterministic — any observer can recompute the exact same footprint from the on-chain attestations, guaranteed by the Stellar transaction order.

### 🔍 On-Chain Provenance Graph

Every product carries a complete, traversable lifecycle history:

- Full chain of custody from raw material to consumer
- Exportable as JSON-LD for integration with ESG reporting software (SustainAbility, Greenstone, Salesforce Net Zero Cloud)
- Compatible with EU CBAM, SEC climate rules, and UK SDR disclosure requirements
- Verifiable by anyone with a Stellar wallet and internet connection — no permission or API key required

### 🌐 Decentralized Verifier Network

Independent third-party verifiers stake collateral to attest supply chain claims:

- On-chain verifier registry with staking requirements (skin in the game)
- Reputation scoring based on historical attestation accuracy
- Random sampling of attested claims for spot-check verification
- Automatic escalation to higher quorum if discrepancies are flagged
- Verifier insurance pool funded by protocol fees

### 🧩 Interoperability Bridges

- **Legacy ERP integration** — SAP, Oracle, Microsoft Dynamics connectors via the API
- **IoT sensor integration** — energy meters, GPS trackers, emissions monitors push data via signed oracle feeds
- **Carbon registry bridging** — Verra, Gold Standard, CDM credit retirement proofs can be linked to product footprints
- **Cross-chain attestations** — Ethereum/Celo/Libra-verified claims can be anchored on Stellar via Merkle proofs

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         CONSUMER & REGULATOR LAYER                        │
│                                                                          │
│   React SPA  ·  Mobile App (QR Scanner)  ·  Public Explorer              │
│   Freighter Wallet  ·  Certificate Viewer  ·  ESG API Portal             │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │  HTTPS / WebSocket
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (NestJS)                             │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  Products    │  │  Supply Chain│  │  Certificates│  │  Verifiers │  │
│  │  Module      │  │  Module      │  │  Module      │  │  Module    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  Carbon      │  │  Lifecycle   │  │  Attestation │  │  SEP-10    │  │
│  │  Accounting  │  │  Engine      │  │  Module      │  │  Auth      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
│                                                                          │
│  Rate Limiter  ·  Request Validation  ·  Audit Logger  ·  Job Queue     │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │  Stellar SDK / Soroban RPC
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       SOROBAN SMART CONTRACTS                             │
│                                                                          │
│  ┌────────────────────┐   ┌────────────────────┐   ┌─────────────────┐  │
│  │  ProductRegistry   │   │ LifecycleTracker   │   │  Attestation    │  │
│  │  · register_product│   │ · record_event     │   │  · submit       │  │
│  │  · transfer        │   │ · get_lifecycle    │   │  · approve      │  │
│  │  · get_provenance  │   │ · get_emissions    │   │  · reject       │  │
│  │  · get_by_owner    │   │ · batch_record     │   │  · escalate     │  │
│  └────────────────────┘   └────────────────────┘   └─────────────────┘  │
│  ┌────────────────────┐   ┌────────────────────┐   ┌─────────────────┐  │
│  │  GreenTagCert      │   │  VerifierRegistry  │   │  CarbonOracle   │  │
│  │  · issue           │   │  · register        │   │  · push_factor  │  │
│  │  · verify          │   │  · stake           │   │  · get_footprint│  │
│  │  · revoke          │   │  · slash           │   │  · update_grid  │  │
│  │  · get_certificate │   │  · get_reputation  │   │  · get_method   │  │
│  └────────────────────┘   └────────────────────┘   └─────────────────┘  │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         STELLAR NETWORK                                  │
│                                                                          │
│   Consensus: Stellar Consensus Protocol (SCP)                           │
│   Settlement: ~5 seconds  ·  Finality: Immediate                        │
│   Testnet: Active  →  Mainnet: Q2 2026                                  │
└──────────────────────────────────────────────────────────────────────────┘
                   │                              │
        ┌──────────┴──────────┐       ┌──────────┴──────────┐
        ▼                     ▼       ▼                     ▼
┌────────────┐       ┌───────────────┐         ┌────────────────────┐
│    IPFS    │       │  PostgreSQL   │         │  External Services │
│  (Pinata)  │       │  + Redis      │         │                    │
│            │       │               │         │  · GHG Protocol    │
│ · MRV Docs │       │ · Off-chain   │         │  · IPCC Data       │
│ · Product   │       │   index       │         │  · Verra API       │
│   Images   │       │ · Job Queue   │         │  · Pinata IPFS     │
│ · Cert     │       │ · Cache       │         │  · IoT Oracles     │
│   Templates│       │ · ERP Sync    │         │  · ESG Platforms   │
└────────────┘       └───────────────┘         └────────────────────┘
```

### Design Principles

**Trustless Core, Trusted Periphery**
All enforcement logic lives in Soroban smart contracts. The NestJS API layer is a convenience layer — it indexes on-chain state, generates certificates, and provides REST endpoints. The protocol functions correctly even if the API is offline. Every consumer can verify a product's provenance by reading the Stellar ledger directly.

**Progressive Decentralization**
The admin multi-sig starts at 3-of-5 and transitions to a DAO of verifiers, manufacturers, and sustainability experts in Q3 2026. Protocol parameters (verifier thresholds, fee structures, attestation requirements) become controlled by token-weighted governance votes.

**Off-Chain Indexing**
Stellar Horizon provides full historical data, but complex queries (provenance graphs spanning thousands of events, carbon accounting aggregations) require an off-chain PostgreSQL index. The indexer is a stateless sync process that can be restarted from genesis without data loss.

**IPFS for Permanence**
All product documentation, certificate templates, and lifecycle metadata are stored on IPFS via Pinata with redundant pinning. The IPFS CID (content identifier) is stored on-chain, creating a permanent, tamper-evident link between the blockchain record and the underlying documents. If a certificate is stored on IPFS with CID `bafybei...abc`, the on-chain record contains that CID — any tampering with the off-chain document changes the CID and breaks the link.

---

## Tech Stack

| Layer               | Technology                  | Version    | Rationale                                                                            |
| ------------------- | --------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| Blockchain          | Stellar                     | —          | 5s finality, ~$0.000001/tx, built-in DEX, energy-efficient SCP consensus             |
| Smart Contracts     | Soroban (Rust)              | SDK 21.x   | Memory-safe, WASM compilation, deterministic execution, formal verification-friendly |
| Backend             | NestJS + TypeScript         | 10.x / 5.x | Enterprise-grade modularity, built-in DI, OpenAPI generation, strong typing          |
| Frontend            | Next.js + Tailwind          | 14.x / 3.x | App Router, RSC, edge-compatible, excellent DX                                       |
| Database            | PostgreSQL + Prisma         | 16.x / 5.x | ACID compliance, JSON support, excellent TypeScript ORM                              |
| Cache / Queue       | Redis + BullMQ              | 7.x / 5.x  | Job queue for cert generation, API response caching                                  |
| Storage             | IPFS via Pinata             | —          | Decentralized, content-addressed, permanent                                          |
| Auth                | SEP-10 + JWT                | —          | Wallet-native, no passwords, Stellar ecosystem standard                              |
| PDF Generation      | Puppeteer + Handlebars      | 21.x / 4.x | Headless Chrome rendering for pixel-perfect certificates                             |
| IoT Oracle          | MQTT + HiveMQ               | 5.x        | Real-time sensor data ingestion (energy meters, GPS)                                 |
| ERP Connector       | SAP BAPI / Oracle REST      | —          | Bridging on-chain attestations with legacy systems                                   |
| Testing (Contracts) | Soroban Test SDK            | —          | Native in-VM contract testing                                                        |
| Testing (Backend)   | Jest + Supertest            | 29.x / 6.x | Unit, integration, and E2E coverage                                                  |
| Testing (Frontend)  | Playwright                  | 1.40.x     | Cross-browser E2E testing                                                            |
| CI/CD               | GitHub Actions              | —          | Automated test, lint, audit, and deployment pipelines                                |
| Infrastructure      | AWS ECS + RDS + ElastiCache | —          | Container-native, auto-scaling, managed databases                                    |
| Monitoring          | Datadog + PagerDuty         | —          | APM, log aggregation, alerting                                                       |

---

## Repository Structure

```
verdechain/
│
├── contracts/                              # Soroban smart contracts (Rust)
│   ├── product_registry/                   # Product registration & ownership
│   │   ├── src/
│   │   │   ├── lib.rs                      # Contract entry points
│   │   │   ├── storage.rs                  # Persistent state management
│   │   │   ├── types.rs                    # Product, metadata, lifecycle event types
│   │   │   ├── validation.rs               # Input validation logic
│   │   │   └── events.rs                   # Contract event definitions
│   │   ├── tests/
│   │   │   ├── unit/                       # Unit tests per function
│   │   │   └── integration/                # Cross-contract integration tests
│   │   └── Cargo.toml
│   │
│   ├── lifecycle_tracker/                  # Lifecycle event recording
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── events.rs                   # Event type definitions
│   │   │   ├── emissions.rs                # On-chain emission factor lookups
│   │   │   └── milestones.rs               # Configurable lifecycle milestones
│   │   └── Cargo.toml
│   │
│   ├── attestation/                        # Multi-stakeholder attestation workflow
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── types.rs                    # Attestation, threshold, quorum types
│   │   │   ├── escalation.rs               # Escalation to higher quorum
│   │   │   └── dissent.rs                  # Minority opinion recording
│   │   └── Cargo.toml
│   │
│   ├── greentag_cert/                      # Certificate of origin & green tag issuance
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── types.rs                    # Certificate, seal, revocation types
│   │   │   ├── templates.rs                # Certificate template management
│   │   │   └── verification.rs             # Off-chain certificate verification
│   │   └── Cargo.toml
│   │
│   ├── verifier_registry/                  # Verifier onboarding and staking
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── staking.rs                  # Stake lock, slashing, rewards
│   │   │   ├── reputation.rs               # Reputation scoring algorithm
│   │   │   └── insurance.rs                # Verifier insurance pool
│   │   └── Cargo.toml
│   │
│   ├── carbon_oracle/                      # Emission factor oracle
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── factors.rs                  # Cached emission factors
│   │   │   ├── methods.rs                  # Methodologies (IPCC, EPA, GHG Protocol)
│   │   │   └── grid.rs                     # Regional grid emission intensity
│   │   └── Cargo.toml
│   │
│   ├── shared/                             # Shared types and utilities
│   │   └── src/
│   │       ├── types.rs                    # Shared data types
│   │       ├── errors.rs                   # Shared error codes (100–599)
│   │       ├── constants.rs                # Protocol constants
│   │       └── auth.rs                     # Authorization helpers
│   │
│   ├── deploy-testnet.sh                   # Testnet deployment script
│   ├── deploy-mainnet.sh                   # Mainnet deployment (multi-sig)
│   ├── Cargo.toml                          # Workspace config
│   └── Cargo.lock
│
├── api/                                    # NestJS backend
│   ├── src/
│   │   ├── main.ts                         # Entry point + Swagger setup
│   │   ├── app.module.ts                   # Root module
│   │   │
│   │   ├── products/                       # Product CRUD + lifecycle
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   ├── products.module.ts
│   │   │   ├── dto/                        # Request/response validation DTOs
│   │   │   └── products.repository.ts
│   │   │
│   │   ├── supply-chain/                   # Supply chain event management
│   │   │   ├── supply-chain.controller.ts
│   │   │   ├── supply-chain.service.ts
│   │   │   ├── supply-chain.module.ts
│   │   │   ├── dto/
│   │   │   └── aggregation.service.ts      # Provenance graph builder
│   │   │
│   │   ├── certificates/                   # GreenTag certificate generation
│   │   │   ├── certificates.controller.ts
│   │   │   ├── certificates.service.ts
│   │   │   ├── certificates.module.ts
│   │   │   ├── generators/                 # PDF, JSON-LD, HTML generators
│   │   │   └── templates/                  # Certificate template files
│   │   │
│   │   ├── verifiers/                      # Verifier management
│   │   │   ├── verifiers.controller.ts
│   │   │   ├── verifiers.service.ts
│   │   │   ├── verifiers.module.ts
│   │   │   ├── dto/
│   │   │   └── staking.service.ts
│   │   │
│   │   ├── carbon-accounting/              # Carbon footprint engine
│   │   │   ├── carbon.controller.ts
│   │   │   ├── carbon.service.ts
│   │   │   ├── carbon.module.ts
│   │   │   ├── calculators/                # Per-scope emission calculators
│   │   │   │   ├── scope1.ts               # Direct emissions
│   │   │   │   ├── scope2.ts               # Energy indirect
│   │   │   │   └── scope3.ts               # Supply chain indirect
│   │   │   ├── factors/                    # Emission factor databases
│   │   │   │   ├── ipcc.ts                 # IPCC factor repository
│   │   │   │   ├── epa.ts                  # EPA factor repository
│   │   │   │   └── grid.ts                 # Regional grid intensity
│   │   │   └── methodology.ts              # GHG Protocol methodology engine
│   │   │
│   │   ├── auth/                           # SEP-10 + JWT implementation
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── strategies/                 # SEP-10 challenge/verify flow
│   │   │   └── guards/                     # @Auth() decorator + role guards
│   │   │
│   │   ├── stellar/                        # Stellar SDK wrapper service
│   │   │   ├── stellar.service.ts          # Contract invocation helpers
│   │   │   ├── soroban-client.ts           # Soroban RPC client
│   │   │   ├── horizon-client.ts           # Horizon client for event indexing
│   │   │   └── wallet.ts                   # Keypair management
│   │   │
│   │   ├── ipfs/                           # Pinata IPFS integration
│   │   │   ├── ipfs.service.ts
│   │   │   └── ipfs.module.ts
│   │   │
│   │   ├── indexer/                        # Stellar event indexer
│   │   │   ├── indexer.service.ts          # Horizon event stream consumer
│   │   │   ├── processors/                 # Per-event-type processors
│   │   │   └── sync.service.ts            # Full resync from genesis
│   │   │
│   │   └── common/
│   │       ├── guards/                     # Rate limiting, role guards
│   │       ├── interceptors/               # Logging, audit, timing
│   │       ├── decorators/                 # @CurrentUser, @Roles custom decorators
│   │       ├── filters/                    # Exception filters
│   │       └── interfaces/                 # Shared TypeScript interfaces
│   │
│   ├── prisma/
│   │   ├── schema.prisma                   # Database schema
│   │   └── migrations/                     # Prisma migrations
│   │
│   ├── test/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   │
│   ├── scripts/                            # API-specific scripts
│   │   ├── seed-products.ts
│   │   ├── seed-verifiers.ts
│   │   └── generate-demo-chain.ts          # Generate a demo supply chain
│   │
│   └── package.json
│
├── frontend/                               # Next.js frontend
│   ├── app/
│   │   ├── layout.tsx                      # Root layout with wallet connector
│   │   ├── page.tsx                        # Product scanner / search
│   │   ├── products/                       # Product detail + provenance graph
│   │   ├── certificates/                   # Certificate viewer
│   │   ├── manufacturer/                   # Manufacturer dashboard
│   │   ├── verifier/                       # Verifier dashboard
│   │   ├── admin/                          # Admin panel
│   │   └── explorer/                       # Public provenance explorer
│   ├── components/
│   │   ├── ui/                             # shadcn/ui primitives
│   │   ├── provenance-graph/               # Interactive D3.js graph
│   │   ├── lifecycle-timeline/             # Chronological lifecycle view
│   │   ├── carbon-breakdown/               # Emissions pie chart
│   │   ├── certificate-preview/            # PDF preview component
│   │   ├── product-card/                   # Search result card
│   │   ├── scanner/                        # QR code scanner
│   │   └── wallet-connector/               # Freighter wallet connect
│   ├── lib/
│   │   ├── stellar.ts                      # Stellar SDK browser wrapper
│   │   ├── freighter.ts                    # Freighter wallet helpers
│   │   └── api.ts                          # API client
│   └── package.json
│
├── sdk/                                    # @verdechain/sdk (npm package)
│   ├── src/
│   │   ├── client.ts                       # VerdeChainClient main class
│   │   ├── products.ts                     # Product registry methods
│   │   ├── lifecycle.ts                    # Lifecycle event methods
│   │   ├── certificates.ts                 # Certificate methods
│   │   ├── verifiers.ts                    # Verifier interaction methods
│   │   ├── carbon.ts                       # Carbon accounting queries
│   │   └── types.ts                        # All TypeScript type definitions
│   └── package.json
│
├── cli/                                    # @verdechain/cli (npm package)
│   ├── src/
│   │   ├── index.ts                        # Commander.js entry point
│   │   └── commands/
│   │       ├── products.ts                 # product register, transfer, get
│   │       ├── lifecycle.ts                # lifecycle record, get, batch
│   │       ├── carbon.ts                   # carbon footprint, factor list
│   │       ├── certificates.ts             # certificate issue, verify, revoke
│   │       ├── verifiers.ts                # verifier register, stake, status
│   │       └── doctor.ts                   # Environment diagnostics
│   └── package.json
│
├── oracle/                                 # IoT & data oracle sidecar
│   ├── src/
│   │   ├── main.rs                         # Oracle service entry point
│   │   ├── emission_factors.rs             # Factor database sync
│   │   ├── iot_ingestion.rs                # MQTT sensor data consumer
│   │   └── grid_intensity.rs               # Grid carbon intensity poller
│   └── Cargo.toml
│
├── connectors/                             # ERP & legacy system connectors
│   ├── sap/                                # SAP BAPI connector
│   ├── oracle-ebs/                         # Oracle EBS connector
│   ├── dynamics/                           # Microsoft Dynamics connector
│   └── shopify/                            # Shopify plugin for e-commerce
│
├── infra/                                  # Terraform infrastructure
│   ├── modules/
│   │   ├── ecs/
│   │   ├── rds/
│   │   ├── elasticache/
│   │   └── cloudfront/
│   ├── environments/
│   │   ├── testnet/
│   │   └── mainnet/
│   └── README.md
│
├── scripts/
│   ├── bootstrap.sh                        # One-click local setup
│   ├── demo.sh                             # Interactive demo
│   ├── seed-testnet.sh                     # Populate testnet with sample data
│   ├── rotate-keys.sh                      # Admin key rotation (multi-sig)
│   └── generate-demo-supply-chain.sh       # Generate a multi-hop supply chain
│
├── docs/
│   ├── architecture/                       # System architecture docs
│   ├── contracts/                          # Per-contract reference
│   ├── api/                                # API reference
│   ├── carbon-accounting/                  # Methodology documentation
│   ├── integration/                        # ERP & IoT integration guides
│   └── guides/                             # Developer guides
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                          # Test + lint on every PR
│   │   ├── audit.yml                       # cargo audit + npm audit nightly
│   │   ├── deploy-testnet.yml              # Auto-deploy on merge to main
│   │   ├── deploy-mainnet.yml              # Multi-sig gated mainnet deploy
│   │   └── release.yml                     # Semantic release on tag
│   ├── CODEOWNERS
│   └── PULL_REQUEST_TEMPLATE.md
│
├── docker-compose.yml                      # Local development stack
├── docker-compose.test.yml                 # Isolated test environment
├── .env.example
├── package.json                            # Monorepo root (npm workspaces)
├── turbo.json                              # Turborepo build config
├── .eslintrc.js
├── .prettierrc
├── sonar-project.properties
├── CONTRIBUTING.md
├── SECURITY.md
├── CODE_OF_CONDUCT.md
├── SUSTAINABILITY.md                       # Our own environmental impact report
└── README.md
```

---

## Quick Start

### Prerequisites

```bash
# Node.js 20+ (via nvm recommended)
nvm install 20 && nvm use 20
node --version   # must be >= 20.0.0

# Rust 1.75+ (required for Soroban contracts)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
rustup target add wasm32-unknown-unknown
rustc --version  # must be >= 1.75.0

# Soroban CLI
cargo install --locked soroban-cli@21.0.0
soroban --version

# Docker + Docker Compose (for local PostgreSQL + Redis)
docker --version          # must be >= 24.0.0
docker compose version    # must be >= 2.20.0

# Freighter Wallet browser extension
# Install from: https://freighter.app
# Enable testnet mode in settings
```

### Option 1: One-Click Bootstrap (Recommended)

```bash
git clone https://github.com/your-org/verdechain
cd verdechain
./scripts/bootstrap.sh
```

This script:

1. Verifies all prerequisites
2. Installs all Node.js dependencies (`npm install`)
3. Starts PostgreSQL and Redis via Docker Compose
4. Runs all database migrations
5. Funds a fresh testnet keypair via Friendbot
6. Deploys all five smart contracts to Stellar Testnet
7. Seeds the database with sample products, lifecycle events, and verifiers
8. Starts the API server on `http://localhost:3000`
9. Starts the frontend on `http://localhost:3001`
10. Prints a summary of all deployed contract addresses

### Option 2: Manual Setup

```bash
# 1. Clone and install dependencies
git clone https://github.com/your-org/verdechain
cd verdechain
npm install          # installs all workspace packages

# 2. Configure environment
cp .env.example .env
cp frontend/.env.local.example frontend/.env.local
# Edit both files — see Environment Configuration below

# 3. Start infrastructure services
docker compose up -d
# Starts: postgres:16, redis:7

# 4. Run database migrations
npm run db:migrate   # applies all Prisma migrations
npm run db:seed      # optional: seed dev data

# 5. Fund and configure Stellar testnet accounts
# Get free testnet XLM: https://laboratory.stellar.org/#account-creator?network=test
# Fund at minimum: ISSUER_PUBLIC_KEY, VERIFIER_1, VERIFIER_2, VERIFIER_3

# 6. Deploy smart contracts to testnet
cd contracts
./deploy-testnet.sh
# This compiles all contracts, deploys them, and writes contract addresses
# to contracts/.deployed-testnet.json and updates your .env automatically
cd ..

# 7. Start development servers
npm run dev
# Starts API (port 3000) and frontend (port 3001) with hot reload

# 8. Verify installation
npm run doctor       # checks all services, contracts, and config
```

### Verify Everything Works

```bash
# Confirm API is up
curl http://localhost:3000/health
# → { "status": "ok", "version": "1.0.0", "network": "testnet" }

# Confirm contracts are deployed
curl http://localhost:3000/contracts
# → { "productRegistry": "CXXX...", "greentagCert": "CYYY...", ... }

# Run the interactive demo
./scripts/demo.sh
# Walks through: register product → record lifecycle → attest → issue GreenTag → scan + verify
```

---

## Environment Configuration

Copy `.env.example` to `.env` and populate all required values.

### Core Configuration

```bash
# ─── App ─────────────────────────────────────────────────────────────────────
NODE_ENV=development          # development | test | production
PORT=3000
LOG_LEVEL=debug               # debug | info | warn | error
VERDECHAIN_VERSION=1.0.0

# ─── Database ────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://verdechain:secret@localhost:5432/verdechain_dev
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20

# ─── Redis ───────────────────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=vc:

# ─── Stellar ─────────────────────────────────────────────────────────────────
STELLAR_NETWORK=testnet       # testnet | mainnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_SOROBAN_RPC=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# Admin keypair (multi-sig on mainnet; single key acceptable for testnet)
STELLAR_ADMIN_PUBLIC_KEY=GXXX...
STELLAR_ADMIN_SECRET_KEY=SXXX...    # NEVER commit this; use secrets manager in prod

# ─── Smart Contract Addresses ────────────────────────────────────────────────
# Auto-populated by deploy-testnet.sh
CONTRACT_PRODUCT_REGISTRY=CXXX...
CONTRACT_LIFECYCLE_TRACKER=CYYY...
CONTRACT_ATTESTATION=CZZZ...
CONTRACT_GREENTAG_CERT=CAAA...
CONTRACT_VERIFIER_REGISTRY=CBBB...
CONTRACT_CARBON_ORACLE=CCCC...

# ─── Auth (SEP-10 + JWT) ─────────────────────────────────────────────────────
JWT_SECRET=your-256-bit-random-secret-here    # openssl rand -hex 32
JWT_EXPIRY=24h
SEP10_SIGNING_KEY=SXXX...                     # Dedicated SEP-10 signing keypair
SEP10_HOME_DOMAIN=api.verdechain.io

# ─── IPFS / Pinata ───────────────────────────────────────────────────────────
PINATA_API_KEY=xxx
PINATA_API_SECRET=xxx
PINATA_JWT=eyJhbGc...
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs

# ─── Attestation / Verifier Settings ─────────────────────────────────────────
VERIFIER_MIN_STAKE_XLM=1000            # Minimum stake to register as verifier
VERIFIER_DEFAULT_THRESHOLD=2           # Minimum approvals (of VERIFIER_QUORUM)
VERIFIER_QUORUM=3                      # Total verifiers per product category
VERIFIER_ESCALATION_QUORUM=5           # Quorum if first panel flags discrepancies
APPROVAL_WINDOW_HOURS=168              # 7 days for verifiers to respond
SLASHING_PENALTY_PCT=20                # % of stake slashed for fraudulent attestation

# ─── Carbon Accounting ───────────────────────────────────────────────────────
CARBON_METHODOLOGY_DEFAULT=ghg_protocol  # ghg_protocol | ipcc | epa
EMISSION_FACTOR_CACHE_TTL_HOURS=24
GRID_INTENSITY_REFRESH_HOURS=6

# ─── Certificate Generation ──────────────────────────────────────────────────
CERT_SIGNING_KEY=SXXX...              # Key used to sign certificate payloads
CERT_TEMPLATE_DIR=./templates/certificates
CERT_OUTPUT_DIR=/tmp/vc-certs
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# ─── Protocol Fees ────────────────────────────────────────────────────────────
PROTOCOL_FEE_BPS=50                   # 0.5% (50 basis points) on premium transactions
VERIFIER_REWARD_BPS=30                # 0.3% distributed to attesting verifiers
INSURANCE_POOL_BPS=10                 # 0.1% to verifier insurance pool
TREASURY_BPS=10                       # 0.1% to protocol treasury

# ─── IoT Oracle ───────────────────────────────────────────────────────────────
MQTT_BROKER_URL=mqtts://iot.verdechain.io:8883
MQTT_USERNAME=verdechain
MQTT_PASSWORD=xxx
ORACLE_SIGNING_SECRET=SXXX...         # Dedicated oracle keypair
```

### Frontend Environment (`frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_STELLAR_EXPERT_URL=https://testnet.stellar.expert
NEXT_PUBLIC_CONTRACT_PRODUCT_REGISTRY=CXXX...
NEXT_PUBLIC_CONTRACT_GREENTAG_CERT=CYYY...
NEXT_PUBLIC_CONTRACT_LIFECYCLE_TRACKER=CZZZ...
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs
```

> **Security note:** Never commit `.env` files containing secret keys. In production, use AWS Secrets Manager, GCP Secret Manager, or HashiCorp Vault. Rotate all keys immediately if compromised. On mainnet, `STELLAR_ADMIN_SECRET_KEY` must never exist in any environment file — use HSM-backed key management with multi-sig ceremonies.

---

## Smart Contracts

All contracts are written in Rust using the Soroban SDK and compile to WASM. They are deployed on Stellar's Soroban execution environment.

### ProductRegistry Contract

The core registry maintains the authoritative on-chain record of all products and their lifecycle metadata.

```rust
use soroban_sdk::{contract, contractimpl, Address, Env, String, BytesN, Vec};
use crate::types::{ProductMetadata, ProductStatus};

#[contract]
pub struct ProductRegistry;

#[contractimpl]
impl ProductRegistry {

    /// Register a new product on-chain.
    /// Returns the assigned product_id (monotonically increasing u64).
    /// Emits: ProductRegistered { product_id, manufacturer, ipfs_hash }
    pub fn register_product(
        env: Env,
        manufacturer: Address,
        product_type: String,         // "consumer_good" | "raw_material" | "component" | "food" | "textile"
        metadata: ProductMetadata,
        ipfs_hash: String,            // CIDv1 of full product documentation
    ) -> u64;

    /// Transfer ownership of a product record along the supply chain.
    /// Requires authorization from `from` address.
    /// Emits: ProductTransferred { product_id, from, to, timestamp }
    pub fn transfer_product(
        env: Env,
        from: Address,
        to: Address,
        product_id: u64,
    ) -> bool;

    /// Get full metadata for a product.
    pub fn get_product(
        env: Env,
        product_id: u64,
    ) -> ProductMetadata;

    /// Get the current owner of a product.
    pub fn get_owner(
        env: Env,
        product_id: u64,
    ) -> Address;

    /// Get all product IDs owned by an address.
    pub fn get_products_by_owner(
        env: Env,
        owner: Address,
        offset: u32,
        limit: u32,
    ) -> Vec<u64>;

    /// Mark a product as recalled (emergency function, admin only).
    /// Emits: ProductRecalled { product_id, reason, timestamp }
    pub fn recall_product(
        env: Env,
        admin: Address,
        product_id: u64,
        reason: String,
    ) -> bool;

    /// Return total products registered.
    pub fn total_products(env: Env) -> u64;
}
```

**ProductMetadata Type:**

```rust
#[contracttype]
pub struct ProductMetadata {
    pub id: u64,
    pub product_type: String,
    pub name: String,
    pub brand: String,
    pub sku: String,                  // Manufacturer SKU / GTIN
    pub batch_number: String,
    pub manufacture_date: u64,        // Unix timestamp
    pub expiry_date: Option<u64>,     // Optional expiry (perishable goods)
    pub country_of_origin: String,    // ISO 3166-1 alpha-2
    pub gps_origin: Option<String>,   // Lat,Long of raw material source
    pub certifications: Vec<String>,  // Existing cert IDs (organic, fair trade, etc.)
    pub weight_kg: u64,
    pub units_per_batch: u64,
    pub msrp_usd: i128,               // Manufacturer suggested retail price (in cents)
    pub ipfs_hash: String,            // CIDv1 of product documentation
    pub status: ProductStatus,        // Active | Recalled | EndOfLife | Retired
    pub created_at: u64,
}
```

---

### LifecycleTracker Contract

Records every significant event in a product's lifecycle — from raw material extraction through manufacturing, logistics, retail, usage, and end-of-life.

```rust
#[contractimpl]
impl LifecycleTracker {

    /// Record a lifecycle event for a product.
    /// Each event must be attested by an authorized participant.
    /// Emits: LifecycleEventRecorded { product_id, event_type, participant, timestamp }
    pub fn record_event(
        env: Env,
        participant: Address,
        product_id: u64,
        event: LifecycleEvent,
        attestation_id: Option<u64>,  // Link to an attestation contract record
    ) -> u64;                          // Returns event_id

    /// Get all lifecycle events for a product in chronological order.
    pub fn get_lifecycle(
        env: Env,
        product_id: u64,
        offset: u32,
        limit: u32,
    ) -> Vec<LifecycleEvent>;

    /// Get a specific lifecycle event by ID.
    pub fn get_event(
        env: Env,
        event_id: u64,
    ) -> LifecycleEvent;

    /// Get the total count of lifecycle events for a product.
    pub fn get_event_count(
        env: Env,
        product_id: u64,
    ) -> u64;

    /// Get estimated cradle-to-gate emissions for a product (aggregated).
    /// Returns total kgCO2e as computed from emission factors.
    pub fn get_emissions_summary(
        env: Env,
        product_id: u64,
    ) -> EmissionsSummary;

    /// Record multiple lifecycle events in a single transaction (batch).
    /// All-or-nothing: reverts if any single event fails.
    pub fn batch_record_events(
        env: Env,
        participant: Address,
        events: Vec<BatchEvent>,
    ) -> Vec<u64>;
}
```

**LifecycleEvent Type:**

```rust
#[contracttype]
pub enum LifecycleStage {
    RawMaterialExtraction,
    Processing,
    Manufacturing,
    Packaging,
    Warehousing,
    OutboundLogistics,
    Retail,
    UsagePhase,
    EndOfLifeCollection,
    Recycling,
    Disposal,
}

#[contracttype]
pub struct LifecycleEvent {
    pub event_id: u64,
    pub product_id: u64,
    pub stage: LifecycleStage,
    pub location: String,             // Facility name or GPS coordinates
    pub facility_id: String,          // Registered facility ID
    pub participant: Address,         // Who recorded this event
    pub timestamp: u64,               // Unix timestamp of event occurrence
    pub inputs: Vec<MaterialInput>,   // Materials consumed
    pub energy_used_kwh: u64,         // Energy consumed at this stage
    pub energy_source: EnergySource,  // Grid, Solar, Wind, Hydro, NaturalGas, Diesel
    pub waste_kg: u64,                // Waste generated
    pub water_used_l: u64,           // Water consumed
    pub emissions_kgco2e: i128,       // Estimated emissions (set by carbon oracle or calculator)
    pub certification_refs: Vec<String>,  // References to certification documents
    pub notes: String,                // Free-text notes
    pub ipfs_hash: Option<String>,     // Supporting documentation CID
}

#[contracttype]
pub struct MaterialInput {
    pub material: String,             // Material name
    pub quantity_kg: u64,
    pub is_recycled: bool,
    pub is_renewable: bool,
    pub supplier: Option<String>,      // Supplier identifier
    pub co2e_per_kg: i128,            // Emission factor for this material
}

#[contracttype]
pub enum EnergySource {
    Grid,
    Solar,
    Wind,
    Hydro,
    Nuclear,
    NaturalGas,
    Diesel,
    Biomass,
    Geothermal,
    Unknown,
}

#[contracttype]
pub struct EmissionsSummary {
    pub product_id: u64,
    pub cradle_to_gate_kgco2e: i128,     // Raw material → factory gate
    pub logistics_kgco2e: i128,          // Transport emissions
    pub usage_phase_kgco2e: Option<i128>,// Expected usage emissions
    pub end_of_life_kgco2e: Option<i128>,// Disposal / recycling emissions
    pub total_kgco2e: i128,              // Cradle-to-grave total
    pub methodology: String,             // "GHG Protocol" | "IPCC 2024" | "EPA"
    pub confidence_score: u8,            // 0–100 based on data completeness
}
```

---

### Attestation Contract

Manages the multi-stakeholder attestation workflow — verifiers sign off on lifecycle events before they become part of a product's permanent record.

```rust
#[contractimpl]
impl Attestation {

    /// Submit a lifecycle event for verifier attestation.
    /// Returns an attestation_id for tracking.
    /// Emits: AttestationRequested { attestation_id, product_id, event_id, requestor }
    pub fn submit_for_attestation(
        env: Env,
        requestor: Address,
        product_id: u64,
        event_id: u64,
        required_verifiers: u32,        // Number of verifiers needed
    ) -> u64;

    /// A registered verifier approves a pending attestation.
    /// If threshold is met, the event is permanently recorded.
    /// Emits: AttestationApproved | EventAttested
    pub fn approve_attestation(
        env: Env,
        verifier: Address,
        attestation_id: u64,
        comments: String,
    ) -> bool;

    /// A registered verifier rejects a pending attestation with reason.
    /// Emits: AttestationRejected
    pub fn reject_attestation(
        env: Env,
        verifier: Address,
        attestation_id: u64,
        reason: String,
    ) -> bool;

    /// Escalate to a larger verifier quorum if discrepancies found.
    /// Emits: AttestationEscalated
    pub fn escalate_attestation(
        env: Env,
        caller: Address,
        attestation_id: u64,
        new_quorum: u32,
    ) -> bool;

    /// Get the current status of an attestation.
    pub fn get_attestation(
        env: Env,
        attestation_id: u64,
    ) -> AttestationRecord;

    /// Get all attestations for a product.
    pub fn get_attestations_for_product(
        env: Env,
        product_id: u64,
        offset: u32,
        limit: u32,
    ) -> Vec<AttestationRecord>;

    /// Get all pending attestations for a given verifier.
    pub fn get_pending_for_verifier(
        env: Env,
        verifier: Address,
        offset: u32,
        limit: u32,
    ) -> Vec<AttestationRecord>;
}

#[contracttype]
pub struct AttestationRecord {
    pub attestation_id: u64,
    pub product_id: u64,
    pub event_id: u64,
    pub requestor: Address,
    pub required_verifiers: u32,
    pub approved_verifiers: Vec<Address>,
    pub rejected_verifiers: Vec<Address>,
    pub status: AttestationStatus,     // Pending | Approved | Rejected | Escalated
    pub created_at: u64,
    pub resolved_at: Option<u64>,
}

#[contracttype]
pub enum AttestationStatus {
    Pending,
    Approved,
    Rejected,
    Escalated,
}
```

---

### GreenTagCert Contract

Issues and manages tamper-proof digital certificates of origin and sustainability claims.

```rust
#[contractimpl]
impl GreenTagCert {

    /// Issue a GreenTag certificate for a product.
    /// Requires the product to have a complete attested lifecycle.
    /// Emits: GreenTagIssued { certificate_id, product_id, issuer, cert_type }
    pub fn issue_certificate(
        env: Env,
        issuer: Address,
        product_id: u64,
        cert_type: CertType,
        metadata_ipfs_hash: String,    // CIDv1 of certificate PDF + metadata
        expiration: Option<u64>,       // Optional Unix timestamp for expiry
    ) -> u64;                          // Returns certificate_id

    /// Verify that a certificate is valid (not revoked, not expired).
    /// Returns true if the certificate is currently valid.
    pub fn verify_certificate(
        env: Env,
        certificate_id: u64,
    ) -> bool;

    /// Revoke a certificate (emergency function, issuer or admin only).
    /// Emits: GreenTagRevoked { certificate_id, reason, timestamp }
    pub fn revoke_certificate(
        env: Env,
        caller: Address,
        certificate_id: u64,
        reason: String,
    ) -> bool;

    /// Get full certificate data.
    pub fn get_certificate(
        env: Env,
        certificate_id: u64,
    ) -> CertificateRecord;

    /// Get all certificates for a product.
    pub fn get_certificates_for_product(
        env: Env,
        product_id: u64,
    ) -> Vec<u64>;

    /// Get all certificates issued by an address.
    pub fn get_certificates_by_issuer(
        env: Env,
        issuer: Address,
        offset: u32,
        limit: u32,
    ) -> Vec<u64>;
}

#[contracttype]
pub enum CertType {
    CertificateOfOrigin,       // ISO 20400-aligned origin certificate
    CarbonNeutral,             // Cradle-to-gate carbon neutrality declaration
    CarbonNeutralFullLifecycle,// Cradle-to-grave carbon neutrality
    Organic,                   // Organic certification
    FairTrade,                 // Fair Trade certification
    CircularEconomy,           // Recycled content + recyclability score
    WaterStewardship,          // Water usage certification
    Biodiversity,              // Biodiversity impact assessment
    Custom(String),            // Extensible for future cert types
}

#[contracttype]
pub struct CertificateRecord {
    pub certificate_id: u64,
    pub product_id: u64,
    pub cert_type: CertType,
    pub issuer: Address,
    pub issued_at: u64,
    pub expires_at: Option<u64>,
    pub is_revoked: bool,
    pub revocation_reason: Option<String>,
    pub metadata_ipfs_hash: String,   // CIDv1 of certificate PDF + machine-readable data
    pub certificate_hash: BytesN<32>, // SHA-256 of certificate content for verification
}
```

---

### VerifierRegistry Contract

Manages the decentralized network of independent verifiers who attest supply chain claims.

```rust
#[contractimpl]
impl VerifierRegistry {

    /// Register as a verifier. Requires staking XLM as collateral.
    /// Emits: VerifierRegistered { verifier, stake_amount, specializations }
    pub fn register_verifier(
        env: Env,
        verifier: Address,
        stake_amount: i128,           // Amount in stroops (1 XLM = 10M stroops)
        specializations: Vec<String>, // Product categories this verifier covers
        metadata_ipfs_hash: String,   // CIDv1 of credentials, certifications, etc.
    ) -> u64;                         // Returns verifier_id

    /// Increase a verifier's stake.
    pub fn add_stake(
        env: Env,
        verifier: Address,
        additional_stake: i128,
    ) -> bool;

    /// Request withdrawal of stake (subject to cooldown period).
    /// Emits: StakeWithdrawalRequested { verifier, amount, available_at }
    pub fn request_stake_withdrawal(
        env: Env,
        verifier: Address,
        amount: i128,
    ) -> bool;

    /// Complete stake withdrawal after cooldown.
    pub fn complete_stake_withdrawal(
        env: Env,
        verifier: Address,
    ) -> bool;

    /// Slash a verifier's stake for fraudulent attestation.
    /// Called by admin after dispute resolution.
    /// Emits: VerifierSlashed { verifier, slashed_amount, reason }
    pub fn slash_verifier(
        env: Env,
        admin: Address,
        verifier: Address,
        reason: String,
        amount: i128,
    ) -> bool;

    /// Get verifier details.
    pub fn get_verifier(
        env: Env,
        verifier_id: u64,
    ) -> VerifierRecord;

    /// Get all verifiers specializing in a product category.
    pub fn get_verifiers_by_specialization(
        env: Env,
        specialization: String,
        offset: u32,
        limit: u32,
    ) -> Vec<VerifierRecord>;

    /// Get a verifier's reputation score.
    pub fn get_reputation(
        env: Env,
        verifier: Address,
    ) -> ReputationScore;
}

#[contracttype]
pub struct VerifierRecord {
    pub verifier_id: u64,
    pub address: Address,
    pub stake_amount: i128,           // Current stake in stroops
    pub specializations: Vec<String>,
    pub total_attestations: u64,
    pub approved_attestations: u64,
    pub rejected_attestations: u64,
    pub escalated_attestations: u64,
    pub status: VerifierStatus,       // Active | Suspended | Slashed | Withdrawn
    pub metadata_ipfs_hash: String,
    pub registered_at: u64,
    pub last_active_at: u64,
}

#[contracttype]
pub struct ReputationScore {
    pub verifier: Address,
    pub overall_score: u32,           // 0–1000
    pub accuracy: u32,                // % of attestations that matched final outcome
    pub timeliness: u32,              // Average response time in hours
    pub peer_reviews: u32,            // Number of peer reviews received
    pub volume: u32,                  // Total attestations handled
}
```

---

### CarbonOracle Contract

Provides on-chain access to emission factors and carbon accounting methodology.

```rust
#[contractimpl]
impl CarbonOracle {

    /// Push an emission factor update.
    /// Called by the oracle sidecar when factors change.
    /// Emits: EmissionFactorUpdated { factor_key, value, source, timestamp }
    pub fn update_emission_factor(
        env: Env,
        admin: Address,
        factor_key: String,            // e.g. "grid_ng_2024", "diesel_combustion"
        value_kgco2e_per_unit: i128,   // kgCO2e per unit (kWh, kg, km, etc.)
        unit: String,                  // "kWh" | "kg" | "km" | "liter"
        source: String,                // "IPCC_2024" | "EPA_2024" | "EIA_2024"
        methodology_version: String,   // "GHG_Protocol_2024"
    ) -> bool;

    /// Look up an emission factor by key.
    pub fn get_emission_factor(
        env: Env,
        factor_key: String,
    ) -> Option<EmissionFactor>;

    /// Update regional grid emission intensity.
    pub fn update_grid_intensity(
        env: Env,
        admin: Address,
        region: String,                // ISO 3166-1 alpha-2 + subregion
        intensity_kgco2e_per_kwh: i128,
        source: String,
    ) -> bool;

    /// Get grid intensity for a region.
    pub fn get_grid_intensity(
        env: Env,
        region: String,
    ) -> Option<i128>;

    /// Get the methodology version string.
    pub fn get_methodology_version(
        env: Env,
    ) -> String;
}

#[contracttype]
pub struct EmissionFactor {
    pub factor_key: String,
    pub value_kgco2e_per_unit: i128,
    pub unit: String,
    pub source: String,
    pub methodology_version: String,
    pub updated_at: u64,
}
```

---

## Backend API

**Base URL (Testnet):** `https://api-testnet.verdechain.io/v1`
**Base URL (Mainnet):** `https://api.verdechain.io/v1`

All endpoints require `Authorization: Bearer <JWT>` unless marked `[public]`. JWT tokens are obtained via SEP-10 wallet authentication.

Full OpenAPI specification: `https://api.verdechain.io/v1/openapi.json`
Interactive Swagger UI: `https://api.verdechain.io/v1/docs`

---

### Products

| Method | Path                         | Auth     | Description                            |
| ------ | ---------------------------- | -------- | -------------------------------------- |
| GET    | `/products`                  | Public   | List products (paginated, filterable)  |
| GET    | `/products/:id`              | Public   | Get product with full metadata         |
| POST   | `/products`                  | Required | Register a new product on-chain        |
| GET    | `/products/:id/provenance`   | Public   | Complete provenance graph (JSON-LD)    |
| GET    | `/products/:id/lifecycle`    | Public   | All lifecycle events, chronologically  |
| GET    | `/products/:id/carbon`       | Public   | Carbon footprint with full breakdown   |
| GET    | `/products/:id/certificates` | Public   | All issued GreenTag certificates       |
| GET    | `/products/owned`            | Required | Products owned by authenticated wallet |
| GET    | `/products/batch/:batch`     | Public   | Find all products in a batch           |

**GET /products Query Parameters:**

| Parameter      | Type   | Description                                                    |
| -------------- | ------ | -------------------------------------------------------------- |
| `type`         | string | Product type filter (`consumer_good`, `food`, `textile`, etc.) |
| `origin`       | string | ISO 3166-1 alpha-2 country of origin                           |
| `manufacturer` | string | Stellar public key of manufacturer                             |
| `owner`        | string | Stellar public key of current owner                            |
| `certified`    | string | Cert type filter (`carbon_neutral`, `organic`, etc.)           |
| `q`            | string | Search by name, brand, or SKU                                  |
| `page`         | number | Page number (default: 1)                                       |
| `limit`        | number | Page size (default: 20, max: 100)                              |
| `sort`         | string | `created_asc` \| `created_desc` \| `name`                      |

**POST /products Request Body:**

```json
{
  "productType": "consumer_good",
  "name": "EcoT-Shirt Classic",
  "brand": "GreenThreads",
  "sku": "GTS-001-BLK-M",
  "batchNumber": "BATCH-2025-06",
  "manufactureDate": "2025-06-15T00:00:00Z",
  "countryOfOrigin": "PT",
  "gpsOrigin": "38.7223,-9.1393",
  "certifications": ["GOTS", "OEKO-TEX"],
  "weightKg": 0.25,
  "unitsPerBatch": 10000,
  "msrpUsd": 4500,
  "documentation": {
    "productImages": ["ipfs://bafybei..."],
    "materialsSpec": "ipfs://bafybei...",
    "manufacturingProcess": "ipfs://bafybei..."
  }
}
```

---

### Supply Chain

| Method | Path                                    | Auth     | Description                           |
| ------ | --------------------------------------- | -------- | ------------------------------------- |
| GET    | `/supply-chain/events/:productId`       | Public   | All lifecycle events for a product    |
| POST   | `/supply-chain/events`                  | Required | Record a new lifecycle event          |
| GET    | `/supply-chain/events/:eventId`         | Public   | Single event detail                   |
| POST   | `/supply-chain/events/batch`            | Required | Batch record lifecycle events         |
| GET    | `/supply-chain/timeline/:productId`     | Public   | Chronological timeline with emissions |
| GET    | `/supply-chain/participants/:productId` | Public   | All participants in a product's chain |

**POST /supply-chain/events Request Body:**

```json
{
  "productId": 42,
  "stage": "manufacturing",
  "location": "EcoFactory Porto",
  "facilityId": "FAC-PT-001",
  "timestamp": "2025-06-20T08:00:00Z",
  "inputs": [
    {
      "material": "Organic Cotton Fabric",
      "quantityKg": 500,
      "isRecycled": false,
      "isRenewable": true,
      "supplier": "G...ABC123",
      "co2ePerKg": 2.1
    },
    {
      "material": "Recycled Polyester Thread",
      "quantityKg": 10,
      "isRecycled": true,
      "isRenewable": false,
      "supplier": "G...DEF456",
      "co2ePerKg": 0.8
    }
  ],
  "energyUsedKwh": 5000,
  "energySource": "solar",
  "wasteKg": 12,
  "waterUsedL": 15000,
  "notes": "Batch BATCH-2025-06 production run"
}
```

---

### GreenTag Certificates

| Method | Path                               | Auth         | Description                               |
| ------ | ---------------------------------- | ------------ | ----------------------------------------- |
| GET    | `/certificates`                    | Public       | List certificates (filterable)            |
| GET    | `/certificates/:id`                | Public       | Certificate metadata (JSON)               |
| GET    | `/certificates/:id/pdf`            | Public       | Download signed PDF certificate           |
| POST   | `/certificates`                    | Required     | Issue a new GreenTag certificate          |
| POST   | `/certificates/:id/revoke`         | Issuer/Admin | Revoke a certificate with reason          |
| POST   | `/certificates/verify`             | Public       | Verify certificate authenticity via hash  |
| GET    | `/certificates/product/:productId` | Public       | All certificates for a product            |
| GET    | `/certificates/owned`              | Required     | All certificates for authenticated wallet |

**POST /certificates Request Body:**

```json
{
  "productId": 42,
  "certType": "carbon_neutral",
  "metadataIpfsHash": "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
  "expiration": "2026-06-15T00:00:00Z"
}
```

---

### Carbon Accounting

| Method | Path                             | Auth   | Description                               |
| ------ | -------------------------------- | ------ | ----------------------------------------- |
| GET    | `/carbon/footprint/:productId`   | Public | Full cradle-to-grave carbon footprint     |
| GET    | `/carbon/breakdown/:productId`   | Public | Emissions breakdown by lifecycle stage    |
| GET    | `/carbon/compare`                | Public | Compare carbon footprints across products |
| GET    | `/carbon/factors`                | Public | List available emission factors           |
| POST   | `/carbon/factors`                | Admin  | Update emission factors                   |
| GET    | `/carbon/grid-intensity/:region` | Public | Grid carbon intensity by region           |
| GET    | `/carbon/methodology`            | Public | Current methodology version               |

**GET /carbon/footprint/:productId Response:**

```json
{
  "productId": 42,
  "productName": "EcoT-Shirt Classic",
  "totalKgCO2e": 3.42,
  "breakdown": {
    "rawMaterialExtraction": 1.25,
    "processing": 0.45,
    "manufacturing": 0.89,
    "packaging": 0.12,
    "warehousing": 0.05,
    "outboundLogistics": 0.38,
    "retail": 0.08,
    "usagePhase": 0.15,
    "endOfLife": 0.05
  },
  "equivalents": {
    "kmDrivenInCar": 27.4,
    "treeSeedlingsGrownFor10Years": 0.06,
    "smartphonesCharged": 415
  },
  "methodology": "GHG Protocol Scope 1, 2, 3 (2024)",
  "confidenceScore": 87,
  "scopeBreakdown": {
    "scope1": 0.45,
    "scope2": 0.89,
    "scope3": 2.08
  },
  "certificateReferences": [
    {
      "type": "carbon_neutral",
      "id": 1,
      "status": "active"
    }
  ]
}
```

---

### Verifiers

| Method | Path                          | Auth     | Description                             |
| ------ | ----------------------------- | -------- | --------------------------------------- |
| GET    | `/verifiers`                  | Public   | List registered verifiers               |
| GET    | `/verifiers/:id`              | Public   | Verifier profile and reputation score   |
| POST   | `/verifiers/register`         | Required | Register as a verifier (requires stake) |
| PUT    | `/verifiers/:id/stake`        | Required | Add or withdraw stake                   |
| GET    | `/verifiers/:id/attestations` | Public   | Verifier's attestation history          |
| GET    | `/verifiers/pending`          | Verifier | Attestations awaiting review            |
| POST   | `/verifiers/:id/heartbeat`    | Verifier | Liveness signal (required every 24h)    |

---

### Webhooks

Register webhook endpoints to receive real-time notifications:

| Method | Path                 | Auth     | Description                 |
| ------ | -------------------- | -------- | --------------------------- |
| POST   | `/webhooks`          | Required | Register a webhook endpoint |
| GET    | `/webhooks`          | Required | List registered webhooks    |
| DELETE | `/webhooks/:id`      | Required | Remove a webhook            |
| POST   | `/webhooks/:id/test` | Required | Send a test event           |

**Webhook Event Types:**

| Event                      | Trigger                          |
| -------------------------- | -------------------------------- |
| `product.registered`       | New product registered           |
| `product.transferred`      | Product ownership transferred    |
| `product.recalled`         | Product recalled by manufacturer |
| `lifecycle.event.recorded` | New lifecycle event recorded     |
| `lifecycle.event.attested` | Lifecycle event fully attested   |
| `carbon.footprint.updated` | Carbon footprint recalculated    |
| `certificate.issued`       | New GreenTag certificate issued  |
| `certificate.revoked`      | Certificate revoked              |
| `verifier.registered`      | New verifier registered          |
| `verifier.slashed`         | Verifier stake slashed           |

All webhook payloads include a `X-VerdeChain-Signature` header (HMAC-SHA256 of the body using the webhook secret) for verification.

---

## GreenTag Certificates

GreenTag certificates are the public-facing output of the VerdeChain protocol — a consumer scans a QR code on a product and sees the complete, verified provenance.

### Certificate Structure

Each certificate is a PDF/A-3 document containing:

1. **Visual Certificate** — Branded front page with product image, cert type, issue date, and QR code
2. **Machine-Readable XML** — Embedded XML with full audit trail (ISO 20400-aligned)
3. **Provenance Summary** — Key lifecycle events and emission data in human-readable form
4. **Verification Link** — QR code + URL linking directly to the Stellar transaction

### Verification Flow

```
Consumer scans QR code on product packaging
              │
              ▼
Redirected to: https://verify.verdechain.io/cert/<cert_id>
              │
              ▼
Frontend loads certificate from API and on-chain contract
              │
              ├── Verify certificate not revoked (contract call)
              ├── Verify product exists and matches (contract call)
              ├── Fetch IPFS-stored certificate content
              ├── Compute SHA-256 hash and compare with on-chain hash
              └── Display full provenance + carbon footprint
```

### Certificate Types

| Type                            | Description                            | Validates                |
| ------------------------------- | -------------------------------------- | ------------------------ |
| Certificate of Origin           | Country of origin, raw material source | ISO 20400                |
| Carbon Neutral (Cradle-to-Gate) | Manufacturing emissions fully offset   | PAS 2060                 |
| Carbon Neutral (Full Lifecycle) | Full lifecycle emissions offset        | PAS 2060                 |
| Organic                         | Organic material content               | USDA Organic, EU Organic |
| Fair Trade                      | Fair labor practices                   | Fair Trade Certified     |
| Circular Economy                | Recycled content ≥50%, recyclable      | ISO 14021                |
| Water Stewardship               | Water usage certified                  | AWS Standard             |
| Biodiversity Positive           | Net positive biodiversity impact       | TNFD-aligned             |

---

## Data Models

### Prisma Schema (Core Tables)

```prisma
model Manufacturer {
  id          String   @id @default(cuid())
  stellarKey  String   @unique
  name        String
  country     String
  verified    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  products     Product[]
  facilities   Facility[]
}

model Product {
  id              Int      @id @default(autoincrement())
  stellarId       Int      @unique
  productType     String
  name            String
  brand           String
  sku             String
  batchNumber     String
  manufactureDate DateTime
  countryOfOrigin String
  gpsOrigin       String?
  weightKg        Float
  unitsPerBatch   Int
  msrpUsd         Int
  status          String   @default("active")
  ipfsHash        String
  createdAt       DateTime @default(now())

  manufacturerId String
  manufacturer   Manufacturer @relation(fields: [manufacturerId], references: [id])

  lifecycleEvents LifecycleEvent[]
  certificates    Certificate[]
  carbonFootprints CarbonFootprint[]
}

model LifecycleEvent {
  id              Int      @id @default(autoincrement())
  stellarEventId  Int      @unique
  stage           String
  location        String
  facilityId      String
  participant     String
  timestamp       DateTime
  energyUsedKwh   Float
  energySource    String
  wasteKg         Float
  waterUsedL      Float
  emissionsKgCO2e Float
  notes           String?
  ipfsHash        String?

  productId Int
  product   Product @relation(fields: [productId], references: [id])

  inputs      MaterialInput[]
  attestation AttestationRecord?
}

model MaterialInput {
  id          Int     @id @default(autoincrement())
  material    String
  quantityKg  Float
  isRecycled  Boolean
  isRenewable Boolean
  supplier    String?
  co2ePerKg   Float

  eventId Int
  event   LifecycleEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
}

model Certificate {
  id              Int      @id @default(autoincrement())
  stellarCertId   Int      @unique
  certType        String
  issuer          String
  issuedAt        DateTime
  expiresAt       DateTime?
  isRevoked       Boolean  @default(false)
  revocationReason String?
  ipfsHash        String
  certificateHash String

  productId Int
  product   Product @relation(fields: [productId], references: [id])
}

model CarbonFootprint {
  id              Int     @id @default(autoincrement())
  totalKgCO2e     Float
  cradleToGate    Float
  logistics       Float
  usagePhase      Float?
  endOfLife       Float?
  methodology     String
  confidenceScore Int

  productId Int
  product   Product @relation(fields: [productId], references: [id])

  scope1 Float?
  scope2 Float?
  scope3 Float?

  calculatedAt DateTime @default(now())
}

model Verifier {
  id              Int      @id @default(autoincrement())
  stellarKey      String   @unique
  name            String
  stakeAmount     BigInt
  stakeLockedUntil DateTime?
  specializations String[]
  totalAttestations Int    @default(0)
  reputationScore Int     @default(500)
  status          String   @default("active")
  ipfsHash        String
  registeredAt    DateTime @default(now())
  lastActiveAt    DateTime @default(now())

  attestations    AttestationRecord[]
}

model AttestationRecord {
  id              Int      @id @default(autoincrement())
  stellarAttestId Int      @unique
  status          String   @default("pending")
  requiredVerifiers Int
  createdAt       DateTime
  resolvedAt      DateTime?

  verifierId String
  verifier   Verifier? @relation(fields: [verifierId], references: [stellarKey])

  lifecycleEventId Int
  lifecycleEvent   LifecycleEvent @relation(fields: [lifecycleEventId], references: [id], onDelete: Cascade)
}

model Facility {
  id          String @id @default(cuid())
  facilityId  String @unique
  name        String
  country     String
  gpsLocation String?
  energySource String
  capacityKw  Int?
  verified    Boolean @default(false)

  manufacturerId String
  manufacturer   Manufacturer @relation(fields: [manufacturerId], references: [id])
}
```

---

## Authentication & Authorization

VerdeChain uses **SEP-10 Stellar Web Authentication** — no passwords, no email-based auth.

### Authentication Flow

```
1. Client requests challenge from /auth/challenge
   → Server returns a Stellar challenge transaction XDR

2. Client signs the challenge with Freighter wallet
   → POST /auth/verify with signed XDR

3. Server validates the signature against Stellar network
   → Returns JWT token (claims: sub, roles, iat, exp)

4. Client includes JWT in Authorization header for all subsequent API calls
   → Authorization: Bearer <jwt>
```

### Roles & Permissions

| Role                 | Permissions                                                     |
| -------------------- | --------------------------------------------------------------- |
| `consumer` (default) | Read public products, certificates, footprints                  |
| `manufacturer`       | Register products, record lifecycle events, issue certificates  |
| `supplier`           | Record raw material extraction events, transfer to manufacturer |
| `logistics`          | Record shipping events                                          |
| `verifier`           | Approve/reject attestations, view pending list                  |
| `admin`              | Manage verifiers, update carbon factors, recall products        |

Roles are derived from the Stellar public key — the server maintains a mapping of `publicKey → role` in PostgreSQL. On mainnet, role assignments will be governed by the DAO.

### Stellar SDK Integration

```typescript
import { Contract, SorobanRpc, TransactionBuilder, Networks } from '@stellar/stellar-sdk';
import { isConnected, getPublicKey, signTransaction } from '@stellar/freighter-api';

const server = new SorobanRpc.Server(SOROBAN_RPC_URL);
const contract = new Contract(PRODUCT_REGISTRY_CONTRACT_ID);

// Register a product on-chain via Soroban
async function registerProduct(metadata: ProductMetadata, ipfsHash: string): Promise<number> {
  const publicKey = await getPublicKey();
  const sourceAccount = await server.getAccount(publicKey);

  const tx = new TransactionBuilder(sourceAccount, { fee: BASE_FEE })
    .addOperation(contract.call('register_product', publicKey, metadata, ipfsHash))
    .setTimeout(30)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  const signedXdr = await signTransaction(preparedTx.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);

  const result = await server.sendTransaction(signedTx);
  const { returnValue } = await server.getTransaction(result.hash);
  return Number(returnValue.u64()); // Returns product_id
}
```

---

## Verifier Network

The verifier network is the backbone of trust in the VerdeChain protocol. Independent third-party verifiers stake XLM as collateral and earn rewards for accurate attestations.

### Becoming a Verifier

1. **Stake XLM** — Minimum 1,000 XLM locked in the `VerifierRegistry` contract
2. **Submit credentials** — Upload certification body credentials, auditor licenses, and domain expertise to IPFS
3. **Define specializations** — Product categories you are qualified to attest (textiles, electronics, food, etc.)
4. **Pass peer review** — Existing verifiers in the network vote on your application
5. **Go live** — Start receiving attestation requests

### Attestation Workflow

```
Producer records lifecycle event
              │
              ▼
Event submitted for attestation (Attestation contract)
              │
              ▼
Verifier panel assigned (3 verifiers by default)
              │
              ▼
┌─────────────┼─────────────┐
│             │             │
▼             ▼             ▼
Approve      Reject      Escalate
│             │             │
│             │             ▼
│             │        (5-verifier panel)
│             │             │
│             │        ┌────┼────┐
│             │        │    │    │
▼             ▼        ▼    ▼    ▼
      Event permanently recorded or rejected
```

### Reputation Scoring

Verifiers earn reputation points based on:

| Metric      | Weight | Description                                       |
| ----------- | ------ | ------------------------------------------------- |
| Accuracy    | 40%    | % of attestations matching final verified outcome |
| Timeliness  | 20%    | Average response time (shorter = better)          |
| Volume      | 15%    | Total attestations handled                        |
| Peer Review | 15%    | Ratings from other verifiers                      |
| Longevity   | 10%    | Continuous active service duration                |

Scores range from 0–1000. Verifiers below 200 are automatically suspended.

### Slashing Conditions

A verifier's stake is partially or fully slashed for:

- **Fraudulent attestation** (20% of stake) — Attesting a false claim
- **Collusion** (50% of stake) — Coordinating with producers to bypass verification
- **Repeated negligence** (10% per incident) — Approving without proper review
- **Downtime exceeding 30 days** (5% of stake) — Inactivity penalty

Slashed funds go to the verifier insurance pool, which compensates users harmed by fraudulent attestations.

---

## Carbon Accounting Engine

The carbon accounting engine calculates product footprints automatically from attested lifecycle data.

### Methodology

VerdeChain follows the **GHG Protocol Corporate Standard** and **Product Life Cycle Accounting and Reporting Standard**:

| Scope                | Included Emissions                        | Data Source                           |
| -------------------- | ----------------------------------------- | ------------------------------------- |
| Scope 1              | Direct emissions from owned sources       | Facility energy meters, fuel use      |
| Scope 2              | Indirect emissions from purchased energy  | Grid intensity factor + usage         |
| Scope 3 (Upstream)   | Raw materials, transport, purchased goods | Supplier attestations + LCA databases |
| Scope 3 (Downstream) | Distribution, usage, end-of-life          | Logistics + product design specs      |

### Emission Factor Sources

| Source                   | Coverage                | Refresh Frequency          |
| ------------------------ | ----------------------- | -------------------------- |
| IPCC Guidelines          | Global, all sectors     | Annual                     |
| EPA Emission Factors Hub | US-specific             | Annual                     |
| EIA Grid Intensity       | US regional grids       | Hourly (real-time via API) |
| ENTSO-E Grid Intensity   | European regional grids | Hourly (real-time via API) |
| IEA World Energy Outlook | Global regional grids   | Annual                     |
| ecoinvent 3.9            | Process-based LCA data  | Periodic                   |
| Regional Grid Operators  | Country-specific        | Configurable               |

### Calculation Example

```typescript
// Simplified carbon footprint calculation
function calculateFootprint(events: LifecycleEvent[]): FootprintResult {
  let total = 0;
  const breakdown: Record<string, number> = {};

  for (const event of events) {
    // 1. Material emissions: input_kg × emission_factor
    const materialEmissions = event.inputs.reduce(
      (sum, input) => sum + input.quantityKg * input.co2ePerKg,
      0,
    );

    // 2. Energy emissions: energy_kwh × grid_intensity_factor
    const gridFactor = getGridIntensity(event.location);
    const energyEmissions = event.energyUsedKwh * gridFactor;

    // 3. Process emissions: waste_kg × waste_factor + water_l × water_factor
    const processEmissions = event.wasteKg * WASTE_FACTOR + event.waterUsedL * WATER_FACTOR;

    const stageTotal = materialEmissions + energyEmissions + processEmissions;
    breakdown[event.stage] = (breakdown[event.stage] || 0) + stageTotal;
    total += stageTotal;
  }

  return { total, breakdown, confidenceScore: computeConfidence(events) };
}
```

---

## Testing

```bash
# Smart contract tests
cd contracts && cargo test                             # Unit tests
cd contracts && cargo test -- --nocapture              # With output

# Cross-contract integration tests
cd contracts && cargo test integration

# Backend tests
cd api && npm run test                                 # Unit tests
cd api && npm run test:integration                     # Integration tests
cd api && npm run test:e2e                            # End-to-end tests

# Frontend tests
cd frontend && npm run test                            # Vitest
cd frontend && npx playwright test                     # E2E tests

# Full test suite
npm run test                                           # All tests
npm run test:ci                                        # CI pipeline tests

# Verify contracts build
npm run contracts:build                                # Build all contracts to WASM

# Lint and type checking
npm run lint                                           # ESLint + cargo clippy
npm run typecheck                                      # TypeScript type checking
```

### Testing Philosophy

1. **Every smart contract function** has at minimum: one happy-path test, one authorization failure test, and one edge case test
2. **Carbon accounting tests** include deterministic fixtures — the same inputs always produce the same outputs
3. **Integration tests** deploy all contracts to a local test node and exercise cross-contract flows
4. **E2E tests** simulate the full user journey: connect wallet → register product → record lifecycle → attest → issue certificate → verify

---

## Deployment

### Local Development

```bash
# Start local Stellar Quickstart node
docker run --rm -it -p 8000:8000 stellar/quickstart --testnet

# Deploy all contracts to local node
npm run deploy:local

# Seed demo data
npm run seed:local
```

### Testnet Deployment

```bash
# 1. Fund testnet keypair
curl "https://friendbot.stellar.org?addr=GXXX..."

# 2. Build contracts
cd contracts && cargo build --target wasm32-unknown-unknown --release

# 3. Deploy
cd contracts && ./deploy-testnet.sh

# 4. Seed test data
npm run seed:testnet

# 5. Verify
npm run doctor
```

### Mainnet Deployment

Mainnet deployment requires a multi-sig ceremony with 3-of-5 keyholders:

```bash
# 1. Build with production optimizations
cd contracts && cargo build --target wasm32-unknown-unknown --release

# 2. Generate deploy transaction (unsigned)
cd contracts && ./generate-deploy-tx.sh mainnet

# 3. Multi-sig signing ceremony
# Each keyholder signs the deploy transaction
stellar sign --secret-key <KEY1> --hash <TX_HASH>
stellar sign --secret-key <KEY2> --hash <TX_HASH>
stellar sign --secret-key <KEY3> --hash <TX_HASH>

# 4. Submit
stellar contract deploy --wasm ... --source <MULTISIG_KEY> --network mainnet

# 5. Verify on Stellar Expert
```

---

## Security

### On-Chain Security

- **All state-mutating functions** require caller authorization (`require_auth()`)
- **Replay protection** via Soroban's built-in nonce system
- **Verifier multi-sig** prevents a single compromised key from approving false attestations
- **Slashing mechanism** creates economic disincentive for fraudulent behavior
- **Admin multi-sig** on mainnet — no single key can upgrade contracts or modify protocol parameters
- **Immutable audit trail** — lifecycle events and certificates are append-only; no delete functions exist on any contract

### Off-Chain Security

- **No private keys in API** — all user-facing transactions signed client-side via Freighter
- **JWT with short expiry** (24h) obtained via SEP-10 wallet auth
- **API rate limiting** — 100 req/min for authenticated, 20 req/min for unauthenticated
- **Input validation** at every API endpoint (class-validator DTOs)
- **CORS** restricted to known origins
- **Helmet.js** security headers
- **SQL injection prevention** via Prisma parameterized queries
- **Dependency scanning** — `npm audit` and `cargo audit` run in CI on every push
- **Secret scanning** — GitHub secret scanning + `.env` in `.gitignore`

### Audits

All smart contracts undergo third-party security audits before mainnet deployment:

| Audit         | Scope                                | Status    |
| ------------- | ------------------------------------ | --------- |
| Trail of Bits | ProductRegistry, LifecycleTracker    | Scheduled |
| OpenZeppelin  | Attestation, GreenTagCert            | Scheduled |
| Halborn       | VerifierRegistry, CarbonOracle       | Scheduled |
| Code4rena     | Full contract suite (public contest) | Scheduled |

---

## Performance & Scalability

### Stellar Network Performance

| Metric                      | Value                     |
| --------------------------- | ------------------------- |
| Transaction finality        | ~5 seconds                |
| Max transactions per second | 1,000+                    |
| Cost per operation          | ~0.00001 XLM (~$0.000001) |
| Carbon footprint per tx     | 0.0000012 kgCO2e          |

### API Layer

- **Horizontal scaling** via ECS Fargate with auto-scaling (5–50 instances)
- **Redis caching** for emission factors (TTL: 24h) and product data (TTL: 1h)
- **Read replicas** for PostgreSQL — heavy query workloads routed to replicas
- **CDN** (CloudFront) for certificate PDF delivery
- **Job queue** (BullMQ/Redis) for async operations: certificate PDF generation, batch attestation

### Indexer

The Stellar event indexer processes ~50M events/day and maintains:

- Materialized views for common queries (product provenance, verifier stats)
- Time-partitioned tables for lifecycle events
- GIN indexes on JSON fields for flexible filtering
- Incremental sync from last processed ledger sequence

---

## Roadmap

### Phase 1 — Testnet MVP (Q1 2026)

- [x] Project architecture & documentation
- [x] Soroban smart contract design
- [ ] ProductRegistry contract (register, transfer, query)
- [ ] LifecycleTracker contract (event recording, batch)
- [ ] GreenTagCert contract (issue, verify, revoke)
- [ ] NestJS API scaffold with Stellar SDK
- [ ] Next.js frontend with Freighter wallet connect
- [ ] Basic product registration flow
- [ ] QR code certificate viewer

### Phase 2 — Attestation & Verifiers (Q2 2026)

- [ ] Attestation contract (multi-sig approval workflow)
- [ ] VerifierRegistry contract (staking, reputation, slashing)
- [ ] Verifier dashboard (pending attestations, reputation)
- [ ] Escalation workflow (3→5 verifier panel)
- [ ] Verifier on-chain registration UI
- [ ] Stake management (deposit, withdraw, slashing)
- [ ] Verifier insurance pool

### Phase 3 — Carbon Accounting (Q3 2026)

- [ ] CarbonOracle contract (emission factor registry)
- [ ] Automated GHG Protocol calculation engine
- [ ] Grid carbon intensity integration (hourly)
- [ ] EPA + IPCC emission factor databases
- [ ] Scope 1, 2, 3 breakdown visualization
- [ ] Carbon footprint comparison tool
- [ ] Consumer-friendly equivalents (km driven, trees grown)

### Phase 4 — Mainnet Launch (Q4 2026)

- [ ] Full contract suite on Stellar mainnet
- [ ] Multi-sig admin key ceremony
- [ ] Third-party security audits (Trail of Bits, OpenZeppelin)
- [ ] Bug bounty program launch
- [ ] SDK v1.0 release
- [ ] CLI tool v1.0 release
- [ ] GreenTag certificate PDF generation
- [ ] IPFS/Pinata integration for documentation

### Phase 5 — Ecosystem & Scale (Q1 2027)

- [ ] ERP connectors (SAP, Oracle, Dynamics)
- [ ] IoT sensor integration (MQTT oracle sidecar)
- [ ] Legacy carbon registry bridge (Verra, Gold Standard)
- [ ] Mobile app (scan-to-verify, QR code scanner)
- [ ] DAO governance migration
- [ ] Cross-chain attestations (Merkle bridge)
- [ ] Public provenance explorer
- [ ] Enterprise plan + SLA

---

## Contributing

We welcome contributions from developers, sustainability experts, verifiers, supply chain professionals, and climate activists.

### Getting Started

```bash
# Fork and clone
git clone https://github.com/your-fork/verdechain

# Create a feature branch
git checkout -b feat/your-feature

# Run the full test suite before submitting
npm run test

# Submit a pull request against main
```

### What We Need Help With

| Area              | Skills Needed                                           |
| ----------------- | ------------------------------------------------------- |
| Smart contracts   | Rust, Soroban SDK, formal verification                  |
| Backend API       | NestJS, TypeScript, Stellar SDK                         |
| Frontend          | Next.js, React, D3.js (provenance graph), Tailwind      |
| Carbon accounting | GHG Protocol, LCA methodology, emission factor research |
| Documentation     | Technical writing, API docs, user guides                |
| Security audits   | Smart contract security, penetration testing            |
| Data science      | Emission factor analysis, carbon modeling               |
| UX/UI             | Design system, mobile app, accessibility                |

### Contribution Guidelines

- Read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting
- All code must include tests
- Smart contract changes require passing `cargo test`
- API changes require passing `npm run test:integration`
- Run `npm run lint` and `npm run typecheck` before committing
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
- For security disclosures, email **security@verdechain.io** — do not open a public issue

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

---

## Support

For questions, issues, or partnership inquiries:

- GitHub Issues: [github.com/your-org/verdechain/issues](https://github.com/your-org/verdechain/issues)
- Documentation: [docs.verdechain.io](https://docs.verdechain.io)
- Discord: [discord.gg/verdechain](https://discord.gg/verdechain)
- Email: **hello@verdechain.io**

---

<p align="center">
  <strong>Built on <a href="https://stellar.org">Stellar</a> with <a href="https://soroban.stellar.org">Soroban</a></strong>
  <br>
  <em>Trust-minimized sustainability. Verifiable by anyone. Permanent for everyone.</em>
</p>
