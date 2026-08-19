# FezTime

SaaS de turnos/agenda online construido con Next.js (App Router), NextAuth y MongoDB.

## Requisitos

- Node.js 20+
- MongoDB (o MongoDB Atlas)

## Variables de entorno

Configurar al menos:

- `MONGODB_URI` — cadena de conexión a MongoDB

Para pagos y URLs:

- `NEXT_PUBLIC_APP_URL` (o `APP_URL`) — URL pública de la app (para back_urls)
- `MP_BASIC_PRICE_ARS` — precio vigente del plan básico en ARS, en unidades monetarias enteras
- `MP_ACCEPTED_PRICES_ARS` — lista explícita separada por comas de precios ARS aceptados por webhooks/reconciliación durante una transición; el precio vigente siempre se incluye
- `MP_ACCESS_TOKEN_TEST` — token de MercadoPago (test)
- `MP_ACCESS_TOKEN_PROD` — token de MercadoPago (producción)
- `MP_WEBHOOK_SECRET` — secreto de firma de Webhooks de Mercado Pago, configurado en Tus Integraciones

Mercado Pago firma cada webhook con `x-signature` usando HMAC-SHA256 sobre `id`, `x-request-id` y `ts`; la aplicación rechaza firmas ausentes, inválidas o con más de cinco minutos. `MP_WEBHOOK_SECRET` es obligatorio para activar el endpoint.

El precio del plan básico se toma de `MP_BASIC_PRICE_ARS` y Mercado Pago recibe `unit_price` en unidades monetarias, no centavos. Checkout y la interfaz usan siempre el precio vigente. Webhooks y reconciliación aceptan únicamente ese precio y los valores explícitos de `MP_ACCEPTED_PRICES_ARS`; nunca aceptan importes arbitrarios. Para una prueba temporal en producción, configurar `MP_BASIC_PRICE_ARS=100` y `MP_ACCEPTED_PRICES_ARS=100,10000` durante la ventana de pagos demorados; luego restaurar `MP_BASIC_PRICE_ARS=10000` y quitar `100` de la lista cuando no queden pagos pendientes por recibir o reconciliar. Nunca reescribir registros `Payment` históricos.

En producción, `NEXT_PUBLIC_APP_URL` o `APP_URL` es obligatorio y debe ser una URL pública válida; no se permite localhost. Si `MP_BASIC_PRICE_ARS` falta o es inválido en producción, el checkout falla cerrado; una lista `MP_ACCEPTED_PRICES_ARS` malformada también se rechaza. En desarrollo y test se usa 10000 ARS como valor seguro cuando la variable no está configurada.

## SEO técnico

- `NEXT_PUBLIC_APP_URL` o `APP_URL` debe apuntar a la URL pública canónica en producción. El sitemap y `robots.txt` usan esa variable y no publican localhost en producción.
- Sitemap: `<APP_URL>/sitemap.xml`. Incluye la homepage y páginas públicas de negocios con estado `trial` o `active` y slugs vigentes válidos.
- `robots.txt`: `<APP_URL>/robots.txt`. Permite páginas públicas y bloquea dashboard, facturación, autenticación, APIs, magic links y rutas de desarrollo.
- Las páginas públicas de negocio (`/<slug>`) tienen metadata dinámica, canonical, Open Graph/Twitter y JSON-LD basado únicamente en datos configurados. La página de reserva (`/<slug>/turnos`) no se indexa y canonicaliza a la landing para evitar duplicación.
- Confirmaciones, reprogramaciones, magic links, autenticación, dashboard y facturación tienen `noindex`. La landing pública no tiene `noindex`.
- Después del despliegue, verificar `sitemap.xml` y `robots.txt`, registrar la propiedad en Google Search Console y enviar el sitemap.

Recomendado en producción:

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

## Desarrollo

```bash
npm install
npm run dev
```

Abrir http://localhost:3000

## Calidad y build

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

CI runs these checks on pushes and pull requests: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml).

Health/readiness: `GET /api/health`. Production operations and recovery guidance: [`docs/OPERATIONS.md`](./docs/OPERATIONS.md).

## Roadmap comercial

Ver [`COMMERCIALIZATION_PLAN.md`](./COMMERCIALIZATION_PLAN.md) para el orden de fases, criterios de salida y registro de ejecución.

## Cambios de branding y UX (FezTime)

- Reemplazo de nombres anteriores por “FezTime” en UI y metadatos.
- Actualización de PWA manifests y cache name del service worker.
- Nuevo asset de logo: `public/feztime-logo.svg` y uso en el landing.
- Ajustes de accesibilidad: focus-visible rings en navegación, formularios y CTAs.
- Ajustes visuales: paleta indigo/cyan, tipografía base y consistencia de estilos.
- Enlaces de footer corregidos con páginas `terms` y `privacy` (placeholders).
