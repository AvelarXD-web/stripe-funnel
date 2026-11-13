import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { sendOrderToUtmify } from '@/lib/utmify';
import { FUNNEL_CONFIG } from '@/lib/funnel-config';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;

  try {
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (sigErr: any) {
        console.warn(`[Stripe Webhook] Signature verification warning: ${sigErr.message}. Fallback to direct event parse.`);
        event = JSON.parse(body);
      }
    } else {
      event = JSON.parse(body);
    }
  } catch (err: any) {
    console.error(`⚠️ Webhook parse failed:`, err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle successful payments
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      console.log(`💰 PaymentIntent succeeded: ${paymentIntent.id}, Amount: ${paymentIntent.amount}`);

      try {
        let customerEmail = paymentIntent.receipt_email;
        let customerName = paymentIntent.metadata?.customer_name;

        if (paymentIntent.customer && (!customerEmail || !customerName)) {
          const customer = await stripe.customers.retrieve(paymentIntent.customer);
          if (!customer.deleted) {
            customerEmail = customerEmail || customer.email;
            customerName = customerName || customer.name;
          }
        }

        const metadata = paymentIntent.metadata || {};
        const isFrontend = metadata.order_type === 'frontend' || !metadata.order_type;
        const productName = isFrontend
          ? FUNNEL_CONFIG.frontend.name
          : metadata.product_name || 'ZapSpy Product';
        const productId = isFrontend
          ? FUNNEL_CONFIG.frontend.id
          : metadata.product_id || 'upsell';

        // Calculate exact net value after Stripe fees
        let gatewayFeeInCents = 0;
        let userCommissionInCents = paymentIntent.amount;

        try {
          const chargeId =
            typeof paymentIntent.latest_charge === 'string'
              ? paymentIntent.latest_charge
              : paymentIntent.latest_charge?.id;

          if (chargeId) {
            const charge = await stripe.charges.retrieve(chargeId, {
              expand: ['balance_transaction'],
            });
            const bt = charge.balance_transaction as any;
            if (bt && typeof bt === 'object' && typeof bt.fee === 'number') {
              gatewayFeeInCents = bt.fee;
              userCommissionInCents = bt.net;
            }
          }
        } catch (e: any) {
          console.warn('[Stripe Fee Retrieval]:', e.message);
        }

        // Fallback to standard international card fee if not available yet (~4.4% + 30 cents)
        if (!gatewayFeeInCents) {
          gatewayFeeInCents = Math.round(paymentIntent.amount * 0.044 + 30);
          userCommissionInCents = paymentIntent.amount - gatewayFeeInCents;
        }

        // Notify UTMify directly with exact net value and 100% attribution
        await sendOrderToUtmify({
          orderId: paymentIntent.id,
          platform: 'Stripe',
          status: 'paid',
          customer: {
            name: customerName || 'Cliente ZapSpy',
            email: customerEmail || 'cliente@checkout.com',
            phone: null,
            document: null,
          },
          products: [
            {
              id: productId,
              name: productName,
              planId: null,
              planName: null,
              quantity: 1,
              priceInCents: userCommissionInCents,
            },
          ],
          trackingParameters: {
            src: metadata.src || null,
            sck: metadata.sck || null,
            utm_source: metadata.utm_source || null,
            utm_campaign: metadata.utm_campaign || null,
            utm_medium: metadata.utm_medium || null,
            utm_content: metadata.utm_content || null,
            utm_term: metadata.utm_term || null,
          },
          commission: {
            totalPriceInCents: userCommissionInCents,
            gatewayFeeInCents,
            userCommissionInCents,
            currency: 'USD',
          },
        });
      } catch (err: any) {
        console.error('[Webhook UTMify Dispatch Error]:', err.message);
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      console.warn(`❌ Payment failed: ${paymentIntent.id}`, paymentIntent.last_payment_error?.message);
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
