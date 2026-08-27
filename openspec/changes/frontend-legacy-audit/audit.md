# Frontend Legacy Audit

## 1. Executive Summary

This is an evidence-based, audit-only inventory of FezTime's mixed Editorial-light, tenant-themed, and legacy-dark frontend. The provisional authority is the Editorial-light product language plus the light dashboard shell; product approval is still **UNRESOLVED**. No browser or screenshot evidence was supplied in this phase, so runtime appearance is not promoted to confirmation.

The highest-risk seams are the dark customer recovery journey (`/r/:token` and `/:slug/turno-actualizado`) and the dark `ServicesTab`/`SettingsTab` inside the light dashboard shell. Fragmented tokens, duplicated primitives, inconsistent dialogs/feedback, and missing visual regression coverage make broad migration unsafe. The recommended order is authority/tokens → primitives → recovery → owner activation → operational consolidation → responsive/accessibility evidence → cleanup.

**Boundary:** this report changes only OpenSpec artifacts. It does not authorize implementation, deletion, refactoring, copy changes, tests, configuration, or runtime/API changes.

### Evidence legend

| Label | Meaning | Use in this report |
|---|---|---|
| `SOURCE-CONFIRMED` | Directly supported by inspected source, OpenSpec evidence, or documented history. | Current files, classes, imports, route inventory, and known code patterns. |
| `RUNTIME-CONFIRMED` | Reproducible browser, screenshot, or runtime test evidence. | None recorded for visual appearance in this phase. |
| `CANDIDATE` | Plausible finding requiring reference/build/history/runtime confirmation. | Suspected dead UI and possible duplication. |
| `UNRESOLVED` | Product decision or observation not proven by available evidence. | Authority approval, viewport appearance, route usage, and browser behavior. |

Confidence is qualitative (`high`, `medium`, or `low`) and is not a percentage. Evidence locators use `exploration.md` sections plus source paths. `npm test` is known to cover 19 backend/route-oriented files and 111 tests, not visual/browser behavior.

## 2. Current Design System

### Authority and ownership

| Area | Current mapping | Proposed audit mapping | Evidence / uncertainty |
|---|---|---|---|
| FezTime-owned canvas/surface | Editorial landing CSS and light Tailwind product surfaces | Product semantic `canvas`, `surface`, `surface-muted` tokens | `SOURCE-CONFIRMED`; `app/page.tsx`, `app/globals.css`, dashboard/public/auth files. Editorial-light authority remains `UNRESOLVED` pending product approval. |
| Content/border/action states | Repeated slate, indigo, emerald, amber, rose utilities and arbitrary values | Product-owned `content`, `muted`, `border`, `action`, `focus`, `success`, `warning`, `danger` tokens | `SOURCE-CONFIRMED`; fragmented ownership is documented in exploration §Findings. Exact canonical values are `UNRESOLVED`. |
| Tenant accent/background/logo | `BrandConfig`, `DEFAULT_BRAND`, inline styles, `validHex` and contrast helpers | Tenant adapter limited to accent, approved background, logo, and readable text calculation | `SOURCE-CONFIRMED`; `app/dashboard/types.ts`, `BusinessLandingClient.tsx`, `TurnosClient.tsx`. Contrast across all runtime values is `UNRESOLVED`. |
| Marketing expression | `.landing-page`, `.section-shell`, `.button`, `.product-preview`, media rules | Keep scoped to marketing; do not treat landing CSS as an implicit product token source | `SOURCE-CONFIRMED`; `app/globals.css`. |

### Primitive candidates

These are migration targets, not existing APIs: `PageFrame`, `Card`, `Button`, `Field`, `Badge`, `Alert`, `Dialog`, `LoadingState`, `EmptyState`, and `StateFeedback`. Current implementations are distributed across `DashboardClient`, `AppointmentsTab`, `AppointmentDetailClient`, `ServicesTab`, `SettingsTab`, `BillingClient`, auth, booking, and recovery pages. Any extraction must preserve labels, APIs, state transitions, focus, announcements, and tenant contrast.

### Canonical candidates and exceptions

| Candidate | Current evidence | Status |
|---|---|---|
| Light dashboard shell and operational cards | `DashboardClient`, `AppointmentsTab`, `ScheduleTab`, `CalendarTab` | `CANDIDATE`, provisional product baseline. |
| Rounded light cards, buttons, and inputs | Light dashboard and public booking surfaces | `CANDIDATE`; variants and ownership require design approval. |
| Semantic state palette | Existing emerald/amber/rose feedback plus text labels | `CANDIDATE`; meanings must be preserved before centralization. |
| Tenant theme adapter | `BrandConfig` and guarded tenant color helpers | `CANDIDATE`; never replace product-owned semantics. |
| Editorial custom CSS | Landing selectors in `app/globals.css` | `SOURCE-CONFIRMED` as a scoped implementation; product-wide authority `UNRESOLVED`. |

## 3. Route Audit

`CURRENT` means aligned with the provisional baseline; `MOSTLY CURRENT`, `MIXED`, `MOSTLY LEGACY`, and `LEGACY` are audit classifications, not runtime visual confirmation.

| Route | Implementation | Classification | Evidence and rationale | Uncertainty |
|---|---|---|---|---|
| `/` | `app/page.tsx`, `app/globals.css` | MOSTLY CURRENT | `SOURCE-CONFIRMED`: Editorial-light marketing/conversion CSS. | Browser appearance and product approval `UNRESOLVED`. |
| `/demo` | `app/demo/page.tsx` | MOSTLY CURRENT | `SOURCE-CONFIRMED`: Editorial-light Tailwind walkthrough with fictitious booking/admin data. | Demo fidelity to runtime product `UNRESOLVED`. |
| `/login` | `app/login/page.tsx`, `LoginForm.tsx` | MOSTLY CURRENT | `SOURCE-CONFIRMED`: light auth layout with repeated header/footer/form patterns. | Focus and responsive appearance `UNRESOLVED`. |
| `/register` | `app/register/page.tsx`, `register/layout.tsx` | MOSTLY CURRENT | `SOURCE-CONFIRMED`: light onboarding surface; no shared form primitives. | Validation/error appearance `UNRESOLVED`. |
| `/dashboard` | `app/dashboard/page.tsx`, `DashboardClient.tsx` | MIXED | `SOURCE-CONFIRMED`: light shell, desktop sidebar, mobile bottom navigation, local tab state; dark tabs are reachable from it. | Deep-link/refresh intent and visual runtime `UNRESOLVED`. |
| `/dashboard/appointments/:id` | `AppointmentDetailClient.tsx` | MIXED | `SOURCE-CONFIRMED`: light standalone detail page duplicates actions/status/dialogs and breaks shell continuity. | Intended standalone navigation `UNRESOLVED`. |
| `/billing` | `app/billing/page.tsx`, `BillingClient.tsx` | MOSTLY CURRENT | `SOURCE-CONFIRMED`: light billing/recovery cards with separate typography/status scale. | Canonical billing relationship to shell `UNRESOLVED`. |
| `/:slug` | `page.tsx`, `BusinessLandingClient.tsx` | MOSTLY CURRENT | `SOURCE-CONFIRMED`: tenant-themed Editorial-light landing with dynamic background and contrast fallback. | All tenant combinations and runtime contrast `UNRESOLVED`. |
| `/:slug/turnos` | `turnos/page.tsx`, `TurnosClient.tsx` | MOSTLY CURRENT | `SOURCE-CONFIRMED`: tenant-themed four-step booking flow with loading/retry/empty/error feedback. | Browser state presentation `UNRESOLVED`. |
| `/:slug/turno-recibido` | `turno-recibido/page.tsx` | MOSTLY CURRENT | `SOURCE-CONFIRMED`: light tenant-adjacent confirmation with local contrast helper. | Cross-route continuity `UNRESOLVED`. |
| `/:slug/turno-actualizado` | `turno-actualizado/page.tsx` | MOSTLY LEGACY | `SOURCE-CONFIRMED`: dark legacy reschedule result with different hierarchy and compact typography. | Runtime appearance and product intent `UNRESOLVED`. |
| `/r/:token` | `MagicLinkClient.tsx` | LEGACY | `SOURCE-CONFIRMED`: dark legacy customer management, `window.confirm`, independent status/error language. | Token-expiry/recovery variants require runtime evidence. |
| `/turnos` | `app/turnos/page.tsx` | LEGACY | `SOURCE-CONFIRMED`: dark generic booking fallback unless deployment redirects to a default slug. | Deployment usage and redirect behavior `UNRESOLVED`. |
| `/terms` | `app/terms/page.tsx` | MIXED | `SOURCE-CONFIRMED`: included legal/trust boundary, but its visual relationship to the current product language was not inspected. | Legal copy/readiness and visual treatment `UNRESOLVED`; preserve content and audit before migration. |
| `/privacy` | `app/privacy/page.tsx` | MIXED | `SOURCE-CONFIRMED`: included legal/trust boundary, but its visual relationship to the current product language was not inspected. | Legal copy/readiness and visual treatment `UNRESOLVED`; preserve content and audit before migration. |

### Route × viewport × state matrix

The matrix is complete for all 15 discovered UI routes. Each row is `route / viewport`; each state cell is `O` (observed from source), `N/A` (not applicable from the route contract), or `U` (unresolved because no runtime/browser evidence exists). State order is **D/L/E/X/S/N/G/R** = default/loading/empty/error/success/disabled/dialog/recovery. Source evidence is not visual runtime confirmation; where a source contains a state it is `O`, otherwise `N/A` or `U` is recorded conservatively. `Resp`, `Focus`, `Sem`, `Touch`, `Overflow`, and `Tenant` summarize the required audit dimensions; all are `U` unless source evidence establishes the concern.

| Route | Viewport | D/L/E/X/S/N/G/R | Resp | Focus | Sem | Touch | Overflow | Tenant |
|---|---|---|---|---|---|---|---|---|
| `/` | 390 | O/U/N/A/U/O/N/A/N/A | U | U | U | U | U | N/A |
| `/` | 768 | O/U/N/A/U/O/N/A/N/A | U | U | U | U | U | N/A |
| `/` | 1024 | O/U/N/A/U/O/N/A/N/A | U | U | U | U | U | N/A |
| `/` | wide | O/U/N/A/U/O/N/A/N/A | U | U | U | U | U | N/A |
| `/demo` | 390 | O/O/O/O/O/U/U/N/A | U | U | U | U | U | N/A |
| `/demo` | 768 | O/O/O/O/O/U/U/N/A | U | U | U | U | U | N/A |
| `/demo` | 1024 | O/O/O/O/O/U/U/N/A | U | U | U | U | U | N/A |
| `/demo` | wide | O/O/O/O/O/U/U/N/A | U | U | U | U | U | N/A |
| `/login` | 390 | O/O/N/A/O/O/N/A/N/A | U | U | U | U | U | N/A |
| `/login` | 768 | O/O/N/A/O/O/N/A/N/A | U | U | U | U | U | N/A |
| `/login` | 1024 | O/O/N/A/O/O/N/A/N/A | U | U | U | U | U | N/A |
| `/login` | wide | O/O/N/A/O/O/N/A/N/A | U | U | U | U | U | N/A |
| `/register` | 390 | O/O/N/A/O/O/N/A/N/A | U | U | U | U | U | N/A |
| `/register` | 768 | O/O/N/A/O/O/N/A/N/A | U | U | U | U | U | N/A |
| `/register` | 1024 | O/O/N/A/O/O/N/A/N/A | U | U | U | U | U | N/A |
| `/register` | wide | O/O/N/A/O/O/N/A/N/A | U | U | U | U | U | N/A |
| `/dashboard` | 390 | O/O/O/O/O/O/G/R | U | U | U | U | U | N/A |
| `/dashboard` | 768 | O/O/O/O/O/O/G/R | U | U | U | U | U | N/A |
| `/dashboard` | 1024 | O/O/O/O/O/O/G/R | U | U | U | U | U | N/A |
| `/dashboard` | wide | O/O/O/O/O/O/G/R | U | U | U | U | U | N/A |
| `/dashboard/appointments/:id` | 390 | O/O/N/A/O/O/U/G/R | U | U | U | U | U | N/A |
| `/dashboard/appointments/:id` | 768 | O/O/N/A/O/O/U/G/R | U | U | U | U | U | N/A |
| `/dashboard/appointments/:id` | 1024 | O/O/N/A/O/O/U/G/R | U | U | U | U | U | N/A |
| `/dashboard/appointments/:id` | wide | O/O/N/A/O/O/U/G/R | U | U | U | U | U | N/A |
| `/billing` | 390 | O/O/O/O/O/U/N/A/R | U | U | U | U | U | N/A |
| `/billing` | 768 | O/O/O/O/O/U/N/A/R | U | U | U | U | U | N/A |
| `/billing` | 1024 | O/O/O/O/O/U/N/A/R | U | U | U | U | U | N/A |
| `/billing` | wide | O/O/O/O/O/U/N/A/R | U | U | U | U | U | N/A |
| `/:slug` | 390 | O/U/O/O/O/U/N/A/R | U | U | U | U | U | U |
| `/:slug` | 768 | O/U/O/O/O/U/N/A/R | U | U | U | U | U | U |
| `/:slug` | 1024 | O/U/O/O/O/U/N/A/R | U | U | U | U | U | U |
| `/:slug` | wide | O/U/O/O/O/U/N/A/R | U | U | U | U | U | U |
| `/:slug/turnos` | 390 | O/O/O/O/O/U/N/A/R | U | U | U | U | U | U |
| `/:slug/turnos` | 768 | O/O/O/O/O/U/N/A/R | U | U | U | U | U | U |
| `/:slug/turnos` | 1024 | O/O/O/O/O/U/N/A/R | U | U | U | U | U | U |
| `/:slug/turnos` | wide | O/O/O/O/O/U/N/A/R | U | U | U | U | U | U |
| `/:slug/turno-recibido` | 390 | O/N/A/N/A/U/O/N/A/N/A/R | U | U | U | U | U | U |
| `/:slug/turno-recibido` | 768 | O/N/A/N/A/U/O/N/A/N/A/R | U | U | U | U | U | U |
| `/:slug/turno-recibido` | 1024 | O/N/A/N/A/U/O/N/A/N/A/R | U | U | U | U | U | U |
| `/:slug/turno-recibido` | wide | O/N/A/N/A/U/O/N/A/N/A/R | U | U | U | U | U | U |
| `/:slug/turno-actualizado` | 390 | O/N/A/N/A/U/O/N/A/N/A/R | U | U | U | U | U | U |
| `/:slug/turno-actualizado` | 768 | O/N/A/N/A/U/O/N/A/N/A/R | U | U | U | U | U | U |
| `/:slug/turno-actualizado` | 1024 | O/N/A/N/A/U/O/N/A/N/A/R | U | U | U | U | U | U |
| `/:slug/turno-actualizado` | wide | O/N/A/N/A/U/O/N/A/N/A/R | U | U | U | U | U | U |
| `/r/:token` | 390 | O/O/N/A/O/O/U/G/R | U | U | U | U | U | U |
| `/r/:token` | 768 | O/O/N/A/O/O/U/G/R | U | U | U | U | U | U |
| `/r/:token` | 1024 | O/O/N/A/O/O/U/G/R | U | U | U | U | U | U |
| `/r/:token` | wide | O/O/N/A/O/O/U/G/R | U | U | U | U | U | U |
| `/turnos` | 390 | O/U/N/A/O/O/U/N/A/R | U | U | U | U | U | N/A |
| `/turnos` | 768 | O/U/N/A/O/O/U/N/A/R | U | U | U | U | U | N/A |
| `/turnos` | 1024 | O/U/N/A/O/O/U/N/A/R | U | U | U | U | U | N/A |
| `/turnos` | wide | O/U/N/A/O/O/U/N/A/R | U | U | U | U | U | N/A |
| `/terms` | 390 | O/N/A/N/A/N/A/N/A/N/A/N/A | U | U | U | U | U | N/A |
| `/terms` | 768 | O/N/A/N/A/N/A/N/A/N/A/N/A | U | U | U | U | U | N/A |
| `/terms` | 1024 | O/N/A/N/A/N/A/N/A/N/A/N/A | U | U | U | U | U | N/A |
| `/terms` | wide | O/N/A/N/A/N/A/N/A/N/A/N/A | U | U | U | U | U | N/A |
| `/privacy` | 390 | O/N/A/N/A/N/A/N/A/N/A/N/A/N/A | U | U | U | U | U | N/A |
| `/privacy` | 768 | O/N/A/N/A/N/A/N/A/N/A/N/A/N/A | U | U | U | U | U | N/A |
| `/privacy` | 1024 | O/N/A/N/A/N/A/N/A/N/A/N/A/N/A | U | U | U | U | U | N/A |
| `/privacy` | wide | O/N/A/N/A/N/A/N/A/N/A/N/A/N/A | U | U | U | U | U | N/A |

The `O` entries mean the state is represented by source logic, not that it was seen in a browser. Every `U` must be replaced only by reproducible browser/screenshot evidence in a later authorized verification slice.

## 4. Component Audit

| Area / components | Files / routes | Status and evidence | Risks to verify later |
|---|---|---|---|
| Owner shell | `DashboardClient`, `app/dashboard/page.tsx`, `/dashboard` | `SOURCE-CONFIRMED` canonical light shell candidate; inline SVG icons, desktop sidebar, mobile bottom nav, activation checklist. | Tab-local URL state, keyboard navigation, mobile overflow. |
| Owner operations | `AppointmentsTab`, `CalendarTab`, `ScheduleTab` | `SOURCE-CONFIRMED` mostly light; duplicated date/week/loading concepts and status presentation. | Calendar/Appointments ownership and endpoint/query preservation `UNRESOLVED`. |
| Owner activation | `ServicesTab`, `SettingsTab` | `SOURCE-CONFIRMED` legacy dark inside light shell; Settings is a monolithic high-risk form. | Save, slug checks, messaging, dialogs, and error semantics must not change. |
| Appointment detail | `AppointmentDetailClient`, `/dashboard/appointments/:id` | `SOURCE-CONFIRMED` light but standalone and duplicates action/status/dialog patterns. | Shell continuity and focus restoration. |
| Billing/auth | `BillingClient`, login/register pages | `SOURCE-CONFIRMED` light with repeated form/header/footer patterns and separate typography. | Shared primitive extraction may alter validation or recovery feedback. |
| Tenant public | `BusinessLandingClient`, `TurnosClient`, `SavedAppointments` | `SOURCE-CONFIRMED` tenant-themed light; repeated color/readability helpers and literals. | Contrast and safe handling of arbitrary tenant values. |
| Customer recovery | `MagicLinkClient`, `turno-recibido`, `turno-actualizado` | `SOURCE-CONFIRMED` mixed light/dark compositions; status language and confirmation behavior differ. | Recovery confidence, token expiry, cancellation/rescheduling state. |
| Demo/acquisition | `DemoPage`, `Frame`, `Detail`, `StatusPill`, `HeroPreviews`, `HeroDemoCarousel` | Demo is `SOURCE-CONFIRMED` live route; preview exports are `CANDIDATE` dead/duplicate UI. | Build/dynamic references and history must precede deletion. |
| Install/PWA | `InstallPwaButton`, `ServiceWorkerRegister` | `InstallPwaButton` is `CANDIDATE` unused; `ServiceWorkerRegister` is `SOURCE-CONFIRMED` live from `app/layout.tsx`. | Never remove PWA behavior as visual cleanup. |

Cross-cutting evidence gaps: no frontend test files, Storybook script, screenshot route script, or browser observations were recorded. Accessibility, announcements, touch targets, overflow, and tenant contrast therefore remain `UNRESOLVED` unless directly stated as source structure.

## 5. Hardcoded Style Findings

Findings are grouped by semantic concern, not repeated literal. Each record identifies current and future ownership without prescribing implementation APIs.

| ID / priority | Label / confidence | Current pattern and evidence | Canonical mapping | Uncertainty |
|---|---|---|---|---|
| HS-01 / P1 | `SOURCE-CONFIRMED` / high | Slate/indigo/rose/emerald/amber utilities and arbitrary values repeat across product UI; `app/login/page.tsx`, dashboard tabs, billing/auth. | Product `canvas`, `surface`, `border`, `content`, `muted`, `action`, `focus`, and semantic state tokens. | Exact values and exceptions require authority approval. |
| HS-02 / P1 | `SOURCE-CONFIRMED` / high | Tenant literal hex and inline style clusters plus repeated `validHex`/contrast logic in public pages and confirmation. | Tenant adapter for accent/background/logo/readable text; product statuses remain product-owned. | All tenant input combinations lack runtime proof. |
| HS-03 / P1 | `SOURCE-CONFIRMED` / high | Dark `bg-slate-900/950`, compact text, and dark fields in `ServicesTab`, `SettingsTab`, `MagicLinkClient`, and updated confirmation. | Shared light surface/field/status primitives, with an explicit approved legacy exception during migration. | Product authority and visual runtime are unresolved. |
| HS-04 / P2 | `SOURCE-CONFIRMED` / medium | Editorial `font-serif`, arbitrary tracking, card radii, and landing media rules differ from Tailwind product scale. | Marketing-scoped exception; product typography scale must be separately approved. | Whether marketing and product should share type tokens is unresolved. |
| HS-05 / P1 | `SOURCE-CONFIRMED` / high | Buttons, fields, cards, badges, alerts, dialogs, loading/empty states are locally composed across tabs/routes. | Primitive candidates with size/state variants and semantic state contracts. | Extraction boundaries and API names are unresolved. |
| HS-06 / P2 | `SOURCE-CONFIRMED` / medium | Repeated status labels, date formatting, summary fields, and icon/detail helpers occur in appointment and booking surfaces. | Shared semantic presentation helpers only after Calendar/Appointments ownership decision. | Consolidation could alter dates, labels, or API behavior. |

## 6. UX Inconsistencies

| ID / priority | Label / confidence | Finding and evidence | Required later verification |
|---|---|---|---|
| UX-01 / P0 | `SOURCE-CONFIRMED` / high | Booking → received → manage → reschedule crosses light and dark route families; `MagicLinkClient` and `turno-actualizado` use legacy hierarchy. | Browser journey at all four viewports, token-expiry/error/recovery states, status semantics. |
| UX-02 / P0 | `SOURCE-CONFIRMED` / high | Light dashboard shell reaches dark `ServicesTab` and `SettingsTab`, especially from activation checklist. | First-run activation path, form/save/error behavior, keyboard and dialog focus. |
| UX-03 / P0 | `SOURCE-CONFIRMED` / high | No validated visual regression boundary; `npm test` does not prove visual/browser behavior. | Add separately authorized read-only visual capability before broad migration. |
| UX-04 / P1 | `SOURCE-CONFIRMED` / high | Dialogs differ: custom `role=dialog`, native `<dialog>`, and `window.confirm`; focus restoration is not consistently evidenced. | Confirmation, reschedule, delete, cancellation flows with keyboard/focus checks. |
| UX-05 / P1 | `SOURCE-CONFIRMED` / high | Feedback differs between bordered semantic alerts and tiny inline colored text; empty states vary in explanation. | State matrix with announcements, disabled controls, retry, and recovery. |
| UX-06 / P1 | `SOURCE-CONFIRMED` / medium | `MessagingSettingsCard` uses English copy inside Spanish owner UI. | Product language decision; copy change is out of scope for this artifact. |
| UX-07 / P1 | `SOURCE-CONFIRMED` / medium | Dashboard tabs are local state while detail, billing, auth, and public journeys are URL routes. | Product decision on deep links, refresh persistence, and browser back behavior. |
| UX-08 / P2 | `SOURCE-CONFIRMED` / medium | Responsive strategy varies: landing 800/420 rules, Tailwind breakpoints, public booking columns, and compact legacy grids. | Route matrix visual checks at 390/768/1024/wide, including touch and overflow. |
| UX-09 / P1 | `SOURCE-CONFIRMED` / medium | Standalone appointment detail duplicates shell/action/status patterns. | Decide shell integration without changing appointment API or state transitions. |

## 7. Dead / Duplicate UI

No deletion is authorized. These records deliberately separate reference, build/runtime, history, and visual confidence.

| Candidate | Reference evidence | Build/runtime evidence | History evidence | Visual confidence | Decision |
|---|---|---|---|---|---|
| `HeroPreviews.tsx` (`PanelPreview`, `CalendarPreview`, `PublicPreview`) | `CANDIDATE`: no import found in inspected `app/*.tsx`. | `UNRESOLVED`: repository-wide and dynamic references not proven; build confirmation pending. | `UNRESOLVED`: history review pending. | `UNRESOLVED`: no screenshot/runtime evidence. | Keep until evidence-gated deletion or marketing reuse task. |
| `app/components/HeroDemoCarousel.tsx` | `CANDIDATE`: export with no import in inspected TSX. | `UNRESOLVED`: compiler/build and non-TSX references pending. | `UNRESOLVED`. | `UNRESOLVED`. | No deletion; create narrow evidence task only. |
| `app/components/InstallPwaButton.tsx` | `CANDIDATE`: export with no import; pages implement local install/share affordances. | `UNRESOLVED`; `ServiceWorkerRegister` is live and must be preserved. | `UNRESOLVED`. | `UNRESOLVED`. | Verify PWA behavior and references before any decision. |
| `AppointmentsTab` vs `AppointmentDetailClient` actions/status/dialogs | `SOURCE-CONFIRMED` duplicate presentation patterns. | `UNRESOLVED` whether behavior differs in edge states. | `UNRESOLVED`. | `UNRESOLVED`. | Consolidate only after semantic behavior is locked. |
| `CalendarTab` vs `AppointmentsTab` week/date concepts | `SOURCE-CONFIRMED` overlapping concepts; Calendar also owns share mode schedule fetch. | `UNRESOLVED` whether jobs are intentionally distinct. | `UNRESOLVED`. | `UNRESOLVED`. | Product/data-boundary decision before extraction. |

## 8. Migration Plan

All slices below are future planning only. Each child is a bounded feature-branch-chain slice, targets the previous slice, stays below the 400 changed-line review budget, and requires separate implementation authorization.

| Slice | Order and boundary | Depends on | Verification focus | Rollback boundary |
|---|---|---|---|---|
| PR1 / foundation | Approve authority, define product/tenant token contract, record scoped marketing exception. | Product approval; this audit. | Token ownership review and route matrix baseline. | Revert token/authority planning only. |
| PR2 / primitives | Nominate page frame, card, button, field, badge, alert, dialog, loading, empty, and state contracts. | PR1. | API/state preservation review; no broad extraction in one slice. | Revert primitive contract slice. |
| PR3 / customer recovery | Migrate `/r/:token` and `/:slug/turno-actualizado` as one journey slice. | PR2; recovery browser evidence. | Booking → received → manage → reschedule at four viewports and recovery states. | Revert only recovery surfaces. |
| PR4 / Services | Migrate `ServicesTab` into light shell. | PR2; PR1 token contract. | Create/edit/toggle/delete/loading/empty/error/dialog/focus behavior. | Revert `ServicesTab` changes only. |
| PR5 / Settings sections | Migrate `SettingsTab` in independently verifiable form/theme/messaging sections. | PR4; preserve slug/save/messaging contracts. | Form validation, save/error/status, tenant contrast, sticky bar, focus. | Revert one Settings section, not the whole shell. |
| PR6 / operations | Align appointment detail, billing/auth, and shared appointment/status presentation; decide Calendar/Appointments ownership first. | PR2, PR4, PR5; product data-boundary decision. | API/state/copy preservation and route continuity. | Revert the selected operational family. |
| PR7 / evidence pass | Validate responsive/accessibility behavior across all matrix rows and states. | PR3–PR6; visual harness authorization. | Screenshots/browser evidence, keyboard, announcements, touch, overflow, tenant contrast. | Revert evidence tooling/output only. |
| PR8 / cleanup | Verify candidates with repository references, build, history, and runtime evidence; then propose narrow deletion/reuse. | PR7 and explicit deletion authorization. | Proof of no dynamic/PWA dependency. | Revert only confirmed candidate cleanup. |

## 9. Actionable Tasks

Every task is planning-only. `S/M/L` is relative scope, not an estimate of changed lines. Evidence labels retain uncertainty and do not authorize production edits.

| ID | Priority / scope | Files/components | Problem | Expected result | Dependencies | Evidence | Verification | Rollback boundary |
|---|---|---|---|---|---|---|---|---|
| AUD-01 | P0 / S | Product references; `app/page.tsx`, `DashboardClient` | Authority is provisional. | Product-approved Editorial-light baseline with named exceptions. | None. | `SOURCE-CONFIRMED`: exploration §Canonical Candidates; `UNRESOLVED`: approval. | Product decision record and authority exception list. | Revert authority record only. |
| AUD-02 | P1 / M | `app/globals.css`, dashboard/public/auth/billing surfaces, `BrandConfig` | Product and tenant styles lack semantic ownership. | Token map covering canvas/surface/border/content/muted/action/focus/states and tenant adapter. | AUD-01. | `SOURCE-CONFIRMED`: exploration §Findings and source paths; `UNRESOLVED`: exact values. | Token ownership review plus route matrix impact check. | Revert token contract only. |
| AUD-03 | P1 / M | Existing button/card/field/badge/alert/dialog/loading/empty implementations | Primitives are duplicated. | Contract and migration map with API/state preservation criteria. | AUD-02. | `SOURCE-CONFIRMED`: Component Audit and design interface contract. | Primitive inventory, state contract, and API-preservation review. | Revert primitive contract slice. |
| AUD-04 | P0 / M | `MagicLinkClient.tsx`, `turno-actualizado/page.tsx`, related booking result pages | Recovery journey changes visual system at high-trust moments. | Light recovery slice preserving token, cancellation, reschedule, and status semantics. | AUD-03; runtime evidence. | `SOURCE-CONFIRMED`: exploration P0; visual runtime `UNRESOLVED` until captured. | Four-viewport booking→recovery matrix, keyboard/focus, expiry/error/recovery checks. | Revert only recovery surfaces. |
| AUD-05 | P0 / M | `ServicesTab.tsx` | Dark activation tab conflicts with light shell. | Light tab with unchanged service CRUD, loading, empty, error, and delete behavior. | AUD-03. | `SOURCE-CONFIRMED`: exploration owner activation inventory. | CRUD/state/dialog matrix and focused accessibility checks. | Revert `ServicesTab` changes only. |
| AUD-06 | P0 / L | `SettingsTab.tsx`, `MessagingSettingsCard` | Monolithic dark form combines high-risk concerns and mixed language. | Sectioned light migration preserving validation, slug, save, messaging, and status behavior; language decision recorded separately. | AUD-03, AUD-05. | `SOURCE-CONFIRMED`: exploration P0/P1; copy policy `UNRESOLVED`. | Section-by-section save/error/slug/tenant-contrast/focus matrix. | Revert one Settings section, not the whole shell. |
| AUD-07 | P1 / M | `AppointmentDetailClient`, `AppointmentsTab`, `CalendarTab` | Actions/status/date concepts repeat and ownership is unclear. | Decision on shell continuity and Calendar/Appointments boundary before helper extraction. | AUD-02, AUD-03. | `SOURCE-CONFIRMED`: exploration P1 duplication; data intent `UNRESOLVED`. | Compare route/state/API behavior before and after any authorized extraction. | Revert the operational decision or helper slice only. |
| AUD-08 | P2 / M | All 15 routes and four viewport targets | Responsive and accessibility evidence is absent. | Reproducible matrix evidence for default/loading/empty/error/success/disabled/dialog/recovery where applicable. | AUD-04–AUD-07; visual harness. | `UNRESOLVED`: no browser/screenshot evidence in this phase. | Route×viewport×state screenshots/browser checks with metadata and semantic assertions. | Revert evidence output/tooling only. |
| AUD-09 | P3 / S | `HeroPreviews`, `HeroDemoCarousel`, `InstallPwaButton` | Suspected dead/duplicate UI lacks proof. | Reference/build/history/runtime record; deletion remains separately authorized. | AUD-08; preserve `ServiceWorkerRegister`. | `CANDIDATE`: inspected TSX had no imports; build/history/runtime `UNRESOLVED`. | Repository-wide reference, build, dynamic resolution, history, and PWA checks. | Revert candidate decision only; never remove live PWA registration. |

For every task: **Evidence** is the source locators above plus later browser/build evidence; **Verification** is the affected route matrix, semantic state assertions, keyboard/focus checks, tenant contrast checks, and `git diff --name-only` scope check; **Rollback boundary** is only the files/components named in that row. No task permits changing APIs, copy, state transitions, routes, tests, dependencies, assets, or configuration without a new authorized implementation change.

## 10. Frontend Design Guardrails

1. **Ownership:** Product tokens own canvas, surfaces, borders, content, focus, and semantic states. Tenant input may own only approved accent/background/logo/readable-text adaptation. Raw tenant color must not define product status meaning.
2. **Authority:** Editorial-light is provisional until product approval. Marketing CSS remains scoped to marketing unless explicitly approved; legacy exceptions must name owner, route scope, and removal dependency.
3. **Primitives:** New work uses the approved primitive contracts and semantic variants rather than copied utility clusters. Extraction must preserve public behavior and existing API contracts.
4. **States:** Preserve default, loading, empty, error, success, disabled, dialog, and recovery semantics. Status must remain understandable without color alone and announcements must remain available to assistive technology.
5. **Accessibility:** Every authorized migration verifies keyboard access, visible focus, dialog focus entry/restoration, semantic roles, announcements, touch target suitability, and overflow at 390/768/1024/wide.
6. **Responsive evidence:** A source inspection is not visual proof. Runtime-confirmed claims require route, viewport, state, timestamp/environment, and reproducible browser or screenshot evidence.
7. **Behavior preservation:** Do not alter labels, copy, API endpoints, query/date behavior, validation, save transitions, token expiry, cancellation, rescheduling, PWA registration, or navigation semantics as a side effect of visual work.
8. **Dialog policy:** Do not replace `window.confirm`, native dialog, or custom dialog in this audit. A future dialog task must define focus, escape, cancellation, destructive action, and recovery behavior first.
9. **Dead UI gate:** `CANDIDATE` never authorizes deletion. Require repository-wide references, build output, dynamic-resolution, history, and runtime/PWA evidence before a separately scoped deletion or reuse task.
10. **Review boundary:** Keep feature-branch-chain slices below 400 changed lines, with one route-family boundary, focused verification, and an exact rollback boundary. This artifact itself is planning-only.

### Unresolved decisions

- Product owner approval of Editorial-light as FezTime-owned authority.
- Whether Calendar and Appointments are intentionally distinct jobs or share a canonical agenda model.
- Desired dashboard tab URL/deep-link/refresh behavior.
- Representative tenant themes and safe runtime data for visual evidence.
- Spanish/English copy policy for owner surfaces.
- Whether suspected preview/install components are obsolete, dynamically referenced, or future marketing/PWA surfaces.

### Evidence index

- `exploration.md` — route inventory, component inventory, findings, canonical candidates, uncertainties, migration order, and risks.
- `proposal.md` — audit-only boundary, required coverage, task fields, and success criteria.
- `specs/frontend-legacy-audit/spec.md` — five requirements and nine acceptance scenarios.
- `design.md` — evidence contract, matrix semantics, token ownership, threat matrix, and chained migration order.
- Source locators named throughout this report — read-only implementation evidence; no production files were changed.
