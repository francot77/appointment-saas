# Design: Migrate Settings Tab — Public Settings and Slug

## Technical Approach

Apply a section-bounded presentation migration inside `SettingsTab`: change only the shared-feedback import, initial load/unavailable branches, header/preview, public-page fields, about/contact fields, and slug-sharing card. Keep the component, state ownership, effects, handlers, API contracts, labels, Spanish copy, and form submission structure intact. Use the existing product variables through Tailwind arbitrary-value classes; do not add tokens or alter shared primitives.

## Architecture Decisions

| Decision | Choice and rationale | Rejected tradeoff |
|---|---|---|
| Slice boundary | Keep one no-props `SettingsTab` and edit presentation in place. This avoids changing ownership in a stateful 344-line component. | Extraction or a whole-file rewrite would mix presentation work with state/prop changes and exceed the review boundary. |
| Feedback mapping | Import `Alert`, `EmptyState`, `LoadingState`, and `Status`. Initial loading uses `LoadingState`; load failure uses danger `Alert`; unavailable settings without an error uses `EmptyState`; setup, refresh, slug checking/availability/error/success use `Status` or `Alert` under the existing live-region conditions. Preserve every current label and announcement wrapper. | Hand-built colored text retains legacy semantics; changing conditions or copy changes behavior. |
| Light styling | Use `--color-canvas`, `--color-surface`, `--color-surface-muted`, `--color-content`, `--color-content-muted`, `--color-border`, `--color-action`, and `--color-focus` in migrated surfaces and `fieldClass`. Product status remains owned by primitive classes. | Slate/red/emerald literals retain the dark system; tenant colors must not represent product status. |
| Preservation evidence | Add a Node/Vitest `readFileSync` source-contract test, following `services-tab-presentation.test.ts`, with section extraction by stable headings/ARIA IDs. Assert both migrated contracts and untouched boundary markers. | Component/browser tests would require a new harness and imply runtime guarantees unavailable in this slice. |

## Data Flow

    existing state/effects/handlers ──unchanged──> conditional JSX
           │                                      │
    settings GET/PUT + slug GET/PATCH      shared feedback + light tokens
           │                                      │
           └──────── existing copy/live regions ──┘

The settings body remains `JSON.stringify(settings)`. Slug checks retain trimming, persisted `OWN` handling, encoding, 450 ms debounce, cancellation, mappings, PATCH body, disabled predicates, and clipboard URL construction.

## File Changes

| File | Action | Description |
|---|---|---|
| `app/dashboard/SettingsTab.tsx` | Modify | Presentation/import changes only within Slice 1. |
| `tests/settings-tab-presentation.test.ts` | Create | Focused source contract for feedback, tokens, behavior, and isolation. |

No other production, test, dependency, configuration, or API file may change for this slice.

## Interfaces / Contracts

No new interface is introduced. `export default function SettingsTab()` remains no-props. Field IDs, controlled state keys, event handlers, request paths/methods/headers/bodies, response assignments, save transitions, slug messages, and user-facing copy are preservation contracts.

The test MUST assert: all four feedback imports and applicable branch usage; required light variables and no legacy-dark classes within each migrated section; settings GET/PUT markers and full body; slug GET/query/PATCH, `encodeURIComponent`, `450`, cancellation, `OWN`, mappings, disabled expression, clipboard URL, and persisted-slug use; all public/business IDs and `aboutEnabled` branch; and unchanged `MessagingSettingsCard`, appearance/theme raw inputs/presets/conditions, and sticky save-state markers.

## Testing Strategy

Strict TDD sequence:

1. **RED** — create only the focused test; run `npx vitest run tests/settings-tab-presentation.test.ts` and retain the expected presentation-contract failure.
2. **GREEN** — make the minimum `SettingsTab.tsx` presentation edits; rerun the focused command.
3. **REFACTOR** — simplify classes/assertions without broadening scope; run `npm test`, `npx tsc --noEmit`, `npm run lint`, and `git diff --check`.

Before delivery, `git diff --name-only <slice-base>...HEAD` MUST list exactly the two files above. Sum additions plus deletions from `git diff --numstat <slice-base>...HEAD -- app/dashboard/SettingsTab.tsx tests/settings-tab-presentation.test.ts`; fail the gate at **400 or more** authored changed lines. If either gate fails, split or reduce the slice before apply/review.

Node source inspection proves static contracts only. Runtime appearance, responsive layout, focus behavior, accessibility interaction, sticky positioning, and tenant contrast remain unverified until browser evidence is authorized.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary changes.

## Migration / Rollout and Rollback

No data migration or feature flag is required. Deliver as one Feature Branch Chain slice. Roll back by reverting the two-file slice; no API, data, configuration, primitive, parent, or tenant-readability rollback is needed.

Explicitly deferred: appearance/theme and raw tenant controls, `MessagingSettingsCard`, sticky save/status presentation, tenant readability helpers and public consumers, copy changes, extraction, shared primitive/token changes, APIs, and every other file.

## Open Questions

None blocking.
