import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import {
  FUNNEL_CONFIG,
  getCurrencyConfig,
  detectCurrencyForCountry,
} from '@/lib/funnel-config';

// Helper to automatically register Apple Pay domain on Stripe if not registered yet
let domainRegistered = false;
async function autoRegisterApplePayDomain(host?: string | null) {
  if (domainRegistered) return;
  try {
    const cleanDomain = (host || 'funnel-checkout-27-whats-psi.vercel.app').split(':')[0];
    if (cleanDomain && !cleanDomain.includes('localhost')) {
      const existing = await stripe.applePayDomains.list({ limit: 50 });
      const alreadyHasIt = existing.data.some((d) => d.domain_name === cleanDomain);
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
    const { email, name, tracking = {}, currency: requestedCurrency } = body;

    // Check & register Apple Pay domain in the background
    const host = req.headers.get('host');
    await autoRegisterApplePayDomain(host);

    // Determine currency: from client request, or IP country header, or fallback to USD
    const ipCountry = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry');
    const currencyConfig = requestedCurrency
      ? getCurrencyConfig(requestedCurrency)
      : detectCurrencyForCountry(ipCountry);

    // Filter tracking metadata for UTMify (Stripe metadata requires string key/values <= 500 chars)
    const trackingMetadata: Record<string, string> = {};
    if (tracking && typeof tracking === 'object') {
      for (const [k, v] of Object.entries(tracking)) {
        if (typeof v === 'string' && v.trim()) {
          trackingMetadata[k.slice(0, 40)] = v.slice(0, 500);
        }
      }
    }

    // 1. Create Stripe Customer so payment method can be saved for 1-click upsells
    const customer = await stripe.customers.create({
      email: email || undefined,
      name: name || undefined,
      metadata: {
        created_via: 'funnel_checkout',
        preferred_currency: currencyConfig.code,
        country: ipCountry || 'UNKNOWN',
        ...trackingMetadata,
      },
    });

    // 2. Create the PaymentIntent in the customer's local currency!
    // Clean standard e-commerce purchase (no off-session penalty on debit cards)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: currencyConfig.frontend.price,
      currency: currencyConfig.code,
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always',
      },
      metadata: {
        order_type: 'frontend',
        product_id: FUNNEL_CONFIG.frontend.id,
        product_name: FUNNEL_CONFIG.frontend.name,
        currency: currencyConfig.code.toUpperCase(),
        display_price: currencyConfig.frontend.displayPrice,
        customer_email: email || '',
        customer_name: name || '',
        ...trackingMetadata,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id,
      currency: currencyConfig.code,
      amount: currencyConfig.frontend.price,
      displayPrice: currencyConfig.frontend.displayPrice,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
