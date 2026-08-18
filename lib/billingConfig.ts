const NON_PRODUCTION_BASIC_PRICE_ARS = 10000;
const ACCEPTED_PRICE_SEPARATOR = ',';

export function parseBasicPriceARS(value: string | undefined) {
  if (!value || !/^\d+$/.test(value.trim())) return null;
  const price = Number(value);
  return Number.isSafeInteger(price) && price > 0 ? price : null;
}

function parseAcceptedPriceARS(value: string) {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const price = Number(normalized);
  return Number.isFinite(price) && price > 0 && price <= Number.MAX_SAFE_INTEGER ? price : null;
}

export function getBasicPriceARS() {
  const configuredPrice = parseBasicPriceARS(process.env.MP_BASIC_PRICE_ARS);
  if (configuredPrice !== null) return configuredPrice;
  if (process.env.NODE_ENV !== 'production') return NON_PRODUCTION_BASIC_PRICE_ARS;
  throw new Error('BILLING_PRICE_NOT_CONFIGURED');
}

/**
 * Prices accepted from Mercado Pago during an intentional price transition.
 * The current checkout price is always accepted; older prices require an explicit env entry.
 */
export function getAcceptedBasicPricesARS() {
  const currentPrice = getBasicPriceARS();
  const configuredPrices = process.env.MP_ACCEPTED_PRICES_ARS;
  if (configuredPrices === undefined) return [currentPrice];

  const priorPrices = configuredPrices.split(ACCEPTED_PRICE_SEPARATOR).map(parseAcceptedPriceARS);
  if (priorPrices.some((price) => price === null)) throw new Error('BILLING_ACCEPTED_PRICES_INVALID');

  return [...new Set([currentPrice, ...priorPrices.filter((price): price is number => price !== null)])];
}

function isLocalhost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

export function getPublicAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (!configuredUrl) {
    if (process.env.NODE_ENV !== 'production') return 'http://localhost:3000';
    throw new Error('PUBLIC_APP_URL_NOT_CONFIGURED');
  }

  let url: URL;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new Error('PUBLIC_APP_URL_INVALID');
  }

  if (!['http:', 'https:'].includes(url.protocol) || (process.env.NODE_ENV === 'production' && isLocalhost(url.hostname))) {
    throw new Error('PUBLIC_APP_URL_INVALID');
  }

  return url.toString().replace(/\/$/, '');
}
