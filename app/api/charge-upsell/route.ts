import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { FUNNEL_CONFIG, getCurrencyConfig } from '@/lib/funnel-config';
import { sendOrderToUtmify } from '@/lib/utmify';
import { ensureWhitehatCatalog } from '@/lib/stripe-catalog';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerId, upsellType, currency: requestedCurrency } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Retrieve customer data to inherit UTMs and preferred local currency
    const customer = await stripe.customers.retrieve(customerId);
    const inheritedMetadata: Record<string, string> =
      !customer.deleted && customer.metadata ? { ...customer.metadata } : {};

    // Fixed USD currency ($47.00 USD / $37.00 USD) - No currency conversions
    const currencyConfig = getCurrencyConfig();

    // Ensure Whitehat Catalog exists in Stripe
    const whitehatCatalog = await ensureWhitehatCatalog();

    // Determine which upsell product and price is being charged in customer's local currency
    let productBase;
    let priceDetails;
    let whitehatProduct;
    if (upsellType === 'upsell-1') {
      productBase = FUNNEL_CONFIG.upsell1;
      priceDetails = currencyConfig.upsell1;
      whitehatProduct = whitehatCatalog?.['upsell-1'];
    } else if (upsellType === 'upsell-2') {
      productBase = FUNNEL_CONFIG.upsell2;
      priceDetails = currencyConfig.upsell2;
      whitehatProduct = whitehatCatalog?.['upsell-2'];
    } else {
      return NextResponse.json(
        { error: 'Invalid upsell type' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 2. Retrieve customer's saved payment method
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      limit: 10,
    });

    let paymentMethodId = paymentMethods.data[0]?.id;

    if (!paymentMethodId) {
      if (!customer.deleted && customer.invoice_settings?.default_payment_method) {
        paymentMethodId = customer.invoice_settings.default_payment_method as string;
      }
    }

    if (!paymentMethodId) {
      try {
        const pastIntents = await stripe.paymentIntents.list({
          customer: customerId,
          limit: 5,
        });
        const validPI = pastIntents.data.find(
          (pi) => pi.status === 'succeeded' && pi.payment_method
        );
        if (validPI && typeof validPI.payment_method === 'string') {
          paymentMethodId = validPI.payment_method;
          try {
            await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
          } catch (attachErr: any) {
            // Already attached or wallet, proceed
          }
        }
      } catch (e: any) {
        console.warn('[Upsell Fallback Payment Method]:', e.message);
      }
    }

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'No saved payment method found for 1-click purchase.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 3. Charge the saved payment method off-session in the customer's local currency!
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: priceDetails.price,
        currency: currencyConfig.code,
        customer: customerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        description: whitehatProduct?.name || productBase.name,
        statement_descriptor_suffix: 'DATA UPGRADE',
        payment_method_options: {
          card: {
            request_three_d_secure: 'automatic',
          },
        },
        metadata: {
          ...inheritedMetadata,
          order_type: upsellType,
          stripe_product_id: whitehatProduct?.productId || productBase.id,
          stripe_price_id: whitehatProduct?.priceId || 'price_upsell',
          stripe_product_name: whitehatProduct?.name || productBase.name,
          front_display_name: productBase.name,
          currency: currencyConfig.code.toUpperCase(),
          display_price: priceDetails.displayPrice,
        },
      },
      {
        idempotencyKey: `charge_${customerId}_${upsellType}_${Math.floor(Date.now() / 60000)}`,
      }
    );

    // 4. Notify UTMify API with net amount and explicit currency
    try {
      const tracking = {
        src: inheritedMetadata.src || null,
        sck: inheritedMetadata.sck || null,
        utm_source: inheritedMetadata.utm_source || null,
        utm_campaign: inheritedMetadata.utm_campaign || null,
        utm_medium: inheritedMetadata.utm_medium || null,
        utm_content: inheritedMetadata.utm_content || null,
        utm_term: inheritedMetadata.utm_term || null,
      };

      // Stripe estimated fee: ~4.4% + flat fee
      const feeEstimate = Math.round(priceDetails.price * 0.044 + 30);
      const netEstimate = priceDetails.price - feeEstimate;

      await sendOrderToUtmify({
        orderId: paymentIntent.id,
        status: 'paid',
        customer: {
          name: (!customer.deleted && customer.name) || 'Cliente ZapSpy',
          email: (!customer.deleted && customer.email) || 'cliente@checkout.com',
          phone: null,
          document: null,
        },
        products: [
          {
            id: productBase.id,
            name: productBase.name,
            planId: null,
            planName: null,
            quantity: 1,
            priceInCents: netEstimate,
          },
        ],
        trackingParameters: tracking,
        commission: {
          totalPriceInCents: netEstimate,
          gatewayFeeInCents: feeEstimate,
          userCommissionInCents: netEstimate,
          currency: currencyConfig.code.toUpperCase(),
        },
      });
    } catch (e: any) {
      console.warn('[UTMify Upsell Dispatch]:', e.message);
    }

    return NextResponse.json(
      {
        success: true,
        status: paymentIntent.status,
        productName: productBase.name,
        amountCharged: priceDetails.displayPrice,
        currency: currencyConfig.code,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error charging 1-click upsell:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process 1-click upsell',
        declineCode: error.decline_code || error.code || null,
      },
      { status: 200, headers: corsHeaders }
    );
  }
}
