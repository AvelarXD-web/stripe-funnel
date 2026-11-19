import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import {
  FUNNEL_CONFIG,
  getCurrencyConfig,
  detectCurrencyForCountry,
} from '@/lib/funnel-config';
import { ensureWhitehatCatalog } from '@/lib/stripe-catalog';

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

    const trimmedEmail = (typeof email === 'string' ? email : '').trim().toLowerCase();
    const trimmedName = (typeof name === 'string' ? name : '').trim();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Por favor, proporciona un correo electrónico válido.' },
        { status: 400 }
      );
    }

    // Check & register Apple Pay domain in the background
    const host = req.headers.get('host');
    await autoRegisterApplePayDomain(host);

    // Ensure Whitehat Catalog exists in Stripe (100% compliant SaaS / Analytics product)
    const whitehatCatalog = await ensureWhitehatCatalog();
    const whitehatFrontend = whitehatCatalog?.frontend;

    // Fixed USD currency ($27.00 USD) - No currency conversions
    const currencyConfig = getCurrencyConfig();
    const ipCountry = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || 'UNKNOWN';

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
      email: trimmedEmail,
      name: trimmedName || undefined,
      metadata: {
        created_via: 'funnel_checkout',
        preferred_currency: currencyConfig.code,
        country: ipCountry || 'UNKNOWN',
        ...trackingMetadata,
      },
    });

    // 2. Create the PaymentIntent linked to the official Whitehat Catalog Product!
    const paymentIntent = await stripe.paymentIntents.create({
      amount: currencyConfig.frontend.price,
      currency: currencyConfig.code,
      customer: customer.id,
      setup_future_usage: 'off_session',
      description: whitehatFrontend?.name || 'DataAnalytics Pro - Relatório Digital de Análise e Métricas',
      statement_descriptor_suffix: 'DATA REPORT',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always',
      },
      metadata: {
        order_type: 'frontend',
        stripe_product_id: whitehatFrontend?.productId || 'prod_frontend',
        stripe_price_id: whitehatFrontend?.priceId || 'price_frontend',
        stripe_product_name: whitehatFrontend?.name || 'DataAnalytics Pro - Relatório Digital de Análise e Métricas',
        front_display_name: FUNNEL_CONFIG.frontend.name,
        currency: currencyConfig.code.toUpperCase(),
        display_price: currencyConfig.frontend.displayPrice,
        customer_email: trimmedEmail,
        customer_name: trimmedName || '',
        ...trackingMetadata,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id,
      currency: currencyConfig.code,
      amount: currencyConfig.frontend.price,
      displayPrice: currencyConfig.frontend.displayPrice,
      productName: whitehatFrontend?.name || FUNNEL_CONFIG.frontend.name,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
