'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FUNNEL_CONFIG } from '@/lib/funnel-config';
import { Check, Star, Sparkles, Loader2, ArrowRight } from 'lucide-react';

export default function Upsell2Page() {
  const router = useRouter();

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedCustomerId = typeof window !== 'undefined' ? localStorage.getItem('funnel_customer_id') : null;
    if (storedCustomerId) {
      setCustomerId(storedCustomerId);
    }
  }, []);

  const handleBuyUpsell = async () => {
    if (!customerId) {
      router.push('/thank-you');
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
          upsellType: 'upsell-2',
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to process 1-click upgrade.');
      }

      // Add to completed orders in localStorage
      if (typeof window !== 'undefined') {
        const currentOrders = JSON.parse(localStorage.getItem('funnel_orders') || '[]');
        currentOrders.push(FUNNEL_CONFIG.upsell2.name);
        localStorage.setItem('funnel_orders', JSON.stringify(currentOrders));
      }

      router.push('/thank-you');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error processing payment. Finalizing order...');
      setTimeout(() => router.push('/thank-you'), 2500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/thank-you');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          <span>Order Progress</span>
          <span className="text-emerald-600 font-extrabold">Step 3 of 3 (95% Complete)</span>
        </div>
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full w-11/12 transition-all duration-500"></div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 md:p-8 text-center space-y-2">
          <span className="inline-flex items-center px-3 py-1 bg-indigo-500 text-white font-black rounded-full text-xs uppercase tracking-wider">
            <Star className="w-3.5 h-3.5 mr-1 fill-white" />
            Final Special Opportunity
          </span>
          <h1 className="text-2xl md:text-4xl font-black leading-tight">
            Unlock the {FUNNEL_CONFIG.upsell2.name}
          </h1>
          <p className="text-indigo-200 text-sm md:text-base max-w-xl mx-auto">
            {FUNNEL_CONFIG.upsell2.tagline}
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
              <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
              What You Unlock Inside:
            </h3>
            <div className="space-y-2.5 pt-1">
              {FUNNEL_CONFIG.upsell2.features.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-sm text-slate-700">
                  <div className="p-0.5 bg-indigo-100 rounded-full text-indigo-600 mt-0.5 flex-shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Highlight */}
          <div className="text-center py-2">
            <span className="text-slate-400 line-through text-sm mr-2">$97.00 Value</span>
            <span className="text-3xl font-black text-slate-900">
              Only {FUNNEL_CONFIG.upsell2.displayPrice}
            </span>
            <span className="block text-xs text-indigo-600 font-bold mt-1">
              ✓ Billed once. Instant 1-click confirmation using your saved payment method.
            </span>
          </div>

          {/* 1-Click Action Buttons */}
          <div className="space-y-4 pt-2">
            <button
              onClick={handleBuyUpsell}
              disabled={isLoading}
              className="w-full py-5 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-lg md:text-xl rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Authorizing 1-Click Purchase...</span>
                </>
              ) : (
                <>
                  <span>YES! Add to My Order for {FUNNEL_CONFIG.upsell2.displayPrice}</span>
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
                No thanks, skip this and take me to my receipt.
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
