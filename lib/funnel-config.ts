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
    frontend: { price: 2700, displayPrice: '$27.00 USD' },
    upsell1: { price: 4700, displayPrice: '$47.00 USD' },
    upsell2: { price: 3700, displayPrice: '$37.00 USD' },
  },
  eur: {
    code: 'eur',
    symbol: '€',
    flag: '🇪🇸',
    name: 'EUR (€)',
    frontend: { price: 2500, displayPrice: '25,00 €' },
    upsell1: { price: 4400, displayPrice: '44,00 €' },
    upsell2: { price: 3400, displayPrice: '34,00 €' },
  },
  mxn: {
    code: 'mxn',
    symbol: '$',
    flag: '🇲🇽',
    name: 'MXN ($)',
    frontend: { price: 54900, displayPrice: '$549 MXN' },
    upsell1: { price: 94900, displayPrice: '$949 MXN' },
    upsell2: { price: 74900, displayPrice: '$749 MXN' },
  },
  cop: {
    code: 'cop',
    symbol: '$',
    flag: '🇨🇴',
    name: 'COP ($)',
    frontend: { price: 11500000, displayPrice: '$115.000 COP' },
    upsell1: { price: 19900000, displayPrice: '$199.000 COP' },
    upsell2: { price: 15900000, displayPrice: '$159.000 COP' },
  },
  clp: {
    code: 'clp',
    symbol: '$',
    flag: '🇨🇱',
    name: 'CLP ($)',
    isZeroDecimal: true,
    frontend: { price: 26000, displayPrice: '$26.000 CLP' },
    upsell1: { price: 45000, displayPrice: '$45.000 CLP' },
    upsell2: { price: 35000, displayPrice: '$35.000 CLP' },
  },
  pen: {
    code: 'pen',
    symbol: 'S/',
    flag: '🇵🇪',
    name: 'PEN (S/)',
    frontend: { price: 9900, displayPrice: 'S/ 99.00 PEN' },
    upsell1: { price: 17900, displayPrice: 'S/ 179.00 PEN' },
    upsell2: { price: 13900, displayPrice: 'S/ 139.00 PEN' },
  },
  crc: {
    code: 'crc',
    symbol: '₡',
    flag: '🇨🇷',
    name: 'CRC (₡)',
    frontend: { price: 1400000, displayPrice: '₡14.000 CRC' },
    upsell1: { price: 2400000, displayPrice: '₡24.000 CRC' },
    upsell2: { price: 1900000, displayPrice: '₡19.000 CRC' },
  },
  dop: {
    code: 'dop',
    symbol: 'RD$',
    flag: '🇩🇴',
    name: 'DOP (RD$)',
    frontend: { price: 165000, displayPrice: 'RD$ 1.650 DOP' },
    upsell1: { price: 285000, displayPrice: 'RD$ 2.850 DOP' },
    upsell2: { price: 225000, displayPrice: 'RD$ 2.250 DOP' },
  },
  brl: {
    code: 'brl',
    symbol: 'R$',
    flag: '🇧🇷',
    name: 'BRL (R$)',
    frontend: { price: 14900, displayPrice: 'R$ 149,00' },
    upsell1: { price: 25900, displayPrice: 'R$ 259,00' },
    upsell2: { price: 19900, displayPrice: 'R$ 199,00' },
  },
};

// Maps 2-letter ISO country code to local currency
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  CR: 'crc', // Costa Rica
  DO: 'dop', // Dominican Republic
  MX: 'mxn', // Mexico
  CO: 'cop', // Colombia
  CL: 'clp', // Chile
  PE: 'pen', // Peru
  ES: 'eur', // Spain
  PT: 'eur', // Portugal
  FR: 'eur', // France
  DE: 'eur', // Germany
  IT: 'eur', // Italy
  BR: 'brl', // Brazil
  US: 'usd', // United States
  PR: 'usd', // Puerto Rico
  PA: 'usd', // Panama
  EC: 'usd', // Ecuador
  SV: 'usd', // El Salvador
};

export function getCurrencyConfig(currencyCode?: string | null): CurrencyConfig {
  const code = (currencyCode || 'usd').toLowerCase();
  return SUPPORTED_CURRENCIES[code] || SUPPORTED_CURRENCIES.usd;
}

export function detectCurrencyForCountry(countryCode?: string | null): CurrencyConfig {
  if (!countryCode) return SUPPORTED_CURRENCIES.usd;
  const upper = countryCode.toUpperCase();
  const currencyCode = COUNTRY_TO_CURRENCY[upper] || 'usd';
  return SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.usd;
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
    displayPrice: '$27.00 USD',
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
      'Recuperación de mensajes eliminados',
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
