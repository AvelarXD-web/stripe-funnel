import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(req: Request) {
  try {
    const host = req.headers.get('host') || 'funnel-checkout-27-whats-psi.vercel.app';
    const domain = host.split(':')[0];

    // 1. Check existing Apple Pay domains
    let domainsList: any[] = [];
    let listError = null;
    try {
      const list = await stripe.applePayDomains.list({ limit: 50 });
      domainsList = list.data.map(d => ({
        id: d.id,
        domain_name: d.domain_name,
        created: new Date(d.created * 1000).toISOString(),
      }));
    } catch (err: any) {
      listError = err.message;
    }

    // 2. Account info
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

    // 3. Diagnose specific declined attempts from customers
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
          customer: pi.customer,
          metadata: pi.metadata,
          last_payment_error: pi.last_payment_error?.message || null,
          decline_code: (pi.last_payment_error as any)?.decline_code || null,
          chargeOutcome: outcome ? {
            network_status: outcome.network_status,
            reason: outcome.reason,
            risk_level: outcome.risk_level,
            risk_score: outcome.risk_score,
            seller_message: outcome.seller_message,
            type: outcome.type,
            rule: outcome.rule,
          } : null,
          checks: pmDetails?.checks || null,
          three_d_secure: pmDetails?.three_d_secure || null,
          billingDetails: charge?.billing_details || null,
        };
      } catch (e: any) {
        return { id, error: e.message };
      }
    }));

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      detectedDomain: domain,
      accountInfo,
      diagnosedIntents: specificDiagnosed,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
