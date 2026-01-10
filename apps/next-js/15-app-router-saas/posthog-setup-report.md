# PostHog Integration Setup Report

## Overview

PostHog has been successfully integrated into this Next.js 15.5.7 App Router SaaS application. The integration includes both client-side and server-side tracking, user identification, and a comprehensive analytics dashboard.

## Configuration

### Environment Variables

The following environment variables have been added to `.env`:

```
NEXT_PUBLIC_POSTHOG_KEY=sTMFPsFhdP1Ssg
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### Client-Side Initialization

PostHog is initialized on the client using Next.js 15.3+ `instrumentation-client.ts`:

- **File**: `instrumentation-client.ts`
- **Features**:
  - Automatic pageview tracking
  - Exception capture
  - Debug mode in development
  - Reverse proxy routing through `/ingest`

### Server-Side Client

A singleton PostHog Node.js client for server-side tracking:

- **File**: `lib/posthog-server.ts`
- **Usage**: Import `getPostHogClient()` for server-side event capture

### Reverse Proxy Configuration

PostHog requests are proxied through the application to avoid ad blockers:

- **File**: `next.config.ts`
- **Routes**:
  - `/ingest/static/*` → PostHog static assets
  - `/ingest/*` → PostHog API

## Events Tracked

### Authentication Events

| Event | Location | Type | Properties |
|-------|----------|------|------------|
| `user_signed_up` | `app/(login)/login.tsx`, `app/(login)/actions.ts` | Client + Server | email, user_id |
| `user_signed_in` | `app/(login)/login.tsx`, `app/(login)/actions.ts` | Client + Server | email, user_id |
| `user_signed_out` | `app/(login)/actions.ts` | Server | email, user_id |
| `password_updated` | `app/(login)/actions.ts` | Server | email, user_id |
| `account_updated` | `app/(login)/actions.ts` | Server | email, user_id |
| `account_deleted` | `app/(login)/actions.ts` | Server | email, user_id |

### Subscription & Payment Events

| Event | Location | Type | Properties |
|-------|----------|------|------------|
| `pricing_page_viewed` | `app/(dashboard)/pricing/pricing-tracker.tsx` | Client | source |
| `checkout_started` | `lib/payments/actions.ts` | Server | email, user_id, team_id, price_id |
| `subscription_created` | `app/api/stripe/checkout/route.ts` | Server | team_id, subscription_id, price_id |
| `subscription_updated` | `app/api/stripe/webhook/route.ts` | Server | team_id, subscription_id, status |
| `subscription_cancelled` | `app/api/stripe/webhook/route.ts` | Server | team_id, subscription_id, status |
| `checkout_error` | `app/api/stripe/checkout/route.ts` | Server | error |

### Team Events

| Event | Location | Type | Properties |
|-------|----------|------|------------|
| `team_member_invited` | `app/(login)/actions.ts` | Server | email, team_id, invited_email, role |
| `team_member_removed` | `app/(login)/actions.ts` | Server | email, team_id, removed_member_id |

## User Identification

Users are identified in PostHog using their email address as the `distinctId`. Identification happens:

1. **On sign-in/sign-up** (client-side): `posthog.identify(email, { email })`
2. **On server actions**: Using `posthog.capture({ distinctId: user.email, ... })`

## Files Modified/Created

### Created Files

| File | Purpose |
|------|---------|
| `.env` | PostHog environment variables |
| `instrumentation-client.ts` | Client-side PostHog initialization |
| `lib/posthog-server.ts` | Server-side PostHog client |
| `app/(dashboard)/pricing/pricing-tracker.tsx` | Pricing page view tracker component |

### Modified Files

| File | Changes |
|------|---------|
| `next.config.ts` | Added PostHog reverse proxy rewrites |
| `app/(login)/login.tsx` | Added client-side identify and event capture |
| `app/(login)/actions.ts` | Added server-side tracking for all auth actions |
| `lib/payments/actions.ts` | Added checkout_started event |
| `app/api/stripe/checkout/route.ts` | Added subscription_created and error tracking |
| `app/api/stripe/webhook/route.ts` | Added subscription lifecycle event tracking |
| `app/(dashboard)/pricing/page.tsx` | Added PricingPageTracker component |

## PostHog Dashboard

A dashboard has been created with 5 insights to track key business metrics:

**Dashboard**: [Analytics basics](https://us.posthog.com/project/2/dashboard/1020346)

### Insights

1. **User Sign-ups & Sign-ins** - Daily trend of user authentication events
2. **Sign-up to Subscription Funnel** - Conversion funnel from pricing page view → checkout → subscription
3. **Churn Events (Cancellations & Deletions)** - Weekly tracking of subscription cancellations and account deletions
4. **Subscription Lifecycle** - Daily tracking of checkout starts, subscription creations, and updates
5. **Team Collaboration Activity** - Weekly team invitation and removal activity

## Next Steps

1. **Test the integration**: Sign up, sign in, and complete a checkout flow to verify events are being captured
2. **Add more events**: Consider tracking additional user interactions specific to your application
3. **Set up alerts**: Create PostHog alerts for critical events like high churn rates
4. **Feature flags**: Use PostHog feature flags for gradual rollouts
5. **Session recordings**: Enable session recordings for debugging user issues

## Dependencies Added

```json
{
  "posthog-js": "^1.x.x",
  "posthog-node": "^4.x.x"
}
```

Package manager: **pnpm**
