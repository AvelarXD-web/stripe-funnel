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

    // 4. Recent Payment Intents & Charges Audit (last 50 charges)
    const recentPIs = await stripe.paymentIntents.list({ limit: 25, expand: ['data.latest_charge'] });
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

    const chargesList = await stripe.charges.list({ limit: 50 });
    const chargeSummary = {
      total: chargesList.data.length,
      succeeded: 0,
      blocked_by_stripe: 0,
      declined_by_bank: 0,
      other_failed: 0,
      by_reason: {} as Record<string, number>,
      by_country: {} as Record<string, { ok: number; blocked: number; bank_declined: number }>,
    };

    const recentCharges = chargesList.data.map((c: any) => {
      const outcome = c.outcome || {};
      const country = c.payment_method_details?.card?.country || 'UNKNOWN';
      if (!chargeSummary.by_country[country]) {
        chargeSummary.by_country[country] = { ok: 0, blocked: 0, bank_declined: 0 };
      }

      if (c.status === 'succeeded') {
        chargeSummary.succeeded++;
        chargeSummary.by_country[country].ok++;
      } else if (outcome.type === 'blocked' || outcome.network_status === 'not_sent_to_network') {
        chargeSummary.blocked_by_stripe++;
        chargeSummary.by_country[country].blocked++;
      } else if (outcome.type === 'issuer_declined') {
        chargeSummary.declined_by_bank++;
        chargeSummary.by_country[country].bank_declined++;
      } else {
        chargeSummary.other_failed++;
      }

      const reasonKey = c.status === 'succeeded' ? 'succeeded' : (outcome.reason || c.failure_code || 'unknown');
      chargeSummary.by_reason[reasonKey] = (chargeSummary.by_reason[reasonKey] || 0) + 1;

      return {
        id: c.id,
        amount: c.amount / 100,
        currency: c.currency,
        status: c.status,
        order_type: c.metadata?.order_type || (c.description ? 'custom' : 'payment_link'),
        email: c.billing_details?.email || null,
        card_country: country,
        card_brand: c.payment_method_details?.card?.brand || null,
        card_funding: c.payment_method_details?.card?.funding || null,
        wallet: c.payment_method_details?.card?.wallet?.type || null,
        outcome_type: outcome.type || null,
        reason: outcome.reason || c.failure_code || null,
        risk_level: outcome.risk_level || null,
        risk_score: outcome.risk_score ?? null,
        network_status: outcome.network_status || null,
        seller_message: outcome.seller_message || null,
        created: new Date(c.created * 1000).toISOString(),
      };
    });

    let disputesCount = 0;
    let efwCount = 0;
    try {
      const disputes = await stripe.disputes.list({ limit: 10 });
      disputesCount = disputes.data.length;
    } catch {}
    try {
      const efw = await stripe.radar.earlyFraudWarnings.list({ limit: 10 });
      efwCount = efw.data.length;
    } catch {}

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      detectedDomain: domain,
      accountInfo,
      disputesCount,
      efwCount,
      chargeSummary,
      recentCharges,
      recentPaymentIntents,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
