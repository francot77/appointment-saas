# Settings Tab Appearance Presentation Specification

## Purpose

Define a presentation-only migration preserving behavior and readability ownership.

## Requirements

### Requirement: Semantic presentation and tenant ownership

Appearance MUST use shared semantic product tokens for surfaces, borders, content, muted content, and focus. It MUST NOT retain legacy-dark presentation or assign status meaning to tenant values.

#### Scenario: Product-owned chrome uses semantic tokens

- GIVEN the appearance section renders
- WHEN its cards, fields, borders, and focus styles are inspected
- THEN they MUST use light semantic product tokens without tenant-owned status semantics

#### Scenario: Tenant values remain tenant-owned

- GIVEN preset or persisted theme values are displayed
- WHEN accent swatches, backgrounds, or the logo URL render
- THEN their values and inline swatch ownership MUST remain unchanged

### Requirement: Preset and custom color preservation

The editor MUST preserve `Clásico`, `Cálido`, and `Natural` preset values, selection, and updates. Custom colors MUST preserve raw tenant input without normalization or validation.

#### Scenario: Select a preset

- GIVEN a preset is not selected
- WHEN the user activates it
- THEN `primaryColor`, `secondaryColor`, and `textColor` MUST receive its values through the generic update helper
- AND `aria-pressed` MUST remain derived from all three values

#### Scenario: Edit a custom color

- GIVEN paired native and text color inputs are available
- WHEN either input changes
- THEN the matching field MUST update through the generic helper without validating or rewriting raw text

### Requirement: Conditional background controls

The editor MUST preserve `solid`, `gradient`, and `image` modes, field identifiers, and exclusive controls. `logoUrl` MUST remain available in every mode.

#### Scenario: Render the selected background mode

- GIVEN `backgroundType` is `solid`, `gradient`, or `image`
- WHEN the editor renders
- THEN it MUST respectively show only `backgroundColor`, `gradientFrom` plus `gradientTo`, or `backgroundImageUrl`
- AND `logoUrl` MUST render in every case

### Requirement: Update, submission, feedback, and copy preservation

The migration MUST preserve the generic update helper, complete payload, save/error behavior, labels, and copy.

#### Scenario: Update and submit appearance settings

- GIVEN an appearance control changes
- WHEN the form updates and submits
- THEN the field MUST use the generic helper
- AND `PUT /api/admin/settings` MUST retain its method, headers, and complete `JSON.stringify(settings)` body

#### Scenario: Save succeeds or fails

- GIVEN a save request succeeds or fails
- WHEN its result is handled
- THEN unsaved, saving, saved, and error transitions MUST remain unchanged
- AND labels, messages, and generic error copy MUST remain unchanged

### Requirement: Isolation and readability ownership

Production edits MUST be limited to the appearance section in `app/dashboard/SettingsTab.tsx`. Messaging, sticky save/status, APIs, models, shared primitives, parent contract, public consumers, and other files MUST remain unchanged.

#### Scenario: Deferred boundaries remain unchanged

- GIVEN the implementation diff is inspected
- WHEN production files and section boundaries are compared
- THEN only the appearance section presentation MAY differ
- AND messaging, sticky save/status, dependencies, configuration, and other files MUST NOT change

#### Scenario: Public consumers retain readability ownership

- GIVEN tenant colors may be invalid or low contrast
- WHEN the editor is migrated
- THEN it MUST NOT add, move, or duplicate hex validation, contrast thresholds, or readable-text selection
- AND public-consumer readability behavior MUST remain unchanged

### Requirement: Bounded strict-TDD evidence

The slice MUST follow strict RED-GREEN-REFACTOR, add only `tests/settings-tab-appearance-presentation.test.ts`, and remain under 400 authored changed lines.

#### Scenario: Focused test leads implementation

- GIVEN production edits have not begun
- WHEN the focused source-contract test and `npm test` run
- THEN the test MUST fail before implementation and pass afterward
- AND it MUST cover tokens, values, updates, branches, payload, feedback, and isolation

#### Scenario: Evidence limitations remain explicit

- GIVEN verification lacks a browser or screenshot harness
- WHEN results are reported
- THEN static source preservation MAY be claimed
- AND runtime appearance, responsiveness, focus, visual contrast, and public readability MUST remain unverified
