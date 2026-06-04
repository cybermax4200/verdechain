# Contributing to VerdeChain

Thank you for your interest in contributing to VerdeChain! We welcome contributions from developers, sustainability experts, verifiers, supply chain professionals, and climate activists.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Commit Conventions](#commit-conventions)
5. [Pull Request Process](#pull-request-process)
6. [Code Standards](#code-standards)
7. [Testing](#testing)
8. [Smart Contract Guidelines](#smart-contract-guidelines)
9. [Security](#security)

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you agree to uphold its principles.

## Getting Started

### Prerequisites

- Node.js 20+ (nvm recommended)
- Rust 1.75+ (`rustup target add wasm32-unknown-unknown`)
- Soroban CLI 21.x (`cargo install --locked soroban-cli@21.0.0`)
- Docker + Docker Compose
- Freighter Wallet browser extension

### One-Click Setup

```bash
git clone https://github.com/your-org/verdechain
cd verdechain
./scripts/bootstrap.sh
```

See the [README](./README.md#quick-start) for manual setup instructions.

## Development Workflow

1. **Fork and clone** the repository
2. **Create a feature branch**: `git checkout -b feat/your-feature`
3. **Make changes** following the code standards below
4. **Run tests**: `npm run test`
5. **Run lint**: `npm run lint`
6. **Run typecheck**: `npm run typecheck`
7. **Commit** using conventional commits
8. **Push** and open a pull request against `main`

## Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type     | Usage                                  |
|----------|----------------------------------------|
| `feat`   | A new feature                          |
| `fix`    | A bug fix                              |
| `chore`  | Tooling, config, dependency changes    |
| `docs`   | Documentation only                     |
| `style`  | Formatting, missing semicolons         |
| `refactor` | Code change that neither fixes nor adds |
| `test`   | Adding or updating tests               |
| `perf`   | Performance improvement                |

### Scopes

| Scope           | Area                          |
|-----------------|-------------------------------|
| `contracts`     | Soroban smart contracts       |
| `api`           | NestJS backend                |
| `frontend`      | Next.js frontend              |
| `sdk`           | TypeScript SDK                |
| `cli`           | CLI tool                      |
| `infra`         | Terraform, Docker, CI/CD      |
| `oracle`        | IoT/data oracle sidecar       |
| `connectors`    | ERP integrations              |
| `docs`          | Documentation                 |

### Examples

```
feat(contracts): add batch lifecycle event recording
fix(api): handle expired JWT tokens gracefully
docs(api): document carbon footprint endpoint
chore: upgrade Soroban SDK to v21.1
```

## Pull Request Process

1. Ensure all tests pass: `npm run test`
2. Ensure lint and typecheck pass: `npm run lint && npm run typecheck`
3. Update documentation if needed
4. Add tests for new functionality
5. Keep PRs focused — one feature or fix per PR
6. Ensure the PR title follows conventional commits
7. Request review from at least one maintainer

### PR Template

Fill out the [PR template](.github/PULL_REQUEST_TEMPLATE.md) with:
- What this PR does
- How to test it
- Screenshots (for UI changes)
- Breaking changes (if any)

## Code Standards

### TypeScript / NestJS

- Strict mode enabled (`strict: true`)
- No `any` types — use `unknown` and type guards
- No `console.log` — use the NestJS Logger
- Use `class-validator` DTOs for all request validation
- Use dependency injection for all services
- Prefer `async/await` over raw promises
- Use `const` and `let`, never `var`

### Rust / Soroban

- Run `cargo clippy` before committing
- All public functions must have doc comments
- Use `require_auth()` for all state-mutating functions
- Follow Soroban SDK patterns
- Use the shared error codes from `contracts/shared/src/errors.rs`

### Frontend / Next.js

- Use the App Router (not Pages Router)
- Server Components by default, Client Components only when needed
- Use Tailwind CSS for styling
- Use the shadcn/ui component library
- All data fetching through the SDK

## Testing

### Smart Contracts

Every contract function must have at minimum:
- One happy-path test
- One authorization failure test
- One edge case test

```bash
cd contracts && cargo test
```

### Backend

```bash
cd api && npm run test        # Unit tests
cd api && npm run test:integration  # Integration tests
cd api && npm run test:e2e    # End-to-end tests
```

### Frontend

```bash
cd frontend && npm run test
npx playwright test           # E2E tests
```

### Full Suite

```bash
npm run test                  # All tests
npm run test:ci               # CI pipeline tests
```

## Smart Contract Guidelines

1. **Authorization** — Every state-mutating function must call `require_auth()`
2. **Events** — Emit events for all state changes
3. **Error codes** — Use shared error codes from `contracts/shared`
4. **Storage** — Use persistent storage types from `storage.rs` patterns
5. **Input validation** — Validate all input parameters
6. **No secrets** — Never store secrets on-chain
7. **Gas efficiency** — Minimize on-chain storage, batch operations where possible
8. **Upgradeability** — Contracts are immutable once deployed; plan for upgrade via proxy patterns

## Security

For security disclosures, email **security@verdechain.io** — do not open a public issue.

See [SECURITY.md](./SECURITY.md) for the full security policy.
