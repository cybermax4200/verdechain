# Developer Environment Setup

## Prerequisites

- **Node.js** 20+ (with npm 10+)
- **Rust** 1.75+ (with `wasm32-unknown-unknown` target)
- **Docker** (for PostgreSQL, Redis, Stellar Quickstart)
- **Git**

## Quick Start

The fastest way to get started:

```bash
# Clone the repository
git clone https://github.com/verdechain/verdechain.git
cd verdechain

# Run the bootstrap script
./scripts/bootstrap.sh

# Start development servers
npm run dev
```

This will:
1. Check prerequisites
2. Install dependencies
3. Start Docker services (PostgreSQL, Redis, Stellar)
4. Generate Prisma client
5. Run database migrations
6. Build smart contracts
7. Fund testnet keypair and deploy contracts
8. Seed sample data

## Manual Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Infrastructure

```bash
docker compose up -d
```

This starts:
- PostgreSQL 16 on port 5432
- Redis 7 on port 6379
- Stellar Quickstart (testnet) on port 8000

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://...` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379` |
| `SOROBAN_RPC_URL` | Soroban RPC endpoint | `http://localhost:8000/soroban/rpc` |
| `HORIZON_URL` | Horizon endpoint | `http://localhost:8000` |
| `ADMIN_SECRET_KEY` | Admin Stellar keypair | (generate via `npm run wallet:generate`) |
| `PINATA_API_KEY` | IPFS Pinata API key | (get from pinata.cloud) |
| `JWT_SECRET` | JWT signing secret | (generate via `openssl rand -hex 32`) |

### 4. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed sample data
npm run db:seed
```

### 5. Build Contracts

```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release
```

### 6. Deploy Contracts (Local Testnet)

```bash
cd contracts
bash deploy-testnet.sh --network local
```

### 7. Start Development Servers

```bash
npm run dev
```

This starts:
- **API**: http://localhost:3000 (Swagger docs at /v1/docs)
- **Frontend**: http://localhost:3001

## Project Structure

```
verdechain/
├── api/              # NestJS backend
│   ├── src/          # Source code
│   ├── prisma/       # Database schema
│   └── test/         # Tests
├── frontend/         # Next.js frontend
│   ├── app/          # Pages (App Router)
│   └── components/   # React components
├── sdk/              # TypeScript SDK
├── cli/              # Commander.js CLI
├── contracts/        # Soroban smart contracts
├── scripts/          # Utility scripts
├── docs/             # Documentation
└── infra/            # Terraform configurations
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all dev servers in parallel |
| `npm run build` | Build all packages |
| `npm run test` | Run all tests |
| `npm run test:ci` | Run all tests with coverage |
| `npm run lint` | Lint all packages |
| `npm run typecheck` | TypeScript type checking |
| `npm run format` | Check formatting |
| `npm run format:fix` | Fix formatting |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed sample data |
| `npm run contracts:build` | Build Soroban contracts |
| `npm run doctor` | Environment diagnostics |
| `npm run clean` | Clean all build artifacts |

## Testing

```bash
# Run all tests
npm run test

# Run API tests only
npm run test -w api

# Run contract tests only
cd contracts && cargo test

# Run specific test file
npm run test -w api -- --testPathPattern="carbon-footprint"

# Watch mode
npm run test:watch -w api
```

## Docker

```bash
# Start services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Reset all data
docker compose down -v
```

## Troubleshooting

### Port already in use

Check if another process is using the required ports:

```bash
lsof -i :3000  # API
lsof -i :3001  # Frontend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
```

### Prisma client generation fails

Ensure PostgreSQL is running and the connection string is correct:

```bash
docker compose up -d db
npm run db:generate
```

### Contract deployment fails

Ensure the Soroban RPC endpoint is reachable:

```bash
# Check if Stellar is running
curl http://localhost:8000/soroban/rpc
```
