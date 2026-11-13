'use client';

import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import { FUNNEL_CONFIG } from '@/lib/funnel-config';
import { BadgeCheck, ShieldCheck } from 'lucide-react';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export default function CheckoutWrapper() {
  const options = {
    mode: 'payment' as const,
    amount: FUNNEL_CONFIG.frontend.price, // 2700 ($27.00)
    currency: FUNNEL_CONFIG.currency,
    appearance: {
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
        '.Tab': {
          borderColor: '#e2e8f0',
          padding: '10px 14px',
        },
        '.Tab--selected': {
          borderColor: '#16a34a',
          backgroundColor: '#f0fdf4',
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-5">
        
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

        {/* Form loads immediately without any client-side delay */}
        {stripePromise && (
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm />
          </Elements>
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
