'use client';

import React, { useEffect, useState } from 'react';
import { Users, CreditCard, Activity, RefreshCw, AlertTriangle, CheckCircle2, Shield, Smartphone, Globe } from 'lucide-react';

interface Visitor {
  sessionId: string;
  device: string;
  country: string;
  city: string;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_term: string | null;
  path: string;
  secondsOnPage: number;
  lastActiveSecondsAgo: number;
}

interface StripeAttempt {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: string;
  lastError: string | null;
  declineCode: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
}

export default function OnlineDashboard() {
  const [onlineCount, setOnlineCount] = useState(0);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [stripeAttempts, setStripeAttempts] = useState<StripeAttempt[]>([]);
  const [serverTime, setServerTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      const res = await fetch('/api/presence');
      const data = await res.json();
      if (data) {
        setOnlineCount(data.onlineCount || 0);
        setVisitors(data.visitors || []);
        setStripeAttempts(data.recentStripeAttempts || []);
        setServerTime(data.serverTime || '');
        setLastRefreshed(new Date());
      }
    } catch (e) {
      console.warn('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Painel Ao Vivo — Checkout ZapSpy
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Monitoramento em tempo real de visitantes online e tentativas de pagamento na Stripe.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-lg self-start sm:self-auto">
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualiza a cada 3s • {serverTime || lastRefreshed.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Big Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Visitantes no Checkout Agora
              </span>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/40 animate-pulse">
                AO VIVO
              </span>
            </div>
            <div className="mt-4 flex items-baseline space-x-3">
              <span className="text-4xl sm:text-5xl font-black text-white">{onlineCount}</span>
              <span className="text-xs text-slate-400">
                {onlineCount === 1 ? 'pessoa navegando no checkout' : 'pessoas navegando no checkout'}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-400" /> Gateway & Checkout
              </span>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-500/10 text-blue-300 rounded-full border border-blue-500/30">
                Stripe Ativa
              </span>
            </div>
            <div className="mt-4 flex items-baseline space-x-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">Pronto & Blindado</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Aceitando cartões mundiais, Apple Pay, Google Pay com 1-clique ativo.
            </p>
          </div>
        </div>

        {/* Live Visitors Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Quem está no checkout agora ({visitors.length})
            </h2>
          </div>

          {visitors.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Nenhum visitante ativo no exato segundo. Assim que alguém clicar no anúncio, aparece aqui na hora!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2.5 font-medium">Dispositivo</th>
                    <th className="pb-2.5 font-medium">País / Local</th>
                    <th className="pb-2.5 font-medium">Campanha / UTM</th>
                    <th className="pb-2.5 font-medium">Tempo no Checkout</th>
                    <th className="pb-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {visitors.map((v) => (
                    <tr key={v.sessionId} className="hover:bg-slate-800/40">
                      <td className="py-3 flex items-center gap-2 text-white font-medium">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                        {v.device}
                      </td>
                      <td className="py-3 text-slate-300">
                        <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[11px] mr-1">
                          {v.country}
                        </span>
                        {v.city ? `${v.city}` : ''}
                      </td>
                      <td className="py-3 text-slate-300 max-w-[220px] truncate">
                        <span className="text-emerald-400 font-semibold">{v.utm_source || 'Direto'}</span>
                        {v.utm_campaign && (
                          <span className="text-slate-400 block text-[11px] truncate">
                            {v.utm_campaign}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-slate-300">
                        {v.secondsOnPage < 60
                          ? `${v.secondsOnPage}s`
                          : `${Math.floor(v.secondsOnPage / 60)}m ${v.secondsOnPage % 60}s`}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                          Navegando
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Stripe Attempts Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" /> Histórico em Tempo Real de Pagamentos na Stripe
            </h2>
            <span className="text-xs text-slate-400">Últimas tentativas capturadas</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2.5 font-medium">Horário</th>
                  <th className="pb-2.5 font-medium">Valor</th>
                  <th className="pb-2.5 font-medium">Status Stripe</th>
                  <th className="pb-2.5 font-medium">Resultado do Banco</th>
                  <th className="pb-2.5 font-medium">Origem (UTM)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stripeAttempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-slate-800/40">
                    <td className="py-3 font-mono text-slate-300">{attempt.created}</td>
                    <td className="py-3 font-bold text-white">
                      ${attempt.amount.toFixed(2)} {attempt.currency}
                    </td>
                    <td className="py-3">
                      {attempt.status === 'succeeded' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Aprovado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                          <AlertTriangle className="w-3 h-3 text-amber-400" /> Tentativa
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-slate-300">
                      {attempt.status === 'succeeded' ? (
                        <span className="text-emerald-400 font-semibold">Pagamento Aceito ✅</span>
                      ) : attempt.lastError ? (
                        <span className="text-rose-400 font-medium">
                          {attempt.lastError === 'Your card was declined.'
                            ? 'Cartão recusado pelo banco emissor'
                            : attempt.lastError ===
                              'Your card has insufficient funds. Use a different payment method to complete this purchase.'
                            ? 'Saldo insuficiente'
                            : attempt.lastError}
                        </span>
                      ) : (
                        <span className="text-slate-400">Iniciado no checkout</span>
                      )}
                    </td>
                    <td className="py-3 text-slate-400 max-w-[200px] truncate">
                      {attempt.utm_source ? (
                        <span className="text-slate-300 font-medium">{attempt.utm_source}</span>
                      ) : (
                        <span className="text-slate-500">Direto / Orgânico</span>
                      )}
                      {attempt.utm_campaign && (
                        <span className="block text-[11px] text-slate-500 truncate">
                          {attempt.utm_campaign}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
