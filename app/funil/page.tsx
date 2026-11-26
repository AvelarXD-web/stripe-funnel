'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Eye,
  Play,
  Clock,
  Unlock,
  FileText,
  MousePointerClick,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Smartphone,
  Globe,
  ArrowDown,
  Layers,
  Percent,
} from 'lucide-react';

interface FunnelData {
  counts: {
    totalVisitors: number;
    form_view: number;
    form_submit: number;
    vsl_start: number;
    vsl_30s: number;
    vsl_1m: number;
    vsl_2m: number;
    vsl_3m: number;
    vsl_5m: number;
    vsl_7m45s: number;
    vsl_cta_revealed: number;
    vsl_cta_clicked: number;
    resultado_view: number;
    scroll_25: number;
    scroll_50: number;
    scroll_75: number;
    scroll_100: number;
    btn_in_view: number;
    btn_clicked: number;
    checkout_view: number;
    checkout_success: number;
  };
  bottleneck: string;
  recentSessions: Array<{
    sessionId: string;
    device: string;
    country: string;
    city: string;
    source: string;
    campaign: string;
    currentStep: string;
    maxScroll: string;
    vslWatched: string;
    sawButton: boolean;
    clickedButton: boolean;
    secondsAgo: number;
  }>;
  lastUpdated: string;
}

export default function FunnelDashboard() {
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/funnel-analytics');
      const json = await res.json();
      if (json && json.counts) {
        setData(json);
      }
    } catch (e) {
      console.warn('Erro ao carregar analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    if (!autoRefresh) return;
    const interval = setInterval(fetchAnalytics, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const c = data?.counts;
  const baseVisitors = Math.max(c?.totalVisitors || 0, c?.form_view || 0, 1);

  // Helper de porcentagem
  const calcPct = (val: number | undefined) => {
    if (!val || baseVisitors === 0) return '0%';
    return `${Math.round((val / baseVisitors) * 100)}%`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── HEADER ── */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <Layers className="w-6 h-6 text-emerald-400" />
                Painel de Inteligência de Funil
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Rastreamento de conversão por etapa, retenção de VSL e profundidade de rolagem (scroll)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                autoRefresh
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              {autoRefresh ? '● Ao vivo (4s)' : 'Pausado'}
            </button>

            <button
              onClick={fetchAnalytics}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>

            <button
              onClick={async () => {
                if (confirm('Deseja zerar as estatísticas para iniciar um novo teste do zero?')) {
                  await fetch('/api/funnel-analytics?action=reset');
                  fetchAnalytics();
                }
              }}
              className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-xs font-medium text-rose-300 transition"
              title="Limpar sessões acumuladas"
            >
              Zerar Métricas
            </button>
          </div>
        </header>

        {/* ── ALERTA DE DIAGNÓSTICO (O GARGALO REAL) ── */}
        {data?.bottleneck && (
          <div className={`p-4 rounded-xl border flex items-start gap-3.5 shadow-lg ${
            data.bottleneck.startsWith('🚨')
              ? 'bg-rose-950/40 border-rose-600/40 text-rose-200'
              : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
          }`}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
            <div>
              <h3 className="font-bold text-sm tracking-wide uppercase text-white">
                Diagnóstico de Comportamento em Tempo Real:
              </h3>
              <p className="text-sm font-medium mt-0.5 leading-relaxed">
                {data.bottleneck}
              </p>
            </div>
          </div>
        )}

        {/* ── KPI HIGHLIGHTS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" /> Visitantes Totais
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {c?.totalVisitors || 0}
            </div>
            <span className="text-xs text-slate-500">Hoje</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-amber-400" /> Iniciaram VSL
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {c?.vsl_start || 0}
            </div>
            <span className="text-xs text-amber-400/90 font-medium">
              {calcPct(c?.vsl_start)} do tráfego
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-400" /> Página Resultados
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {c?.resultado_view || 0}
            </div>
            <span className="text-xs text-purple-400/90 font-medium">
              {calcPct(c?.resultado_view)} do tráfego
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" /> Clicaram Checkout
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
              {c?.btn_clicked || 0}
            </div>
            <span className="text-xs text-emerald-400/90 font-medium">
              {calcPct(c?.btn_clicked)} conversão final
            </span>
          </div>
        </div>

        {/* ── FUNIL VISUAL (WATERFALL) ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                Funil de Passagem Completo (Passo a Passo)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Veja onde a audiência está se perdendo antes de comprar
              </p>
            </div>
          </div>

          <div className="space-y-4">

            {/* Passo 1 */}
            <FunnelBarItem
              stepNumber={1}
              label="Visualizaram a Página Inicial (Formulário)"
              count={c?.form_view || c?.totalVisitors || 0}
              total={baseVisitors}
              colorClass="bg-blue-500"
              subtext="Entrada de tráfego frio"
            />

            {/* Passo 2 */}
            <FunnelBarItem
              stepNumber={2}
              label="Digitaram o WhatsApp e Clicaram em 'ESPIAR AHORA'"
              count={c?.form_submit || 0}
              total={baseVisitors}
              colorClass="bg-indigo-500"
              subtext="Interagiram com a ferramenta"
            />

            {/* Passo 3 */}
            <FunnelBarItem
              stepNumber={3}
              label="Começaram a Assistir a VSL (Vídeo de Investigação)"
              count={c?.vsl_start || 0}
              total={baseVisitors}
              colorClass="bg-violet-500"
              subtext="Assistindo ao conteúdo"
            />

            {/* Passo 3 Retenção */}
            <div className="pl-6 sm:pl-10 py-2 border-l-2 border-slate-800 ml-4 sm:ml-5 space-y-2 text-xs">
              <div className="text-slate-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-400" /> Retenção no Vídeo:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                  <span className="text-slate-400">1 Minuto:</span>
                  <div className="font-bold text-white">{c?.vsl_1m || 0} <span className="text-slate-500 font-normal">({calcPct(c?.vsl_1m)})</span></div>
                </div>
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                  <span className="text-slate-400">3 Minutos:</span>
                  <div className="font-bold text-white">{c?.vsl_3m || 0} <span className="text-slate-500 font-normal">({calcPct(c?.vsl_3m)})</span></div>
                </div>
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                  <span className="text-slate-400">5 Minutos:</span>
                  <div className="font-bold text-white">{c?.vsl_5m || 0} <span className="text-slate-500 font-normal">({calcPct(c?.vsl_5m)})</span></div>
                </div>
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                  <span className="text-slate-400">7m45s (Final):</span>
                  <div className="font-bold text-emerald-400">{c?.vsl_7m45s || 0} <span className="text-slate-500 font-normal">({calcPct(c?.vsl_7m45s)})</span></div>
                </div>
              </div>
            </div>

            {/* Passo 4 */}
            <FunnelBarItem
              stepNumber={4}
              label="Botão da VSL Liberado & Clicado ('Ver el resultado')"
              count={c?.vsl_cta_clicked || 0}
              total={baseVisitors}
              colorClass="bg-amber-500"
              subtext="Avançaram para o relatório"
            />

            {/* Passo 5 */}
            <FunnelBarItem
              stepNumber={5}
              label="Chegaram na Página de Resultados (/resultado)"
              count={c?.resultado_view || 0}
              total={baseVisitors}
              colorClass="bg-orange-500"
              subtext="Abriram a tela com as provas borradas"
            />

            {/* Passo 6 (O teste real do Scroll) */}
            <FunnelBarItem
              stepNumber={6}
              label="O Botão de Compra Ficou VISÍVEL na Tela do Celular (Scroll)"
              count={c?.btn_in_view || 0}
              total={baseVisitors}
              colorClass={c?.btn_in_view && c.resultado_view && (c.btn_in_view / c.resultado_view < 0.3) ? 'bg-rose-500' : 'bg-emerald-500'}
              subtext={c?.btn_in_view && c.resultado_view ? `${Math.round((c.btn_in_view / c.resultado_view) * 100)}% de quem chegou em /resultado rolou até o botão` : 'Rolaram a página até encontrar a oferta'}
            />

            {/* Passo 7 */}
            <FunnelBarItem
              stepNumber={7}
              label="CLICARAM no Botão de Desbloquear ($27 USD)"
              count={c?.btn_clicked || 0}
              total={baseVisitors}
              colorClass="bg-emerald-400"
              subtext="Intenção de compra manifestada"
            />

            {/* Passo 8 */}
            <FunnelBarItem
              stepNumber={8}
              label="Venda Aprovada (Stripe)"
              count={c?.checkout_success || 0}
              total={baseVisitors}
              colorClass="bg-green-300"
              subtext="Conversão concluída"
            />

          </div>
        </div>

        {/* ── PROFUNDIDADE DE SCROLL NA PÁGINA DE RESULTADOS ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <ArrowDown className="w-5 h-5 text-indigo-400" />
                Auditoria de Rolagem (Scroll Depth) na Página de Resultados
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Descubra com precisão matemática se a página está longa demais para o público mobile
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold">Rolaram 25% da página:</span>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                {c?.scroll_25 || 0}
              </div>
              <span className="text-xs text-slate-400">
                {c?.resultado_view ? Math.round(((c?.scroll_25 || 0) / c.resultado_view) * 100) : 0}% dos visitantes
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold">Rolaram 50% da página:</span>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                {c?.scroll_50 || 0}
              </div>
              <span className="text-xs text-slate-400">
                {c?.resultado_view ? Math.round(((c?.scroll_50 || 0) / c.resultado_view) * 100) : 0}% dos visitantes
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold">Rolaram 75% da página:</span>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                {c?.scroll_75 || 0}
              </div>
              <span className="text-xs text-slate-400">
                {c?.resultado_view ? Math.round(((c?.scroll_75 || 0) / c.resultado_view) * 100) : 0}% dos visitantes
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/50 bg-emerald-950/20">
              <span className="text-xs text-emerald-400 font-semibold">Enxergaram o Botão:</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-1">
                {c?.btn_in_view || 0}
              </div>
              <span className="text-xs text-emerald-400/80 font-medium">
                {c?.resultado_view ? Math.round(((c?.btn_in_view || 0) / c.resultado_view) * 100) : 0}% viram a oferta
              </span>
            </div>
          </div>
        </div>

        {/* ── FEED DE LEADS AO VIVO ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Feed de Leads Recentes & Comportamento
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Últimos visitantes navegando pelo funil em tempo real
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Lead / Sessão</th>
                  <th className="py-2.5 px-3">Dispositivo</th>
                  <th className="py-2.5 px-3">País</th>
                  <th className="py-2.5 px-3">Etapa Atual</th>
                  <th className="py-2.5 px-3 text-center">Tempo VSL</th>
                  <th className="py-2.5 px-3 text-center">Scroll Máx</th>
                  <th className="py-2.5 px-3 text-center">Viu Oferta?</th>
                  <th className="py-2.5 px-3 text-center">Clicou?</th>
                  <th className="py-2.5 px-3 text-right">Última ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {!data?.recentSessions || data.recentSessions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      Nenhum visitante registrado ainda. Insira o script nas páginas para começar a monitorar!
                    </td>
                  </tr>
                ) : (
                  data.recentSessions.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {s.sessionId}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                        {s.device}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-400" />
                          {s.country} {s.city ? `(${s.city})` : ''}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px]">
                          {s.currentStep}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-amber-300">
                        {s.vslWatched}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                        {s.maxScroll}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {s.sawButton ? (
                          <span className="text-emerald-400 font-bold">Sim</span>
                        ) : (
                          <span className="text-slate-600">Não</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {s.clickedButton ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/40 text-[11px] font-bold">
                            CLICOU
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">
                        há {s.secondsAgo}s
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

function FunnelBarItem({
  stepNumber,
  label,
  count,
  total,
  colorClass,
  subtext,
}: {
  stepNumber: number;
  label: string;
  count: number;
  total: number;
  colorClass: string;
  subtext: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round((count / (total || 1)) * 100)));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
            {stepNumber}
          </span>
          <span className="font-semibold text-white">{label}</span>
          <span className="hidden sm:inline text-xs text-slate-400">({subtext})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-black text-white text-sm sm:text-base">{count}</span>
          <span className="text-xs font-semibold text-slate-400 w-12 text-right">
            {pct}%
          </span>
        </div>
      </div>

      <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
        />
      </div>
    </div>
  );
}
