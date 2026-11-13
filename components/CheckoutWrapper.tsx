'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import { FUNNEL_CONFIG } from '@/lib/funnel-config';
import { ShieldCheck, Check, Sparkles, ArrowRight, Loader2 } from 'lucide-react';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export default function CheckoutWrapper() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;

    setIsInitializing(true);
    setInitError(null);

    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to initialize checkout session.');
      }

      setClientSecret(data.clientSecret);
      setCustomerId(data.customerId);
    } catch (err: any) {
      console.error(err);
      setInitError(err.message || 'Error setting up payment. Please check your Stripe keys.');
    } finally {
      setIsInitializing(false);
    }
  };

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#059669', // Emerald
      colorBackground: '#ffffff',
      colorText: '#1e293b',
      colorDanger: '#ef4444',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      borderRadius: '8px',
      spacingUnit: '4px',
    },
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* Top Notification Bar */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-8 text-center text-xs md:text-sm text-amber-800 font-medium">
        ⚡ Special Promotional Pricing Applied: Save 80% Today Only!
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Offer Summary & Proof */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                Instant Access
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                {FUNNEL_CONFIG.frontend.name}
              </h1>
              <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                {FUNNEL_CONFIG.frontend.description}
              </p>
            </div>

            {/* Price Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 line-through block">$147.00 Regular</span>
                <span className="text-2xl font-black text-emerald-600">
                  {FUNNEL_CONFIG.frontend.displayPrice}
                </span>
              </div>
              <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg">
                Save $120.00
              </span>
            </div>

            {/* Bullet Points */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                What's Included:
              </h3>
              {FUNNEL_CONFIG.frontend.features.map((feature, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-sm text-slate-700">
                  <div className="p-0.5 bg-emerald-100 rounded-full text-emerald-600 mt-0.5 flex-shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* Money Back Guarantee Badge */}
            <div className="border-t border-slate-100 pt-5 flex items-start space-x-4">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600 flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">30-Day 100% Money-Back Guarantee</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Try it risk-free. If you aren't completely thrilled with the results, simply contact our support team for a full, no-questions-asked refund.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Form */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-md">
            <h2 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-emerald-600" />
              Step 1: Your Contact Information
            </h2>

            {!clientSecret ? (
              <form onSubmit={handleStartPayment} className="space-y-4">
                {initError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {initError}
                  </div>
                )}

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
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address (For digital delivery)
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isInitializing || !name || !email}
                  className="w-full py-4 px-6 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-bold text-sm md:text-base rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  {isInitializing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Loading Secure Payment...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Payment</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div>
                <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-800">{name}</span> ({email})
                  </div>
                  <button
                    onClick={() => setClientSecret(null)}
                    className="text-emerald-600 hover:underline font-medium"
                  >
                    Edit
                  </button>
                </div>

                {stripePromise && (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance,
                    }}
                  >
                    <CheckoutForm
                      customerId={customerId!}
                      customerEmail={email}
                      customerName={name}
                    />
                  </Elements>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
