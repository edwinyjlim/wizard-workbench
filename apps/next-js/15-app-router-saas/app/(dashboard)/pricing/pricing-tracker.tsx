'use client';

import { useRef } from 'react';
import posthog from 'posthog-js';

export function PricingPageTracker() {
  const hasTracked = useRef(false);

  // Track pricing page view on mount (only once)
  if (!hasTracked.current && typeof window !== 'undefined') {
    hasTracked.current = true;
    posthog.capture('pricing_page_viewed', {
      source: 'client'
    });
  }

  return null;
}
