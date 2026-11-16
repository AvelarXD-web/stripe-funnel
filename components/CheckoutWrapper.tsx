'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import {
  CurrencyConfig,
  getCurrencyConfig,
  detectCurrencySynchronous,
} from '@/lib/funnel-config';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export default function CheckoutWrapper() {
  // Synchronous detection: 0ms delay, instantaneous paint!
  const [currencyConfig] = useState<CurrencyConfig>(() => {
    return detectCurrencySynchronous();
  });

  // Fire InitiateCheckout to UTMify Tracker & Meta Pixel
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const alreadyFired = sessionStorage.getItem('utmify_ic_dispatched');
    if (!alreadyFired) {
      sessionStorage.setItem('utmify_ic_dispatched', 'true');

      // 1. Meta Pixel InitiateCheckout
      try {
        if ((window as any).fbq) {
          (window as any).fbq('track', 'InitiateCheckout', {
            value: currencyConfig.frontend.price / (currencyConfig.isZeroDecimal ? 1 : 100),
            currency: currencyConfig.code.toUpperCase(),
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
  }, [currencyConfig]);

  // Pixel-perfect Stripe Appearance
  const options = useMemo(() => ({
    mode: 'payment' as const,
    amount: currencyConfig.frontend.price,
    currency: currencyConfig.code,
    locale: 'es' as const,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#0066eb',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        borderRadius: '6px',
        spacingUnit: '4px',
      },
      rules: {
        '.Input': {
          border: '1px solid #e0e6eb',
          boxShadow: '0px 1px 1px rgba(0, 0, 0, 0.03), 0px 3px 6px rgba(0, 0, 0, 0.02)',
          padding: '10px 12px',
          fontSize: '14px',
          backgroundColor: '#ffffff',
        },
        '.Input:focus': {
          border: '1px solid #0066eb',
          boxShadow: '0px 1px 1px rgba(0, 0, 0, 0.03), 0px 3px 6px rgba(0, 0, 0, 0.02), 0 0 0 1px #0066eb',
        },
        '.Label': {
          fontWeight: '500',
          fontSize: '13px',
          color: '#425466',
          marginBottom: '6px',
        },
        '.Block': {
          border: '1px solid #e0e6eb',
          borderRadius: '6px',
        },
        '.AccordionItem': {
          border: '1px solid #e0e6eb',
          borderRadius: '6px',
        },
      },
    },
  }), [currencyConfig.code, currencyConfig.frontend.price]);

  // Formatted price string for Stripe clean look
  const displayPriceText = useMemo(() => {
    if (currencyConfig.code.toLowerCase() === 'usd') {
      return 'US$ 27,00';
    }
    return currencyConfig.frontend.displayPrice;
  }, [currencyConfig]);

  return (
    <div className="min-h-screen bg-[#f8fafc] sm:bg-[#f6f9fc] flex flex-col justify-start sm:justify-center items-center px-4 py-5 sm:py-12 antialiased">
      <div className="w-full max-w-[430px] bg-white rounded-xl sm:rounded-2xl border-0 sm:border sm:border-slate-200/80 sm:shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-5 sm:p-8">
        
        {/* Stripe Header: Centered Product Name & Price */}
        <div className="text-center pt-1 pb-6 space-y-1">
          <div className="text-sm font-medium text-slate-500 tracking-normal">
            La Verdad Acesso
          </div>
          <div className="text-[34px] font-black text-slate-900 tracking-tight leading-none">
            {displayPriceText}
          </div>
        </div>

        {/* Stripe Elements Form */}
        {stripePromise && (
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm currencyConfig={currencyConfig} />
          </Elements>
        )}
      </div>
    </div>
  );
}
