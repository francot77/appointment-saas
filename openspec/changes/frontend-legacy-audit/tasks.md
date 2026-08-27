# Tasks: Frontend Legacy Audit

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 220–320 OpenSpec lines; 0 production |
| 400-line budget risk | Low; future migration slices stay below 400 |
| Chained PRs recommended | Yes (force-chained slices) |
| Suggested split | PR1 audit inventory → PR2 findings/design map → PR3 backlog/guardrails |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal / boundary | Verification | Rollback |
|---|---|---|---|
| PR1 | Create audit evidence schema and route × viewport × state inventory; base=feature/tracker | Markdown/schema check; no runtime harness (read-only) | Revert audit inventory files |
| PR2 | Add design-system, component, hardcoded-style, UX, and dead/duplicate findings; base=PR1 | Evidence-label and locator review | Revert findings section |
| PR3 | Add P0–P3 backlog, migration chain, guardrails, and final report assembly; base=PR2 | Requirement checklist; `git diff --name-only` | Revert report artifact |

## Phase 1: Audit Artifact Foundation

- [x] **1.1 [P0, S]** Define `audit.md` titled `Frontend Legacy Audit`, with schema and evidence legend; problem: findings mix inference with proof; result: each record has label, confidence, locator, uncertainty, and no invented percentages; deps: none; evidence: design contract; verify: schema review; rollback: delete `audit.md`.
- [x] **1.2 [P0, M]** Inventory 15 UI routes and `route × viewport × state` cells (390/768/1024/wide × default/loading/empty/error/success/disabled/dialog/recovery); problem: coverage is unprovable; result: each cell is OBSERVED, N/A, or UNRESOLVED with reason and responsive/focus/semantics/touch/overflow/tenant-contrast fields; deps: 1.1; evidence: exploration/spec; verify: matrix check; rollback: revert matrix.

## Phase 2: Evidence-Based Audit Sections

- [x] **2.1 [P1, M]** Record `Current Design System`, `Route Audit`, `Component Audit`, and `Grouped Hardcoded-Style Findings` for `app/**`; problem: authority, ownership, and duplication are fragmented; result: provisional authority and semantic token/primitive mapping with SOURCE-CONFIRMED versus unresolved claims; deps: 1.2; evidence: source/CodeGraph/history; verify: locator review; rollback: revert sections.
- [x] **2.2 [P0, M]** Record `UX Inconsistencies` across recovery, activation, dialogs, language, responsive, focus, announcements, touch, overflow, and tenant contrast; result: prioritized findings preserve behavior/API/state and identify runtime gaps; deps: 1.2; evidence: source/browser/screenshots; verify: state matrix; rollback: revert section.
- [x] **2.3 [P3, S]** Record `Dead/Duplicate UI` candidates (`HeroPreviews`, `HeroDemoCarousel`, `InstallPwaButton`) with reference/build/history/visual confidence; result: candidates are not deletion authorization; deps: 2.1; verify: repository-reference and build evidence; rollback: revert candidate records.

## Phase 3: Plan, Guardrails, and Compliance

- [x] **3.1 [P0–P3, M]** Add `Phased Migration Plan` and actionable backlog with IDs, files/components, problem, result, dependencies, S/M/L, evidence, verification matrix, and rollback; result: authority/tokens → primitives → recovery → Services → Settings → operations → responsive/accessibility → cleanup, each slice <400 lines and separately authorized; deps: 2.1–2.3; verify: schema checklist; rollback: revert backlog.
- [x] **3.2 [P0, S]** Add `Frontend Design Guardrails`, unresolved decisions, and `Executive Summary`; result: product-versus-tenant ownership, accessibility/evidence gates, behavior preservation, and audit-only boundary are explicit; deps: 3.1; verify: proposal/spec and `git diff --name-only`; rollback: revert report artifact.

No task authorizes production changes, deletion, refactor, or fixes. Future slices use PR1→PR2→PR3 and require separate authorization.
