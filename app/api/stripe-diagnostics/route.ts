import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { ensureWhitehatCatalog } from '@/lib/stripe-catalog';

export async function GET(req: Request) {
  try {
    const host = req.headers.get('host') || 'funnel-checkout-27-whats-psi.vercel.app';
    const domain = host.split(':')[0];

    // 1. Account info
    let accountInfo: any = null;
    try {
      const account = await stripe.accounts.retrieve();
      accountInfo = {
        id: account.id,
        country: account.country,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
      };
    } catch (e: any) {
      accountInfo = { error: e.message };
    }

    // 2. Ensure Whitehat Products & Prices are created in Stripe Catalog
    const catalogSetup = await ensureWhitehatCatalog();

    // 3. List all products in Stripe Catalog
    const allProducts = await stripe.products.list({ limit: 10, active: true });
    const productList = await Promise.all(
      allProducts.data.map(async (p) => {
        const prices = await stripe.prices.list({ product: p.id, limit: 5 });
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          active: p.active,
          prices: prices.data.map((pr) => ({
            id: pr.id,
            amount: (pr.unit_amount || 0) / 100,
            currency: pr.currency,
          })),
        };
      })
    );

    // 4. Recent Payment Intents
    const recentPIs = await stripe.paymentIntents.list({ limit: 8 });
    const recentPaymentIntents = recentPIs.data.map((pi) => ({
      id: pi.id,
      amount: pi.amount,
      currency: pi.currency,
      status: pi.status,
      customer: pi.customer,
      description: pi.description,
      order_type: pi.metadata?.order_type || 'unknown',
      created: new Date(pi.created * 1000).toISOString(),
    }));

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      detectedDomain: domain,
      accountInfo,
      catalogSetup,
      productList,
      recentPaymentIntents,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
