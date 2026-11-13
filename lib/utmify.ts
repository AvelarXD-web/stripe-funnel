// Helper to notify UTMify Orders API directly
export interface UtmifyOrderPayload {
  orderId: string;
  platform?: string;
  paymentMethod?: 'credit_card' | 'boleto' | 'pix' | 'paypal' | 'free_price';
  status?: 'waiting_payment' | 'paid' | 'refused' | 'refunded' | 'chargedback';
  createdAt?: string;
  approvedDate?: string | null;
  refundedAt?: string | null;
  customer: {
    name?: string;
    email?: string;
    phone?: string | null;
    document?: string | null;
    country?: string;
    ip?: string;
  };
  products: Array<{
    id: string;
    name: string;
    planId?: string | null;
    planName?: string | null;
    quantity: number;
    priceInCents: number;
  }>;
  trackingParameters: {
    src?: string | null;
    sck?: string | null;
    utm_source?: string | null;
    utm_campaign?: string | null;
    utm_medium?: string | null;
    utm_content?: string | null;
    utm_term?: string | null;
  };
  commission?: {
    totalPriceInCents: number;
    gatewayFeeInCents?: number;
    userCommissionInCents?: number;
  };
  isTest?: boolean;
}

const UTMIFY_TOKEN =
  process.env.UTMIFY_API_TOKEN || 'zOWBwtyzhJnDx4BHVdUQbWnpo6joGyuwry2Q';

function formatUtcDate(date: Date = new Date()): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

export async function sendOrderToUtmify(payload: UtmifyOrderPayload) {
  try {
    const nowFormatted = formatUtcDate();
    const finalPayload = {
      orderId: payload.orderId,
      platform: payload.platform || 'Stripe',
      paymentMethod: payload.paymentMethod || 'credit_card',
      status: payload.status || 'paid',
      createdAt: payload.createdAt || nowFormatted,
      approvedDate: payload.approvedDate || nowFormatted,
      refundedAt: payload.refundedAt || null,
      customer: {
        name: payload.customer.name || 'Cliente ZapSpy',
        email: payload.customer.email || 'cliente@z競争.com',
        phone: payload.customer.phone || null,
        document: payload.customer.document || null,
        country: payload.customer.country || 'US',
        ip: payload.customer.ip || '',
      },
      products: payload.products,
      trackingParameters: {
        src: payload.trackingParameters.src || null,
        sck: payload.trackingParameters.sck || null,
        utm_source: payload.trackingParameters.utm_source || null,
        utm_campaign: payload.trackingParameters.utm_campaign || null,
        utm_medium: payload.trackingParameters.utm_medium || null,
        utm_content: payload.trackingParameters.utm_content || null,
        utm_term: payload.trackingParameters.utm_term || null,
      },
      commission: payload.commission || {
        totalPriceInCents: payload.products.reduce((acc, p) => acc + p.priceInCents, 0),
        gatewayFeeInCents: Math.round(
          payload.products.reduce((acc, p) => acc + p.priceInCents, 0) * 0.04
        ),
        userCommissionInCents: Math.round(
          payload.products.reduce((acc, p) => acc + p.priceInCents, 0) * 0.96
        ),
      },
      isTest: Boolean(payload.isTest),
    };

    const res = await fetch('https://api.utmify.com.br/api-credentials/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': UTMIFY_TOKEN,
      },
      body: JSON.stringify(finalPayload),
    });

    const resData = await res.json().catch(() => ({}));
    console.log(`[UTMify API] Sent order ${payload.orderId}:`, res.status, resData);
    return { success: res.ok, status: res.status, data: resData };
  } catch (err: any) {
    console.error('[UTMify API Error]:', err.message);
    return { success: false, error: err.message };
  }
}
