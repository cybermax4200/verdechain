# Changelog

All notable changes to VerdeChain are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project scaffold: NestJS API, Next.js frontend, Soroban smart contracts
- `ProductRegistry` contract — register, transfer, recall products
- `LifecycleTracker` contract — record and batch lifecycle events
- `GreenTagCert` contract — issue, verify, and revoke GreenTag certificates
- `Attestation` contract — multi-stakeholder attestation workflow with escalation
- `VerifierRegistry` contract — staking, reputation scoring, and slashing
- `CarbonOracle` contract — on-chain emission factor registry
- SEP-10 wallet authentication (Freighter) with JWT session tokens
- Carbon accounting engine (GHG Protocol Scope 1, 2, 3)
- GreenTag certificate PDF generation via Puppeteer
- IPFS/Pinata integration for document permanence
- Stellar event indexer (Horizon stream consumer)
- `@verdechain/sdk` TypeScript SDK
- `@verdechain/cli` CLI tool
- Turborepo monorepo with npm workspaces
- GitHub Actions CI (contracts, API, frontend, SDK, CLI, format checks)
- Nightly security audits (`cargo audit`, `npm audit`, Trivy, TruffleHog)
- Testnet deployment automation
- Infrastructure as Code (Terraform: ECS, RDS, ElastiCache, CloudFront)

[Unreleased]: https://github.com/verdechain/verdechain/compare/HEAD...HEAD
