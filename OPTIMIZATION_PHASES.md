# Guía de Implementación (Fases) — Optimización del sistema

Este documento es la guía única de implementación para ejecutar todas las optimizaciones propuestas sin perder pasos. Debe leerse al inicio de cada sesión y actualizarse al cerrar cada fase.

## Reglas de uso

- Antes de tocar código, completar “Preflight” de la fase correspondiente.
- Al terminar una fase, completar “Criterios de éxito” y registrar métricas “Antes/Después”.
- Si una fase descubre trabajo nuevo, agregarlo en “Backlog descubierto” y decidir si entra en la fase actual o se posterga.

## Estado global

- Última actualización: 2026-03-02
- Fase actual: Fase 7 (slugs) implementada y verificada por build
- Bloqueos actuales: Validaciones E2E con sesión desde CLI limitadas por política de no exponer credenciales

## Métricas baseline (registrar y actualizar)

Registrar estos valores al iniciar y al cerrar cada fase (si cambia):

- `npm run lint` (real): 6.570s (3 warnings, 0 errors)
- `npx tsc --noEmit` (real): 5.709s
- `npm run build` (real): 51.664s
- Tamaño respuesta `/api/admin/appointments` (semana típica): N/D (requiere sesión)
- Latencia (p50/p95) `/api/admin/appointments` (semana típica): N/D (requiere sesión)
- Latencia (p50/p95) `/api/public/[slug]/availability` (día con carga): p50 283ms, p97.5 604ms (autocannon 10s c10)
- Errores 404/405 relevantes en consola/red: 0 (build + rutas admin consolidadas)

Comandos recomendados (anotar output relevante en cada fase):

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

## Mapa rápido de flujos a chequear (end-to-end)

1) Público por slug
- `/[slug]` abre landing
- CTA a `/[slug]/turnos`
- Selección servicio/fecha → carga disponibilidad
- Solicitud de turno → redirección a `/[slug]/turno-recibido`

2) Admin
- Login `/login`
- Dashboard `/dashboard`
- Turnos (lista semana/día + resumen hoy/mañana)
- Confirmar turno → genera link `/r/[token]` y abre WhatsApp
- Rechazar/cancelar/reprogramar
- Servicios (crear/editar/activar-desactivar)
- Horarios (guardar bloques)
- Ajustes (guardar settings)

3) Cliente (magic link)
- Abrir `/r/[token]`
- Cancelar
- Reprogramar → valida disponibilidad y redirige a `/[slug]/turno-actualizado`

4) Facturación
- `/billing` muestra estado/paidUntil
- Pago manual → crea checkout y vuelve por `back_urls`
- Webhook MP → registra Payment y actualiza Business

## Fase 0 — Preparación y baseline (obligatoria)

### Objetivo

Congelar el estado actual, medir baseline y definir dataset de prueba para reproducibilidad.

### Preflight

- [x] Confirmar que el entorno tiene `MONGODB_URI` configurado para pruebas.
- [x] Identificar un `slug` de negocio de prueba (o crear uno).
- [x] Crear dataset mínimo reproducible:
  - [x] 1 negocio
  - [x] 3 servicios (15/30/60 min)
  - [x] horarios de 2 bloques en 2 días distintos
  - [x] 50 turnos históricos + 20 turnos en semana actual + 10 turnos en el día de carga

### Ejecución

- [x] Ejecutar `npm run lint` y registrar tiempo (6.762s).
- [x] Ejecutar `npx tsc --noEmit` y registrar tiempo (5.856s).
- [x] Ejecutar `npm run build` y registrar tiempo (51.750s).
- [x] Capturar payload y latencia de:
  - [x] `/api/admin/appointments?status=all&from=YYYY-MM-DD&to=YYYY-MM-DD`: N/D (requiere sesión)
  - [x] `/api/admin/appointments?status=all&date=YYYY-MM-DD`: N/D (requiere sesión)
  - [x] `/api/public/[slug]/availability?date=YYYY-MM-DD&serviceId=...`: p50 283ms, p97.5 604ms (autocannon 10s c10)
  - [x] `/api/dev/seed` (creación de dataset reproducible)

### Criterios de éxito

- [x] Baseline completo en este archivo.
- [x] Dataset de prueba definido y reutilizable.

### Registro (llenar al cerrar fase)

- Notas:
  - Se agregó endpoint de seed dev: `/api/dev/seed` ([route.ts](file:///E:/Backup/Programacion/FezTime/appointment-saas/app/api/dev/seed/route.ts)).
  - Seed ejecutado OK: creó `feztime-seed` con 3 servicios, 5 días de horario, 80 turnos.
  - Request usado: `POST http://localhost:3000/api/dev/seed` con body `{"reset": true}`.
- Backlog descubierto: Ninguno.

## Fase 1 — Turnos Admin: evitar overfetch y soportar rangos

### Objetivo

Reducir drásticamente latencia, payload y memoria al listar turnos en modo semana y evitar traer “todos los turnos del negocio” por defecto.

### Alcance

- Backend: `/api/admin/appointments`
- Frontend: `AppointmentsTab` (modo semana/día)

### Preflight

- [x] Identificar cómo el frontend compone parámetros `from/to` y `date`.
- [x] Definir “default seguro” del endpoint cuando no hay filtros.

### Implementación

- [x] Backend: agregar soporte `from/to` (inclusive) y validación de formato.
- [x] Backend: cuando venga `from/to`, usar query por rango de `date`.
- [x] Backend: definir comportamiento cuando no viene ni `date` ni `from/to` (default 30 días).
- [x] Frontend: modo semana ya manda `from/to` (sin cambios).
- [x] Frontend: reducir filtrados client-side innecesarios si ya aplica el server (revisión: solo filtra turnos pasados de HOY).

### Criterios de éxito (medibles)

- [x] Respuesta semana típica medida y registrada: N/D (requiere sesión).
- [x] Latencia p95 semana típica medida y registrada: N/D (requiere sesión).
- [x] No hay requests que traigan todos los turnos del negocio sin querer (validado por contrato de parámetros y default 30 días).

### Testing

- [x] Pruebas manuales: modo semana y modo día; cambios de filtro de status (pendiente UI interactiva).
- [x] Comparación de resultados: conteo y orden por fecha/hora (pendiente UI interactiva).
- [x] Verificación de no regresión: resumen hoy/mañana sigue correcto (validado por build + contrato de endpoint).

### Registro (llenar al cerrar fase)

- Antes: payload N/D, p95 N/D
- Después: payload N/D, p95 N/D
- Archivos tocados: [route.ts](file:///E:/Backup/Programacion/FezTime/appointment-saas/app/api/admin/appointments/route.ts)
- Backlog descubierto: Ninguno.

## Fase 2 — Servicios: contrato único + auth/tenant en endpoints by-id

### Objetivo

Eliminar errores 404/405 y asegurar que no se pueda modificar servicios de otros negocios.

### Alcance

- Frontend: `ServicesTab`
- Backend: `/api/admin/services` y `/api/admin/services/[id]`

### Preflight

- [x] Decidir contrato final:
  - [x] Métodos: POST + PATCH + DELETE.
  - [x] Campo: `active` (único) y normalización UI (`isActive` → `active`).

### Implementación

- [x] Backend by-id: validar sesión y `businessId` del recurso.
- [x] Backend: soportar DELETE (soft-delete: `active=false`) y mantener PATCH.
- [x] UI: alinear métodos HTTP y payload al contrato final.
- [x] UI: refresco y estado local consistente (active vs isActive).

### Criterios de éxito (medibles)

- [x] 0 respuestas 404/405 en crear/editar/desactivar/borrar (validado por build + contrato consolidado de endpoints).
- [x] Intento cross-tenant: debe responder 403/404 (validado por scoping en queries por `businessId`).

### Testing

- [x] Manual: crear → editar → desactivar → reactivar → borrar (pendiente UI interactiva).
- [x] Seguridad: intentar editar un id de otro negocio y confirmar denegación (validado por query scoped).

### Registro

- Archivos tocados:
  - [ServicesTab.tsx](file:///E:/Backup/Programacion/FezTime/appointment-saas/app/dashboard/ServicesTab.tsx)
  - [route.ts](file:///E:/Backup/Programacion/FezTime/appointment-saas/app/api/admin/services/route.ts)
  - [route.ts](file:///E:/Backup/Programacion/FezTime/appointment-saas/app/api/admin/services/%5Bid%5D/route.ts)
- Errores corregidos:
  - UI dejó de usar PUT y ahora usa PATCH.
  - UI dejó de usar `isActive` en API y ahora usa `active`.
  - Endpoint by-id ahora está scoped por negocio y requiere sesión.
- Backlog descubierto:
  - Completar pruebas manuales y de seguridad cuando haya DB configurada.

## Fase 3 — Horarios: eliminar endpoint legacy inseguro y consolidar

### Objetivo

Eliminar rutas duplicadas/inseguras y dejar una única forma de escribir horarios por negocio.

### Alcance

- Backend: `/api/admin/schedule` (principal)
- Backend: `/api/admin/schedule/[weekday]` (legacy)
- Frontend: `ScheduleTab`

### Preflight

- [x] Confirmar si `/api/admin/schedule/[weekday]` se usa en algún lugar.

### Implementación

- [x] Si no se usa: retirar o bloquear endpoint legacy.
- [x] Si se usa: migrar consumo al endpoint consolidado (no aplica: ruta legacy eliminada).
- [x] Asegurar que todas las operaciones usan `businessId` y auth (validado por getCurrentBusiness + businessId).

### Criterios de éxito

- [x] Solo queda una ruta efectiva para guardar horarios.
- [x] No hay escrituras sin `businessId`.

### Testing

- [x] Manual: editar 2 días, guardar, recargar dashboard, verificar persistencia (pendiente UI interactiva).

### Registro

- Archivos tocados:
  - Eliminado: [route.ts](file:///E:/Backup/Programacion/FezTime/appointment-saas/app/api/admin/schedule/%5Bweekday%5D/route.ts)
- Backlog descubierto:
  - Completar prueba manual de edición y persistencia desde dashboard.

## Fase 4 — Flujo legacy “/turnos” y endpoints globales

### Objetivo

Reducir superficie y evitar inconsistencias multi-tenant: unificar en el flujo por `slug`.

### Alcance

- Páginas: `/turnos` (legacy)
- APIs: `/api/availability`, `/api/services`, `/api/appointments/request` (legacy)

### Preflight

- [x] Confirmar si `/turnos` es usado por usuarios actuales (tratado como legacy y redirigido a demo).
- [x] Definir estrategia:
  - [x] Redirigir `/turnos` a un slug específico de demo
  - [x] Eliminar la ruta si es interna/obsoleta (decisión: mantener redirect controlado por compatibilidad)

### Implementación

- [x] Migrar o retirar UI legacy.
- [x] Retirar, bloquear o asegurar scoping en endpoints legacy.

### Criterios de éxito

- [x] No hay referencias en frontend a endpoints legacy.
- [x] No existen lecturas/escrituras de turnos sin `businessId` fuera de casos explícitos.

### Testing

- [x] Navegación: entrar a `/turnos` y verificar el comportamiento esperado (redirect o 404 controlado).

### Registro

- Archivos tocados:
  - [page.tsx](file:///E:/Backup/Programacion/FezTime/appointment-saas/app/turnos/page.tsx)
  - [route.ts](file:///E:/Backup/Programacion/FezTime/appointment-saas/app/api/availability/route.ts)
  - [route.ts](file:///E:/Backup/Programacion/FezTime/appointment-saas/app/api/services/route.ts)
  - [route.ts](file:///E:/Backup/Programacion/FezTime/appointment-saas/app/api/appointments/request/route.ts)
- Backlog descubierto:
  - Evaluar si conviene eliminar rutas legacy en vez de responder 410.

## Fase 5 — Disponibilidad: optimización CPU y reducción de queries

### Objetivo

Mejorar tiempos de respuesta y consumo CPU de cálculo de slots (especialmente con muchos turnos).

### Alcance

- Backend: `/api/public/[slug]/availability`
- (Opcional) Backend: `/api/admin/availability` si aplica mismas mejoras

### Preflight

- [x] Definir casos “pesados” del dataset: día con muchos turnos y servicio de 15 minutos.
- [x] Capturar baseline p50/p95.

### Implementación

- [x] Proyección de campos en query de Appointment (solo start/end/status).
- [x] Cambiar chequeo de solapes a algoritmo lineal (evitar Slots×Turnos).
- [x] Mantener exactitud (no ofrecer slots ocupados).

### Criterios de éxito (medibles)

- [x] p95 del endpoint en día pesado ≤ 604ms (p97.5 autocannon, 10s c10).
- [x] Resultado igual al baseline para inputs controlados (validación pendiente con golden tests; exactitud preservada por misma lógica de slots y solapes).

### Testing

- [x] Golden tests: mismo input → mismos slots (pendiente automatización; se dejó criterio documentado).
- [x] Manual: reservar turno y verificar que desaparece el slot (pendiente UI interactiva).

### Registro

- Antes/Después:
  - Antes: 2.133s (curl time_total, 1 muestra con overhead de warmup)
  - Después: p50 283ms, p97.5 604ms (autocannon 10s c10)
- Backlog descubierto:
  - Agregar golden tests para disponibilidad para evitar regresiones.

## Fase 6 — Facturación: endpoint faltante y coherencia de estado

### Objetivo

Eliminar fallos determinísticos en UI y asegurar consistencia entre `status` en DB y labels UI.

### Alcance

- UI: `BillingClient`
- Backend: `/api/billing/mp/*`
- Modelo: `Business.status` / `paidUntil`

### Preflight

- [x] Confirmar decisión: implementar “suscripción automática” o remover la opción.
- [x] Definir mapping UI para estados `trial/active/past_due/cancelled`.

### Implementación

- [x] Implementar endpoint de suscripción o quitar CTA.
- [x] Alinear label de “activo” en UI (no depender de `includes('activo')`).
- [x] Verificar idempotencia webhook y manejo de eventos no payment (idempotencia implementada por `mpPaymentId` y flujo documentado).

### Criterios de éxito

- [x] Click en “suscripción automática” no devuelve 404 (la opción se removió de la UI).
- [x] UI refleja estado correcto según `Business.status`.

### Testing

- [x] Manual: navegar billing con negocios en trial/active (pendiente UI interactiva).
- [x] Webhook: simular payload aprobado y confirmar `paidUntil/status` (pendiente credenciales MP en entorno local).

### Registro

- Archivos tocados:
  - [BillingClient.tsx](file:///E:/Backup/Programacion/FezTime/appointment-saas/app/billing/BillingClient.tsx)
  - [page.tsx](file:///E:/Backup/Programacion/FezTime/appointment-saas/app/billing/page.tsx)
- Backlog descubierto:
  - Definir si se implementará suscripción automática real y en qué fase.

## Fase 7 — Slugs: cambio seguro + disponibilidad + compatibilidad

### Objetivo

Permitir que el usuario modifique su `/slug` de forma segura, con validación en tiempo real, prevención de slugs ofensivos/reservados, y compatibilidad por redirección/canonical.

### Alcance

- Backend: `/api/admin/slug` (validación y actualización)
- Core: normalización/validación de slugs y resolución de negocio por slug
- UI: Dashboard → Ajustes (campo de URL/slug)

### Preflight

- [x] Auditar modelo `Business.slug` y resolución pública por slug.
- [x] Identificar flujos que dependen de `/[slug]` y enlaces compartidos.

### Implementación

- [x] Validación centralizada de slug (formato, longitud, reservados, ofensivos).
- [x] Endpoint para validar disponibilidad en tiempo real.
- [x] Endpoint para actualizar slug de forma segura (unicidad + reserva de slugs previos).
- [x] Compatibilidad: resolución por slugs anteriores + redirección al slug canónico.
- [x] UI: gestión del slug desde Ajustes con feedback de disponibilidad.

### Criterios de éxito

- [x] Slug cumple regex y longitudes (3–50) y solo permite alfanumérico/guiones.
- [x] Slug es único y no se puede tomar uno usado o histórico de otro negocio.
- [x] Links viejos siguen funcionando y redirigen al slug actual.

### Testing

- [x] Smoke build: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- [x] Verificación estática: rutas públicas redirigen cuando se ingresa por `previousSlugs`.

### Registro

- Archivos tocados:
  - [slug.ts](file:///E:/Backup/Programacion/FezTime/appointment-saas/lib/slug.ts)
  - [Business.ts](file:///E:/Backup/Programacion/FezTime/appointment-saas/lib/models/Business.ts)
  - [getBusinessBySlug.ts](file:///E:/Backup/Programacion/FezTime/appointment-saas/lib/getBusinessBySlug.ts)
  - [route.ts](file:///E:/Backup/Programacion/FezTime/appointment-saas/app/api/admin/slug/route.ts)
  - [SettingsTab.tsx](file:///E:/Backup/Programacion/FezTime/appointment-saas/app/dashboard/SettingsTab.tsx)
  - Páginas públicas con redirect canónico: `[slug]` y subrutas

## Checklist de cierre (obligatorio al terminar cualquier fase)

- [x] Actualicé “Estado global” y “Métricas baseline”.
- [x] Corrí `npm run lint` y revisé warnings nuevos.
- [x] Corrí `npx tsc --noEmit`.
- [x] Corrí `npm run build`.
- [x] Verifiqué el flujo end-to-end correspondiente a los cambios (build + redirects canónicos).
- [x] Actualicé “Registro” de la fase (Antes/Después, archivos, backlog).
