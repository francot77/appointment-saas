# Proposal: Reorder the Dashboard Around Daily Work

## Intent

Make the dashboard serve the owner's primary job: understand today's needs, manage appointments, and keep public booking usable. Appointments lead the first viewport; setup and utilities remain supporting context.

## Scope

### In Scope
- Lead Turnos with its existing today/tomorrow summary, pending requests, and agenda.
- Show activation below primary work while incomplete, or once after completion during the current mounted visit.
- Keep valid public-link open/copy/share actions as an independent secondary utility.
- Hide all automatic WhatsApp UI for Basic or unresolved entitlements; preserve Premium and Enterprise states.
- Retain neutral canvas, responsive containment, Spanish copy, and tab consistency.
- Preserve APIs, mutations, filters, navigation, accessibility, and manual WhatsApp behavior.

### Out of Scope
- `app/api/admin/activation/route.ts`, `app/api/admin/entitlements/route.ts`, `lib/entitlements.ts`, and `lib/plans/catalog.ts`.
- `app/billing/BillingClient.tsx`; Basic absence is dashboard-scoped.
- Public pages, global primitives, persistence, aggregation layers, and unrelated files.

## Capabilities

### New Capabilities
- `dashboard-presentation`: Appointment-first hierarchy, contextual activation, independent sharing, messaging visibility, responsiveness, and behavior preservation.

### Modified Capabilities
- `plan-entitlements`: Dashboard settings omit automatic-messaging UI for Basic or unresolved states while retaining paid presentation.

## Approach

Keep component, endpoint, and tab boundaries. Reorder `DashboardClient`, track acknowledgement only for the mounted visit, separate sharing from checklist visibility, and gate `MessagingSettingsCard` from effective entitlements. Deliver one autonomous force-chained feature-branch-chain slice under 400 authored lines.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/dashboard/DashboardClient.tsx` | Modified | Ordering, activation visit state, and sharing. |
| `app/dashboard/*Tab.tsx` | Modified | Presentation consistency only. |
| `app/dashboard/MessagingSettingsCard.tsx` | Modified | Fail-closed visibility. |
| `tests/*presentation.test.ts` | Modified | Presentation contracts. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Activation state is wrong | Medium | Test incomplete, transition, refresh, and remount states. |
| Sharing becomes coupled to completion | Medium | Contract-test `publicLinkAvailable` independently. |
| Basic messaging content leaks | Medium | Render nothing until eligibility resolves. |
| Presentation changes behavior | Medium | Preserve handlers, requests, focus, and responsive markers. |

## Rollback Plan

Revert the dashboard presentation slice and focused tests; no data rollback is required.

## Dependencies

- Existing activation and entitlement reads; no new dependency.

## Success Criteria

- [ ] Turnos is the first meaningful work surface with behavior intact.
- [ ] Activation is contextual, and sharing remains independently available when valid.
- [ ] Basic and unresolved states expose no automatic-messaging UI; paid states remain accurate.
- [ ] Canvas, containment, copy, navigation, focus, and manual WhatsApp behavior remain intact.
- [ ] Authored changes remain below 400 lines and exclude named out-of-scope files.
