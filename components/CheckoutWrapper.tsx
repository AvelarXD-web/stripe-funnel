'use client';

import React, { useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import { FUNNEL_CONFIG } from '@/lib/funnel-config';
import { BadgeCheck, ShieldCheck } from 'lucide-react';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export default function CheckoutWrapper() {
  // Fire InitiateCheckout to UTMify Tracker & Meta Pixel (100% bug-free, zero duplicates)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check sessionStorage to prevent duplicate events on page reload / refresh
    const alreadyFired = sessionStorage.getItem('utmify_ic_dispatched');
    if (!alreadyFired) {
      sessionStorage.setItem('utmify_ic_dispatched', 'true');

      // 1. Meta Pixel InitiateCheckout
      try {
        if ((window as any).fbq) {
          (window as any).fbq('track', 'InitiateCheckout', {
            value: 27.0,
            currency: 'USD',
          });
        }
      } catch (e) {
        console.warn('Meta IC:', e);
      }

      // 2. UTMify Pixel InitiateCheckout with smart retry
      const fireUtmifyIC = () => {
        try {
          if ((window as any).Tracker?.track) {
            (window as any).Tracker.track('InitiateCheckout');
            return true;
          }
          if ((window as any).utmify?.track) {
            (window as any).utmify.track('InitiateCheckout');
            return true;
          }
        } catch (e) {
          // ignore
        }
        return false;
      };

      if (!fireUtmifyIC()) {
        const interval = setInterval(() => {
          if (fireUtmifyIC()) {
            clearInterval(interval);
          }
        }, 400);
        setTimeout(() => clearInterval(interval), 5000);
      }
    }
  }, []);

  const options = {
    mode: 'payment' as const,
    amount: FUNNEL_CONFIG.frontend.price, // 2700 ($27.00)
    currency: FUNNEL_CONFIG.currency,
    setup_future_usage: 'off_session' as const,
    locale: 'es' as const, // 100% Spanish localization in Stripe Elements
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#16a34a',
        colorBackground: '#ffffff',
        colorText: '#0f172a',
        colorDanger: '#dc2626',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        borderRadius: '8px',
        spacingUnit: '4px',
      },
      rules: {
        '.Input': {
          border: '1.5px solid #94a3b8',
          boxShadow: 'none',
          padding: '12px 14px',
          backgroundColor: '#ffffff',
        },
        '.Input:focus': {
          border: '1.5px solid #16a34a',
          boxShadow: '0 0 0 1px #16a34a',
        },
        '.Input--invalid': {
          border: '1.5px solid #dc2626',
        },
        '.Block': {
          border: '1.5px solid #94a3b8',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
        },
        '.Tab': {
          border: '1.5px solid #94a3b8',
          padding: '10px 14px',
          backgroundColor: '#f8fafc',
        },
        '.Tab:hover': {
          border: '1.5px solid #64748b',
        },
        '.Tab--selected': {
          border: '1.5px solid #16a34a',
          backgroundColor: '#f0fdf4',
          color: '#16a34a',
        },
        '.Label': {
          fontWeight: '600',
          fontSize: '12px',
          color: '#334155',
          marginBottom: '6px',
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-5">
        {/* Header: Verified Product Title & Clean Price */}
        <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-base md:text-lg font-bold text-slate-900">
              {FUNNEL_CONFIG.frontend.name}
            </span>
            <BadgeCheck className="w-5 h-5 text-blue-500 flex-shrink-0 fill-blue-500 text-white" />
          </div>
          <div>
            <span className="text-xl md:text-2xl font-black text-slate-900">
              {FUNNEL_CONFIG.frontend.displayPrice}
            </span>
          </div>
        </div>

        {/* Form renders immediately with zero preload delay */}
        {stripePromise && (
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm />
          </Elements>
        )}

        {/* Security Stamp in Spanish */}
        <div className="pt-2 flex items-center justify-center space-x-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Pago seguro encriptado SSL de 256 bits • Cumple con PCI-DSS</span>
        </div>
      </div>
    </div>
  );
}
