# Settings Tab Messaging Presentation Specification

## Purpose

Define the final `SettingsTab` presentation slice: semantic main-save feedback with messaging isolation and no behavioral change.

## Requirements

### Requirement: Semantic sticky save presentation

The main settings sticky bar MUST use existing light product semantic tokens and the shared `Status` primitive. It MUST preserve the four `saveState` conditions, exact visible copy, `aria-live="polite"`, and non-color status labels.

#### Scenario: Present each main-save state

- GIVEN main settings are unsaved, saving, saved, or failed
- WHEN the sticky bar renders
- THEN it MUST show the existing matching Spanish label through `Status`
- AND it MUST retain a polite live region without legacy-dark product classes

#### Scenario: Preserve sticky and submit behavior

- GIVEN the main settings form is rendered
- WHEN its sticky action area is inspected or submitted
- THEN `sticky bottom-3`, `z-10`, and the responsive flex layout MUST remain
- AND the button MUST remain `type="submit"`, disabled only by `saving`, with unchanged labels

### Requirement: Main settings state and API preservation

The migration MUST preserve `settings`, `update`, `handleSave`, `saving`, `saveState`, `error`, dirty-state transitions, and the complete settings request contract.

#### Scenario: Edit and save main settings

- GIVEN a main settings control changes
- WHEN `update` and `handleSave` execute
- THEN the state MUST become `unsaved`, then `saving`, and finally `saved` or `error`
- AND `PUT /api/admin/settings` MUST retain its headers and `JSON.stringify(settings)` body

### Requirement: Independent messaging composition

`MessagingSettingsCard` MUST remain a no-props, self-owned composition. Main settings state or submission MUST NOT control messaging state, and messaging edits or saves MUST NOT change main `saveState`.

#### Scenario: Render messaging without ownership changes

- GIVEN `SettingsTab` renders its messaging section
- WHEN `<MessagingSettingsCard />` is composed
- THEN no props, lifted state, callbacks, or alternate wrapper contract MUST be introduced
- AND the card's independent `saving`, `error`, loading, entitlement, and connection state MUST remain intact

#### Scenario: Preserve messaging fields and APIs

- GIVEN messaging settings load or save
- WHEN the read-only card contract is inspected
- THEN connection and entitlement GETs plus messaging PUT MUST retain their endpoints and existing payload fields
- AND masked identifiers, enablement, lead time, templates, optional write-only token, disabled behavior, and existing English copy MUST remain unchanged

### Requirement: Scope and parent isolation

Production edits MUST be limited to the sticky bar in `app/dashboard/SettingsTab.tsx`. `DashboardClient` MUST continue rendering the no-props `<SettingsTab />`; all completed public and appearance slices MUST remain unchanged.

#### Scenario: Inspect implementation scope

- GIVEN the implementation diff is reviewed
- WHEN changed production and test files are listed
- THEN only `app/dashboard/SettingsTab.tsx` and `tests/settings-tab-messaging-presentation.test.ts` MAY belong to the implementation slice
- AND no API, primitive, card, parent, library, dependency, copy, or configuration file MAY change

### Requirement: Bounded strict-TDD evidence

The slice MUST follow RED-GREEN-REFACTOR, remain below 400 authored changed lines, and use the focused source-contract test before production edits.

#### Scenario: Focused test leads implementation

- GIVEN the legacy-dark sticky bar still exists
- WHEN the focused test first runs
- THEN it MUST fail on the presentation contract and pass after the minimum migration
- AND the full `npm test` suite MUST pass before delivery

#### Scenario: Report evidence limitations

- GIVEN verification uses Node source inspection without a browser harness
- WHEN results are reported
- THEN static presentation and preservation contracts MAY be claimed
- AND runtime stickiness, responsiveness, focus rendering, contrast, announcements, and entitlement behavior MUST remain explicitly unverified
