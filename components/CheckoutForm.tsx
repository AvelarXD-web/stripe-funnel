'use client';

import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';
import { FUNNEL_CONFIG } from '@/lib/funnel-config';

interface CheckoutFormProps {
  customerId: string;
}

export default function CheckoutForm({ customerId }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    if (!name.trim() || !email.trim()) {
      setErrorMessage('Please fill in your name and email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // Save session data for 1-click upsell
    if (typeof window !== 'undefined') {
      localStorage.setItem('funnel_customer_id', customerId);
      localStorage.setItem('funnel_customer_email', email);
      localStorage.setItem('funnel_customer_name', name);
      localStorage.setItem('funnel_orders', JSON.stringify([`${FUNNEL_CONFIG.frontend.name} (${FUNNEL_CONFIG.frontend.displayPrice})`]));
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/upsell-1?customer_id=${customerId}`,
        payment_method_data: {
          billing_details: {
            name: name,
            email: email,
          },
        },
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2.5 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Customer Info */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            required
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Payment Element (Card, Apple Pay, Google Pay, Link) */}
      <div className="pt-2">
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Payment Information
        </label>
        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
          <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />
        </div>
      </div>

      {/* Minimalist High-Converting CTA */}
      <button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className="w-full mt-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-base rounded-xl shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>Pay {FUNNEL_CONFIG.frontend.displayPrice}</span>
          </>
        )}
      </button>
    </form>
  );
}
