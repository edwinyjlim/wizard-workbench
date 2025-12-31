import Stripe from 'stripe';
import { handleSubscriptionChange, stripe } from '@/lib/payments/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { getPostHogClient } from '@/lib/posthog-server';

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

  const posthog = getPostHogClient();

  switch (event.type) {
    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(updatedSubscription);

      // PostHog: Track subscription updated
      posthog.capture({
        distinctId: updatedSubscription.customer as string,
        event: 'subscription_updated',
        properties: {
          stripeCustomerId: updatedSubscription.customer,
          subscriptionId: updatedSubscription.id,
          subscriptionStatus: updatedSubscription.status,
          cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end
        }
      });
      break;
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(deletedSubscription);

      // PostHog: Track subscription cancelled (churn event)
      posthog.capture({
        distinctId: deletedSubscription.customer as string,
        event: 'subscription_cancelled',
        properties: {
          stripeCustomerId: deletedSubscription.customer,
          subscriptionId: deletedSubscription.id,
          subscriptionStatus: deletedSubscription.status
        }
      });
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
