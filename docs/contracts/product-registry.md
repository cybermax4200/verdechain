# ProductRegistry Contract

## Overview

The ProductRegistry contract manages the lifecycle of product registration on the Stellar Soroban network. It provides tamper-proof ownership tracking, transfer capabilities, and recall functionality.

## Data Structures

### ProductMetadata

```rust
pub struct ProductMetadata {
    pub product_id: u64,
    pub manufacturer: Address,
    pub owner: Address,
    pub ipfs_hash: BytesN<32>,
    pub status: ProductStatus,
    pub registered_at: u64,
    pub updated_at: u64,
}
```

### ProductStatus

```rust
pub enum ProductStatus {
    Active,
    Transferred,
    Recalled,
    Retired,
}
```

## Entry Points

### register_product

Registers a new product on-chain.

| Parameter      | Type              | Description                    |
| -------------- | ----------------- | ------------------------------ |
| `manufacturer` | `Address`         | Manufacturer's Stellar address |
| `owner`        | `Address`         | Initial owner address          |
| `ipfs_hash`    | `BytesN<32>`      | SHA-256 hash of IPFS metadata  |
| `metadata`     | `ProductMetadata` | Product details                |

**Events emitted:** `ProductRegistered { product_id, manufacturer, ipfs_hash }`

### transfer_product

Transfers product ownership to a new address.

| Parameter    | Type      | Description        |
| ------------ | --------- | ------------------ |
| `product_id` | `u64`     | Product identifier |
| `from`       | `Address` | Current owner      |
| `to`         | `Address` | New owner address  |

**Events emitted:** `ProductTransferred { product_id, from, to, timestamp }`

### recall_product

Recalls a product (manufacturer or authorized entity only).

| Parameter    | Type     | Description        |
| ------------ | -------- | ------------------ |
| `product_id` | `u64`    | Product identifier |
| `reason`     | `String` | Recall reason      |

**Events emitted:** `ProductRecalled { product_id, reason, timestamp }`

### get_product

Returns product metadata by ID.

### get_products_by_owner

Returns all product IDs owned by an address.

### total_products

Returns the total number of registered products.

## Error Codes

| Code | Error                  | Description                           |
| ---- | ---------------------- | ------------------------------------- |
| 200  | `NotAuthorized`        | Caller is not the owner or authorized |
| 201  | `ProductNotFound`      | No product with the given ID          |
| 202  | `ProductAlreadyExists` | Duplicate product registration        |
| 203  | `InvalidMetadata`      | Metadata validation failed            |
| 204  | `ProductNotActive`     | Product is not in Active status       |

## Testing

Unit tests cover:

- Product registration (happy path, duplicate prevention, validation)
- Product transfer (ownership change, unauthorized attempts)
- Product recall (authorized vs. unauthorized)
- Cross-contract integration with LifecycleTracker

```bash
cargo test -p product_registry
```
