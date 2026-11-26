'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Play,
  FileText,
  MousePointerClick,
  AlertTriangle,
  RefreshCw,
  Smartphone,
  Globe,
  ArrowDown,
  Layers,
  Download,
  Database,
  Search,
  CheckCircle2,
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
  countries: Array<{
    country: string;
    total: string;
    count: number;
    sawBtn: number;
    clicked: number;
  }>;
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
    firstSeenFormatted?: string;
  }>;
  persistedTotal?: number;
  cloudSyncStatus?: string;
  lastUpdated: string;
}

const COUNTRY_NAMES: Record<string, { name: string; flag: string }> = {
  MX: { name: 'México', flag: '🇲🇽' },
  CO: { name: 'Colômbia', flag: '🇨🇴' },
  ES: { name: 'Espanha', flag: '🇪🇸' },
  US: { name: 'Estados Unidos', flag: '🇺🇸' },
  BR: { name: 'Brasil', flag: '🇧🇷' },
  AR: { name: 'Argentina', flag: '🇦🇷' },
  CL: { name: 'Chile', flag: '🇨🇱' },
  PE: { name: 'Peru', flag: '🇵🇪' },
  EC: { name: 'Equador', flag: '🇪🇨' },
  GT: { name: 'Guatemala', flag: '🇬🇹' },
  DO: { name: 'Rep. Dominicana', flag: '🇩🇴' },
  BO: { name: 'Bolívia', flag: '🇧🇴' },
  CR: { name: 'Costa Rica', flag: '🇨🇷' },
  PA: { name: 'Panamá', flag: '🇵🇦' },
  UY: { name: 'Uruguai', flag: '🇺🇾' },
  PY: { name: 'Paraguai', flag: '🇵🇾' },
};

function getCountry(code: string) {
  const c = (code || '').toUpperCase();
  return COUNTRY_NAMES[c] || { name: c || 'Outro', flag: '🌐' };
}

export default function FunnelDashboard() {
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const calcPct = (val: number | undefined) => {
    if (!val || baseVisitors === 0) return '0%';
    return `${Math.round((val / baseVisitors) * 100)}%`;
  };

  const filteredSessions = (data?.recentSessions || []).filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const cObj = getCountry(s.country);
    return (
      s.sessionId.toLowerCase().includes(term) ||
      s.country.toLowerCase().includes(term) ||
      cObj.name.toLowerCase().includes(term) ||
      s.city.toLowerCase().includes(term) ||
      s.device.toLowerCase().includes(term) ||
      s.currentStep.toLowerCase().includes(term)
    );
  });

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
                Auditor & Inteligência de Funil
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>Gravação individual de cada lead por país, retenção de VSL e profundidade de rolagem.</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 text-xs font-semibold">
                <Database className="w-3 h-3" />
                Histórico Seguro & Permanente
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                window.open('/api/funnel-analytics?action=export_csv', '_blank');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition"
              title="Baixar todos os leads em formato Excel / Planilha"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar CSV (Excel)
            </button>

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
              Zerar
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
                Diagnóstico de Gargalo em Tempo Real:
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
              <Users className="w-3.5 h-3.5 text-blue-400" /> Visitantes Gravados
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {c?.totalVisitors || 0}
            </div>
            <span className="text-xs text-slate-500">Gravados e persistidos</span>
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

        {/* ── DISTRIBUIÇÃO POR PAÍS (GEOLOCALIZAÇÃO) ── */}
        {data?.countries && data.countries.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-emerald-400" />
              Origem dos Leads por País (Comportamento Geográfico)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {data.countries.map((item, idx) => {
                const cObj = getCountry(item.country);
                return (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl">{cObj.flag}</span>
                      <span className="font-semibold text-xs text-slate-200 truncate">{cObj.name}</span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-lg font-black text-white">{item.count} leads</span>
                      <span className="text-[11px] text-emerald-400 font-semibold">{item.clicked} compras</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {item.sawBtn} viram a oferta
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
            <FunnelBarItem
              stepNumber={1}
              label="Visualizaram a Página Inicial (Formulário)"
              count={c?.form_view || c?.totalVisitors || 0}
              total={baseVisitors}
              colorClass="bg-blue-500"
              subtext="Entrada de tráfego frio"
            />

            <FunnelBarItem
              stepNumber={2}
              label="Digitaram o WhatsApp e Clicaram em 'ESPIAR AHORA'"
              count={c?.form_submit || 0}
              total={baseVisitors}
              colorClass="bg-cyan-500"
              subtext="Engajaram com o aplicativo"
            />

            <FunnelBarItem
              stepNumber={3}
              label="Iniciaram o Vídeo da VSL (Transição de Tela)"
              count={c?.vsl_start || 0}
              total={baseVisitors}
              colorClass="bg-amber-500"
              subtext="Começaram a assistir à explicação"
            />

            <FunnelBarItem
              stepNumber={4}
              label="Assistiram 1 Minuto da VSL"
              count={c?.vsl_1m || 0}
              total={baseVisitors}
              colorClass="bg-amber-600"
              subtext="Passaram da introdução"
            />

            <FunnelBarItem
              stepNumber={5}
              label="Assistiram 3 Minutos da VSL"
              count={c?.vsl_3m || 0}
              total={baseVisitors}
              colorClass="bg-orange-500"
              subtext="Meio da narrativa"
            />

            <FunnelBarItem
              stepNumber={6}
              label="Assistiram 7m45s e o Botão de Prosseguir Apareceu"
              count={c?.vsl_cta_revealed || c?.vsl_7m45s || 0}
              total={baseVisitors}
              colorClass="bg-emerald-500"
              subtext="Chegaram no pitch e na liberação do botão"
            />

            <FunnelBarItem
              stepNumber={7}
              label="Clicaram no Botão da VSL e Foram para a Página de Resultados"
              count={c?.resultado_view || 0}
              total={baseVisitors}
              colorClass="bg-purple-500"
              subtext="Acessaram o relatório de espionagem"
            />

            <FunnelBarItem
              stepNumber={8}
              label="Rolaram a Página de Resultados até o Botão de Pagamento"
              count={c?.btn_in_view || 0}
              total={baseVisitors}
              colorClass="bg-indigo-500"
              subtext="Tiveram o botão de compra visível na tela"
            />

            <FunnelBarItem
              stepNumber={9}
              label="Clicaram no Botão para ir para o Checkout da Stripe"
              count={c?.btn_clicked || 0}
              total={baseVisitors}
              colorClass="bg-emerald-400"
              subtext="Intenção de compra manifestada"
            />
          </div>
        </div>

        {/* ── RETENÇÃO DA VSL & SCROLL DEPTH ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Card 1: Retenção da VSL */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="mb-4">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-amber-400" />
                Retenção Segundo a Segundo na VSL
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Em qual minuto as pessoas estão desistindo do vídeo?
              </p>
            </div>

            <div className="space-y-3">
              <VslRetentionRow label="Primeiros 30 segundos" count={c?.vsl_30s || 0} total={c?.vsl_start || 1} />
              <VslRetentionRow label="1 minuto de vídeo" count={c?.vsl_1m || 0} total={c?.vsl_start || 1} />
              <VslRetentionRow label="2 minutos de vídeo" count={c?.vsl_2m || 0} total={c?.vsl_start || 1} />
              <VslRetentionRow label="3 minutos de vídeo" count={c?.vsl_3m || 0} total={c?.vsl_start || 1} />
              <VslRetentionRow label="5 minutos de vídeo" count={c?.vsl_5m || 0} total={c?.vsl_start || 1} />
              <VslRetentionRow label="7m45s (Botão Liberado)" count={c?.vsl_7m45s || 0} total={c?.vsl_start || 1} highlight />
            </div>
          </div>

          {/* Card 2: Auditoria de Scroll */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="mb-4">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <ArrowDown className="w-5 h-5 text-indigo-400" />
                Auditoria de Rolagem (Scroll) em /resultado
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                A página é muito longa para o público de celular?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold">Rolaram 25%:</span>
                <div className="text-xl sm:text-2xl font-black text-white mt-1">
                  {c?.scroll_25 || 0}
                </div>
                <span className="text-xs text-slate-400">
                  {c?.resultado_view ? Math.round(((c?.scroll_25 || 0) / c.resultado_view) * 100) : 0}% dos visitantes
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold">Rolaram 50%:</span>
                <div className="text-xl sm:text-2xl font-black text-white mt-1">
                  {c?.scroll_50 || 0}
                </div>
                <span className="text-xs text-slate-400">
                  {c?.resultado_view ? Math.round(((c?.scroll_50 || 0) / c.resultado_view) * 100) : 0}% dos visitantes
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold">Rolaram 75%:</span>
                <div className="text-xl sm:text-2xl font-black text-white mt-1">
                  {c?.scroll_75 || 0}
                </div>
                <span className="text-xs text-slate-400">
                  {c?.resultado_view ? Math.round(((c?.scroll_75 || 0) / c.resultado_view) * 100) : 0}% dos visitantes
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/50 bg-emerald-950/20">
                <span className="text-xs text-emerald-400 font-semibold">Enxergaram Botão:</span>
                <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-1">
                  {c?.btn_in_view || 0}
                </div>
                <span className="text-xs text-emerald-400/80 font-medium">
                  {c?.resultado_view ? Math.round(((c?.btn_in_view || 0) / c.resultado_view) * 100) : 0}% viram a oferta
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── REGISTRO DE CADA PESSOA QUE ENTROU ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Registro Individual de Cada Lead ({filteredSessions.length} registros)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Gravando país, dispositivo, tempo de VSL e rolagem de cada visitante
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrar por país, cidade ou ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Hora</th>
                  <th className="py-2.5 px-3">Lead / ID</th>
                  <th className="py-2.5 px-3">Dispositivo</th>
                  <th className="py-2.5 px-3">País & Cidade</th>
                  <th className="py-2.5 px-3">Onde Parou</th>
                  <th className="py-2.5 px-3 text-center">Tempo VSL</th>
                  <th className="py-2.5 px-3 text-center">Scroll</th>
                  <th className="py-2.5 px-3 text-center">Viu Oferta?</th>
                  <th className="py-2.5 px-3 text-center">Clicou?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      Nenhum visitante correspondente aos filtros.
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((s, idx) => {
                    const cObj = getCountry(s.country);
                    return (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                          {s.firstSeenFormatted || 'Agora'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">
                          {s.sessionId}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          {s.device}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="text-base">{cObj.flag}</span>
                            <span>{cObj.name} {s.city ? `(${s.city})` : ''}</span>
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
                              COMPROU
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
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

function VslRetentionRow({
  label,
  count,
  total,
  highlight = false,
}: {
  label: string;
  count: number;
  total: number;
  highlight?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, Math.round((count / (total || 1)) * 100)));

  return (
    <div className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
      highlight ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-slate-950 border-slate-800'
    }`}>
      <span className={highlight ? 'text-emerald-300 font-bold' : 'text-slate-300'}>{label}</span>
      <div className="flex items-center gap-2 font-mono">
        <span className="text-white font-bold">{count}</span>
        <span className="text-slate-500 text-[11px]">({pct}%)</span>
      </div>
    </div>
  );
}
