'use client';

import { useEffect, useRef } from 'react';
import posthog from 'posthog-js';

export function AboutPageTracker() {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      hasTracked.current = true;
      posthog.capture('about_page_viewed', {
        referrer: document.referrer || 'direct',
      });
    }
  }, []);

  return null;
}
