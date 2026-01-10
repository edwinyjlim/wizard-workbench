import Stripe from 'stripe';
import { handleSubscriptionChange, stripe } from '@/lib/payments/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { getPostHogClient } from '@/lib/posthog-server';
import { db } from '@/lib/db/drizzle';
import { teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Use a dummy webhook secret for stub mode
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_stub_secret';

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed.' },
      { status: 400 }
    );
  }

  switch (event.type) {
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(subscription);

      // Track subscription events in PostHog
      const posthog = getPostHogClient();
      const customerId = typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id;

      // Look up the team by stripe customer ID to get distinct ID
      const team = await db
        .select()
        .from(teams)
        .where(eq(teams.stripeCustomerId, customerId))
        .limit(1);

      if (team.length > 0) {
        const eventName = event.type === 'customer.subscription.deleted'
          ? 'subscription_cancelled'
          : 'subscription_updated';

        posthog.capture({
          distinctId: customerId, // Using customer ID as distinct ID for webhook events
          event: eventName,
          properties: {
            team_id: team[0].id,
            team_name: team[0].name,
            subscription_id: subscription.id,
            subscription_status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            source: 'stripe_webhook'
          }
        });
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
