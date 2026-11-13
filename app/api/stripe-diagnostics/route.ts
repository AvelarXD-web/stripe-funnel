import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(req: Request) {
  try {
    const host = req.headers.get('host') || 'funnel-checkout-27-whats-psi.vercel.app';
    const domain = host.split(':')[0];

    // 1. Check existing Apple Pay domains registered with this Stripe account
    let domainsList: any[] = [];
    let domainRegistrationResult: any = null;
    let listError = null;

    try {
      const list = await stripe.applePayDomains.list({ limit: 50 });
      domainsList = list.data.map(d => ({
        id: d.id,
        domain_name: d.domain_name,
        created: new Date(d.created * 1000).toISOString(),
      }));

      const isRegistered = domainsList.some(d => d.domain_name === domain);
      if (!isRegistered && domain && !domain.includes('localhost')) {
        domainRegistrationResult = await stripe.applePayDomains.create({
          domain_name: domain,
        });
      }
    } catch (err: any) {
      listError = err.message;
    }

    // 2. Check Stripe account mode (test vs live) and capabilities
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

    // 3. Check existing Webhook endpoints (e.g. UTMify)
    let webhooksList: any[] = [];
    try {
      const endpoints = await stripe.webhookEndpoints.list({ limit: 10 });
      webhooksList = endpoints.data.map(ep => ({
        id: ep.id,
        url: ep.url,
        status: ep.status,
        enabled_events: ep.enabled_events,
      }));
    } catch (e: any) {
      webhooksList = [{ error: e.message }];
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      detectedDomain: domain,
      hasSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
      secretKeyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.slice(0, 8) : 'missing',
      applePayDomains: domainsList,
      registrationAttempt: domainRegistrationResult,
      applePayError: listError,
      accountInfo,
      webhooks: webhooksList,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
