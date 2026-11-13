'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import { FUNNEL_CONFIG } from '@/lib/funnel-config';
import { Loader2, ShieldCheck } from 'lucide-react';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export default function CheckoutWrapper() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    async function initIntent() {
      try {
        const res = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Failed to initialize payment.');
        }

        setClientSecret(data.clientSecret);
        setCustomerId(data.customerId);
      } catch (err: any) {
        console.error(err);
        setInitError(err.message || 'Error loading checkout.');
      } finally {
        setIsLoading(false);
      }
    }

    initIntent();
  }, []);

  const appearance = {
    theme: 'flat' as const,
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
        borderColor: '#e2e8f0',
        padding: '12px 14px',
      },
      '.Input:focus': {
        borderColor: '#16a34a',
        boxShadow: '0 0 0 1px #16a34a',
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-5">
        
        {/* Simple Ticket Header */}
        <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Item
            </span>
            <span className="text-base font-bold text-slate-900">
              {FUNNEL_CONFIG.frontend.name}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-slate-900">
              {FUNNEL_CONFIG.frontend.displayPrice}
            </span>
          </div>
        </div>

        {initError ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs text-center">
            {initError}
          </div>
        ) : isLoading || !clientSecret ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs">Loading payment...</span>
          </div>
        ) : (
          stripePromise && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance,
              }}
            >
              <CheckoutForm customerId={customerId!} />
            </Elements>
          )
        )}

        {/* Security Stamp */}
        <div className="pt-2 flex items-center justify-center space-x-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-Bit SSL Encrypted • PCI-DSS Compliant</span>
        </div>
      </div>
    </div>
  );
}
