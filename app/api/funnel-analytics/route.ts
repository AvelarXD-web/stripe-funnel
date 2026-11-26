import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface FunnelSession {
  sessionId: string;
  ip: string;
  country: string;
  city: string;
  device: string;
  utm: {
    source: string | null;
    campaign: string | null;
    medium: string | null;
    content: string | null;
  };
  firstSeen: number;
  lastSeen: number;
  currentStep: string;
  steps: Record<string, number>;
  maxScroll: number;
  vslSecondsWatched: number;
}

const TMP_FILE = '/tmp/funnel_sessions.json';

declare global {
  // eslint-disable-next-line no-var
  var __funnel_sessions: Map<string, FunnelSession> | undefined;
}

function loadSessions(): Map<string, FunnelSession> {
  if (globalThis.__funnel_sessions) {
    return globalThis.__funnel_sessions;
  }
  const store = new Map<string, FunnelSession>();
  try {
    if (fs.existsSync(TMP_FILE)) {
      const raw = fs.readFileSync(TMP_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          store.set(item.sessionId, item);
        }
      }
    }
  } catch (e) {
    console.warn('Error loading funnel sessions from tmp:', e);
  }
  globalThis.__funnel_sessions = store;
  return store;
}

function persistSessions(store: Map<string, FunnelSession>) {
  try {
    const list = Array.from(store.values()).slice(-500); // keep last 500
    fs.writeFileSync(TMP_FILE, JSON.stringify(list), 'utf-8');
  } catch (e) {
    // ignore in serverless if disk is read-only
  }
}

function getDeviceInfo(ua: string): string {
  if (/iPhone/i.test(ua)) return 'iPhone (iOS)';
  if (/iPad/i.test(ua)) return 'iPad (iOS)';
  if (/Android/i.test(ua)) return 'Android Móvil';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Macintosh|Mac OS/i.test(ua)) return 'Mac';
  return 'Móvil / Web';
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      sessionId,
      event,
      step,
      utm = {},
      scrollPercent = 0,
      vslSeconds = 0,
      extra = {},
    } = body;

    if (!sessionId || !event) {
      return NextResponse.json({ ok: false, error: 'sessionId and event required' }, { status: 400 });
    }

    const headers = req.headers;
    const ua = headers.get('user-agent') || '';
    const country = headers.get('x-vercel-ip-country') || 'XX';
    const city = headers.get('x-vercel-ip-city') || '';
    const ip = headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    const store = loadSessions();
    const now = Date.now();
    let session = store.get(sessionId);

    if (!session) {
      session = {
        sessionId,
        ip: ip.slice(0, 7) + '***',
        country,
        city,
        device: getDeviceInfo(ua),
        utm: {
          source: utm.utm_source || null,
          campaign: utm.utm_campaign || null,
          medium: utm.utm_medium || null,
          content: utm.utm_content || null,
        },
        firstSeen: now,
        lastSeen: now,
        currentStep: step || event,
        steps: {},
        maxScroll: 0,
        vslSecondsWatched: 0,
      };
      store.set(sessionId, session);
    }

    session.lastSeen = now;
    if (step) session.currentStep = step;
    session.steps[event] = now;

    if (scrollPercent > session.maxScroll) {
      session.maxScroll = scrollPercent;
      if (scrollPercent >= 25) session.steps['scroll_25'] = session.steps['scroll_25'] || now;
      if (scrollPercent >= 50) session.steps['scroll_50'] = session.steps['scroll_50'] || now;
      if (scrollPercent >= 75) session.steps['scroll_75'] = session.steps['scroll_75'] || now;
      if (scrollPercent >= 90) session.steps['scroll_100'] = session.steps['scroll_100'] || now;
    }

    if (vslSeconds > session.vslSecondsWatched) {
      session.vslSecondsWatched = vslSeconds;
      if (vslSeconds >= 30) session.steps['vsl_30s'] = session.steps['vsl_30s'] || now;
      if (vslSeconds >= 60) session.steps['vsl_1m'] = session.steps['vsl_1m'] || now;
      if (vslSeconds >= 120) session.steps['vsl_2m'] = session.steps['vsl_2m'] || now;
      if (vslSeconds >= 180) session.steps['vsl_3m'] = session.steps['vsl_3m'] || now;
      if (vslSeconds >= 300) session.steps['vsl_5m'] = session.steps['vsl_5m'] || now;
      if (vslSeconds >= 465) session.steps['vsl_7m45s'] = session.steps['vsl_7m45s'] || now;
    }

    // Persist to tmp occasionally
    if (Math.random() < 0.2) {
      persistSessions(store);
    }

    return NextResponse.json({ ok: true, stepRegistered: event });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const store = loadSessions();
    const sessions = Array.from(store.values());
    const now = Date.now();

    // Counts across all sessions
    const counts = {
      totalVisitors: sessions.length,
      form_view: 0,
      form_submit: 0,
      vsl_start: 0,
      vsl_30s: 0,
      vsl_1m: 0,
      vsl_2m: 0,
      vsl_3m: 0,
      vsl_5m: 0,
      vsl_7m45s: 0,
      vsl_cta_revealed: 0,
      vsl_cta_clicked: 0,
      resultado_view: 0,
      scroll_25: 0,
      scroll_50: 0,
      scroll_75: 0,
      scroll_100: 0,
      btn_in_view: 0,
      btn_clicked: 0,
      checkout_view: 0,
      checkout_success: 0,
    };

    for (const s of sessions) {
      if (s.steps['form_view']) counts.form_view++;
      if (s.steps['form_submit']) counts.form_submit++;
      if (s.steps['vsl_start']) counts.vsl_start++;
      if (s.steps['vsl_30s']) counts.vsl_30s++;
      if (s.steps['vsl_1m']) counts.vsl_1m++;
      if (s.steps['vsl_2m']) counts.vsl_2m++;
      if (s.steps['vsl_3m']) counts.vsl_3m++;
      if (s.steps['vsl_5m']) counts.vsl_5m++;
      if (s.steps['vsl_7m45s']) counts.vsl_7m45s++;
      if (s.steps['vsl_cta_revealed']) counts.vsl_cta_revealed++;
      if (s.steps['vsl_cta_clicked']) counts.vsl_cta_clicked++;
      if (s.steps['resultado_view']) counts.resultado_view++;
      if (s.steps['scroll_25']) counts.scroll_25++;
      if (s.steps['scroll_50']) counts.scroll_50++;
      if (s.steps['scroll_75']) counts.scroll_75++;
      if (s.steps['scroll_100']) counts.scroll_100++;
      if (s.steps['btn_in_view']) counts.btn_in_view++;
      if (s.steps['btn_clicked']) counts.btn_clicked++;
      if (s.steps['checkout_view']) counts.checkout_view++;
      if (s.steps['checkout_success']) counts.checkout_success++;
    }

    // Determine Bottleneck Diagnostic
    let bottleneck = 'Aguardando mais dados de tráfego para diagnosticar com precisão.';
    if (counts.totalVisitors >= 3) {
      if (counts.form_submit / (counts.form_view || 1) < 0.3) {
        bottleneck = '🚨 GARGALO CRÍTICO NA ETAPA 1: Menos de 30% das pessoas estão digitando o número e clicando em "ESPIAR AHORA". Revise a headline inicial ou a chamada de ação!';
      } else if (counts.vsl_cta_clicked / (counts.vsl_start || 1) < 0.15) {
        bottleneck = '🚨 GARGALO NA RETENÇÃO DA VSL: As pessoas começam o vídeo, mas saem antes do botão aparecer (delay de 7m45s). A maioria abandona entre 1 e 3 minutos!';
      } else if (counts.resultado_view > 0 && counts.btn_in_view / counts.resultado_view < 0.25) {
        bottleneck = '🚨 GARGALO CONFIRMADO NA PÁGINA DE RESULTADOS: Os leads entram em /resultado, mas mais de 75% NÃO rolam até o botão de compra! A página está muito longa ou o botão precisa ficar fixo/visível mais em cima!';
      } else if (counts.btn_in_view > 0 && counts.btn_clicked / counts.btn_in_view < 0.1) {
        bottleneck = '🚨 GARGALO NO VALOR/PREÇO: Os leads rolam e chegam a enxergar o botão de $27 USD, mas não clicam para ir ao checkout!';
      } else if (counts.checkout_view > 0 && counts.checkout_success / counts.checkout_view < 0.05) {
        bottleneck = '🚨 GARGALO NO GATEWAY: Os leads clicam no checkout, mas estão sendo barrados pelo antifraude ou recusa de cartão!';
      } else {
        bottleneck = '✅ Funil operando normalmente sem vazamento extremo evidente no momento.';
      }
    }

    // Format recent sessions for live feed
    const recentSessions = sessions
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, 30)
      .map(s => ({
        sessionId: s.sessionId.slice(0, 8),
        device: s.device,
        country: s.country,
        city: s.city,
        source: s.utm.source || 'direto',
        campaign: s.utm.campaign || '-',
        currentStep: s.currentStep,
        maxScroll: s.maxScroll + '%',
        vslWatched: Math.round(s.vslSecondsWatched) + 's',
        sawButton: !!s.steps['btn_in_view'],
        clickedButton: !!s.steps['btn_clicked'],
        secondsAgo: Math.round((now - s.lastSeen) / 1000),
      }));

    return NextResponse.json({
      counts,
      bottleneck,
      recentSessions,
      lastUpdated: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
