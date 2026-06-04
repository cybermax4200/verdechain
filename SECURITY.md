# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of VerdeChain seriously. If you believe you have found a
security vulnerability, please **do not open a public issue**.

### Disclosure Process

1. **Email** your report to **security@verdechain.io**
2. Include as much detail as possible:
   - Type of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. You should receive a response within **48 hours**
4. We will work with you to understand and address the issue
5. Once resolved, we will coordinate public disclosure

### What to Expect

- Acknowledgment of your report within 2 business days
- Regular updates on progress (every 5 business days)
- Credit for the discovery (if desired) in the release notes
- A bug bounty for verified critical vulnerabilities (program details TBD)

### Scope

- Soroban smart contracts in `contracts/`
- NestJS API in `api/`
- SDK and CLI packages in `sdk/` and `cli/`
- Infrastructure configurations in `infra/`
- CI/CD pipelines in `.github/workflows/`

### Out of Scope

- Issues in dependencies — report to the upstream maintainer
- Theoretical attacks without a concrete exploit path
- Social engineering attacks against the team

## Security Best Practices

### For Contributors

- Never commit `.env` files or secrets
- Use environment variables for all configuration
- Run `npm audit` and `cargo audit` before submitting PRs
- Use `require_auth()` in all state-mutating contract functions
- Validate all inputs at the API layer and contract layer

### For Deployers

- Use a secrets manager (AWS Secrets Manager, HashiCorp Vault) in production
- Never store admin secret keys in environment files on mainnet
- Use multi-sig for admin operations on mainnet
- Rotate keys immediately if compromised
- Enable rate limiting on API endpoints
- Use HTTPS in production

## Audits

Smart contract security audits will be conducted before mainnet launch:

| Auditor        | Scope                          | Status    |
|----------------|--------------------------------|-----------|
| Trail of Bits  | ProductRegistry, LifecycleTracker | Scheduled |
| OpenZeppelin   | Attestation, GreenTagCert      | Scheduled |
| Halborn        | VerifierRegistry, CarbonOracle | Scheduled |
| Code4rena      | Full contract suite            | Scheduled |

## Bug Bounty

A bug bounty program will be announced before mainnet launch. Details TBD.
