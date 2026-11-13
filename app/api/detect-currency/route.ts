import { NextResponse } from 'next/server';
import {
  detectCurrencyForCountry,
  getCurrencyConfig,
  SUPPORTED_CURRENCIES,
} from '@/lib/funnel-config';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const queryCountry = url.searchParams.get('country');
    const queryCurrency = url.searchParams.get('currency');

    // 1. Check query parameter overrides (for testing or manual selection)
    if (queryCurrency && SUPPORTED_CURRENCIES[queryCurrency.toLowerCase()]) {
      const cfg = getCurrencyConfig(queryCurrency);
      return NextResponse.json({
        country: queryCountry || 'DEFAULT',
        currency: cfg.code,
        pricing: cfg,
        availableCurrencies: Object.values(SUPPORTED_CURRENCIES),
      });
    }

    // 2. Read Vercel IP country header (e.g. "CR", "MX", "CO", "ES", "US", "CL", "PE", "DO")
    const detectedCountry =
      queryCountry ||
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('cf-ipcountry') ||
      'US';

    const cfg = detectCurrencyForCountry(detectedCountry);

    return NextResponse.json({
      country: detectedCountry.toUpperCase(),
      currency: cfg.code,
      pricing: cfg,
      availableCurrencies: Object.values(SUPPORTED_CURRENCIES),
    });
  } catch (err: any) {
    const defaultCfg = SUPPORTED_CURRENCIES.usd;
    return NextResponse.json({
      country: 'US',
      currency: defaultCfg.code,
      pricing: defaultCfg,
      availableCurrencies: Object.values(SUPPORTED_CURRENCIES),
    });
  }
}
