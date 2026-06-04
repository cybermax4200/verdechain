# VerdeChain Sustainability Impact Report

> *We hold ourselves to the same standards we build for others — full transparency on our own environmental footprint.*

## Our Carbon Footprint

### Infrastructure Emissions (Monthly Estimate)

| Source | Monthly CO2e | Notes |
|--------|-------------|-------|
| CI/CD Pipelines (GitHub Actions) | ~2.5 kg | ~500 min/month × 5g CO2e/min |
| Development Machines | ~50 kg | 10 developers × ~5 kg/month |
| API Servers (AWS ECS Fargate) | ~150 kg | 3 × t3.medium, 24/7 |
| Database (RDS PostgreSQL) | ~100 kg | 1 × db.r6g.large |
| Cache (ElastiCache Redis) | ~50 kg | 1 × cache.r6g.large |
| CDN (CloudFront) | ~10 kg | Edge caching minimizes origin load |
| Stellar Network Fees | ~0.0006 kg | ~0.0000012 kgCO2e per transaction |
| **Total** | **~362.5 kg** | |

### Annual Projected: ~4.35 tonnes CO2e

### Offsets

We purchase verified carbon credits from [Verra-certified](https://verra.org) projects:
- Reforestation in Madagascar (VCS-CCB)
- Wind energy in India (VCS-Gold Standard)

## How We Minimize Our Impact

1. **Energy-efficient blockchain** — Stellar's SCP consensus uses ~0.0000012 kgCO2e per tx
   (vs. ~300 kgCO2e per Bitcoin tx and ~30 kgCO2e per Ethereum tx)
2. **Right-sized infrastructure** — Auto-scaling ensures we never run idle capacity
3. **Optimized CI/CD** — Cached dependencies, parallel workflows, minimal runner usage
4. **Renewable energy** — AWS regions powered by 100% renewable energy (eu-west-1, us-east-2)
5. **Remote-first team** — No office energy consumption or commuting emissions

## Our Product's Impact

By enabling transparent, verifiable supply chains, VerdeChain helps:
- **Reduce greenwashing** — Companies can no longer make false sustainability claims
- **Optimize supply chains** — Visibility enables carbon-aware routing and sourcing
- **Automate carbon accounting** — Eliminates manual, error-prone reporting
- **Enable consumer choice** — Scan-to-verify empowers sustainable purchasing decisions

## Reporting

This report is updated quarterly. Last updated: Q1 2026.

For questions, email **sustainability@verdechain.io**.
