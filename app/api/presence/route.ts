import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

// Global in-memory presence store (persists across requests on the same serverless container)
interface VisitorSession {
  sessionId: string;
  ip: string;
  country: string;
  city: string;
  device: string;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_term: string | null;
  path: string;
  firstSeen: number;
  lastSeen: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __presence_sessions: Map<string, VisitorSession> | undefined;
  // eslint-disable-next-line no-var
  var __presence_daily_count: { date: string; count: number } | undefined;
}

if (!globalThis.__presence_sessions) {
  globalThis.__presence_sessions = new Map<string, VisitorSession>();
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDeviceInfo(ua: string): string {
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iPhone / iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Macintosh|Mac OS/i.test(ua)) return 'Mac';
  return 'Móvil / Web';
}

function cleanupStaleSessions() {
  const store = globalThis.__presence_sessions;
  if (!store) return;
  const now = Date.now();
  // Session considered offline after 35 seconds of silence
  for (const [key, session] of store.entries()) {
    if (now - session.lastSeen > 35000) {
      store.delete(key);
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { sessionId, utm = {}, path = '/' } = body;

    if (!sessionId) {
      return NextResponse.json({ ok: false, error: 'No sessionId' }, { status: 400 });
    }

    const headers = req.headers;
    const ua = headers.get('user-agent') || '';
    const country = headers.get('x-vercel-ip-country') || 'XX';
    const city = headers.get('x-vercel-ip-city') || '';
    const ip = headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    const store = globalThis.__presence_sessions!;
    const now = Date.now();
    const existing = store.get(sessionId);

    if (existing) {
      existing.lastSeen = now;
      existing.path = path;
    } else {
      store.set(sessionId, {
        sessionId,
        ip: ip.slice(0, 7) + '***',
        country,
        city,
        device: getDeviceInfo(ua),
        utm_source: utm.utm_source || null,
        utm_campaign: utm.utm_campaign || null,
        utm_medium: utm.utm_medium || null,
        utm_term: utm.utm_term || null,
        path,
        firstSeen: now,
        lastSeen: now,
      });

      // Update daily visitor counter
      const today = getTodayString();
      if (!globalThis.__presence_daily_count || globalThis.__presence_daily_count.date !== today) {
        globalThis.__presence_daily_count = { date: today, count: 1 };
      } else {
        globalThis.__presence_daily_count.count++;
      }
    }

    cleanupStaleSessions();

    return NextResponse.json({
      ok: true,
      onlineNow: store.size,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    cleanupStaleSessions();
    const store = globalThis.__presence_sessions || new Map();
    const now = Date.now();

    const activeList = Array.from(store.values()).map(s => ({
      sessionId: s.sessionId.slice(0, 8),
      device: s.device,
      country: s.country,
      city: s.city,
      utm_source: s.utm_source,
      utm_campaign: s.utm_campaign,
      utm_medium: s.utm_medium,
      utm_term: s.utm_term,
      path: s.path,
      secondsOnPage: Math.round((now - s.firstSeen) / 1000),
      lastActiveSecondsAgo: Math.round((now - s.lastSeen) / 1000),
    }));

    // Also fetch the last 8 Stripe PaymentIntents in real time so the user can see recent payment attempts!
    let recentStripeAttempts: any[] = [];
    try {
      const intents = await stripe.paymentIntents.list({ limit: 8 });
      recentStripeAttempts = intents.data.map(pi => ({
        id: pi.id,
        amount: pi.amount / 100,
        currency: pi.currency.toUpperCase(),
        status: pi.status,
        created: new Date(pi.created * 1000).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        lastError: pi.last_payment_error?.message || null,
        declineCode: pi.last_payment_error?.decline_code || null,
        utm_source: pi.metadata?.utm_source || null,
        utm_campaign: pi.metadata?.utm_campaign || null,
        utm_term: pi.metadata?.utm_term || null,
      }));
    } catch (e: any) {
      console.warn('Stripe presence list error:', e.message);
    }

    return NextResponse.json({
      onlineCount: activeList.length,
      todayTotalEstimate: globalThis.__presence_daily_count?.count || activeList.length,
      visitors: activeList,
      recentStripeAttempts,
      serverTime: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
