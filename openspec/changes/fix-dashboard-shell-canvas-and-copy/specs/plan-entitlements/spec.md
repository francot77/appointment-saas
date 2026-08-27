# Delta for Plan Entitlements

## MODIFIED Requirements

### Requirement: Minimal entitlement read model

The tenant read API MUST continue to return plan key and label, effective capability availability, allowance, accepted usage, uncertain usage, remaining known allowance, period key, period bounds, and timezone. Dashboard messaging settings MUST render no automatic-messaging card, copy, quota, upsell, loading placeholder, error, or action while entitlements are unresolved or when the effective plan is `basic`. Once resolved, `premium` and `enterprise` MUST retain their existing available, unavailable, quota-reached, and delivery-uncertainty presentation. These presentation rules MUST NOT change entitlement resolution, APIs, billing settings, or manual messaging.

(Previously: Billing and settings UI distinguished entitlement states without requiring dashboard-specific omission for Basic and unresolved states.)

#### Scenario: Render uncertain usage
- GIVEN the resolved effective plan is `premium` or `enterprise` and uncertain usage is above zero
- WHEN dashboard messaging settings is displayed
- THEN the UI MUST identify the uncertainty and current period
- AND it MUST NOT present uncertain usage as accepted.

#### Scenario: Basic plan omits automatic messaging
- GIVEN the resolved effective plan is `basic`
- WHEN dashboard settings renders
- THEN no automatic-messaging UI or related action MUST be present
- AND manual WhatsApp behavior MUST remain available.

#### Scenario: Entitlements are unresolved
- GIVEN the entitlement request is loading, failed, or otherwise unresolved
- WHEN dashboard settings renders
- THEN no automatic-messaging UI, placeholder, error, or upsell MUST be present.

#### Scenario: Paid presentation is preserved
- GIVEN the effective plan resolves as `premium` or `enterprise`
- WHEN dashboard messaging settings renders
- THEN its prior state-specific presentation and actions MUST remain available.
