export type SlugValidationResult =
  | { ok: true; slug: string }
  | { ok: false; error: string; code: string; slug?: string };

const MIN_LEN = 3;
const MAX_LEN = 50;

const RESERVED_EXACT = new Set([
  'admin',
  'api',
  'app',
  'assets',
  'auth',
  'billing',
  'callback',
  'contact',
  'dashboard',
  'demo',
  'dev',
  'docs',
  'favicon',
  'help',
  'home',
  'legal',
  'login',
  'logout',
  'me',
  'new',
  'null',
  'oauth',
  'pricing',
  'privacy',
  'profile',
  'register',
  'root',
  'r',
  'settings',
  'static',
  'status',
  'support',
  'terms',
  'turnos',
  'undefined',
  'www',
  'feztime',
]);

const RESERVED_PREFIXES = [
  '_',
  '.',
  'api-',
  'admin-',
  'mp-',
  'mercadopago-',
  'webhook-',
];

const OFFENSIVE_WORDS = [
  'puta',
  'puto',
  'mierda',
  'caca',
  'concha',
  'pija',
  'verga',
  'porno',
  'porn',
  'sexo',
  'sex',
  'nazi',
  'hitler',
];

export function normalizeSlugInput(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function slugifyName(name: string) {
  return normalizeSlugInput(name)
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function validateSlug(input: unknown): SlugValidationResult {
  if (typeof input !== 'string') {
    return { ok: false, code: 'TYPE', error: 'slug debe ser string' };
  }

  const slug = normalizeSlugInput(input);

  if (slug.length < MIN_LEN) {
    return {
      ok: false,
      code: 'TOO_SHORT',
      error: `El slug debe tener al menos ${MIN_LEN} caracteres`,
      slug,
    };
  }

  if (slug.length > MAX_LEN) {
    return {
      ok: false,
      code: 'TOO_LONG',
      error: `El slug debe tener como máximo ${MAX_LEN} caracteres`,
      slug,
    };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      ok: false,
      code: 'FORMAT',
      error:
        'Formato inválido: solo letras/números y guiones (sin guiones dobles ni al inicio/fin)',
      slug,
    };
  }

  const reserved = getReservedReason(slug);
  if (reserved) {
    return {
      ok: false,
      code: reserved.code,
      error: reserved.error,
      slug,
    };
  }

  return { ok: true, slug };
}

export function getReservedReason(slug: string):
  | { code: string; error: string }
  | null {
  if (RESERVED_EXACT.has(slug)) {
    return { code: 'RESERVED', error: 'Slug reservado' };
  }

  for (const p of RESERVED_PREFIXES) {
    if (slug.startsWith(p)) {
      return { code: 'RESERVED', error: 'Slug reservado' };
    }
  }

  for (const w of OFFENSIVE_WORDS) {
    const re = new RegExp(`(^|-)${escapeRegExp(w)}(-|$)`, 'i');
    if (re.test(slug)) {
      return { code: 'OFFENSIVE', error: 'Slug no permitido' };
    }
  }

  return null;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
