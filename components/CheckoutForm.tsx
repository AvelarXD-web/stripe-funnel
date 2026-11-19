'use client';

import React, { useState } from 'react';
import {
  PaymentElement,
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { AlertCircle, Loader2, Lock } from 'lucide-react';
import { FUNNEL_CONFIG, CurrencyConfig } from '@/lib/funnel-config';

interface CheckoutFormProps {
  currencyConfig: CurrencyConfig;
}

export default function CheckoutForm({ currencyConfig }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expressAvailable, setExpressAvailable] = useState(false);
  const [activeSession, setActiveSession] = useState<{
    clientSecret: string;
    customerId: string;
    email: string;
    name: string;
    currency: string;
  } | null>(null);

  // Helper to extract UTMs and tracking parameters for UTMify
  const getTrackingParams = () => {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    const tracking: Record<string, string> = {};

    const standardKeys = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term',
      'src',
      'sck',
      'sck1',
      'sck2',
      'sck3',
      'sck4',
      'sck5',
      'fbclid',
      'gclid',
      'ttclid',
    ];

    standardKeys.forEach((key) => {
      const val = params.get(key) || localStorage.getItem(key);
      if (val) tracking[key] = val;
    });

    params.forEach((value, key) => {
      if (key.startsWith('utm_') && !tracking[key]) {
        tracking[key] = value;
      }
    });

    const getCookie = (cname: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + cname + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    };
    const fbp = getCookie('_fbp');
    const fbc = getCookie('_fbc');
    if (fbp) tracking['_fbp'] = fbp;
    if (fbc) tracking['_fbc'] = fbc;

    return tracking;
  };

  // Helper to generate redirect URL with customer_id and keep all UTMs
  const getUpsellRedirectUrl = (customerId: string) => {
    const rawUrl = FUNNEL_CONFIG.urls.upsell1;
    const baseOrigin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://funnel-checkout-27-whats-psi.vercel.app';

    try {
      const target = rawUrl.startsWith('http')
        ? new URL(rawUrl)
        : new URL(rawUrl, baseOrigin);

      if (typeof window !== 'undefined') {
        const currentParams = new URLSearchParams(window.location.search);
        currentParams.forEach((value, key) => {
          target.searchParams.set(key, value);
        });
      }

      target.searchParams.set('customer_id', customerId);
      target.searchParams.set('currency', currencyConfig.code);
      return target.toString();
    } catch {
      return `${rawUrl}?customer_id=${customerId}&currency=${currencyConfig.code}`;
    }
  };

  // 1-Click Express Checkout Handler (Apple Pay, Google Pay)
  const handleExpressConfirm = async (event: any) => {
    if (!stripe || !elements) return;

    setIsLoading(true);
    setErrorMessage(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      if (event?.paymentFailed) {
        event.paymentFailed({ message: submitError.message });
      }
      setErrorMessage(submitError.message || 'Error en la validación.');
      setIsLoading(false);
      return;
    }

    try {
      const billingDetails = event.billingDetails || {};
      const customerEmail = (billingDetails.email || event.payerEmail || email || '').trim().toLowerCase();
      const customerName = (billingDetails.name || event.payerName || name || '').trim() || (customerEmail ? customerEmail.split('@')[0] : '');

      if (!customerEmail || !customerEmail.includes('@')) {
        const msg = 'Por favor proporciona un correo electrónico válido para recibir tu acceso.';
        if (event?.paymentFailed) {
          event.paymentFailed({ message: msg });
        }
        setErrorMessage(msg);
        setIsLoading(false);
        return;
      }

      let clientSecret =
        activeSession &&
        activeSession.email === customerEmail &&
        activeSession.name === customerName &&
        activeSession.currency === currencyConfig.code
          ? activeSession.clientSecret
          : null;
      let customerId =
        activeSession &&
        activeSession.email === customerEmail &&
        activeSession.name === customerName &&
        activeSession.currency === currencyConfig.code
          ? activeSession.customerId
          : null;

      if (!clientSecret || !customerId) {
        const res = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: customerEmail,
            name: customerName,
            currency: currencyConfig.code,
            tracking: getTrackingParams(),
          }),
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          if (event?.paymentFailed) {
            event.paymentFailed({ message: data.error || 'No se pudo iniciar el pedido.' });
          }
          throw new Error(data.error || 'No se pudo iniciar el pedido.');
        }

        clientSecret = data.clientSecret;
        customerId = data.customerId;
        if (clientSecret && customerId) {
          setActiveSession({
            clientSecret,
            customerId,
            email: customerEmail,
            name: customerName,
            currency: currencyConfig.code,
          });
        }
      }

      if (!clientSecret || !customerId) {
        throw new Error('No se pudo inicializar la sesión de pago.');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('funnel_customer_id', customerId);
        localStorage.setItem('funnel_customer_email', customerEmail);
        localStorage.setItem('funnel_customer_name', customerName);
        localStorage.setItem('funnel_currency', currencyConfig.code);
        localStorage.setItem(
          'funnel_orders',
          JSON.stringify([`${FUNNEL_CONFIG.frontend.name} (${currencyConfig.frontend.displayPrice})`])
        );
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: getUpsellRedirectUrl(customerId),
          receipt_email: customerEmail,
          payment_method_data: {
            billing_details: {
              name: customerName,
              email: customerEmail,
            },
          },
        },
      });

      if (confirmError) {
        if (event?.paymentFailed) {
          event.paymentFailed({ message: confirmError.message });
        }
        setErrorMessage(confirmError.message || 'Error al procesar el pago.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      if (event?.paymentFailed) {
        event.paymentFailed({ message: err.message });
      }
      setErrorMessage(err.message || 'Ocurrió un error inesperado al procesar el pago rápido.');
      setIsLoading(false);
    }
  };

  // Standard Form Submit Handler (Credit/Debit Card)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Por favor, ingresa tu nombre completo.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMessage('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // 1. Trigger form validation in Stripe Elements (Validates Card)
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setErrorMessage(submitError.message || 'Por favor, verifica los datos de pago.');
      setIsLoading(false);
      return;
    }

    try {
      let clientSecret =
        activeSession &&
        activeSession.email === trimmedEmail &&
        activeSession.name === trimmedName &&
        activeSession.currency === currencyConfig.code
          ? activeSession.clientSecret
          : null;
      let customerId =
        activeSession &&
        activeSession.email === trimmedEmail &&
        activeSession.name === trimmedName &&
        activeSession.currency === currencyConfig.code
          ? activeSession.customerId
          : null;

      if (!clientSecret || !customerId) {
        const res = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: trimmedEmail,
            name: trimmedName,
            currency: currencyConfig.code,
            tracking: getTrackingParams(),
          }),
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || 'No se pudo iniciar el pedido.');
        }

        clientSecret = data.clientSecret;
        customerId = data.customerId;
        if (clientSecret && customerId) {
          setActiveSession({
            clientSecret,
            customerId,
            email: trimmedEmail,
            name: trimmedName,
            currency: currencyConfig.code,
          });
        }
      }

      if (!clientSecret || !customerId) {
        throw new Error('No se pudo inicializar la sesión de pago.');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('funnel_customer_id', customerId);
        localStorage.setItem('funnel_customer_email', trimmedEmail);
        localStorage.setItem('funnel_customer_name', trimmedName);
        localStorage.setItem('funnel_currency', currencyConfig.code);
        localStorage.setItem(
          'funnel_orders',
          JSON.stringify([`${FUNNEL_CONFIG.frontend.name} (${currencyConfig.frontend.displayPrice})`])
        );
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: getUpsellRedirectUrl(customerId),
          receipt_email: trimmedEmail,
          payment_method_data: {
            billing_details: {
              name: trimmedName,
              email: trimmedEmail,
            },
          },
        },
      });

      if (confirmError) {
        setErrorMessage(confirmError.message || 'Error al procesar el pago. Por favor verifica tus datos.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Ocurrió un error inesperado. Por favor, intenta de nuevo.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Express Checkout Element: Apple Pay, Google Pay */}
      <div className="w-full">
        <ExpressCheckoutElement
          onConfirm={handleExpressConfirm}
          onReady={({ availablePaymentMethods }) => {
            if (
              availablePaymentMethods &&
              (availablePaymentMethods.applePay ||
                availablePaymentMethods.googlePay ||
                availablePaymentMethods.link)
            ) {
              setExpressAvailable(true);
            }
          }}
          options={{
            buttonHeight: 46,
            buttonTheme: {
              applePay: 'black',
              googlePay: 'black',
            },
            paymentMethods: {
              applePay: 'auto',
              googlePay: 'auto',
              link: 'auto',
            },
            emailRequired: true,
            billingAddressRequired: true,
            business: {
              name: 'La Verdad Acesso',
            },
            lineItems: [
              {
                name: 'La Verdad Acesso',
                amount: currencyConfig.frontend.price,
              },
            ],
          }}
        />
      </div>

      {/* Divider with Spanish "O" */}
      {expressAvailable && (
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-[#e0e6eb] w-full" />
          <span className="bg-white px-3 text-[12px] font-medium text-slate-400 uppercase tracking-wider">
            O
          </span>
          <div className="border-t border-[#e0e6eb] w-full" />
        </div>
      )}

      {/* Main Form: Name, Email, Payment Element Accordion, and Blue Pay Button */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-[#425466] mb-1.5">
            Nombre completo
          </label>
          <input
            type="text"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Carlos Mendoza"
            className="w-full px-3.5 py-3 text-[16px] text-[#30313d] bg-white border border-[#e0e6eb] rounded-[6px] shadow-[0px_1px_1px_rgba(0,0,0,0.03),0px_3px_6px_rgba(0,0,0,0.02)] focus:outline-none focus:border-[#0066eb] focus:ring-1 focus:ring-[#0066eb] transition-colors placeholder:text-[#a3acb9]"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#425466] mb-1.5">
            Correo electrónico
          </label>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="w-full px-3.5 py-3 text-[16px] text-[#30313d] bg-white border border-[#e0e6eb] rounded-[6px] shadow-[0px_1px_1px_rgba(0,0,0,0.03),0px_3px_6px_rgba(0,0,0,0.02)] focus:outline-none focus:border-[#0066eb] focus:ring-1 focus:ring-[#0066eb] transition-colors placeholder:text-[#a3acb9]"
          />
        </div>

        <div className="pt-1">
          <label className="block text-[14px] font-semibold text-[#1a1f36] mb-2">
            Forma de pago
          </label>
          <PaymentElement
            id="payment-element"
            options={{
              layout: {
                type: 'accordion',
                defaultCollapsed: false,
                radios: true,
                spacedAccordionItems: false,
              },
              wallets: {
                applePay: 'auto',
                googlePay: 'auto',
              },
              terms: {
                card: 'never',
                applePay: 'never',
                googlePay: 'never',
              },
              fields: {
                billingDetails: {
                  name: 'never',
                  email: 'never',
                },
              },
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !stripe || !elements}
          className="w-full mt-5 py-3 px-4 bg-[#0066eb] hover:bg-[#0052cc] active:bg-[#0047b3] disabled:bg-[#0066eb]/60 text-white font-semibold text-base rounded-[6px] shadow-sm transition-colors flex items-center justify-center cursor-pointer select-none"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              <span>Procesando...</span>
            </div>
          ) : (
            <span>Pagar</span>
          )}
        </button>

        {/* High-Trust Subtle Security Badges */}
        <div className="pt-3.5 pb-1 flex flex-col items-center justify-center space-y-1 text-center">
          <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-600 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>Pago seguro con encriptación SSL de 256 bits</span>
          </div>
          <div className="flex items-center justify-center space-x-2.5 text-[11px] text-slate-400">
            <span>• Acceso inmediato</span>
            <span>• Confidencialidad garantizada</span>
            <span>• Cumple PCI-DSS</span>
          </div>
        </div>
      </form>
    </div>
  );
}
