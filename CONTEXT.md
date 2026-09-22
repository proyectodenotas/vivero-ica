# Vivero Ica — Contexto del proyecto

Gestión de vivero multiusuario para Ica, Perú (clima árido, costero, hemisferio sur). Cada usuario tiene su propio inventario de plantas, bitácora de cuidados, calendario de alertas, compras/ventas y dashboard, completamente aislados de los demás. Permite registrar plantas manualmente o identificarlas por foto con IA, y consulta el clima real del día para avisar si alguna planta corre riesgo.

Producción: https://vivero-ica.vercel.app — Repo: proyectodenotas/vivero-ica

## Stack

- React 18 + Vite 5, un solo archivo de componente (`src/App.jsx`, ~2900 líneas) más `src/main.jsx` como entry point.
- `src/data.js`: capa de acceso a datos, todas las llamadas a Supabase (tablas y Storage).
- `src/supabaseClient.js`: cliente de Supabase para el navegador (anon key).
- Iconos: `lucide-react`.
- Backend: funciones serverless de Vercel en `/api` — auth server-side, proxy autenticado hacia Anthropic/PlantNet, y administración de usuarios (usan la service role key de Supabase, nunca expuesta al cliente).
- Tipografías: Fraunces (títulos), Work Sans (cuerpo), Space Mono (etiquetas). Paleta cálida en tonos tierra (`#F1E9D2` fondo, `#211C14` texto, `#A85C32` terracota, `#2F5233` verde).

## Backend: Supabase (Postgres + Auth + Storage)

Esquema completo en `supabase/schema.sql` — **idempotente, se puede volver a correr sin romper nada**; cualquier cambio de esquema futuro debe agregarse ahí (con `alter table ... add column if not exists` para columnas nuevas sobre tablas existentes).

**Importante — GRANT además de RLS**: habilitar Row Level Security en una tabla de Postgres NO basta por sí solo; Postgres además exige un `GRANT` explícito en la tabla al rol (`authenticated`, `service_role`) o toda query falla con `permission denied` (42501), sin importar que las policies estén perfectas. `schema.sql` ya incluye los GRANT necesarios — si se crea una tabla nueva, hay que agregar su GRANT también. Y tras cualquier cambio de permisos, PostgREST puede tardar en reflejarlo — `schema.sql` termina con `notify pgrst, 'reload schema';` para forzar el refresco.

### Tablas (todas con RLS por `owner_id = auth.uid()`, excepto `profiles`)

- `profiles`: extiende `auth.users`. `role` (`admin`/`user`), `nombre`, `vivero_nombre`, `active`. Se crea automáticamente vía trigger `on_auth_user_created` al dar de alta un usuario en Auth.
- `plant_types`: áreas/categorías de planta, por usuario. `slug` mapea a los cuidados por defecto (`CARE_INFO` en App.jsx) para los 16 tipos base sembrados automáticamente al primer login (`seedDefaultPlantTypes`, usa `upsert` con `onConflict: owner_id,slug` — importante que sea así y no `insert` simple, porque `React.StrictMode` en desarrollo monta el efecto de carga dos veces y un insert plano duplicaría los tipos base).
- `spaces`: ubicación física/organizativa dentro del vivero (Invernadero A, Mesa de propagación…), distinta del tipo botánico.
- `plants`: inventario. `estado` (`en_inventario`/`vendida`/`baja`), `valor_actual` se actualiza al registrar una transacción. `materiales` es un campo agregado fuera del modelo original del prompt, preserva una función que ya existía en la app (badges de materiales de sustrato en la ficha).
- `bitacora_eventos`: cuidados por planta (fertilización, riego, cambio de maceta, cambio de sustrato, poda, control de plagas, trasplante, otro). `repite_cada_dias` + `proxima_fecha_sugerida` alimentan el Calendario.
- `transacciones`: compras/ventas, moneda fija PEN. `plant_id` es `ON DELETE SET NULL` (si se borra la planta, el historial financiero se conserva).

### Storage

Bucket `plant-photos`, público para lectura, escritura solo dentro de la carpeta `<owner_id>/...` del usuario dueño.

## Autenticación y multiusuario

- Supabase Auth (email/password). No hay señal de auto-registro en la UI — los usuarios los crea un admin desde Configuración.
- `api/bootstrap-admin.js`: se llama automáticamente tras cada login (ver `App.jsx`); si todavía no existe ningún `admin`, promueve al usuario que se loguea. Si ya hay uno, no hace nada.
- `api/admin-users.js`: GET/POST/PATCH, protegido (`role='admin'` vía `getAuthedUser` en `api/_supabase.js`). Crear usuario usa `auth.admin.createUser` con `email_confirm: true` (sin verificación de correo). Desactivar usuario usa `auth.admin.updateUserById(id, { ban_duration })`, además de marcar `profiles.active = false` — el ban bloquea el login de verdad, no es solo un flag visual.
- `api/_supabase.js`: `adminClient()` (service role, ignora RLS, solo server-side) y `getAuthedUser(req)` (valida el Bearer token del cliente).
- El cliente llama a `/api/claude` e `/api/identify` con `Authorization: Bearer <access_token>` (helper `authHeader()` en `App.jsx`).

## Módulos de la app (pestañas)

1. **Inventario**: CRUD de plantas, fotos a Supabase Storage (comprimidas en cliente, luego subidas — `db.uploadPlantPhoto`), identificación por IA, gestión rápida de áreas/espacios (crear desde el toolbar).
2. **Calendario**: tareas vencidas/próximas (7 días) derivadas de `bitacora_eventos.proxima_fecha_sugerida`, vista de mes. Botón "Sugerencias de cuidado (IA)" en la bitácora de cada planta, mismo patrón que el clima (`/api/claude` + `web_search_20250305`).
3. **Compras y ventas**: registrar compra/venta vinculando una planta existente (o crearla al vuelo); una venta marca `estado='vendida'` y la planta sale del inventario activo pero conserva su historial.
4. **Dashboard**: filtro de rango de fechas; plantas activas + variación (altas − bajas por venta, reconstruido a partir de `created_at` y la primera venta de cada planta); evolución mensual del inventario (columnas); distribución por tipo (colores heredados de cada área) y por espacio; alertas activas (notas/eventos de plagas + bitácora vencida).
5. **Configuración**: gestión de usuarios (solo `admin`), editar/eliminar áreas y espacios, cambiar contraseña, cerrar sesión, migración puntual de datos viejos de `localStorage` (`ica-plant-inventory`/`ica-plant-tipos`, versión pre-Supabase — `db.migrateLocalInventory`).

## Flujo de identificación de planta por foto

1. El usuario sube una imagen y se comprime en el cliente, máximo 640px, calidad 0.72, JPEG base64 (`fileToCompressedDataUrl`).
2. Se envía a `POST /api/claude`, modelo `claude-sonnet-4-6`, con la imagen y un prompt que pide un JSON con nombre común, nombre científico, categoría, sustrato recomendado, cuidados, clima natural de la especie y cómo adaptarla a Ica.
3. Si la categoría devuelta no existe entre los tipos del usuario, se crea un tipo nuevo con color automático.
4. El formulario de nueva planta se abre pre-llenado, marcado como `aiIdentified: true`. Al guardar, la imagen (todavía en base64 en ese punto) se sube a Storage y se reemplaza por su URL pública.

Nota: `api/identify.js` (PlantNet) sigue implementado pero no conectado desde la interfaz — el botón "Subir foto" llama únicamente a `/api/claude`.

## Endpoints de /api

- `claude.js`, POST: proxy autenticado (Bearer token de Supabase) hacia la API de Anthropic.
- `identify.js`, POST: proxy autenticado hacia PlantNet, no usado actualmente desde la UI.
- `bootstrap-admin.js`, POST: promueve al primer usuario a admin.
- `admin-users.js`, GET/POST/PATCH: gestión de usuarios, solo admin.
- `_supabase.js`: helpers compartidos (`adminClient`, `getAuthedUser`), no es un endpoint.

**Limitación de desarrollo local**: `npm run dev` (Vite) NO sirve las funciones `/api/*` — esas son funciones serverless de Vercel. En local solo se puede probar la UI y las llamadas directas a Supabase (RLS incluido); para probar `/api/claude`, `/api/identify`, `/api/bootstrap-admin` o `/api/admin-users` hace falta desplegar a Vercel o correr `vercel dev` (requiere Vercel CLI).

## Variables de entorno, configuradas en Vercel, nunca en el repo

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`: cliente (prefijo `VITE_` para que Vite las exponga al navegador).
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: solo funciones serverless.
- `ANTHROPIC_API_KEY`: usada por `api/claude.js`.
- `PLANTNET_API_KEY`: usada por `api/identify.js`, endpoint no conectado actualmente.
- Para desarrollo local: copiar `.env.example` a `.env.local` (gitignored) y completar.

## Ideas y pendientes conocidos

- `api/identify.js` (PlantNet) está implementado pero no integrado a la interfaz.
- El Dashboard reconstruye el estado histórico del inventario a partir de `created_at` de cada planta y la fecha de su primera venta — no hay una tabla de snapshots, así que "plantas activas a la fecha X" es siempre derivado, no almacenado.
- Las alertas del Dashboard usan el estado actual (hoy), no se filtran por el rango de fechas del Dashboard — es una decisión de producto, no una limitación técnica (no tendría mucho sentido preguntar "qué alertas había hace 3 meses" con los datos que se guardan hoy).
