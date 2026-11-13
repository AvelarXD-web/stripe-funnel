'use client';

import { useEffect } from 'react';

export default function PresenceTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let sessionId = sessionStorage.getItem('checkout_presence_sid');
    if (!sessionId) {
      sessionId = 's_' + Math.random().toString(36).substring(2, 12);
      sessionStorage.setItem('checkout_presence_sid', sessionId);
    }

    const getUtms = () => {
      const p = new URLSearchParams(window.location.search);
      return {
        utm_source: p.get('utm_source'),
        utm_campaign: p.get('utm_campaign'),
        utm_medium: p.get('utm_medium'),
        utm_term: p.get('utm_term'),
      };
    };

    const sendPing = () => {
      try {
        fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            utm: getUtms(),
            path: window.location.pathname,
          }),
        }).catch(() => {});
      } catch (e) {
        // ignore
      }
    };

    // Ping immediately on page entry
    sendPing();

    // Keep active heartbeat every 12 seconds
    const interval = setInterval(sendPing, 12000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
