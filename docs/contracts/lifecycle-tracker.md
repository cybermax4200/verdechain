# LifecycleTracker Contract

## Overview

The LifecycleTracker contract records and queries lifecycle events for products registered on the ProductRegistry. It supports batch operations, emission factor lookups via the CarbonOracle, and provides emission summaries per product.

## Data Structures

### LifecycleEvent

```rust
pub struct LifecycleEvent {
    pub event_id: u64,
    pub product_id: u64,
    pub stage: LifecycleStage,
    pub participant: Address,
    pub timestamp: u64,
    pub metadata_hash: BytesN<32>,
    pub emissions: Option<i128>,
}
```

### LifecycleStage

```rust
pub enum LifecycleStage {
    RawMaterialExtraction,
    Manufacturing,
    TransportToDistributor,
    Retail,
    EndOfLife,
}
```

## Entry Points

### record_event

Records a lifecycle event for a product.

| Parameter | Type | Description |
|-----------|------|-------------|
| `product_id` | `u64` | Product identifier |
| `stage` | `LifecycleStage` | Lifecycle stage |
| `participant` | `Address` | Address recording the event |
| `metadata_hash` | `BytesN<32>` | SHA-256 hash of event metadata |
| `location` | `String` | ISO country/region code |

**Events emitted:** `LifecycleEventRecorded { product_id, event_id, stage }`

### batch_record_events

Atomically records multiple lifecycle events.

| Parameter | Type | Description |
|-----------|------|-------------|
| `events` | `Vec<EventInput>` | Array of event inputs |

### get_lifecycle

Returns all events for a product, ordered by timestamp.

### get_event

Returns a single event by ID.

### get_emissions_summary

Returns aggregated emissions for a product, grouped by stage.

### get_event_count

Returns the total number of events recorded for a product.

## Cross-Contract Calls

The LifecycleTracker calls:
- **ProductRegistry**: Validates product existence and ownership
- **CarbonOracle**: Retrieves emission factors for the event's location and stage

## Error Codes

| Code | Error | Description |
|------|-------|-------------|
| 300 | `ProductNotFound` | Product does not exist in registry |
| 301 | `NotAuthorized` | Caller is not authorized |
| 302 | `InvalidStage` | Lifecycle stage is invalid |
| 303 | `InvalidEventData` | Event data failed validation |
| 304 | `BatchTooLarge` | Batch exceeds maximum size |

## Testing

```bash
cargo test -p lifecycle_tracker
```
