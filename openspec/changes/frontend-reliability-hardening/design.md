# Design: Frontend Reliability Hardening

## Technical Approach

Apply five local, test-led corrections over committed baseline `e8a589e`. Keep each component as its current state/API owner; add only instance IDs, canonical derived values, mutation/request guards, tolerant response handling, and semantic presentation changes. Each production file travels with its existing focused test in a sub-400-line chained slice.

## Architecture Decisions

| Decision | Choice | Alternatives / rationale |
|---|---|---|
| Empty-state IDs | Generate `empty-state-title-${useId()}` per instance. | A caller ID prop expands the API; a counter is SSR-unsafe. This follows `Dialog`. |
| Slug canonical form | Import read-only `normalizeSlugInput` from `lib/slug.ts`; derive one canonical candidate and use it for comparisons, statuses, gating, query, and PATCH body. | Duplicating normalization can diverge from server behavior. Raw display input remains controlled. |
| Slug effect settlement | Set checking false before empty/owned returns and invalidate cleanup before cancelling the timer. | Ad-hoc branch fixes miss superseded timers. Existing 450 ms debounce and messages stay fixed. |
| Service responses | Add a local optional-body parser that accepts empty success, parses non-empty JSON, and checks `ok` explicitly. | Unconditional `json()` rejects valid 204/empty success; broad API changes are unnecessary. |
| Service mutation policy | Track pending visibility IDs, reject only duplicate toggles, then call an authoritative `loadServices` that reports success and preserves current data on refresh failure. Reset create/edit/delete context only after refresh success. | Global locking blocks unrelated services; optimistic inversion can drift from server truth. |
| Appointment load ownership | Keep an active `{id, controller}` ref; abort the previous load and gate every state/storage/finally effect by current identity. Effect cleanup aborts only its active request. | Abort alone loses races when a promise settles concurrently. Global extraction would widen scope. |
| Messaging scope | Translate card-owned visible English copy and map product colors to existing `--color-*` tokens inside the card only. | Changing entitlement helpers affects Billing; changing shared tokens or card ownership violates scope. Server-returned errors remain untouched. |
| Evidence boundary | Extend existing source/SSR Vitest contracts; no browser harness. | Matches repository tests and explicit exclusion, but cannot prove real interaction timing or appearance. |

## Data Flow

```text
slug input -> normalizeSlugInput -> owned/empty early exit OR debounced GET -> status -> canonical PATCH

service action -> per-item guard -> mutation -> optional body -> GET services
                                               -> refresh success: authoritative state/reset
                                               -> refresh failure: retain list/context + error

token/effect/retry -> abort previous -> request identity -> fetch/timeout
                                               -> current only: state + storage + finally
```

## File Changes

| File | Action | Description |
|---|---|---|
| `app/components/ui/feedback.tsx` | Modify | Instance-safe `EmptyState` title ID. |
| `tests/frontend-design-primitives.test.ts` | Modify | Two-instance SSR uniqueness and structure contract. |
| `app/dashboard/SettingsTab.tsx` | Modify | Canonical slug lifecycle and terminal checking state. |
| `tests/settings-tab-public-presentation.test.ts` | Modify | Canonical ownership/query/PATCH and cleanup markers. |
| `app/dashboard/ServicesTab.tsx` | Modify | Per-service guard, optional responses, authoritative refresh preservation. |
| `tests/services-tab-presentation.test.ts` | Modify | Mutation, refresh, and empty-success contracts. |
| `app/r/[token]/MagicLinkClient.tsx` | Modify | Abort/identity ownership for appointment loads. |
| `tests/client-turn-recovery-presentation.test.ts` | Modify | Token/retry supersession and guarded effects. |
| `app/dashboard/MessagingSettingsCard.tsx` | Modify | Spanish copy and semantic-token classes only. |
| `tests/settings-tab-messaging-presentation.test.ts` | Modify | Copy/token assertions plus unchanged API/state contract. |

Read-only contracts: `lib/slug.ts`, `app/api/admin/slug/route.ts`, `DashboardClient.tsx`, and all service/messaging/appointment routes.

## Interfaces / Contracts

No public component, route, request, payload, storage, or navigation interface changes. `EmptyStateProps`, `SettingsTab()`, `ServicesTab({ brand? })`, `MagicLinkClient({ token })`, and `MessagingSettingsCard({ className? })` remain unchanged.

## Testing Strategy

| Layer | Evidence |
|---|---|
| SSR unit | Render two `EmptyState` instances and compare references. |
| Source contract | Assert lifecycle guards plus preserved endpoints, payloads, copy, ownership, and token classes in four existing tests. |
| Full regression | `npm test`; then `npx tsc --noEmit`, scoped lint, and `git diff --check`. |
| Browser/E2E | N/A — explicitly excluded; no runtime visual/race claim. |

For every slice: run focused test RED, make the minimum production change, run focused GREEN, refactor, then run `npm test`.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable classification, or process-integration boundary changes.

## Migration / Rollout and Rollback

No data migration or flag. Merge PR1→PR5 in order. Revert the production/test pair for the affected slice; reverse later dependent slices only if their base requires it. APIs and persisted data need no rollback.

## Open Questions

None.
