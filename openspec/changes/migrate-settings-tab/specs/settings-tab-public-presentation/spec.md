# Settings Tab Public Presentation Specification

## Purpose

Define the first presentation-only migration slice for public/business settings and slug validation without behavioral change.

## Requirements

### Requirement: Editorial-light presentation and shared feedback

The migrated header, preview, public-page fields, about/contact fields, sharing card, and global load/error branches MUST use light product semantic tokens. Applicable states MUST use the existing shared `Alert`, `Status`, `LoadingState`, and `EmptyState` contracts, and migrated surfaces MUST NOT retain legacy-dark presentation.

#### Scenario: Initial loading and unavailable settings

- GIVEN settings are initially loading or no settings are available
- WHEN `SettingsTab` renders the applicable branch
- THEN it MUST use `LoadingState`, `Alert`, or `EmptyState` according to the existing condition
- AND the existing announcement semantics and copy MUST remain unchanged

#### Scenario: Public setup and slug feedback

- GIVEN setup, copy, slug-check, slug-error, or slug-success feedback is available
- WHEN that feedback renders
- THEN applicable visible feedback MUST use `Status` or `Alert` without relying on color alone
- AND every condition, label, and message MUST remain unchanged

### Requirement: Settings form behavior preservation

The migration MUST preserve all settings state, effects, handlers, validation, controlled values, field identifiers, labels, save transitions, and user-facing copy.

#### Scenario: Load and save settings

- GIVEN `SettingsTab` loads or submits the public/business form
- WHEN the settings request is sent
- THEN `GET /api/admin/settings` and `PUT /api/admin/settings` MUST retain their paths, methods, headers, response mapping, and full existing settings body
- AND load, unsaved, saving, saved, and error transitions and copy MUST remain unchanged

#### Scenario: Edit public/business fields

- GIVEN loaded settings are edited
- WHEN any public name, hero, CTA, about, WhatsApp, Instagram, or address control changes
- THEN its existing state key, value, branch condition, identifier, label, and validation contract MUST remain unchanged

### Requirement: Slug validation and sharing preservation

Slug loading, availability validation, persistence, and sharing behavior MUST remain unchanged.

#### Scenario: Check slug availability

- GIVEN a slug is empty, persisted, changed, unavailable, invalid, or affected by a network failure
- WHEN availability is evaluated
- THEN the existing `GET /api/admin/slug` requests, 450 ms debounce, cancellation, encoding, `OWN` handling, and result mapping MUST remain unchanged
- AND conflict, validation, network, checking, error, and success copy MUST remain unchanged

#### Scenario: Save or share the slug

- GIVEN a slug is saved or the public URL is opened or copied
- WHEN the user performs that action
- THEN `PATCH /api/admin/slug` and its existing body, disabled states, transitions, and mappings MUST remain unchanged
- AND URL construction, clipboard behavior, links, announcements, and copy MUST remain unchanged

### Requirement: Isolation and parent contract

Production changes MUST be limited to Slice 1 presentation in `app/dashboard/SettingsTab.tsx`. The no-props `SettingsTab` parent contract MUST remain unchanged, and all raw tenant inputs MUST be preserved without introducing or moving readability calculations.

#### Scenario: Deferred boundaries remain intact

- GIVEN Slice 1 is implemented
- WHEN the production diff is inspected
- THEN appearance/theme, messaging, sticky save/status, tenant readability helpers, and every other file MUST remain unchanged
- AND shared primitives, APIs, parent behavior, dependencies, configuration, and copy MUST NOT be modified

### Requirement: Bounded strict-TDD evidence

The slice MUST add only `tests/settings-tab-presentation.test.ts`, remain under 400 authored changed lines, and follow strict RED-GREEN-REFACTOR.

#### Scenario: Source-contract verification

- GIVEN production edits have not begun
- WHEN the focused source-contract test is introduced
- THEN it MUST fail before implementation and pass afterward with `npm test`
- AND it MUST cover shared feedback, light tokens, preserved behavior markers, and deferred boundaries

#### Scenario: Evidence limitations

- GIVEN verification uses source inspection and non-browser tests
- WHEN results are reported
- THEN source-contract preservation MAY be claimed
- AND runtime appearance, responsive layout, focus, sticky behavior, accessibility interaction, and tenant contrast MUST remain explicitly unverified
