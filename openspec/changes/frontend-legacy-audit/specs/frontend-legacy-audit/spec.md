# Frontend Legacy Audit Specification

## Purpose

Define a complete, evidence-based audit and migration backlog without changing production code or behavior.

## Requirements

### Requirement: Deliverable Structure and Evidence

The audit MUST contain: Executive Summary; Current Design System (canonical tokens, primitives, patterns); Route Audit; Component Audit; Grouped Hardcoded-Style Findings; UX Inconsistencies; Dead/Duplicate UI; Phased Migration Plan; Actionable Tasks; and Frontend Design Guardrails. Every finding MUST use `SOURCE-CONFIRMED`, `RUNTIME-CONFIRMED`, `CANDIDATE`, or `UNRESOLVED`, cite evidence, state confidence and uncertainty, and MUST NOT invent percentages.

#### Scenario: Reviewer traces a finding
- GIVEN any audit finding
- WHEN a reviewer inspects its evidence
- THEN its label, source location, confidence, and uncertainty are explicit
- AND inference is not presented as confirmation.

#### Scenario: Visual evidence is available
- GIVEN screenshots or browser observations exist
- WHEN the audit records the affected surface
- THEN it MUST confirm and reference that visual evidence; otherwise it MUST mark runtime appearance unresolved.

### Requirement: Exhaustive Route Coverage

The audit MUST inventory and classify every discovered UI route as `CURRENT`, `MOSTLY CURRENT`, `MIXED`, `MOSTLY LEGACY`, or `LEGACY`: `/`, `/demo`, `/login`, `/register`, `/dashboard`, `/dashboard/appointments/:id`, `/billing`, `/:slug`, `/:slug/turnos`, `/:slug/turno-recibido`, `/:slug/turno-actualizado`, `/r/:token`, `/turnos`, `/terms`, and `/privacy`. API routes MAY appear only as behavior evidence.

#### Scenario: Route matrix is complete
- GIVEN the discovered route inventory
- WHEN the audit is reviewed
- THEN every route has implementation files, classification, rationale, evidence, and uncertainty
- AND each route is assessed at 390, 768, 1024, and wide viewports.

#### Scenario: Route states are assessed
- GIVEN a route supports interactive states
- WHEN its audit row is completed
- THEN loading, empty, error, success, disabled, dialog, and recovery states are recorded as observed, not applicable, or unresolved.

### Requirement: Complete UI and UX Audit

The audit MUST cover every discovered shared, feature, and UI component with file ownership, usage evidence, canonical/duplicate/legacy status, responsive behavior, keyboard/focus, semantics, announcements, touch/overflow risk, and tenant contrast. Hardcoded styles MUST be grouped by semantic concern rather than reported as an unstructured literal list.

#### Scenario: Component coverage is reproducible
- GIVEN the exploration component inventory
- WHEN a migration agent follows the audit
- THEN dashboard, owner, public/customer, acquisition, state, dialog, and suspected dead UI components are traceable to files and routes
- AND missing runtime evidence is explicit.

#### Scenario: Dead or duplicate UI is reported
- GIVEN an apparently unused or duplicated component
- WHEN it is documented
- THEN reference, build/runtime, history, and visual evidence confidence are separated
- AND deletion is not authorized.

### Requirement: Migration Plan and Actionable Backlog

The audit MUST define phased migration by authority/tokens, primitives, customer recovery, owner activation, operational consolidation, responsive/accessibility validation, and evidence-gated cleanup. Each P0–P3 task MUST include ID, priority, files, problem, expected result, dependencies, and `S`, `M`, or `L` scope, and MUST fit an independently reviewable chained slice below 400 changed lines or be split.

#### Scenario: Later agent can begin without rediscovery
- GIVEN the completed audit and backlog
- WHEN a later migration agent selects a task
- THEN affected files, evidence, dependencies, expected result, guardrails, and verification matrix are sufficient to scope the slice without repeating inventory discovery.

### Requirement: Frontend Design Guardrails and Audit-Only Boundary

Guardrails MUST define product-versus-tenant token ownership, canonical primitives and state conventions, accessibility baselines, responsive evidence, behavior/API/state preservation, and evidence gates for migration or deletion. This change MUST NOT modify, delete, refactor, or fix production code, styles, components, routes, assets, dependencies, configuration, or tests.

#### Scenario: Audit recommends a future change
- GIVEN a migration or cleanup recommendation
- WHEN the artifact is accepted
- THEN it remains planning-only, preserves known behavior, names unresolved product decisions, and requires later implementation and verification authorization.

#### Scenario: Scope is verified
- GIVEN the change diff
- WHEN compliance is checked
- THEN only OpenSpec artifacts under `openspec/changes/frontend-legacy-audit/**` are changed.
