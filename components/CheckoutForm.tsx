'use client';

import React, { useState } from 'react';
import {
  PaymentElement,
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';
import { FUNNEL_CONFIG } from '@/lib/funnel-config';

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expressAvailable, setExpressAvailable] = useState(false);

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

      // Preserve all UTMs and tracking params
      if (typeof window !== 'undefined') {
        const currentParams = new URLSearchParams(window.location.search);
        currentParams.forEach((value, key) => {
          target.searchParams.set(key, value);
        });
      }

      target.searchParams.set('customer_id', customerId);
      return target.toString();
    } catch {
      return `${rawUrl}?customer_id=${customerId}`;
    }
  };

  // 1-Click Express Checkout Handler (Apple Pay, Google Pay, Stripe Link)
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
      const customerEmail = billingDetails.email || email || 'cliente@checkout.com';
      const customerName = billingDetails.name || name || 'Cliente Digital';

      // Create Customer and PaymentIntent on server
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: customerEmail, name: customerName }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        if (event?.paymentFailed) {
          event.paymentFailed({ message: data.error || 'No se pudo iniciar el pedido.' });
        }
        throw new Error(data.error || 'No se pudo iniciar el pedido.');
      }

      const { clientSecret, customerId } = data;

      // Save customer for subsequent 1-click upsells
      if (typeof window !== 'undefined') {
        localStorage.setItem('funnel_customer_id', customerId);
        localStorage.setItem('funnel_customer_email', customerEmail);
        localStorage.setItem('funnel_customer_name', customerName);
        localStorage.setItem(
          'funnel_orders',
          JSON.stringify([`${FUNNEL_CONFIG.frontend.name} (${FUNNEL_CONFIG.frontend.displayPrice})`])
        );
      }

      // Confirm payment with Stripe
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: getUpsellRedirectUrl(customerId),
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

    if (!name.trim() || !email.trim()) {
      setErrorMessage('Por favor, ingresa tu nombre completo y correo electrónico.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // 1. Trigger form validation in Stripe Elements
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setErrorMessage(submitError.message || 'Por favor, verifica los datos de pago.');
      setIsLoading(false);
      return;
    }

    try {
      // 2. Create customer and get clientSecret on the fly
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'No se pudo iniciar el pedido.');
      }

      const { clientSecret, customerId } = data;

      // 3. Save customer details for subsequent 1-click upsells
      if (typeof window !== 'undefined') {
        localStorage.setItem('funnel_customer_id', customerId);
        localStorage.setItem('funnel_customer_email', email);
        localStorage.setItem('funnel_customer_name', name);
        localStorage.setItem(
          'funnel_orders',
          JSON.stringify([`${FUNNEL_CONFIG.frontend.name} (${FUNNEL_CONFIG.frontend.displayPrice})`])
        );
      }

      // 4. Confirm payment with Stripe
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: getUpsellRedirectUrl(customerId),
          payment_method_data: {
            billing_details: {
              name: name,
              email: email,
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
    <div className="space-y-4">
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Express Checkout Element: Apple Pay, Google Pay, Stripe Link */}
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
          }}
        />
      </div>

      {/* Visual Divider if Express Wallets are detected */}
      {expressAvailable && (
        <div className="relative my-3 flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            o pagar con tarjeta
          </span>
          <div className="border-t border-slate-200 w-full" />
        </div>
      )}

      {/* Main Form for Customer Details & Card */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Information with solid visible borders */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border-[1.5px] border-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              placeholder="juan@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border-[1.5px] border-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Payment Methods - Highlighted title with clear separation */}
        <div className="pt-3 border-t border-slate-200/80">
          <label className="block text-sm font-bold text-slate-800 mb-2.5">
            Datos de la Tarjeta
          </label>
          <PaymentElement
            id="payment-element"
            options={{
              layout: {
                type: 'tabs',
                defaultCollapsed: false,
              },
              wallets: {
                applePay: 'auto',
                googlePay: 'auto',
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

        {/* 1-Step Pay Button in Spanish */}
        <button
          type="submit"
          disabled={isLoading || !stripe || !elements}
          className="w-full mt-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-base rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Procesando pago...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Pagar {FUNNEL_CONFIG.frontend.displayPrice}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
