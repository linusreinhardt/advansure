-- =====================================================================
--  LinoHub – Initiale Migration
--  - Tabelle public.profiles (1:1 zu auth.users) mit Rolle
--  - Hilfsfunktion is_admin() (umgeht RLS-Rekursion)
--  - Row Level Security + Policies
--  - Trigger: legt automatisch ein Profil an, sobald ein User entsteht
--
--  Idempotent: kann mehrfach ausgeführt werden.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Tabelle "profiles"
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid        primary key references auth.users (id) on delete cascade,
  email      text        not null,
  role       text        not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Benutzerprofile inkl. Rolle (admin|user), 1:1 verknüpft mit auth.users';

-- updated_at automatisch pflegen
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 2) Hilfsfunktion: Ist der aktuelle Nutzer Admin?
--    SECURITY DEFINER -> läuft mit den Rechten des Owners und umgeht RLS.
--    Das verhindert eine Endlos-Rekursion, die entstünde, wenn eine
--    Policy auf "profiles" selbst wieder "profiles" abfragen würde.
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- 3) Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Aufräumen (idempotent)
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_insert_admin"        on public.profiles;
drop policy if exists "profiles_update_admin"        on public.profiles;
drop policy if exists "profiles_delete_admin"        on public.profiles;

-- SELECT: eigenes Profil ODER Admin sieht alle
create policy "profiles_select_own_or_admin"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id or public.is_admin());

-- INSERT: nur Admins (der Service-Role-Key umgeht RLS ohnehin)
create policy "profiles_insert_admin"
  on public.profiles
  for insert
  to authenticated
  with check (public.is_admin());

-- UPDATE: nur Admins
create policy "profiles_update_admin"
  on public.profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- DELETE: nur Admins
create policy "profiles_delete_admin"
  on public.profiles
  for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- 4) Auto-Profil: sobald ein auth.users-Eintrag entsteht, Profil anlegen.
--    Die Rolle wird – falls vorhanden – aus den User-Metadaten gelesen,
--    defensiv aber nur 'admin' zugelassen, sonst 'user'.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case
      when (new.raw_user_meta_data ->> 'role') = 'admin' then 'admin'
      else 'user'
    end
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
