# Client Turn Recovery Specification

## Purpose

Migrate customer recovery presentation without changing behavior.

## Requirements

### Requirement: Bounded Presentation Migration

The change MUST modify presentation only in `app/r/[token]/MagicLinkClient.tsx` and `app/[slug]/turno-actualizado/page.tsx`. It MUST use applicable `Alert`, `Status`, `LoadingState`, and `EmptyState` primitives and Editorial-light surfaces. Tenant colors MUST identify tenants or actions, never status.

#### Scenario: Authorized surfaces are migrated

- GIVEN either recovery route renders
- WHEN the migration is complete
- THEN they use applicable shared feedback primitives and Editorial-light hierarchy
- AND tenant identity, accents, and copy remain unchanged

#### Scenario: Scope remains isolated

- GIVEN the implementation diff
- WHEN production changes are inspected
- THEN only the two authorized consumers contain production changes
- AND `turno-recibido`, owner tabs, APIs, `lib`, dependencies, configuration, shared primitives, and Dialog behavior are unchanged

### Requirement: Appointment Loading and Persistence Preservation

`MagicLinkClient` MUST preserve every loading, timeout, error, retry, empty, and loaded branch; 10-second abort cleanup; `GET /api/client/appointments/:token`; and existing localStorage save, expiry filtering, five-entry cap, and removal.

#### Scenario: Valid appointment loads

- GIVEN loading succeeds with valid token, expiry, and business data
- WHEN the appointment loads
- THEN existing appointment fields, identity, status, notes, service, and controls appear
- AND the same saved-appointment values and management URL are persisted

#### Scenario: Load fails or expires

- GIVEN loading aborts, fails, returns 404/410, or finds no appointment
- WHEN the corresponding branch resolves
- THEN existing messages and retry availability use `LoadingState`, `Alert`, or `EmptyState`
- AND only 404/410 removes the saved token and the timeout is cleared

### Requirement: Cancellation and Status Preservation

The client MUST preserve `confirmed`, `request`, `cancelled`, and `rejected` status, disabled-control, success/error, and native `window.confirm` branches.

#### Scenario: Cancellation is declined

- GIVEN cancellation is available
- WHEN the user rejects the existing `window.confirm`
- THEN no request, state mutation, or success message occurs

#### Scenario: Cancellation resolves

- GIVEN confirmation is accepted
- WHEN `PATCH /api/client/appointments/:token` sends `{ "action": "cancel" }`
- THEN success sets status to cancelled and preserves its message
- AND HTTP and exception failures preserve their distinct existing messages

### Requirement: Availability and Reschedule Preservation

The client MUST preserve date resets, all availability branches, slot selection, saving, and reschedule navigation.

#### Scenario: Availability is requested

- GIVEN business and service data exist
- WHEN availability is loaded
- THEN `GET /api/public/:slug/availability?date=:date&serviceId=:id` is unchanged
- AND loading, error, empty, results, selection, and disabled branches retain copy and transitions

#### Scenario: Reschedule resolves

- GIVEN a slot is selected
- WHEN `PATCH /api/client/appointments/:token` sends `{ "action": "reschedule", "newDate": date, "newStartTime": startTime }`
- THEN failures preserve their messages
- AND success redirects to `/:slug/turno-actualizado` with available `oldDate`, `oldTime`, `newDate`, `newTime`, and `service`, or preserves the no-slug success branch

### Requirement: Updated-Turn Result Preservation

The result page MUST preserve loading, `notFound`, canonical redirect, all five query parameters, tenant identity/accents, optional summaries, copy, and `/:slug` return link while using semantic success feedback.

#### Scenario: Canonical result renders

- GIVEN a business and any supported query parameters
- WHEN the result page renders
- THEN only supplied service, previous-time, and new-time summaries appear
- AND text, values, identity, accents, and return destination remain unchanged

#### Scenario: Tenant lookup redirects or fails

- GIVEN the lookup is missing or resolves to a different canonical slug
- WHEN the page loads
- THEN missing data invokes `notFound`
- AND canonical redirect forwards every supplied supported query parameter unchanged

### Requirement: Verification and Evidence Boundary

Implementation MUST use strict RED-GREEN-REFACTOR, pass `npm test`, and keep authored additions plus deletions below 400 lines per chained slice.

#### Scenario: Verification is reported honestly

- GIVEN source review and `npm test` pass
- WHEN verification is documented
- THEN source/test evidence is separate from browser evidence
- AND focus, responsive, contrast, visual, localStorage, navigation, and real interaction guarantees remain explicitly unproven without reproducible browser evidence
