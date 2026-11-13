'use client';

import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import {
  FUNNEL_CONFIG,
  SUPPORTED_CURRENCIES,
  CurrencyConfig,
  getCurrencyConfig,
} from '@/lib/funnel-config';
import { BadgeCheck, ShieldCheck, Globe, ChevronDown } from 'lucide-react';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export default function CheckoutWrapper() {
  const [currencyConfig, setCurrencyConfig] = useState<CurrencyConfig>(SUPPORTED_CURRENCIES.usd);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<string>('US');

  // Detect visitor's local country & currency automatically
  useEffect(() => {
    async function initCurrency() {
      try {
        const params = new URLSearchParams(window.location.search);
        const queryCurr = params.get('currency') || params.get('curr');
        const queryCountry = params.get('country');

        const savedCurr = localStorage.getItem('funnel_currency');

        const queryParams = new URLSearchParams();
        if (queryCurr) queryParams.set('currency', queryCurr);
        else if (savedCurr) queryParams.set('currency', savedCurr);
        if (queryCountry) queryParams.set('country', queryCountry);

        const res = await fetch(`/api/detect-currency?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.pricing) {
            setCurrencyConfig(data.pricing);
            setDetectedCountry(data.country || 'US');
            localStorage.setItem('funnel_currency', data.pricing.code);
          }
        }
      } catch (e) {
        console.warn('Currency detection fallback:', e);
      }
    }

    initCurrency();
  }, []);

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

  const handleSelectCurrency = (code: string) => {
    const selected = getCurrencyConfig(code);
    setCurrencyConfig(selected);
    localStorage.setItem('funnel_currency', selected.code);
    setIsCurrencyDropdownOpen(false);
  };

  const options = {
    mode: 'payment' as const,
    amount: currencyConfig.frontend.price,
    currency: currencyConfig.code,
    setup_future_usage: 'off_session' as const,
    locale: 'es' as const,
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-start sm:justify-center items-center px-3 sm:px-4 pt-3 sm:pt-8 pb-8">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-md p-5 sm:p-6 space-y-4 sm:space-y-5">
        
        {/* Currency & Country Selector Pill */}
        <div className="flex items-center justify-between pb-1 relative">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>Moneda local:</span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
              className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-full border border-slate-200 transition-colors cursor-pointer"
            >
              <span>{currencyConfig.flag}</span>
              <span>{currencyConfig.code.toUpperCase()}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isCurrencyDropdownOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 max-h-64 overflow-y-auto">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                  Selecciona tu moneda
                </div>
                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelectCurrency(c.code)}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      c.code === currencyConfig.code
                        ? 'font-bold text-emerald-600 bg-emerald-50/50'
                        : 'text-slate-700'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{c.flag}</span>
                      <span>{c.name}</span>
                    </span>
                    <span className="text-[11px] text-slate-400">{c.frontend.displayPrice}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Header: Verified Product Title & Clean Price */}
        <div className="pb-3 sm:pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-base md:text-lg font-bold text-slate-900">
              {FUNNEL_CONFIG.frontend.name}
            </span>
            <BadgeCheck className="w-5 h-5 text-blue-500 flex-shrink-0 fill-blue-500 text-white" />
          </div>
          <div>
            <span className="text-xl md:text-2xl font-black text-slate-900">
              {currencyConfig.frontend.displayPrice}
            </span>
          </div>
        </div>

        {/* Form renders immediately with key bound to currencyConfig.code */}
        {stripePromise && (
          <Elements key={currencyConfig.code} stripe={stripePromise} options={options}>
            <CheckoutForm currencyConfig={currencyConfig} />
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
