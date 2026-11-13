'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, ShieldCheck, Mail } from 'lucide-react';

export default function ThankYouPage() {
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('funnel_customer_email') || 'tu correo';
      const name = localStorage.getItem('funnel_customer_name') || 'Cliente';
      const orders = JSON.parse(localStorage.getItem('funnel_orders') || '[]');

      setCustomerEmail(email);
      setCustomerName(name);
      setPurchasedItems(orders.length > 0 ? orders : ['Start Digital System ($27.00)']);
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 md:p-10 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            Pedido Completado y Confirmado
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">
            ¡Felicitaciones, {customerName}!
          </h1>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            Tu pago ha sido procesado con éxito. Hemos enviado un recibo detallado y tus credenciales de acceso a{' '}
            <strong className="text-slate-900">{customerEmail}</strong>.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Resumen de tus compras:
          </h3>
          <div className="divide-y divide-slate-200">
            {purchasedItems.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-sm text-slate-800 font-medium">
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2.5"></span>
                  {item}
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Pagado
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-left flex items-start space-x-3 text-sm text-emerald-900">
          <Mail className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Revisa tu bandeja de entrada:</span>
            <span>
              Hemos enviado tu enlace de acceso a <strong>{customerEmail}</strong>. Si no lo ves en 5 minutos, recuerda revisar tu carpeta de correo no deseado o spam.
            </span>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-center space-x-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Pago Verificado por Stripe • Encriptación SSL de 256 bits</span>
        </div>
      </div>
    </div>
  );
}
