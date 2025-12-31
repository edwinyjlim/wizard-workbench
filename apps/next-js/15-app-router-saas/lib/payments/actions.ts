'use server';

import { redirect } from 'next/navigation';
import { createCheckoutSession, createCustomerPortalSession } from './stripe';
import { withTeam } from '@/lib/auth/middleware';
import { getPostHogClient } from '@/lib/posthog-server';

export const checkoutAction = withTeam(async (formData, team) => {
  const priceId = formData.get('priceId') as string;

  // PostHog: Track checkout started (conversion funnel)
  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: team.stripeCustomerId || `team_${team.id}`,
    event: 'checkout_started',
    properties: {
      teamId: team.id,
      teamName: team.name,
      priceId
    }
  });

  await createCheckoutSession({ team: team, priceId });
});

export const customerPortalAction = withTeam(async (_, team) => {
  // PostHog: Track customer portal opened
  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: team.stripeCustomerId || `team_${team.id}`,
    event: 'customer_portal_opened',
    properties: {
      teamId: team.id,
      teamName: team.name,
      subscriptionStatus: team.subscriptionStatus,
      planName: team.planName
    }
  });

  const portalSession = await createCustomerPortalSession(team);
  redirect(portalSession.url);
});
