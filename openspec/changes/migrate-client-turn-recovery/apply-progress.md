# Apply Progress: Migrate Client Turn Recovery

## Status

- Change: `migrate-client-turn-recovery`
- Mode: Strict TDD
- Delivery strategy: force-chained / feature-branch-chain (cached preflight)
- Current work unit: PR2 — `turno-actualizado` result presentation and extended source contract
- Boundary: `app/[slug]/turno-actualizado/page.tsx` plus the PR2 extension to `tests/client-turn-recovery-presentation.test.ts`; PR1 remains complete
- Authored review budget: PR2 67 changed lines (18 additions/17 deletions in production, 32 test additions); below 400

## Completed Tasks

- [x] 1.1 RED — Added the focused Node/Vitest source-contract test and confirmed the expected failure before production edits.
- [x] 1.2 GREEN — Migrated `MagicLinkClient` loading, error, empty, status, and success presentation to shared primitives and Editorial-light tokens without changing behavior code.
- [x] 1.3 REFACTOR — Focused/full tests, TypeScript, scoped lint, full lint, word diff, numstat, and scope checks completed; unrelated lint findings remain outside PR1.
- [x] 2.1 RED — Extended the focused contract for `turno-actualizado`; the focused run failed 1/8 before production edits because the success Alert/light composition was absent.
- [x] 2.2 GREEN — Migrated the result page to Editorial-light classes and semantic success `Alert`; server loading, redirects, query forwarding, identity/accent, summaries, copy, and return href remain unchanged.
- [x] 2.3 REFACTOR — Focused/full tests, TypeScript, scoped lint, word diff, numstat, and authorized-scope checks completed; the PR2 slice remains below 400 authored changed lines.
- [ ] 3.1 Maintain the forced Feature Branch Chain.
- [ ] 3.2 Preserve the documented rollback order.

## TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.1 | `tests/client-turn-recovery-presentation.test.ts` | Node source contract | N/A (new test) | ✅ Focused run failed: 2/5 tests failed before production edits | ✅ 5/5 focused tests passed after implementation | ✅ Five cases cover primitive mapping, light tokens, loading/persistence, interaction contracts, and copy/scope | ✅ Regex compatibility fixed for the project TypeScript target; assertions remain source-contract based |
| 1.2 | `tests/client-turn-recovery-presentation.test.ts` | Node source contract | ✅ Existing suite: 116/116 | ✅ Test existed before production change | ✅ Focused 5/5 and full 121/121 passed | ✅ Alternate status tones, retry omission contract, empty branch, no-availability info tone, and no-slug behavior strings are covered | ✅ Presentation-only diff reviewed; handlers and behavior boundary were not edited |
| 1.3 | `tests/client-turn-recovery-presentation.test.ts` | Static/source verification | ✅ Existing suite: 116/116 | ✅ Contract retained | ✅ All applicable checks recorded below | ✅ Focused and full suite results confirm both new and existing paths | ✅ Word diff and numstat inspected before PR2 |
| 2.1 | `tests/client-turn-recovery-presentation.test.ts` | Node source contract | ✅ Existing suite: 121/121 | ✅ Focused run failed: 1/8 before production edits because updated-turn Alert/light contract was absent | ✅ 8/8 focused tests passed after implementation | ✅ Three additional cases cover success/light composition, summaries/ownership/copy, and redirect/query preservation | ✅ Corrected the import path after TypeScript caught the initial alias mistake; production remains presentation-only |
| 2.2 | `tests/client-turn-recovery-presentation.test.ts` | Node source contract | ✅ Existing suite: 121/121 | ✅ Test existed before production change | ✅ Focused 8/8 and full 124/124 passed | ✅ Optional summary and canonical redirect branches are source-locked | ✅ Diff review confirms server behavior and all preserved contracts were untouched |
| 2.3 | `tests/client-turn-recovery-presentation.test.ts` | Static/source verification | ✅ Existing suite: 121/121 | ✅ Contract retained | ✅ All applicable checks recorded below | ✅ Focused/full suite, TypeScript, and scoped lint pass | ✅ Word diff, numstat, and exact file scope inspected; browser evidence remains deferred |

## Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test | `npx vitest run tests/client-turn-recovery-presentation.test.ts` — exit 0; 1 file, 8 tests passed |
| Full test | `npm test` — exit 0; 21 files, 124 tests passed |
| TypeScript | `npx tsc --noEmit` — exit 0 after correcting the feedback import to `@/app/components/ui/feedback` |
| Scoped lint | `npm run lint -- "app/[slug]/turno-actualizado/page.tsx" tests/client-turn-recovery-presentation.test.ts` — exit 0 |
| Full lint | `npm run lint` — exit 1 from 8 pre-existing errors and 1 warning in unrelated messaging/dashboard files; no PR1 findings |
| Word diff / budget | `git diff --word-diff=plain` inspected; PR2 diff is 18 additions / 17 deletions in production plus 32 test additions = 67 authored changed lines |
| Runtime harness | N/A — no browser harness is authorized; source/Node evidence only |
| Rollback boundary | Revert `app/[slug]/turno-actualizado/page.tsx` and remove only the PR2 assertions from `tests/client-turn-recovery-presentation.test.ts`; do not revert PR1 or unrelated dirty files |

## Evidence Boundary and Limitations

- Node/source checks do not prove browser focus, keyboard behavior, responsive layout at 390/768/1024/wide, visual appearance, tenant contrast, touch targets, overflow, real announcements, localStorage interaction, native confirmation, or navigation.
- No browser, visual, localStorage, or interaction harness was available or authorized for these PR1/PR2 slices; those guarantees remain deferred.
- Production build was not rerun in this apply slice; the supplied foundation verification records the known external `BILLING_PRICE_NOT_CONFIGURED` blocker.
- `turno-recibido`, owner tabs, APIs, lib files, shared primitives, manifests, config, and unrelated dirty files remain untouched by PR1/PR2.
- PR2 changed only `app/[slug]/turno-actualizado/page.tsx` and extended `tests/client-turn-recovery-presentation.test.ts`; browser focus, keyboard, responsive, visual, contrast, announcements, localStorage, confirmation, and navigation evidence remain deferred.
