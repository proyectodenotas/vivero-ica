-- Vivero Ica — esquema Supabase (Fase 1)
-- Ejecutar completo en el SQL Editor del proyecto Supabase.
-- Idempotente: puede volver a correrse sin duplicar objetos.

-- ---------------------------------------------------------------------------
-- profiles: extiende auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('admin', 'user')),
  nombre text,
  vivero_nombre text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Crea automáticamente una fila en profiles cuando Supabase Auth crea un usuario
-- nuevo (tanto por el endpoint de admin como por el bootstrap inicial).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Función auxiliar para políticas: evita recursión de RLS sobre profiles.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- No hay policy de insert/delete para clientes: la creación y baja de usuarios
-- se hace desde endpoints serverless con la service role key, que ignora RLS.

-- Tema de colores por usuario (Configuración → Apariencia). Defaults = los
-- colores reales que ya usaba la app (verde, tinta oscura, terracota) — un
-- perfil existente o uno nuevo sin fila explícita hereda estos valores solos.
alter table public.profiles add column if not exists theme_primary text not null default '#2F5233';
alter table public.profiles add column if not exists theme_secondary text not null default '#211C14';
alter table public.profiles add column if not exists theme_accent text not null default '#A85C32';

-- ---------------------------------------------------------------------------
-- plant_types
-- ---------------------------------------------------------------------------
create table if not exists public.plant_types (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  color text not null,
  sustrato text,
  estratos int[],
  -- slug de la categoría semántica original (ej. "cactus"), usado para
  -- mapear a los cuidados/materiales por defecto definidos en el código.
  -- null para tipos personalizados creados por el usuario.
  slug text,
  created_at timestamptz not null default now()
);
create index if not exists plant_types_owner_idx on public.plant_types(owner_id);

-- Por si la tabla ya existía de una corrida anterior del schema sin esta columna.
alter table public.plant_types add column if not exists slug text;

-- Evita sembrar los tipos base duplicados si el efecto de carga se dispara
-- dos veces (ej. React.StrictMode en desarrollo, o una carrera de red real).
-- Sin WHERE: un índice único parcial no sirve de blanco para ON CONFLICT vía
-- PostgREST. No hace falta el filtro igual — Postgres nunca considera dos
-- NULL iguales entre sí, así que los tipos personalizados (slug null) no
-- chocan entre ellos de todas formas.
drop index if exists plant_types_owner_slug_idx;
create unique index plant_types_owner_slug_idx on public.plant_types(owner_id, slug);

alter table public.plant_types enable row level security;
drop policy if exists plant_types_owner on public.plant_types;
create policy plant_types_owner on public.plant_types
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- spaces (ubicación física/organizativa dentro del vivero)
-- ---------------------------------------------------------------------------
create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  descripcion text,
  created_at timestamptz not null default now()
);
create index if not exists spaces_owner_idx on public.spaces(owner_id);

alter table public.spaces enable row level security;
drop policy if exists spaces_owner on public.spaces;
create policy spaces_owner on public.spaces
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- plants
-- ---------------------------------------------------------------------------
create table if not exists public.plants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  variedad text,
  tipo_id uuid references public.plant_types(id) on delete set null,
  space_id uuid references public.spaces(id) on delete set null,
  sustrato text,
  -- lista corta de materiales de sustrato sugeridos (no está en el modelo
  -- original del prompt, pero ya existía en la app y se muestra en la
  -- ficha de la planta como badges; se preserva en vez de perder la función.
  materiales text,
  cuidados text,
  clima_preferido text,
  adaptacion text,
  ubicacion text,
  foto_url text,
  fecha_recepcion date,
  vivero_origen text,
  provincia_origen text,
  notas text,
  estado text not null default 'en_inventario' check (estado in ('en_inventario', 'vendida', 'baja')),
  valor_actual numeric(12, 2),
  ai_identified boolean not null default false,
  created_at timestamptz not null default now()
);
-- Por si la tabla ya existía de una corrida anterior del schema sin esta columna.
alter table public.plants add column if not exists materiales text;

create index if not exists plants_owner_idx on public.plants(owner_id);
create index if not exists plants_tipo_idx on public.plants(tipo_id);
create index if not exists plants_space_idx on public.plants(space_id);
create index if not exists plants_estado_idx on public.plants(estado);

alter table public.plants enable row level security;
drop policy if exists plants_owner on public.plants;
create policy plants_owner on public.plants
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- bitacora_eventos
-- ---------------------------------------------------------------------------
create table if not exists public.bitacora_eventos (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references public.plants(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null default current_date,
  tipo text not null check (tipo in (
    'fertilizacion', 'riego', 'cambio_maceta', 'cambio_sustrato',
    'poda', 'control_plagas', 'trasplante', 'otro'
  )),
  insumo text,
  dosis text,
  repite_cada_dias int,
  proxima_fecha_sugerida date,
  nota text,
  created_at timestamptz not null default now()
);
create index if not exists bitacora_plant_idx on public.bitacora_eventos(plant_id);
create index if not exists bitacora_owner_idx on public.bitacora_eventos(owner_id);
create index if not exists bitacora_proxima_fecha_idx on public.bitacora_eventos(proxima_fecha_sugerida);

alter table public.bitacora_eventos enable row level security;
drop policy if exists bitacora_owner on public.bitacora_eventos;
create policy bitacora_owner on public.bitacora_eventos
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- transacciones
-- Nota: plant_id es nullable con ON DELETE SET NULL — si se borra una planta,
-- el historial financiero (compras/ventas ya registradas) se conserva.
-- ---------------------------------------------------------------------------
create table if not exists public.transacciones (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  plant_id uuid references public.plants(id) on delete set null,
  tipo text not null check (tipo in ('compra', 'venta')),
  monto numeric(12, 2) not null,
  moneda text not null default 'PEN',
  contraparte text,
  fecha date not null default current_date,
  nota text,
  created_at timestamptz not null default now()
);
create index if not exists transacciones_owner_idx on public.transacciones(owner_id);
create index if not exists transacciones_plant_idx on public.transacciones(plant_id);
create index if not exists transacciones_fecha_idx on public.transacciones(fecha);

alter table public.transacciones enable row level security;
drop policy if exists transacciones_owner on public.transacciones;
create policy transacciones_owner on public.transacciones
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Privilegios base para el rol authenticated.
-- RLS por sí solo NO alcanza: Postgres exige un GRANT en la tabla además de
-- las policies — sin esto, toda query falla con "permission denied" (42501)
-- sin importar cuán bien estén escritas las policies. Las policies siguen
-- siendo las que deciden fila por fila (ej. profiles no tiene policy de
-- insert, así que un GRANT insert aquí no abre esa puerta).
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on
  public.profiles,
  public.plant_types,
  public.spaces,
  public.plants,
  public.bitacora_eventos,
  public.transacciones
to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Storage: bucket de fotos de plantas
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('plant-photos', 'plant-photos', true)
on conflict (id) do nothing;

-- Cada owner solo puede escribir/editar/borrar dentro de su propia carpeta
-- <owner_id>/... dentro del bucket. Lectura pública (bucket público) porque
-- las fotos se muestran en la ficha de la planta vía URL directa.
drop policy if exists plant_photos_read on storage.objects;
create policy plant_photos_read on storage.objects
  for select using (bucket_id = 'plant-photos');

drop policy if exists plant_photos_write on storage.objects;
create policy plant_photos_write on storage.objects
  for insert with check (
    bucket_id = 'plant-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists plant_photos_update on storage.objects;
create policy plant_photos_update on storage.objects
  for update using (
    bucket_id = 'plant-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists plant_photos_delete on storage.objects;
create policy plant_photos_delete on storage.objects
  for delete using (
    bucket_id = 'plant-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- PostgREST cachea permisos/roles; sin este aviso, un GRANT recién corrido
-- puede tardar en verse reflejado en las llamadas a la API.
notify pgrst, 'reload schema';
