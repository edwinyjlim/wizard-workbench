'use client';

import posthog from 'posthog-js';

// Track pricing page viewed on mount
// Using a ref to ensure the event is only captured once
let hasTracked = false;

export function PricingTracker() {
  if (typeof window !== 'undefined' && !hasTracked) {
    hasTracked = true;
    posthog.capture('pricing_page_viewed', {
      url: window.location.href
    });
  }

  return null;
}
