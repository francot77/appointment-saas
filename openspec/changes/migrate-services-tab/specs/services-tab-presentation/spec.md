# Services Tab Presentation Specification

## Purpose

Define the presentation-only Editorial-light migration of service management without behavioral change.

## Requirements

### Requirement: Editorial-light feedback presentation

`ServicesTab` MUST use existing Editorial-light semantic tokens and shared `Alert`, `Status`, `LoadingState`, and `EmptyState`. Migrated surfaces MUST NOT retain legacy-dark classes. Tenant colors MUST remain limited to existing action and decorative roles.

#### Scenario: Loading and empty branches

- GIVEN services are loading or a successful load returns no services
- WHEN `ServicesTab` renders the applicable branch
- THEN it MUST use `LoadingState` or `EmptyState` respectively
- AND existing conditions, announcement semantics, and Spanish copy MUST remain unchanged

#### Scenario: Error branch

- GIVEN a load, save, update, or delete failure occurs
- WHEN the error branch renders
- THEN it MUST use `Alert`
- AND that failure's message, clearing behavior, and transition MUST remain unchanged

#### Scenario: Loaded service branch

- GIVEN a successful load returns services
- WHEN each service is rendered
- THEN active or hidden state MUST use `Status` without tenant color
- AND existing service details and action labels MUST remain unchanged

### Requirement: Service API and state preservation

The migration MUST preserve CRUD endpoints, methods, normalized bodies, response mapping, local state, and transitions.

#### Scenario: Fetch services

- GIVEN `ServicesTab` mounts or reloads after a successful mutation
- WHEN services are fetched
- THEN `GET /api/admin/services` and response mapping MUST remain unchanged
- AND failure MUST clear the list and expose the existing load error

#### Scenario: Create or edit service

- GIVEN the valid form is submitted in create or edit mode
- WHEN the request is sent
- THEN it MUST remain `POST /api/admin/services` or `PATCH /api/admin/services/:id` with the existing normalized body
- AND success MUST reload and reset while `saving` preserves disabled and label transitions

#### Scenario: Toggle service visibility

- GIVEN a loaded service is toggled
- WHEN its request is sent
- THEN `PATCH /api/admin/services/:id` with `{ active: !service.isActive }` MUST remain unchanged
- AND success MUST update only that local item while failure preserves its error

#### Scenario: Delete service

- GIVEN deletion is confirmed
- WHEN the request completes
- THEN `DELETE /api/admin/services/:id` and soft deactivation MUST remain unchanged
- AND success MUST reload services and reset editing only when the deleted service was being edited

### Requirement: Form and copy preservation

User-facing copy, validation, controlled values, and form modes MUST remain unchanged.

#### Scenario: Browser validation contract

- GIVEN a user enters service data
- WHEN the form is validated
- THEN required name, nonnegative price, duration minimum and step, optional color, and active state MUST match the current contract

#### Scenario: User-visible language

- GIVEN any loading, empty, error, form, toggle, success, or confirmation branch renders
- WHEN its text is inspected
- THEN existing Spanish copy MUST be preserved byte-for-byte

### Requirement: Native delete dialog and parent contract

The native delete `<dialog>`, refs, cancel/close behavior, and focus lifecycle MUST remain unchanged. `ServicesTab` MUST retain its `brand` input and self-contained behavior.

#### Scenario: Dialog focus lifecycle

- GIVEN deletion is opened from a service action
- WHEN the dialog opens and later closes or is cancelled
- THEN cancel MUST receive entry focus
- AND focus MUST return to the stored trigger without introducing the shared `Dialog`

#### Scenario: Parent integration

- GIVEN `DashboardClient` renders the Services tab
- WHEN the migration is applied
- THEN the existing `ServicesTab brand={theme}` contract and parent-owned tab behavior MUST remain unchanged

### Requirement: Bounded verification and isolation

Production changes MUST be limited to `app/dashboard/ServicesTab.tsx`; only the focused contract test MAY be added. The slice MUST remain under 400 authored changed lines and MUST NOT change `SettingsTab`, other routes, APIs, `lib`, dependencies, configuration, or shared primitives.

#### Scenario: Strict TDD verification

- GIVEN implementation has not begun
- WHEN the focused test is added
- THEN it MUST fail before production edits
- AND the focused test and `npm test` MUST pass after implementation

#### Scenario: Evidence claims

- GIVEN verification uses source-contract Vitest and `npm test`
- WHEN results are reported
- THEN source preservation MAY be claimed
- AND browser rendering, dialog interaction, focus, responsive layout, visual correctness, and contrast MUST remain explicitly unverified
