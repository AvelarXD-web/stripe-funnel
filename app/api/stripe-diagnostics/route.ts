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

    // 4. Recent Payment Intents & Customer Check
    const recentPIs = await stripe.paymentIntents.list({ limit: 8, expand: ['data.latest_charge'] });
    const recentPaymentIntents = recentPIs.data.map((pi: any) => ({
      id: pi.id,
      amount: pi.amount,
      currency: pi.currency,
      status: pi.status,
      customer: pi.customer,
      description: pi.description,
      order_type: pi.metadata?.order_type || 'unknown',
      last_payment_error: pi.last_payment_error ? {
        code: pi.last_payment_error.code,
        decline_code: pi.last_payment_error.decline_code,
        message: pi.last_payment_error.message,
        type: pi.last_payment_error.type,
      } : null,
      charge_outcome: pi.latest_charge?.outcome ? {
        network_status: pi.latest_charge.outcome.network_status,
        reason: pi.latest_charge.outcome.reason,
        risk_level: pi.latest_charge.outcome.risk_level,
        risk_score: pi.latest_charge.outcome.risk_score,
        seller_message: pi.latest_charge.outcome.seller_message,
        type: pi.latest_charge.outcome.type,
      } : null,
      created: new Date(pi.created * 1000).toISOString(),
    }));

    // Check payment methods for latest customer cus_VdwqAoIlaFlax3
    let customerAudit: any = null;
    try {
      const pmList = await stripe.paymentMethods.list({ customer: 'cus_VdwqAoIlaFlax3' });
      customerAudit = {
        customerId: 'cus_VdwqAoIlaFlax3',
        pmCount: pmList.data.length,
        pms: pmList.data.map(p => ({
          id: p.id,
          type: p.type,
          card: p.card ? { brand: p.card.brand, country: p.card.country, funding: p.card.funding } : null,
        })),
      };
    } catch (e: any) {
      customerAudit = { error: e.message };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      detectedDomain: domain,
      accountInfo,
      catalogSetup,
      productList,
      recentPaymentIntents,
      customerAudit,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
