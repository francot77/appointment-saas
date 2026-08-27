# Design: Frontend Legacy Audit

## Technical Approach

Produce one traceable, audit-only report from repository, history, and optional read-only runtime evidence. The report nominates Editorial-light product UI plus the light dashboard shell as the **provisional** FezTime-owned authority, keeps marketing CSS scoped, and treats tenant branding as an adapter. Authority remains `UNRESOLVED` until product approval. Findings are grouped by repeated semantic pattern, then converted into dependency-aware route-family slices; no recommendation authorizes production work.

## Architecture Decisions

| Option | Tradeoff | Decision |
|---|---|---|
| Route-by-route prose | Easy to write; duplicates patterns and hides systemic causes | Reject; use normalized inventories plus grouped findings. |
| Source-only evidence | Reproducible but cannot prove rendering | Use as baseline; runtime claims require browser evidence. |
| Screenshot-driven authority | Visually persuasive but may encode accidental UI | Reject as authority; combine product references, history, source, and approval. |
| One migration backlog | Simple but exceeds review and rollback boundaries | Use dependency-ordered, force-chained route-family slices below 400 changed lines. |

## Audit Data Flow

```text
routes/components + CodeGraph + product references + git history
                         │
                         v
inventory -> evidence records -> repeated-pattern findings -> P0-P3
                         ^                                  │
optional browser/screenshots/tests (read-only)              v
                 authority/token map -> bounded migration tasks
```

CodeGraph establishes symbols, references, and call paths; source locations prove current implementation; roadmap/history explains intent but not current approval. Browser observations, screenshots, existing tests, `npm test`, lint, and build MAY strengthen evidence without changing snapshots, tests, dependencies, configuration, or production files. Missing runtime proof stays unresolved.

## Document Structure

`audit.md` SHALL lead with an executive summary, then: evidence legend; authority decision; current token/primitive map; route matrix; component inventory; repeated-pattern findings; UX/accessibility inconsistencies; dead/duplicate candidates; P0-P3 backlog; phased migration plan; guardrails; unresolved decisions; evidence index.

The route matrix key is `route × viewport × state`: every inventoried route has rows for `390`, `768`, `1024`, and `wide`, crossed with applicable `default`, `loading`, `empty`, `error`, `success`, `disabled`, `dialog`, and `recovery` states. Each cell is `OBSERVED`, `N/A` with reason, or `UNRESOLVED`, and records responsive, focus/keyboard, semantic/announcement, touch-target, overflow, and tenant-contrast evidence.

## Interfaces / Contracts

Each finding uses:

```text
ID | label | confidence | pattern | affected routes/components
evidence[] {kind: source|codegraph|reference|history|browser|screenshot|test,
            locator, observation}
current mapping | canonical mapping | uncertainty | priority | rationale
```

Labels are `SOURCE-CONFIRMED`, `RUNTIME-CONFIRMED`, `CANDIDATE`, or `UNRESOLVED`. `RUNTIME-CONFIRMED` requires reproducible browser/test evidence; candidates never authorize deletion. Priorities mean: P0 trust/recovery or audit blocker; P1 material consistency/migration risk; P2 accessibility/responsive/system quality; P3 evidence-gated cleanup.

The canonical map separates product-owned `canvas/surface/border/content/muted/action/focus/success/warning/danger` tokens from tenant-owned accent, approved background, and logo inputs. Every literal or utility cluster maps to a semantic token or an explicitly scoped exception. Primitive candidates map current implementations to `PageFrame`, `Card`, `Button`, `Field`, `Badge`, `Alert`, `Dialog`, and loading/empty/state patterns without prescribing APIs.

Each backlog task contains `ID, priority, files, problem, expected result, dependencies, S/M/L, evidence, verification matrix, rollback boundary`, and must fit one sub-400-line review slice or be split.

## File Changes

| File | Action | Description |
|---|---|---|
| `openspec/changes/frontend-legacy-audit/design.md` | Create | Evidence and audit architecture. |
| `openspec/changes/frontend-legacy-audit/audit.md` | Future audit artifact | Populate the designed report; OpenSpec-only. |
| `app/**`, `lib/**`, assets/config/tests | Read-only | Evidence only; never modify in this change. |

## Testing Strategy

Review checks SHALL prove route/component completeness, schema-valid findings/tasks, evidence-label consistency, all matrix cells resolved to observed/N/A/unresolved, and no invented percentages. Diff verification MUST show only this change directory. Optional browser capture uses representative non-destructive data and records route, viewport, state, timestamp, and environment.

## Threat Matrix

N/A — the audit observes routes but changes no routing, shell, subprocess, VCS automation, executable classification, or process-integration boundary.

## Migration / Rollout

The planned strangler order is: authority/tokens; primitives; customer recovery; Services; Settings sections; owner operations; responsive/accessibility; evidence-gated cleanup. Each child slice depends on the prior contract, has route-specific verification, and rolls back independently. Audit artifact slices themselves are chained: inventory/evidence model, findings/token map, migration backlog/guardrails. No production rollout occurs here.

## Frontend Design Guardrails

New work must use approved semantic tokens/primitives, preserve APIs, state transitions, copy, focus, announcements, and tenant contrast, and include route-matrix evidence. No raw product color may masquerade as tenant input; no browser confirmation, dead-code removal, or shared extraction proceeds without a separately authorized task and evidence. Temporary legacy exceptions must name owner, scope, and removal dependency.

## Open Questions

- [ ] Product owner approval of the provisional Editorial-light authority.
- [ ] Representative tenant themes and safe runtime data for optional visual evidence.
