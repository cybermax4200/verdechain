# Contributing to VerdeChain

Thank you for your interest in contributing to VerdeChain! This guide will help you understand our contribution process.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository
2. Set up your development environment (see `docs/guides/development.md`)
3. Create a feature branch from `main`
4. Make your changes
5. Submit a pull request

## Development Workflow

### Branch Naming

- `feature/<description>` — New features
- `fix/<description>` — Bug fixes
- `chore/<description>` — Tooling, config, dependencies
- `docs/<description>` — Documentation
- `refactor/<description>` — Code restructuring

### Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`

Examples:
```
feat(api): add product carbon footprint endpoint
fix(contracts): correct emission factor lookup key
docs(sdk): update client configuration example
test(api): add integration tests for auth flow
```

### Pull Request Process

1. Ensure your branch is up to date with `main`
2. Run all tests: `npm run test`
3. Run lint: `npm run lint`
4. Run typecheck: `npm run typecheck`
5. If changing contracts: `cd contracts && cargo test && cargo clippy`
6. Submit a PR using the template (automatically provided)

### PR Requirements

- All CI checks must pass
- At least one reviewer must approve
- No merge conflicts with `main`
- Changes must include tests (where applicable)
- Documentation must be updated for public API changes

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer interfaces over types for object shapes
- Use async/await over raw promises
- Follow existing patterns in the codebase
- No `any` types — use `unknown` if necessary

### Rust

- Follow Rust 2021 edition conventions
- Use `rustfmt` for formatting
- Run `cargo clippy — -D warnings` before committing
- Document public items with doc comments (`///`)

### Testing

- Write unit tests for all new business logic
- Write integration tests for API endpoints
- Write contract tests for new entry points
- Name tests descriptively: `it('calculates natural gas emissions correctly')`

## Project Structure Guidelines

### Adding a New API Endpoint

1. Add DTOs in `api/src/<module>/dto/`
2. Add service method in `api/src/<module>/<module>.service.ts`
3. Add controller route in `api/src/<module>/<module>.controller.ts`
4. Add repository method in `api/src/<module>/<module>.repository.ts` (if needed)
5. Add tests in `api/test/`

### Adding a New Contract

1. Add workspace member in `contracts/Cargo.toml`
2. Create contract directory with `src/lib.rs`, `src/types.rs`, `src/events.rs`
3. Implement entry points following existing patterns
4. Add tests in `contracts/<name>/tests/`
5. Add deployment step in `contracts/deploy-testnet.sh`

### Adding a New SDK Method

1. Add types in `sdk/src/types.ts`
2. Add module in `sdk/src/<name>.ts`
3. Export from `sdk/src/client.ts`
4. Add tests in `sdk/__tests__/`

## Review Process

Reviewers will check for:

- Correctness: Does the code do what it claims?
- Security: Are there any vulnerabilities?
- Performance: Are there obvious performance issues?
- Test coverage: Are there adequate tests?
- Documentation: Are public APIs documented?
- Style: Does the code follow project conventions?

## Getting Help

- Open a [GitHub Discussion](https://github.com/verdechain/verdechain/discussions)
- Join our [Discord](https://discord.gg/verdechain)
- Read the [docs](https://docs.verdechain.io)

## Release Process

Releases follow semantic versioning:

1. Maintainers merge PRs into `main`
2. A maintainer creates a tag (`v1.2.3`)
3. CI publishes SDK and CLI to npm
4. A GitHub Release is created with release notes

## Security Issues

**Do not open public issues for security vulnerabilities.** See `SECURITY.md` for disclosure instructions.
