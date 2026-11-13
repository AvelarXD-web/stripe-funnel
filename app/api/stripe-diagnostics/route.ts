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

      // Specific customer attempt IDs to diagnose
      const targetIds = [
        'pi_3UbQdFAt2ZmVW0VR1daxlFI7',
        'pi_3UbPifAt2ZmVW0VR1WNzKH84',
        'pi_3UbPfbAt2ZmVW0VR1Bu1AJAL',
        'pi_3UbPb6At2ZmVW0VR0VaogvT0',
        'pi_3UbOsFAt2ZmVW0VR0GwATbgb',
        'pi_3UbOiBAt2ZmVW0VR12Xxq9y0',
      ];

      const specificDiagnosed = await Promise.all(targetIds.map(async id => {
        try {
          const pi = await stripe.paymentIntents.retrieve(id, {
            expand: ['latest_charge'],
          });
          const charge = typeof pi.latest_charge === 'object' ? (pi.latest_charge as any) : null;
          const outcome = charge?.outcome || null;
          const pmDetails = charge?.payment_method_details?.card || null;
          return {
            id: pi.id,
            amount: pi.amount,
            currency: pi.currency,
            status: pi.status,
            created: new Date(pi.created * 1000).toISOString(),
            last_payment_error: pi.last_payment_error,
            chargeOutcome: outcome,
            checks: pmDetails?.checks || null,
            three_d_secure: pmDetails?.three_d_secure || null,
            billingDetails: charge?.billing_details || null,
          };
        } catch (e: any) {
          return { id, error: e.message };
        }
      }));

        recentIntents: specificDiagnosed,
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
