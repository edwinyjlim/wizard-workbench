'use client';

import { useRef } from 'react';
import posthog from 'posthog-js';

export function AboutPageTracker() {
  const tracked = useRef(false);

  // Track only once per mount, avoiding useEffect for analytics
  if (!tracked.current && typeof window !== 'undefined') {
    tracked.current = true;
    posthog.capture('about_page_viewed', {
      referrer: document.referrer || 'direct',
    });
  }

  return null;
}
