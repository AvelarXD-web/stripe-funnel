# 🚀 Stripe Transparent Funnel (Front + 1-Click Upsells)

High-converting, direct-response sales funnel built with **Next.js 15**, **Stripe Payment Element**, and **Tailwind CSS**. Designed specifically for international / US sales with native Apple Pay, Google Pay, Stripe Link, and Credit Cards.

## 📦 What's Included:
1. **Frontend Checkout ($27.00)**: Clean transparent checkout using Stripe Payment Element. Sets up customer tokens with `setup_future_usage: 'off_session'` for immediate 1-click upsells.
2. **Upsell 1 ($47.00)**: True **One-Click Post-Purchase Upsell**. Customer clicks "YES! Add to my order" and the card is charged in the background in 1 second without re-entering card details.
3. **Upsell 2 ($37.00)**: Second **One-Click Upsell** with the same frictionless background authorization.
4. **Thank You Page**: Complete order receipt displaying all purchased items and delivery instructions.
5. **Stripe Webhook**: Secure backend route ready to listen for payments and trigger fulfillment.

---

## ⚙️ How to Configure Products & Prices
All product names, prices, bullet points, and descriptions are centrally controlled in:
📁 `lib/funnel-config.ts`

---

## 🔑 Environment Variables
Add these variables in your Vercel Project Settings:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Public Key | `pk_test_...` or `pk_live_...` |
| `STRIPE_SECRET_KEY` | Stripe Secret Key | `sk_test_...` or `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret | `whsec_...` |
| `NEXT_PUBLIC_APP_URL` | Your domain URL | `https://your-domain.vercel.app` |

