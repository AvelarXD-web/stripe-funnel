export interface FunnelProduct {
  id: string;
  name: string;
  price: number; // in cents (or base units for zero-decimal currencies)
  displayPrice: string;
  tagline: string;
  description: string;
  features: string[];
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  flag: string;
  name: string;
  isZeroDecimal?: boolean;
  frontend: { price: number; displayPrice: string };
  upsell1: { price: number; displayPrice: string };
  upsell2: { price: number; displayPrice: string };
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  usd: {
    code: 'usd',
    symbol: '$',
    flag: '🇺🇸',
    name: 'USD ($)',
    frontend: { price: 2700, displayPrice: 'US$ 27,00' },
    upsell1: { price: 4700, displayPrice: '$47.00 USD' },
    upsell2: { price: 3700, displayPrice: '$37.00 USD' },
  },
};

export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: 'usd',
};

export function getCurrencyConfig(_currencyCode?: string | null): CurrencyConfig {
  return SUPPORTED_CURRENCIES.usd;
}

export function detectCurrencyForCountry(_countryCode?: string | null): CurrencyConfig {
  return SUPPORTED_CURRENCIES.usd;
}

// 0ms Synchronous Fixed USD ($27.00)
export function detectCurrencySynchronous(): CurrencyConfig {
  return SUPPORTED_CURRENCIES.usd;
}

export const FUNNEL_CONFIG = {
  currency: 'usd',

  // URLs for the funnel pages
  urls: {
    upsell1: process.env.NEXT_PUBLIC_UPSELL_1_URL || 'https://premioapp.top/lat/2/up1/',
    upsell2: process.env.NEXT_PUBLIC_UPSELL_2_URL || 'https://premioapp.top/lat/2/up2/',
    thankYou: process.env.NEXT_PUBLIC_THANK_YOU_URL || 'https://premioapp.top/lat/2/sistema/',
  },
  
  // Front-end offer: Default USD ($27.00)
  frontend: {
    id: 'frontend',
    name: 'La Verdad - Acceso a tu Reporte',
    price: 2700, // $27.00
    displayPrice: 'US$ 27,00',
    tagline: 'Acceso instantáneo a La Verdad - Tu Reporte Completo',
    description: 'Acceso inmediato a tu informe detallado y confidencial.',
    features: [
      'Acceso inmediato y confidencial',
      'Reporte detallado desbloqueado',
      'Monitoreo anónimo y seguro',
      'Garantía de satisfacción',
    ],
  },

  // Upsell 1 (OTO 1): Default USD ($47.00)
  upsell1: {
    id: 'upsell-1',
    name: 'ZapSpy - Recuperación de Mensajes Eliminados',
    price: 4700, // $47.00
    displayPrice: '$47.00 USD',
    tagline: 'Accede y ve cada mensaje que eliminaron',
    description: 'Recuperación profunda de textos, fotos e audios eliminados hasta 90 días.',
    features: [
      'Recuperación de mensagens eliminados',
      'Acceso a fotos y audios borrados',
      'Historial de hasta 90 días',
      'Conexión segura e indetectable',
    ],
  },

  // Upsell 2 (OTO 2): Default USD ($37.00)
  upsell2: {
    id: 'upsell-2',
    name: 'ZapSpy - Modo Invisible y Bloqueo de Alerta',
    price: 3700, // $37.00
    displayPrice: '$37.00 USD',
    tagline: 'Bloquea el aviso para que no te descubran',
    description: 'Apaga la notificación en su celular y tu espionaje queda 100% oculto.',
    features: [
      'Bloqueo de alertas en el dispositivo objetivo',
      'Modo 100% invisible y anónimo',
      'Monitoreo en tiempo real sin sospechas',
      'Protección permanente de acceso',
    ],
  },
};
