# Tasks: Fix Dashboard Shell Canvas and Copy

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 280–390 authored lines |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | One autonomous feature-branch-chain slice: PR #1 |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Dashboard hierarchy, visit state, sharing, entitlement visibility, and contracts | PR #1; base = feature/tracker branch | `npm test -- tests/dashboard-presentation.test.ts tests/settings-tab-messaging-presentation.test.ts` | `npm run dev`; authenticated dashboard at four widths and 200% zoom | Revert the two production files and two tests together |

Dependency: `feature/tracker` → 📍 PR #1 → main. Do not modify APIs, billing, public pages, persistence, or global primitives.

## Phase 1: Strict RED Contracts (before production edits)

- [x] 1.1 In `tests/dashboard-presentation.test.ts`, add failing source contracts proving `AppointmentsTab` precedes support content, activation is below it, and existing summary/pending/agenda markers remain.
- [x] 1.2 Add failing contracts for `unresolved → incomplete`, `unresolved → suppressed` when initially complete, `incomplete → completion`, acknowledgement → `suppressed`, refresh idempotence, and fresh-remount suppression.
- [x] 1.3 Add a failing independent-sharing contract: open/copy/share render only from `publicLinkAvailable`, including when activation is suppressed; preserve URL, clipboard/share fallback, feedback, navigation, filters, API requests, mutations, and activation cancellation.
- [x] 1.4 In `tests/settings-tab-messaging-presentation.test.ts`, add failing contracts for unresolved/loading/error and Basic returning no automatic-messaging UI, while Premium/Enterprise state presentation, entitlement reads, save payload, and manual WhatsApp remain.
- [x] 1.5 Run both focused tests and record RED failures before touching production files.

## Phase 2: GREEN Production Implementation

- [x] 2.1 Modify only `app/dashboard/DashboardClient.tsx`: reorder appointments first, implement mounted-visit activation transitions/acknowledgement, and extract sibling `PublicLinkUtility`; preserve existing handlers, requests, URLs, focus names, canvas, copy, and tab navigation.
- [x] 2.2 Modify only `app/dashboard/MessagingSettingsCard.tsx`: after hooks, fail closed for unresolved or `basic`; leave existing `premium`/`enterprise` rendering and manual messaging behavior unchanged.
- [x] 2.3 Run focused tests, then `npm test`, `npm run lint`, and `npm run build`; fix only slice-caused failures.

## Phase 3: Browser and Review Verification

- [ ] 3.1 At 390, 768, 1024, and 1440 CSS pixels, exercise incomplete, transition-complete, initially-complete/remounted, Basic, unresolved, Premium, and Enterprise states; verify hierarchy, independent sharing, neutral canvas, bounded controls, and `scrollWidth <= clientWidth`.
- [ ] 3.2 At every width and 200% zoom, keyboard-traverse appointments, activation, sharing, tabs, filters, and manual WhatsApp; verify logical order, visible focus, names, roles, status feedback, and no clipping.
- [x] 3.3 Review exact scope: only `app/dashboard/DashboardClient.tsx`, `app/dashboard/MessagingSettingsCard.tsx`, `tests/dashboard-presentation.test.ts`, and `tests/settings-tab-messaging-presentation.test.ts`; reject authored additions plus deletions at 400 or more and mark unverified claims.

## Reconciliation Notes

- 3.1 remains open: authenticated geometry was exercised at 390, 768, 1024, and 1440, but incomplete, activation-transition/session-suppression, and entitlement-variant browser states were unavailable because the supplied account starts at 100% completion.
- 3.2 remains open: keyboard traversal was exercised at 390px, but activation-state coverage, entitlement-state coverage, and actual 200% browser zoom remain unverified; CSS zoom approximation is not equivalent evidence.
- 3.3 is complete: the reconciled implementation delta is limited to `app/dashboard/DashboardClient.tsx`, `app/dashboard/MessagingSettingsCard.tsx`, `tests/dashboard-presentation.test.ts`, and `tests/settings-tab-messaging-presentation.test.ts`; unrelated worktree changes were not touched and the reconciled authored delta remains below 400 lines.
