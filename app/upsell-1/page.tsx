'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FUNNEL_CONFIG } from '@/lib/funnel-config';
import { Check, Flame, ShieldAlert, Sparkles, Loader2, ArrowRight } from 'lucide-react';

function Upsell1Content() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Read customerId from URL or localStorage
    const urlCustomerId = searchParams.get('customer_id');
    const storedCustomerId = typeof window !== 'undefined' ? localStorage.getItem('funnel_customer_id') : null;
    const finalCustomerId = urlCustomerId || storedCustomerId;

    if (finalCustomerId) {
      setCustomerId(finalCustomerId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('funnel_customer_id', finalCustomerId);
      }
    }
  }, [searchParams]);

  const handleBuyUpsell = async () => {
    if (!customerId) {
      // If no customer ID, advance to next step
      router.push('/upsell-2');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/charge-upsell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          upsellType: 'upsell-1',
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to process 1-click upgrade.');
      }

      // Add to completed orders in localStorage
      if (typeof window !== 'undefined') {
        const currentOrders = JSON.parse(localStorage.getItem('funnel_orders') || '[]');
        currentOrders.push(FUNNEL_CONFIG.upsell1.name);
        localStorage.setItem('funnel_orders', JSON.stringify(currentOrders));
      }

      // Proceed to Upsell 2
      router.push('/upsell-2');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error processing payment. Moving to next step...');
      setTimeout(() => router.push('/upsell-2'), 2500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/upsell-2');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          <span>Order Progress</span>
          <span className="text-amber-600 font-extrabold">Step 2 of 3 (80% Complete)</span>
        </div>
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full w-4/5 transition-all duration-500"></div>
        </div>
      </div>

      {/* Urgent Warning Header */}
      <div className="bg-red-500 text-white text-center py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center space-x-2 shadow-sm mb-6">
        <ShieldAlert className="w-4 h-4 flex-shrink-0 animate-pulse" />
        <span>DO NOT CLOSE OR REFRESH THIS WINDOW - SPECIAL ONE-TIME OFFER</span>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Card Header */}
        <div className="bg-slate-900 text-white p-6 md:p-8 text-center space-y-2">
          <span className="inline-flex items-center px-3 py-1 bg-amber-400 text-slate-950 font-black rounded-full text-xs uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 mr-1" />
            Special One-Time Upgrade
          </span>
          <h1 className="text-2xl md:text-4xl font-black leading-tight">
            Want to Fast-Track Your Results 3X Faster?
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto">
            {FUNNEL_CONFIG.upsell1.tagline}
          </p>
        </div>

        {/* Card Body */}
        <div className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-amber-500" />
              Here's What You're Getting With {FUNNEL_CONFIG.upsell1.name}:
            </h3>
            <div className="space-y-2.5 pt-1">
              {FUNNEL_CONFIG.upsell1.features.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-sm text-slate-700">
                  <div className="p-0.5 bg-emerald-100 rounded-full text-emerald-600 mt-0.5 flex-shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Highlight */}
          <div className="text-center py-2">
            <span className="text-slate-400 line-through text-sm mr-2">$197.00 Value</span>
            <span className="text-3xl font-black text-slate-900">
              Only {FUNNEL_CONFIG.upsell1.displayPrice}
            </span>
            <span className="block text-xs text-emerald-600 font-bold mt-1">
              ✓ Billed once. Instant 1-click confirmation using your saved payment method.
            </span>
          </div>

          {/* 1-Click Action Buttons */}
          <div className="space-y-4 pt-2">
            <button
              onClick={handleBuyUpsell}
              disabled={isLoading}
              className="w-full py-5 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black text-lg md:text-xl rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Authorizing 1-Click Upgrade...</span>
                </>
              ) : (
                <>
                  <span>YES! Add to My Order for {FUNNEL_CONFIG.upsell1.displayPrice}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Decline Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleSkip}
                disabled={isLoading}
                className="text-xs text-slate-400 hover:text-slate-600 underline transition-colors"
              >
                No thanks, I will pass on this upgrade and risk doing it on my own.
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Upsell1Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <Upsell1Content />
    </Suspense>
  );
}
