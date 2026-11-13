import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { FUNNEL_CONFIG } from '@/lib/funnel-config';

// Helper to automatically register Apple Pay domain on Stripe if not registered yet
let domainRegistered = false;
async function autoRegisterApplePayDomain(host?: string | null) {
  if (domainRegistered) return;
  try {
    const cleanDomain = (host || 'funnel-checkout-27-whats-psi.vercel.app').split(':')[0];
    if (cleanDomain && !cleanDomain.includes('localhost')) {
      const existing = await stripe.applePayDomains.list({ limit: 50 });
      const alreadyHasIt = existing.data.some(d => d.domain_name === cleanDomain);
      if (!alreadyHasIt) {
        await stripe.applePayDomains.create({ domain_name: cleanDomain });
        console.log(`[Stripe] Auto-registered Apple Pay domain: ${cleanDomain}`);
      }
      domainRegistered = true;
    }
  } catch (err: any) {
    console.warn('[Stripe] Apple Pay auto-registration:', err.message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, tracking = {} } = body;

    // Check & register Apple Pay domain in the background
    const host = req.headers.get('host');
    await autoRegisterApplePayDomain(host);

    // Filter tracking metadata for UTMify (Stripe metadata requires string key/values <= 500 chars)
    const trackingMetadata: Record<string, string> = {};
    if (tracking && typeof tracking === 'object') {
      for (const [k, v] of Object.entries(tracking)) {
        if (typeof v === 'string' && v.trim()) {
          trackingMetadata[k.slice(0, 40)] = v.slice(0, 500);
        }
      }
    }

    // 1. Create or retrieve a Stripe Customer so payment method can be saved for 1-click upsells
    const customer = await stripe.customers.create({
      email: email || undefined,
      name: name || undefined,
      metadata: {
        created_via: 'funnel_checkout',
        ...trackingMetadata,
      },
    });

    // 2. Create the PaymentIntent for the frontend offer ($27)
    // Injects all UTMify UTMs directly into PaymentIntent metadata so UTMify marks the sale!
    const paymentIntent = await stripe.paymentIntents.create({
      amount: FUNNEL_CONFIG.frontend.price, // 2700 ($27.00)
      currency: FUNNEL_CONFIG.currency,
      customer: customer.id,
      setup_future_usage: 'off_session',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        order_type: 'frontend',
        product_id: FUNNEL_CONFIG.frontend.id,
        product_name: FUNNEL_CONFIG.frontend.name,
        ...trackingMetadata,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

