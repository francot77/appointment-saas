# Automatic Messaging Usage Specification

## Purpose

Define timezone-month accounting and authoritative automatic-message dispatch admission.

## Requirements

### Requirement: Authoritative dispatch enforcement

Automatic usage MUST be enforced backend-only immediately before an automatic `MessageJob` calls the provider. Admission MUST require an available capability, an enabled tenant connection, and remaining allowance. Scheduling and UI checks MUST NOT be authoritative.

#### Scenario: Disabled connection
- GIVEN an otherwise eligible automatic job and a disabled or missing connection
- WHEN dispatch admission occurs
- THEN no provider call or quota reservation occurs
- AND the job records a connection-blocked outcome

### Requirement: Calendar-month allowance

Usage MUST belong to `YYYY-MM` and calendar bounds derived from the effective business IANA timezone, never server timezone or a rolling interval. A job MUST retain its first admitted period across retries and reconciliation. Admission MUST require `accepted + reserved < allowance`.

#### Scenario: Dispatch at a month boundary
- GIVEN a business timezone differs from server timezone
- WHEN a job is admitted around local midnight on day one
- THEN its period is selected from business-local time
- AND that period remains attached to the job

### Requirement: Atomic idempotent accounting

Reservation, commit, and release MUST be atomic and concurrency-safe per tenant-period. A stable job usage identity MUST permit at most one active reservation and one accepted commit. Concurrent admissions MUST NOT exceed allowance, and the provider call MUST NOT occur inside an accounting transaction.

#### Scenario: Race for the last unit
- GIVEN one unit remains and two distinct jobs dispatch concurrently
- WHEN both attempt reservation
- THEN exactly one obtains admission
- AND accepted plus reserved never exceeds allowance

#### Scenario: Duplicate execution
- GIVEN one job is executed or reconciled repeatedly
- WHEN reservation, commit, or release is repeated
- THEN accepted usage changes at most once
- AND no duplicate provider call is admitted after a terminal outcome

### Requirement: Provider outcome accounting

A provider message identifier MUST count as acceptance and commit exactly one unit. A definite pre-acceptance failure MUST release the reservation and count zero. An ambiguous result MUST become non-retryable `delivery_unknown`, retain one uncertain reservation, and count zero accepted units until trusted reconciliation commits or releases it.

#### Scenario: Provider accepts
- GIVEN an admitted job has one reservation
- WHEN the provider returns a message identifier
- THEN one unit is committed exactly once
- AND the identifier and accepted outcome are auditable

#### Scenario: Definite failure
- GIVEN an admitted job fails with definite non-acceptance
- WHEN the outcome is recorded
- THEN its reservation is released
- AND the job may follow its existing retry policy without usage being counted

#### Scenario: Ambiguous outcome reconciliation
- GIVEN a job is `delivery_unknown` with an uncertain reservation
- WHEN trusted reconciliation proves acceptance or non-acceptance
- THEN it atomically commits or releases the reservation
- AND records reconciler, reason, evidence reference, and timestamp

### Requirement: Quota-reached isolation

At exhausted allowance, new automatic dispatches MUST make no provider call and MUST record an auditable quota-blocked outcome. Appointment creation, updates, cancellation, and manual or semi-automatic `waUrl` messaging MUST remain available.

#### Scenario: Appointment mutation at quota
- GIVEN a tenant has no remaining automatic allowance
- WHEN an appointment is changed and a manual WhatsApp action is requested
- THEN the appointment and manual action remain available
- AND any resulting automatic job is blocked only at dispatch

### Requirement: Auditable usage state

Each usage outcome MUST expose tenant, job usage identity, period, timezone, effective plan, allowance, outcome, accepted and uncertain totals, provider identifier when known, and relevant timestamps. Reconciliation audit fields MUST be immutable to tenant owners.

#### Scenario: Inspect a quota-blocked job
- GIVEN an automatic job was denied for quota
- WHEN an authorized tenant reads its status
- THEN the period, allowance, outcome, and usage totals are present
- AND operator-only reconciliation fields cannot be modified
