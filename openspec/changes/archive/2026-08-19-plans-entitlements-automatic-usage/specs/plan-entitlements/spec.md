# Plan Entitlements Specification

## Purpose

Define tenant-effective plans, capabilities, assignment controls, transitions, and the minimum entitlement read model.

## Requirements

### Requirement: Code-owned plan catalog

The catalog MUST expose stable `basic`, `premium`, and `enterprise` keys. Each entry MUST define its display name, capabilities, and custom automatic-messaging monthly allowance as separate values; capability availability MUST NOT be inferred from allowance size. Enterprise values MAY be customized without changing its stable key.

#### Scenario: Resolve every catalog plan
- GIVEN each supported stable plan key
- WHEN the catalog entry is read
- THEN its capabilities and monthly allowance are returned independently
- AND no pricing value is required

### Requirement: Effective entitlement resolution

The resolver MUST derive effective capabilities and limits from tenant assignment, billing state, and the current catalog. A missing legacy assignment MUST resolve as `basic`; a missing or invalid business timezone MUST resolve as `America/Argentina/Buenos_Aires`, and all results MUST expose the effective IANA timezone explicitly.

#### Scenario: Resolve a legacy business
- GIVEN a business without plan assignment or valid timezone
- WHEN effective entitlements are requested
- THEN `basic` and `America/Argentina/Buenos_Aires` are returned
- AND capabilities and limits match the current catalog and billing state

#### Scenario: Billing state removes availability
- GIVEN an assigned plan whose billing state does not permit a capability
- WHEN effective entitlements are resolved
- THEN that capability is unavailable without changing the stored plan key

### Requirement: Plan transitions

An upgrade MUST apply immediately and MUST preserve current-period usage. A downgrade MUST apply immediately to new automatic dispatch admissions; it MUST NOT erase accepted history or alter appointments or manual messaging. Pending automatic jobs MUST be evaluated against effective entitlements at dispatch time.

#### Scenario: Upgrade during a month
- GIVEN a tenant has consumed usage under a lower allowance
- WHEN an operator assigns a higher effective plan
- THEN the higher allowance applies immediately
- AND prior accepted and uncertain usage remains in the same period

#### Scenario: Downgrade with pending jobs
- GIVEN automatic jobs are pending when a lower plan becomes effective
- WHEN those jobs reach dispatch admission
- THEN each job is admitted or blocked under the downgraded entitlement
- AND no appointment or manual action is blocked

### Requirement: Minimal entitlement read model

The tenant read API MUST return plan key and label, effective capability availability, allowance, accepted usage, uncertain usage, remaining known allowance, period key, period bounds, and timezone. Billing/settings UI MUST distinguish available, unavailable, quota reached, and delivery uncertainty states and MUST be advisory only.

#### Scenario: Render uncertain usage
- GIVEN the read model reports uncertain usage above zero
- WHEN billing or messaging settings is displayed
- THEN the UI identifies the uncertainty and current period
- AND it does not present uncertain usage as accepted

### Requirement: Operator-only assignment boundary

Plan assignment MUST be available only through a trusted operator-side server abstraction. Tenant-owner APIs and UI MUST NOT assign plans, limits, capabilities, billing state, or timezone on behalf of the operator.

#### Scenario: Tenant attempts assignment
- GIVEN an authenticated tenant owner
- WHEN they submit an assignment mutation
- THEN the system rejects the mutation
- AND the stored entitlement inputs remain unchanged

### Requirement: Commercial functions remain excluded

This capability MUST NOT define checkout, payment-provider integration, pricing, invoicing, proration, refunds, self-service plan changes, operator RBAC/UI, usage-based billing, or a full event ledger.

#### Scenario: Read catalog metadata
- GIVEN a tenant reads entitlements
- WHEN the response is produced
- THEN it contains no checkout action or authoritative price
