# VerdeChain API Reference

## Base URL

- **Local**: `http://localhost:3000`
- **Testnet**: `https://api.testnet.verdechain.io`
- **Mainnet**: `https://api.verdechain.io`

## Authentication

### SEP-10 Flow

1. `POST /auth/challenge` — Get a Stellar challenge transaction
2. Sign the challenge XDR with your Stellar wallet (e.g., Freighter)
3. `POST /auth/verify` — Submit signed XDR to receive JWT
4. Include `Authorization: Bearer <jwt>` in subsequent requests

### Endpoints

#### Auth

| Method | Path              | Description                     |
| ------ | ----------------- | ------------------------------- |
| POST   | `/auth/challenge` | Generate SEP-10 challenge       |
| POST   | `/auth/verify`    | Verify challenge and return JWT |
| POST   | `/auth/refresh`   | Refresh JWT token               |

#### Products

| Method | Path                         | Description                           |
| ------ | ---------------------------- | ------------------------------------- |
| GET    | `/products`                  | List products (paginated, filterable) |
| POST   | `/products`                  | Register a new product                |
| GET    | `/products/:id`              | Get product details                   |
| GET    | `/products/:id/provenance`   | Get JSON-LD provenance graph          |
| GET    | `/products/:id/lifecycle`    | Get lifecycle timeline                |
| GET    | `/products/:id/carbon`       | Get carbon footprint                  |
| GET    | `/products/:id/certificates` | Get product certificates              |
| GET    | `/products/owned`            | Get products by owner                 |
| GET    | `/products/batch/:batch`     | Get products by batch                 |

#### Supply Chain

| Method | Path                                    | Description            |
| ------ | --------------------------------------- | ---------------------- |
| POST   | `/supply-chain/events`                  | Record lifecycle event |
| POST   | `/supply-chain/events/batch`            | Batch record events    |
| GET    | `/supply-chain/timeline/:productId`     | Get event timeline     |
| GET    | `/supply-chain/participants/:productId` | Get chain participants |

#### Carbon Accounting

| Method | Path                             | Description                     |
| ------ | -------------------------------- | ------------------------------- |
| GET    | `/carbon/footprint/:productId`   | Cradle-to-grave footprint       |
| GET    | `/carbon/breakdown/:productId`   | Breakdown by lifecycle stage    |
| GET    | `/carbon/compare?ids=1,2,3`      | Compare multiple products       |
| GET    | `/carbon/factors`                | List emission factors           |
| POST   | `/carbon/factors`                | Update emission factors (admin) |
| GET    | `/carbon/grid-intensity/:region` | Grid intensity by region        |
| GET    | `/carbon/methodology`            | Current methodology version     |

#### Certificates

| Method | Path                               | Description              |
| ------ | ---------------------------------- | ------------------------ |
| GET    | `/certificates`                    | List certificates        |
| POST   | `/certificates`                    | Issue certificate        |
| GET    | `/certificates/:id`                | Get certificate details  |
| GET    | `/certificates/:id/pdf`            | Download certificate PDF |
| POST   | `/certificates/:id/revoke`         | Revoke certificate       |
| POST   | `/certificates/verify`             | Verify certificate       |
| GET    | `/certificates/product/:productId` | Certificates for product |

#### Verifiers

| Method | Path                       | Description          |
| ------ | -------------------------- | -------------------- |
| GET    | `/verifiers`               | List verifiers       |
| POST   | `/verifiers/register`      | Register as verifier |
| GET    | `/verifiers/:id`           | Get verifier profile |
| PUT    | `/verifiers/:id/stake`     | Add stake            |
| GET    | `/verifiers/pending`       | Pending attestations |
| POST   | `/verifiers/:id/heartbeat` | Liveness signal      |

#### Webhooks

| Method | Path                 | Description      |
| ------ | -------------------- | ---------------- |
| POST   | `/webhooks`          | Register webhook |
| GET    | `/webhooks`          | List webhooks    |
| DELETE | `/webhooks/:id`      | Remove webhook   |
| POST   | `/webhooks/:id/test` | Send test event  |

## Pagination

Paginated endpoints accept:

- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `sort` (field:asc or field:desc)

## Error Responses

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "name",
      "constraints": ["name must be a string"]
    }
  ]
}
```

## Rate Limiting

- 100 requests per minute per IP (unauthenticated)
- 1000 requests per minute per user (authenticated)
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## SDK

For programmatic access, use the TypeScript SDK:

```typescript
import { VerdeChainClient } from '@verdechain/sdk';

const client = new VerdeChainClient({
  apiUrl: 'http://localhost:3000',
});

await client.setAuthToken(jwt);
const products = await client.getProducts({ page: 1, limit: 10 });
```

Full Swagger documentation available at `/v1/docs` when the API is running.
