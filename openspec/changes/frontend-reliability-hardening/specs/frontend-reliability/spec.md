# Frontend Reliability Specification

## Purpose

Define bounded reliability corrections for migrated frontend surfaces while preserving established contracts.

## Requirements

### Requirement: Instance-safe empty-state labeling

Every rendered `EmptyState` MUST associate its section with an instance-unique title identifier while preserving its public props and optional content structure.

#### Scenario: Multiple empty states render
- GIVEN two `EmptyState` instances render together
- WHEN their markup is inspected
- THEN each `aria-labelledby` MUST reference its own distinct title ID
- AND both titles, descriptions, and actions MUST retain existing structure

### Requirement: Canonical slug lifecycle

`SettingsTab` MUST use the server-compatible canonical slug representation for ownership, availability, save gating, status display, and PATCH submission. Every effect path MUST settle `slugChecking`; the 450 ms debounce and cancellation contract MUST remain.

#### Scenario: Input canonicalizes to the owned slug
- GIVEN casing, whitespace, accents, spaces, or repeated hyphens normalize to `persistedSlug`
- WHEN the slug effect evaluates the input
- THEN it MUST report `OWN` without an availability request
- AND checking MUST be false and saving MUST remain disabled

#### Scenario: A distinct slug is checked and saved
- GIVEN a non-empty canonical candidate differs from the owned slug
- WHEN availability succeeds and the user saves
- THEN GET/PATCH endpoints, messages, and response handling MUST remain unchanged
- AND the PATCH body MUST carry the canonical candidate

#### Scenario: Slug checking exits early or is superseded
- GIVEN the candidate is empty, owned, or replaced before debounce completion
- WHEN the effect exits or cleans up
- THEN stale work MUST NOT leave `slugChecking` true or publish stale availability

### Requirement: Resilient service mutations

Service mutations MUST preserve existing URLs, methods, bodies, copy, form semantics, and delete focus. A service visibility mutation MUST NOT overlap for the same service, successful empty bodies MUST be accepted, and post-mutation state MUST come from an authoritative refresh.

#### Scenario: Visibility toggle repeats while pending
- GIVEN a service visibility PATCH is in flight
- WHEN the same toggle is activated again
- THEN no second PATCH MUST start for that service
- AND unrelated services MUST remain independently actionable

#### Scenario: Mutation succeeds without JSON
- GIVEN create, edit, toggle, or delete returns a successful empty response
- WHEN the response is handled
- THEN the mutation MUST continue as successful
- AND an authoritative service refresh MUST follow

#### Scenario: Post-mutation refresh fails
- GIVEN existing services or an editing form are visible
- WHEN a successful mutation is followed by a failed refresh
- THEN existing list and relevant form/edit context MUST remain
- AND the existing Spanish load error MUST be exposed

### Requirement: Token-scoped appointment loading

Only the current `MagicLinkClient` appointment request MAY update appointment, date, errors, slots, selection, saved-entry storage, expiry cleanup, or loading state. Superseded requests MUST be aborted and invalidated while preserving timeout, retry, copy, and downstream APIs.

#### Scenario: Token changes during a load
- GIVEN token A is loading
- WHEN token B starts before A settles
- THEN A MUST be aborted or invalidated
- AND only B MAY update state, storage, expiry cleanup, or loading

#### Scenario: Retry overlaps an earlier load
- GIVEN a load remains pending
- WHEN retry starts and either request settles first
- THEN only the newest request MAY publish success, failure, or final loading state

#### Scenario: Current request times out
- GIVEN the active request exceeds ten seconds
- WHEN its controller aborts
- THEN the existing timeout message MUST appear
- AND retry and all appointment-management contracts MUST remain available

### Requirement: Spanish semantic messaging presentation

`MessagingSettingsCard` MUST use Spanish product-owned copy and existing product semantic tokens. It MUST preserve its props, independent state, normalized view, entitlement semantics, event order, fields, disabled predicates, endpoints, and PUT body including the optional write-only token.

#### Scenario: Messaging card renders
- GIVEN connection and entitlement data are available
- WHEN the card renders its states and controls
- THEN owner-facing labels, actions, fallbacks, and template labels MUST be Spanish
- AND product surfaces/statuses MUST contain no literal slate, red, emerald, or indigo utilities

#### Scenario: Messaging settings save
- GIVEN the user edits messaging controls
- WHEN save succeeds or fails
- THEN the existing connection PUT fields and state transitions MUST remain unchanged
- AND server-provided error text MUST pass through unchanged

### Requirement: Bounded verification

Each slice MUST use strict TDD, pass its focused Vitest file and `npm test`, and remain below 400 authored changed lines.

#### Scenario: Evidence is reported
- GIVEN source/SSR tests pass without a browser harness
- WHEN verification is recorded
- THEN contract preservation MAY be claimed
- AND runtime race timing, visuals, focus execution, and responsive behavior MUST remain unclaimed
