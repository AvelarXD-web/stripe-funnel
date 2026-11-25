import { stripe } from '@/lib/stripe';

export interface WhitehatProductConfig {
  key: 'frontend' | 'upsell-1' | 'upsell-2';
  name: string;
  description: string;
  unitAmount: number; // in cents
  currency: string;
}

export const WHITEHAT_PRODUCTS: WhitehatProductConfig[] = [
  {
    key: 'frontend',
    name: 'DataAnalytics Pro - Relatório Digital de Análise e Métricas',
    description: 'Acesso instantâneo à plataforma digital de análise, métricas e relatório consolidado.',
    unitAmount: 2700, // $27.00 USD
    currency: 'usd',
  },
  {
    key: 'upsell-1',
    name: 'DataAnalytics Pro - Módulo Avançado de Backup e Histórico',
    description: 'Módulo avançado de armazenamento em nuvem e histórico estendido de dados.',
    unitAmount: 4700, // $47.00 USD
    currency: 'usd',
  },
  {
    key: 'upsell-2',
    name: 'DataAnalytics Pro - Módulo de Segurança e Proteção Digital',
    description: 'Pacote avançado de privacidade, auditoria de segurança e proteção de dados.',
    unitAmount: 3700, // $37.00 USD
    currency: 'usd',
  },
];

export async function ensureWhitehatCatalog() {
  try {
    const existing = await stripe.products.list({ limit: 50, active: true });
    const results: Record<string, { productId: string; priceId: string; name: string }> = {};

    for (const item of WHITEHAT_PRODUCTS) {
      // Find existing product by exact whitehat name or metadata
      let prod = existing.data.find(
        (p) => p.name === item.name || p.metadata?.whitehat_key === item.key
      );

      if (!prod) {
        prod = await stripe.products.create({
          name: item.name,
          description: item.description,
          active: true,
          metadata: {
            whitehat_key: item.key,
            category: 'digital_software_analytics',
          },
        });
        console.log(`[Stripe Catalog] Created Whitehat Product: ${item.name} (${prod.id})`);
      }

      // Check if price exists for this product
      const prices = await stripe.prices.list({
        product: prod.id,
        limit: 10,
        active: true,
      });

      let price = prices.data.find(
        (pr) => pr.unit_amount === item.unitAmount && pr.currency === item.currency
      );

      if (!price) {
        price = await stripe.prices.create({
          product: prod.id,
          unit_amount: item.unitAmount,
          currency: item.currency,
          metadata: {
            whitehat_key: item.key,
          },
        });
        console.log(`[Stripe Catalog] Created Whitehat Price: $${item.unitAmount / 100} (${price.id})`);
      }

      results[item.key] = {
        productId: prod.id,
        priceId: price.id,
        name: prod.name,
      };
    }

    return results;
  } catch (error: any) {
    console.error('[Stripe Catalog Error]:', error.message);
    return null;
  }
}
