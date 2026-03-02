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

## Cambios de branding y UX (FezTime)

- Reemplazo de nombres anteriores por “FezTime” en UI y metadatos.
- Actualización de PWA manifests y cache name del service worker.
- Nuevo asset de logo: `public/feztime-logo.svg` y uso en el landing.
- Ajustes de accesibilidad: focus-visible rings en navegación, formularios y CTAs.
- Ajustes visuales: paleta indigo/cyan, tipografía base y consistencia de estilos.
- Enlaces de footer corregidos con páginas `terms` y `privacy` (placeholders).
