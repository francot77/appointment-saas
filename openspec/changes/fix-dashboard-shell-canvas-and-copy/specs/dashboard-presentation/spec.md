# Dashboard Presentation Specification

## Purpose

Define an appointment-first dashboard hierarchy without changing core behavior.

## Requirements

### Requirement: Appointments lead daily work

The dashboard MUST present Turnos as the primary first-viewport work surface, including the existing today/tomorrow summary, pending requests, and agenda. Supporting setup and utility content MUST follow the primary work surface.

#### Scenario: Owner opens the dashboard
- GIVEN dashboard data is available at a supported viewport
- WHEN the dashboard renders
- THEN Turnos MUST be the first meaningful work surface in the viewport
- AND its summary, pending requests, and agenda MUST remain available.

### Requirement: Activation is contextual to the mounted visit

Incomplete activation MUST remain visible below Turnos. Reaching 100% MUST keep completion acknowledgement visible only for the current mounted dashboard visit; after acknowledgement it MUST be suppressed, and a later remount MUST start with completed activation suppressed.

#### Scenario: Activation remains incomplete
- GIVEN activation is below 100%
- WHEN the dashboard renders
- THEN activation guidance MUST appear after Turnos.

#### Scenario: Activation completes during the visit
- GIVEN activation reaches 100% during the current mounted visit
- WHEN completion is acknowledged
- THEN the completion state MUST be available during that visit
- AND activation MUST be suppressed after acknowledgement and on a later remount.

### Requirement: Public sharing remains independent

Public booking open, copy, and share actions MUST remain available as a secondary utility whenever a valid public link exists. Their visibility MUST NOT depend on activation visibility, completion, or acknowledgement.

#### Scenario: Completed activation is hidden
- GIVEN activation is suppressed and a valid public link exists
- WHEN the owner views dashboard utilities
- THEN open, copy, and share actions MUST remain available.

### Requirement: Product-owned shell and bounded controls

The shell and canvas MUST use neutral product surfaces while tenant colors remain bounded to identity, active emphasis, and actions. Agenda date, view, and status controls MUST remain contained, operable, and free of page-level horizontal scrolling at 390, 768, 1024, and 1440 pixels.

#### Scenario: Tenant styling renders at target widths
- GIVEN a vivid tenant background and each target viewport
- WHEN the dashboard and appointment controls render
- THEN product surfaces MUST remain neutral and tenant accents MUST remain recognizable
- AND controls MUST wrap or stack without clipping, overlap, or horizontal page scrolling.

### Requirement: Copy is owner-facing and behavior is preserved

Affected copy MUST use clear Spanish, established voseo, and appointment terminology without technical or diagnostic language. The change MUST preserve existing APIs, payloads, queries, filters, mutations, loading behavior, navigation, public-link handlers, tab behavior, manual WhatsApp actions, and Premium or Enterprise automatic-messaging presentation. It MUST NOT change persistence, core entitlements, public pages, billing UI, or global primitives.

#### Scenario: Owner uses an affected action
- GIVEN an existing appointment, navigation, sharing, activation, or manual WhatsApp action is available
- WHEN the owner invokes it
- THEN its request, state transition, destination, and feedback semantics MUST match prior behavior
- AND visible affected copy MUST describe the task or outcome without diagnostics.

### Requirement: Responsive and accessible acceptance

At each target viewport and at 200% browser zoom, primary work and utilities MUST remain perceivable and operable. Existing accessible names, semantic roles, keyboard operation, visible focus, logical focus order, and status announcements MUST be preserved.

#### Scenario: Keyboard and zoom acceptance
- GIVEN the dashboard is shown at each target viewport and at 200% zoom
- WHEN a keyboard user traverses appointments, activation when present, and sharing when available
- THEN no required content or action MUST be clipped, overlapped, or unreachable
- AND focus order MUST follow visual hierarchy with visible focus and unchanged accessible names.

### Requirement: Verification remains bounded

Verification MUST combine focused contract tests with browser evidence at every target viewport. Authored changes MUST remain one force-chained feature-branch-chain slice below 400 changed lines and MUST exclude named out-of-scope files.

#### Scenario: Acceptance evidence is recorded
- GIVEN focused tests and representative tenant data
- WHEN verification runs
- THEN hierarchy, state independence, entitlement visibility, copy, behavior, overflow, keyboard, focus, and zoom criteria MUST be checked
- AND unverified visual claims MUST remain explicitly unclaimed.
