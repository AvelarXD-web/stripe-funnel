'use client';

import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Lock, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { FUNNEL_CONFIG } from '@/lib/funnel-config';

interface CheckoutFormProps {
  customerId: string;
  customerEmail: string;
  customerName: string;
}

export default function CheckoutForm({
  customerId,
  customerEmail,
  customerName,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // Save session info to localStorage for the subsequent 1-click upsells
    if (typeof window !== 'undefined') {
      localStorage.setItem('funnel_customer_id', customerId);
      localStorage.setItem('funnel_customer_email', customerEmail);
      localStorage.setItem('funnel_customer_name', customerName);
      localStorage.setItem('funnel_orders', JSON.stringify([FUNNEL_CONFIG.frontend.name]));
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Upon success, redirect to Upsell 1 immediately
        return_url: `${window.location.origin}/upsell-1?customer_id=${customerId}`,
      },
    });

    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setErrorMessage(error.message || 'Payment failed. Please check your card info.');
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Stripe Payment Element (Cards, Apple Pay, Google Pay, Link) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
          <Lock className="w-4 h-4 mr-2 text-emerald-600" />
          Payment Method
        </h3>
        <PaymentElement id="payment-element" />
      </div>

      {/* Guarantee & Trust Badges */}
      <div className="space-y-2 text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Guaranteed 256-Bit Encrypted & PCI-Compliant Checkout.</span>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Instant digital delivery right to your inbox.</span>
        </div>
      </div>

      {/* Primary Pay Button */}
      <button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing Order...</span>
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            <span>Pay {FUNNEL_CONFIG.frontend.displayPrice} & Get Instant Access</span>
          </>
        )}
      </button>
    </form>
  );
}
