# Frontend Design Primitives Specification

## Purpose

Define the bounded first implementation slice for product semantic tokens and accessible, presentational feedback contracts without migrating consumers.

## Requirements

### Requirement: Product Semantic Token Ownership

`app/globals.css` MUST define product-owned semantic variables for canvas, surface, muted surface, content, muted content, border, action, focus, and info/success/warning/danger foreground, background, and border states. Tenant inputs MUST NOT define product status meaning, and final visual values MAY remain provisional.

#### Scenario: Product tokens are available

- GIVEN the product stylesheet
- WHEN its semantic variables are inspected
- THEN every required product and state category has a named variable
- AND status variables are not derived from tenant colors

#### Scenario: Marketing remains isolated

- GIVEN existing `.landing-page` marketing variables and selectors
- WHEN product tokens are added
- THEN marketing semantics MUST remain scoped and unchanged
- AND they MUST NOT become implicit product-token authority

### Requirement: Alert Contract

`Alert` MUST preserve caller-provided content and tone, expose an appropriate `alert` or explicitly non-interruptive `status` role, and MAY render caller-provided action or retry content without owning retry behavior.

#### Scenario: Alert communicates semantically

- GIVEN caller-provided alert content and an announcement mode
- WHEN `Alert` is server-rendered
- THEN the requested semantic role and content are present
- AND meaning is not conveyed by color alone

#### Scenario: Optional retry is preserved

- GIVEN caller-provided retry or action content
- WHEN `Alert` is rendered
- THEN that content is present unchanged
- AND no action is invented when none is provided

### Requirement: Visible Status Contract

`Status` MUST render a visible caller-provided label independent of tone color and MAY render a caller-provided description.

#### Scenario: Status remains understandable without color

- GIVEN a tone, label, and optional description
- WHEN `Status` is server-rendered
- THEN the label is visible text
- AND the description is present only when supplied

### Requirement: Loading and Empty Contracts

`LoadingState` MUST expose `role="status"`, a required accessible label, and polite announcement semantics. `EmptyState` MUST expose a required visible title and MAY render a description and caller-provided action. Neither component SHALL own API, data, or state transitions.

#### Scenario: Loading is announced

- GIVEN a loading label
- WHEN `LoadingState` is server-rendered
- THEN it has status and polite-live semantics
- AND the accessible label is present

#### Scenario: Empty state supports recovery action

- GIVEN a title with optional description and action
- WHEN `EmptyState` is server-rendered
- THEN supplied text and action are present
- AND omitted optional content produces no substitute behavior

### Requirement: Controlled Dialog Contract

`Dialog` MUST be controlled by caller-provided open state, title, optional description, `onClose`, body, and explicit cancel/confirm slots. When open it MUST expose `role="dialog"`, `aria-modal="true"`, title labeling, and description association when supplied; when closed it MUST NOT render dialog content.

#### Scenario: Open dialog is labeled

- GIVEN an open dialog with title and description
- WHEN it is server-rendered
- THEN modal dialog attributes reference the rendered title
- AND the description is associated with the dialog

#### Scenario: Dialog remains caller-controlled

- GIVEN a closed dialog or omitted action slots
- WHEN it is server-rendered
- THEN closed dialog content is absent
- AND no cancel or confirm behavior is invented

### Requirement: Browser Guarantees Are Deferred

This slice MUST NOT claim guarantees for focus entry, focus restoration, keyboard interaction, Escape handling, responsive appearance, contrast, or visual behavior; those require later browser verification before consumer migration.

#### Scenario: SSR evidence stays bounded

- GIVEN the focused server-rendered contract suite
- WHEN verification evidence is reported
- THEN only markup contracts are claimed
- AND browser focus and keyboard guarantees remain explicitly deferred

### Requirement: Strict TDD and Change Boundary

Implementation MUST use RED-GREEN-REFACTOR with `npm test`, modify only `app/globals.css`, `app/components/ui/feedback.tsx`, and `tests/frontend-design-primitives.test.ts`, and remain under 400 authored changed lines. It MUST NOT migrate consumers or change existing behavior, APIs, copy, routes, validation, or state transitions.

#### Scenario: Authorized slice passes review gates

- GIVEN the completed implementation diff
- WHEN tests and scope are checked
- THEN `npm test` passes and only the three authorized files changed
- AND authored additions plus deletions are fewer than 400 lines

#### Scenario: Existing consumers remain untouched

- GIVEN current product and tenant routes
- WHEN this slice is completed
- THEN no consumer imports or rendered copy change
- AND existing API and state behavior remains unchanged
