# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into your Next.js 15 SaaS application. The integration includes:

- **Client-side initialization** via `instrumentation-client.ts` (the recommended approach for Next.js 15.3+)
- **Server-side tracking** using `posthog-node` for all server actions
- **User identification** on both client and server to correlate user behavior across sessions
- **Automatic error tracking** via `capture_exceptions: true`
- **PostHog reset on logout** to properly handle user session boundaries

## Files Created

| File | Purpose |
|------|---------|
| `.env` | Environment variables for PostHog API key and host |
| `instrumentation-client.ts` | Client-side PostHog initialization for Next.js 15.3+ |
| `lib/posthog-server.ts` | Server-side PostHog client singleton |

## Files Modified

| File | Changes |
|------|---------|
| `app/(login)/login.tsx` | Added client-side user identification on form submit |
| `app/(login)/actions.ts` | Added server-side tracking for all auth events |
| `app/(dashboard)/layout.tsx` | Added PostHog reset on sign-out |
| `lib/payments/actions.ts` | Added checkout and subscription management tracking |
| `app/api/stripe/checkout/route.ts` | Added subscription creation tracking |

## Events Instrumented

| Event Name | Description | File |
|------------|-------------|------|
| `user_signed_in` | Triggered when a user successfully signs in | `app/(login)/actions.ts` |
| `user_signed_up` | Triggered when a new user creates an account | `app/(login)/actions.ts` |
| `user_signed_out` | Triggered when a user signs out | `app/(login)/actions.ts` |
| `user_logged_out` | Client-side logout event with PostHog reset | `app/(dashboard)/layout.tsx` |
| `checkout_started` | Triggered when a user initiates subscription checkout | `lib/payments/actions.ts` |
| `subscription_created` | Triggered after successful Stripe checkout | `app/api/stripe/checkout/route.ts` |
| `manage_subscription_clicked` | Triggered when user accesses customer portal | `lib/payments/actions.ts` |
| `password_updated` | Triggered when a user updates their password | `app/(login)/actions.ts` |
| `account_updated` | Triggered when a user updates account info | `app/(login)/actions.ts` |
| `account_deleted` | Triggered when a user deletes their account (churn) | `app/(login)/actions.ts` |
| `team_member_invited` | Triggered when a team owner invites a member | `app/(login)/actions.ts` |
| `team_member_removed` | Triggered when a team member is removed | `app/(login)/actions.ts` |
| `invitation_accepted` | Triggered when an invited user accepts invitation | `app/(login)/actions.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard

- [Analytics basics](https://us.posthog.com/project/2/dashboard/1020817) - Core product analytics dashboard

### Insights

- [User Sign Ups & Sign Ins](https://us.posthog.com/project/2/insights/1vogVnsY) - Daily trend of authentication events
- [Signup to Subscription Conversion Funnel](https://us.posthog.com/project/2/insights/mDBjyKyW) - Track conversion from signup through checkout to subscription
- [Account Deletions (Churn)](https://us.posthog.com/project/2/insights/CsawIhMV) - Monitor account deletions as a churn indicator
- [Team Activity](https://us.posthog.com/project/2/insights/XaOX84So) - Track team member invitations and removals
- [Subscription Activity](https://us.posthog.com/project/2/insights/jgkIgjMe) - Monitor checkout and subscription events

## Configuration

Your PostHog instance is configured with:

- **API Key**: `sTMFPsFhdP1Ssg` (stored in `.env` as `NEXT_PUBLIC_POSTHOG_KEY`)
- **Host**: `https://us.i.posthog.com` (stored in `.env` as `NEXT_PUBLIC_POSTHOG_HOST`)

Make sure to add these environment variables to your production hosting provider (Vercel, Netlify, etc.).
