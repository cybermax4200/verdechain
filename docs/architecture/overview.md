# VerdeChain Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Clients                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │   Web    │  │  Mobile   │  │   CLI    │  │   SDK (npm)    │  │
│  │ (Next.js)│  │  (PWA)    │  │(Commander)│  │ @verdechain/sdk│  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬────────┘  │
│       │             │             │               │            │
└───────┼─────────────┼─────────────┼───────────────┼────────────┘
        │             │             │               │
        ▼             ▼             ▼               ▼
┌──────────────────────────────────────────────────────────────────┐
│                     API Gateway (NestJS)                          │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ Products │ │ Supply   │ │ Carbon   │ │ Certificates     │    │
│  │ Module   │ │ Chain    │ │Accounting│ │ Module           │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ Auth     │ │ Verifiers│ │ Indexer  │ │ Webhooks         │    │
│  │ Module   │ │ Module   │ │ Service  │ │ Module           │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              Common Infrastructure                         │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │   │
│  │  │ Guards   │ │Filters   │ │Intercepts│ │ Decorators    │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  PostgreSQL   │  │      Redis       │  │    IPFS (Pinata) │
│  (Prisma ORM) │  │   (BullMQ/Queue) │  │  (Metadata Store)│
└──────────────┘  └──────────────────┘  └──────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Stellar Soroban Contracts                       │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐   │
│  │ ProductRegistry │  │LifecycleTracker│  │  CarbonOracle    │   │
│  └────────────────┘  └────────────────┘  └──────────────────┘   │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐   │
│  │  Attestation   │  │ GreenTagCert   │  │VerifierRegistry  │   │
│  └────────────────┘  └────────────────┘  └──────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## Layer Descriptions

### 1. Client Layer

- **Web App (Next.js)**: Server-side rendered React application with Tailwind CSS. Supports wallet connectivity via Freighter, product scanning, certificate viewing, and manufacturer/verifier dashboards.
- **CLI (Commander.js)**: Terminal-based tool for developers and operators. Supports product, lifecycle, carbon, and certificate operations.
- **SDK (TypeScript)**: Programmatic access to VerdeChain API. Published as `@verdechain/sdk` on npm with both ESM and CJS builds.

### 2. API Layer (NestJS)

The backend API is organized into domain modules:

| Module | Purpose |
|--------|---------|
| **Products** | CRUD for product registration, provenance queries |
| **Supply Chain** | Lifecycle event recording and aggregation |
| **Carbon Accounting** | GHG Protocol Scope 1/2/3 calculations |
| **Certificates** | GreenTag certificate issuance and verification |
| **Auth** | SEP-10 Stellar challenge + JWT authentication |
| **Verifiers** | Verifier registration, staking, reputation |
| **Indexer** | Stellar Horizon event stream processing |
| **Webhooks** | Event-driven callbacks with HMAC signing |
| **IPFS** | Decentralized metadata storage via Pinata |
| **Stellar** | Soroban/Horizon client wrappers |

### 3. Stellar Soroban Contracts

Smart contracts deployed on Stellar Soroban:

| Contract | Purpose |
|----------|---------|
| **ProductRegistry** | Register, transfer, and recall products |
| **LifecycleTracker** | Record and query lifecycle events with emissions |
| **CarbonOracle** | Emission factors, grid intensity, methodology |
| **Attestation** | Multi-verifier attestation workflow |
| **GreenTagCert** | GreenTag certificate issuance and revocation |
| **VerifierRegistry** | Verifier registration, staking, reputation |

### 4. Data Layer

- **PostgreSQL**: Primary off-chain data store via Prisma ORM. Stores product metadata, lifecycle events, certificates, and user data.
- **Redis**: Job queue (BullMQ) for async tasks and caching.
- **IPFS**: Decentralized storage for product metadata and certificates.

## Key Design Decisions

### Off-Chain Index + On-Chain Anchor

Products are registered on-chain (Soroban) for tamper-proof ownership, while detailed metadata is stored off-chain in PostgreSQL and IPFS. The on-chain hash links the two.

### SEP-10 Authentication

Authentication uses Stellar's SEP-10 standard, allowing users to authenticate with their Stellar wallet (Freighter). JWTs are issued for subsequent API calls.

### GHG Protocol Methodology

Carbon accounting follows the GHG Protocol Corporate Standard, with Scope 1 (direct), Scope 2 (energy indirect), and Scope 3 (supply chain) emissions calculated from lifecycle events.

## Security

- All API endpoints are protected by rate limiting (token bucket)
- JWT authentication with configurable expiry
- Role-based access control (manufacturer, verifier, admin)
- Helmet security headers
- Input validation via class-validator DTOs
- HMAC-signed webhook payloads
- Encrypted secrets in CI/CD environments

## Deployment

See [infra/README.md](../../infra/README.md) for Terraform deployment instructions.
