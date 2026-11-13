import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { FUNNEL_CONFIG } from '@/lib/funnel-config';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name } = body;

    // 1. Create or retrieve a Stripe Customer so payment method can be saved for 1-click upsells
    const customer = await stripe.customers.create({
      email: email || undefined,
      name: name || undefined,
      metadata: {
        created_via: 'funnel_checkout',
      },
    });

    // 2. Create the PaymentIntent for the frontend offer ($27)
    // setup_future_usage: 'off_session' saves the card/Apple Pay/Google Pay for instant 1-click upsell
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
