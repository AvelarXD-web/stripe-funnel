import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { FUNNEL_CONFIG } from '@/lib/funnel-config';

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
    const { customerId, upsellType } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Determine which upsell product is being charged
    let product;
    if (upsellType === 'upsell-1') {
      product = FUNNEL_CONFIG.upsell1;
    } else if (upsellType === 'upsell-2') {
      product = FUNNEL_CONFIG.upsell2;
    } else {
      return NextResponse.json(
        { error: 'Invalid upsell type' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Retrieve the customer's saved payment methods (cards, Apple Pay, Google Pay, Link)
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      limit: 10,
    });

    let paymentMethodId = paymentMethods.data[0]?.id;

    // Fallback if not standard card (e.g., link or wallet)
    if (!paymentMethodId) {
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer.deleted && customer.invoice_settings?.default_payment_method) {
        paymentMethodId = customer.invoice_settings.default_payment_method as string;
      }
    }

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'No saved payment method found for 1-click purchase.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 2. Charge the saved payment method off-session (True 1-Click Upsell)
    // Uses idempotencyKey to prevent accidental double-charges
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: product.price,
        currency: FUNNEL_CONFIG.currency,
        customer: customerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        metadata: {
          order_type: upsellType,
          product_id: product.id,
          product_name: product.name,
        },
      },
      {
        idempotencyKey: `charge_${customerId}_${upsellType}`,
      }
    );

    return NextResponse.json(
      {
        success: true,
        status: paymentIntent.status,
        productName: product.name,
        amountCharged: product.displayPrice,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error charging 1-click upsell:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process 1-click upsell' },
      { status: 500, headers: corsHeaders }
    );
  }
}
