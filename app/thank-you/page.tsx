'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, ShieldCheck, Mail, ArrowRight, Download } from 'lucide-react';

export default function ThankYouPage() {
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('funnel_customer_email') || 'your email';
      const name = localStorage.getItem('funnel_customer_name') || 'Customer';
      const orders = JSON.parse(localStorage.getItem('funnel_orders') || '[]');

      setCustomerEmail(email);
      setCustomerName(name);
      setPurchasedItems(orders.length > 0 ? orders : ['Core System & Masterclass ($27.00)']);
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 md:p-10 text-center space-y-6">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            Order Complete & Confirmed
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">
            Congratulations, {customerName}!
          </h1>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            Your payment was successfully processed. A detailed receipt and your login credentials have been sent to{' '}
            <strong className="text-slate-900">{customerEmail}</strong>.
          </p>
        </div>

        {/* Order Summary Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Summary of Your Purchases:
          </h3>
          <div className="divide-y divide-slate-200">
            {purchasedItems.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-sm text-slate-800 font-medium">
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2.5"></span>
                  {item}
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Paid
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Access Instructions */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-left flex items-start space-x-3 text-sm text-emerald-900">
          <Mail className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Check your inbox now:</span>
            <span>
              We have sent your instant access link to <strong>{customerEmail}</strong>. Be sure to check your spam or promotions folder if it doesn't arrive within 5 minutes.
            </span>
          </div>
        </div>

        {/* Security Stamp */}
        <div className="pt-4 flex items-center justify-center space-x-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Verified Stripe Payment • 256-Bit SSL Encryption</span>
        </div>
      </div>
    </div>
  );
}
