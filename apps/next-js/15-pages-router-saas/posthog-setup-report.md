# PostHog post-wizard report

The wizard has completed a deep integration of your Next.js 15 Pages Router SaaS project with PostHog analytics. The integration includes:

- **Client-side initialization** via `instrumentation-client.ts` using the recommended Next.js 15.3+ approach
- **Server-side tracking** via `posthog-node` for API route events
- **User identification** on both client and server to correlate user behavior across sessions
- **Error tracking** with `captureException` for monitoring application errors
- **Reverse proxy setup** in `next.config.ts` for reliable event delivery

## Files Created

| File | Description |
|------|-------------|
| `instrumentation-client.ts` | Client-side PostHog initialization with error tracking enabled |
| `lib/posthog-server.ts` | Server-side PostHog client singleton for API routes |
| `.env` | Environment variables for PostHog API key and host |

## Files Modified

| File | Description |
|------|-------------|
| `next.config.ts` | Added PostHog reverse proxy rewrites for `/ingest` endpoints |

## Events Implemented

| Event Name | Description | File Path |
|------------|-------------|-----------|
| `user_signed_up` | User successfully created a new account | `pages/api/auth/sign-up.ts`, `components/login.tsx` |
| `user_signed_in` | User successfully signed into their account | `pages/api/auth/sign-in.ts`, `components/login.tsx` |
| `user_signed_out` | User signed out of their account | `components/header.tsx` |
| `checkout_started` | User initiated checkout process for a subscription plan | `pages/pricing.tsx` |
| `checkout_completed` | User successfully completed Stripe checkout | `pages/api/stripe/checkout.ts` |
| `subscription_managed` | User clicked to manage their subscription via Stripe portal | `pages/dashboard/index.tsx` |
| `team_member_invited` | Owner invited a new team member | `pages/api/team/invite.ts` |
| `team_member_removed` | Owner removed a team member from the team | `pages/api/team/remove-member.ts` |
| `account_updated` | User updated their account information | `pages/api/account/update.ts` |
| `invitation_accepted` | User signed up via a team invitation link | `pages/api/auth/sign-up.ts` |
| `pricing_viewed` | User viewed the pricing page (conversion funnel top) | `pages/pricing.tsx` |
| `sign_in_failed` | User failed to sign in due to invalid credentials | `components/login.tsx` |
| `sign_up_failed` | User failed to sign up | `components/login.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://us.posthog.com/project/2/dashboard/1020679) - Core analytics dashboard with 5 key insights

### Insights
- [Subscription Conversion Funnel](https://us.posthog.com/project/2/insights/ykHxN6pS) - Tracks user journey from pricing to checkout completion
- [User Sign-ups Over Time](https://us.posthog.com/project/2/insights/s3fJDyfN) - Daily trend of new user registrations
- [User Authentication Events](https://us.posthog.com/project/2/insights/ZtyhB6y6) - Sign-ins, sign-ups, and sign-outs over time
- [Sign-in Failures](https://us.posthog.com/project/2/insights/9GxZdju1) - Failed authentication attempts for security monitoring
- [Team Management Activity](https://us.posthog.com/project/2/insights/alighu15) - Team invitations, member removals, and account updates
