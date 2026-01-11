'use server';

import { redirect } from 'next/navigation';
import { createCheckoutSession, createCustomerPortalSession } from './stripe';
import { withTeam } from '@/lib/auth/middleware';
import { getPostHogClient } from '@/lib/posthog-server';
import { getUser } from '@/lib/db/queries';

export const checkoutAction = withTeam(async (formData, team) => {
  const priceId = formData.get('priceId') as string;
  const user = await getUser();

  // PostHog: Track checkout started event
  if (user) {
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: user.email,
      event: 'checkout_started',
      properties: {
        userId: user.id,
        teamId: team.id,
        teamName: team.name,
        priceId: priceId,
        planName: team.planName,
      },
    });
  }

  await createCheckoutSession({ team: team, priceId });
});

export const customerPortalAction = withTeam(async (_, team) => {
  const user = await getUser();

  // PostHog: Track manage subscription clicked event
  if (user) {
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: user.email,
      event: 'manage_subscription_clicked',
      properties: {
        userId: user.id,
        teamId: team.id,
        teamName: team.name,
        currentPlan: team.planName,
        subscriptionStatus: team.subscriptionStatus,
      },
    });
  }

  const portalSession = await createCustomerPortalSession(team);
  redirect(portalSession.url);
});
