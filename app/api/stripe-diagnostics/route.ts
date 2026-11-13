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

    // 3. Check existing Webhook endpoints (e.g. UTMify & our app)
    let webhooksList: any[] = [];
    let webhookRegistrationResult: any = null;
    let utmifyWebhookUpdated: any = null;

    try {
      const endpoints = await stripe.webhookEndpoints.list({ limit: 10 });
      webhooksList = endpoints.data.map(ep => ({
        id: ep.id,
        url: ep.url,
        status: ep.status,
        enabled_events: ep.enabled_events,
      }));

      // Register our app webhook in Stripe if not registered yet
      const ourWebhookUrl = `https://${domain}/api/webhooks/stripe`;
      const hasOurWebhook = endpoints.data.some(ep => ep.url === ourWebhookUrl);
      if (!hasOurWebhook && !domain.includes('localhost')) {
        webhookRegistrationResult = await stripe.webhookEndpoints.create({
          url: ourWebhookUrl,
          enabled_events: ['payment_intent.succeeded', 'payment_intent.payment_failed'],
        });
      }

      // Ensure UTMify's webhook also receives payment_intent.succeeded
      const utmifyWebhook = endpoints.data.find(ep => ep.url.includes('utmify.com.br'));
      if (utmifyWebhook && !utmifyWebhook.enabled_events.includes('payment_intent.succeeded')) {
        utmifyWebhookUpdated = await stripe.webhookEndpoints.update(utmifyWebhook.id, {
          enabled_events: [
            ...utmifyWebhook.enabled_events,
            'payment_intent.succeeded',
            'charge.succeeded',
          ] as any,
        });
      }
    } catch (e: any) {
      webhooksList = [{ error: e.message }];
    }

      // Fetch last 5 payment intents with card details
      const recentIntents = await stripe.paymentIntents.list({ limit: 5 });
      const formattedIntents = await Promise.all(recentIntents.data.map(async pi => {
        let cardCountry = null;
        let cardBrand = null;
        let cardFunding = null;
        try {
          const pmId = typeof pi.payment_method === 'string' ? pi.payment_method : (pi.last_payment_error as any)?.payment_method?.id;
          if (pmId) {
            const pm = await stripe.paymentMethods.retrieve(pmId);
            cardCountry = pm.card?.country;
            cardBrand = pm.card?.brand;
            cardFunding = pm.card?.funding;
          }
        } catch {}

        return {
          id: pi.id,
          amount: pi.amount,
          currency: pi.currency,
          status: pi.status,
          created: new Date(pi.created * 1000).toISOString(),
          customer: pi.customer,
          metadata: pi.metadata,
          last_payment_error: pi.last_payment_error?.message || null,
          decline_code: (pi.last_payment_error as any)?.decline_code || null,
          cardCountry,
          cardBrand,
          cardFunding,
        };
      }));

      const testCurrencies = ['usd', 'eur', 'mxn', 'cop', 'clp', 'pen', 'crc', 'brl', 'gbp'];
      const currencyTests: Record<string, any> = {};

      for (const curr of testCurrencies) {
        try {
          const testPi = await stripe.paymentIntents.create({
            amount: 1000,
            currency: curr,
            payment_method_types: ['card'],
          });
          currencyTests[curr] = { success: true };
          await stripe.paymentIntents.cancel(testPi.id);
        } catch (e: any) {
          currencyTests[curr] = { success: false, error: e.message };
        }
      }

      return NextResponse.json({
        timestamp: new Date().toISOString(),
        detectedDomain: domain,
        hasSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
        secretKeyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.slice(0, 8) : 'missing',
        webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET ? process.env.STRIPE_WEBHOOK_SECRET.slice(0, 10) : 'missing',
        applePayDomains: domainsList,
        registrationAttempt: domainRegistrationResult,
        applePayError: listError,
        accountInfo,
        webhooks: webhooksList,
        ourWebhookCreated: webhookRegistrationResult,
        utmifyWebhookUpdated: utmifyWebhookUpdated ? true : false,
        recentIntents: formattedIntents,
        currencyTests,
      });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
