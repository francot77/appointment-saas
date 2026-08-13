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
- `MP_ACCESS_TOKEN_TEST` — token de MercadoPago (test)
- `MP_ACCESS_TOKEN_PROD` — token de MercadoPago (producción)
- `MP_WEBHOOK_SECRET` — secreto de firma de Webhooks de Mercado Pago, configurado en Tus Integraciones

Mercado Pago firma cada webhook con `x-signature` usando HMAC-SHA256 sobre `id`, `x-request-id` y `ts`; la aplicación rechaza firmas ausentes, inválidas o con más de cinco minutos. `MP_WEBHOOK_SECRET` es obligatorio para activar el endpoint.

El precio del plan básico es `10000` ARS. Mercado Pago recibe `unit_price` en unidades monetarias, no centavos; el valor se valida nuevamente en el webhook junto con `currency_id=ARS`, el producto `basic-monthly` y cantidad 1.

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
npm run lint
npx tsc --noEmit
npm run build
```

## Roadmap comercial

Ver [`COMMERCIALIZATION_PLAN.md`](./COMMERCIALIZATION_PLAN.md) para el orden de fases, criterios de salida y registro de ejecución.

## Cambios de branding y UX (FezTime)

- Reemplazo de nombres anteriores por “FezTime” en UI y metadatos.
- Actualización de PWA manifests y cache name del service worker.
- Nuevo asset de logo: `public/feztime-logo.svg` y uso en el landing.
- Ajustes de accesibilidad: focus-visible rings en navegación, formularios y CTAs.
- Ajustes visuales: paleta indigo/cyan, tipografía base y consistencia de estilos.
- Enlaces de footer corregidos con páginas `terms` y `privacy` (placeholders).
