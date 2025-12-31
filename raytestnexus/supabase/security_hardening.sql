-- =========================================================
-- Security hardening: roles, storage, Stripe idempotency, extra tables
-- =========================================================

-- -------------------------
-- A) Prevent role escalation
-- -------------------------

-- Ensure handle_new_user always sets role='user'
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, name, email)
  values (
    new.id,
    'user',
    new.raw_user_meta_data->>'name',
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Block non-admin role changes (service_role allowed for backend)
create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
begin
  if new.role is distinct from old.role then
    if auth.role() = 'service_role' then
      return new;
    end if;

    select role into caller_role from public.profiles where id = auth.uid();
    if caller_role is distinct from 'admin' then
      raise exception 'Not authorized to change role';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_profile_role_change on public.profiles;
create trigger prevent_profile_role_change
before update on public.profiles
for each row execute function public.prevent_profile_role_change();

-- Ensure users can update their own profile but cannot change role (enforced by trigger)
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Admin-only role update function
create or replace function public.set_role(target_user_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
begin
  select role into caller_role from public.profiles where id = auth.uid();
  if caller_role is distinct from 'admin' then
    raise exception 'Only admins can set roles';
  end if;

  if new_role not in ('user','admin','client','partner','sales') then
    raise exception 'Invalid role';
  end if;

  update public.profiles
  set role = new_role
  where id = target_user_id;

  if not found then
    raise exception 'Profile not found';
  end if;
end;
$$;

-- ---------------------------------------
-- B) Storage policies for documents bucket
-- ---------------------------------------

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do update set public = false;

-- Helper expression: extract client_id from path
-- name format: clients/<client_id>/<filename>

-- SELECT/READ policy

drop policy if exists "documents_read" on storage.objects;
create policy "documents_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
    or exists (
      select 1 from public.client_users cu
      where cu.user_id = auth.uid()
        and cu.client_id = split_part(name, '/', 2)::uuid
    )
    or exists (
      select 1 from public.client_staff cs
      where cs.user_id = auth.uid()
        and cs.client_id = split_part(name, '/', 2)::uuid
    )
  )
);

-- INSERT/UPLOAD policy

drop policy if exists "documents_insert" on storage.objects;
create policy "documents_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
    or exists (
      select 1 from public.client_users cu
      where cu.user_id = auth.uid()
        and cu.client_id = split_part(name, '/', 2)::uuid
    )
    or exists (
      select 1 from public.client_staff cs
      where cs.user_id = auth.uid()
        and cs.client_id = split_part(name, '/', 2)::uuid
    )
  )
);

-- UPDATE policy (admin or staff only)

drop policy if exists "documents_update" on storage.objects;
create policy "documents_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
    or exists (
      select 1 from public.client_staff cs
      where cs.user_id = auth.uid()
        and cs.client_id = split_part(name, '/', 2)::uuid
    )
  )
)
with check (
  bucket_id = 'documents'
  and (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
    or exists (
      select 1 from public.client_staff cs
      where cs.user_id = auth.uid()
        and cs.client_id = split_part(name, '/', 2)::uuid
    )
  )
);

-- DELETE policy (admin or staff only)

drop policy if exists "documents_delete" on storage.objects;
create policy "documents_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
    or exists (
      select 1 from public.client_staff cs
      where cs.user_id = auth.uid()
        and cs.client_id = split_part(name, '/', 2)::uuid
    )
  )
);

-- --------------------------------------
-- C) Stripe idempotency support table
-- --------------------------------------

create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  created_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;

drop policy if exists "stripe_events_admin_select" on public.stripe_events;
create policy "stripe_events_admin_select"
on public.stripe_events
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Note: Stripe webhook should insert event id first; if conflict, skip processing.

-- --------------------------------------
-- D) Document extractions table + RLS
-- --------------------------------------

create table if not exists public.document_extractions (
  id bigserial primary key,
  client_id uuid not null references public.clients(id) on delete cascade,
  path text not null,
  extracted jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.document_extractions enable row level security;

drop policy if exists "document_extractions_select" on public.document_extractions;
create policy "document_extractions_select"
on public.document_extractions
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
  or exists (
    select 1 from public.client_users cu
    where cu.user_id = auth.uid()
      and cu.client_id = public.document_extractions.client_id
  )
  or exists (
    select 1 from public.client_staff cs
    where cs.user_id = auth.uid()
      and cs.client_id = public.document_extractions.client_id
  )
);
