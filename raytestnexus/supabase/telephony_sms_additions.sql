-- =========================================================
-- Telephony + SMS additions (append-only)
-- =========================================================

-- -------------------------
-- A) Telephony identities
-- -------------------------

create table if not exists public.user_telephony_identities (
  user_id uuid primary key references auth.users(id) on delete cascade,
  identity text unique not null,
  last_seen_at timestamptz,
  created_at timestamptz default now()
);

alter table public.user_telephony_identities enable row level security;

drop policy if exists "user_telephony_identities_select_own" on public.user_telephony_identities;
create policy "user_telephony_identities_select_own"
on public.user_telephony_identities
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_telephony_identities_update_own" on public.user_telephony_identities;
create policy "user_telephony_identities_update_own"
on public.user_telephony_identities
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_telephony_identities_internal_select" on public.user_telephony_identities;
create policy "user_telephony_identities_internal_select"
on public.user_telephony_identities
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','user','sales','partner')
  )
);

-- -------------------------
-- B) SMS threads/messages
-- -------------------------

create table if not exists public.sms_threads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  phone text not null,
  created_at timestamptz default now(),
  unique (client_id, phone)
);

create table if not exists public.sms_messages (
  id bigserial primary key,
  thread_id uuid not null references public.sms_threads(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  direction text not null check (direction in ('inbound','outbound')),
  from_number text,
  to_number text,
  body text,
  status text,
  provider text not null default 'twilio',
  provider_message_sid text unique,
  error_code text,
  error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists sms_threads_client_created_idx
  on public.sms_threads (client_id, created_at desc);
create index if not exists sms_threads_client_phone_idx
  on public.sms_threads (client_id, phone);
create index if not exists sms_messages_client_created_idx
  on public.sms_messages (client_id, created_at desc);
create index if not exists sms_messages_provider_sid_idx
  on public.sms_messages (provider_message_sid);

alter table public.sms_threads enable row level security;
alter table public.sms_messages enable row level security;

drop policy if exists "sms_threads_select" on public.sms_threads;
create policy "sms_threads_select"
on public.sms_threads
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
  or exists (
    select 1 from public.client_users cu
    where cu.user_id = auth.uid() and cu.client_id = sms_threads.client_id
  )
  or exists (
    select 1 from public.client_staff cs
    where cs.user_id = auth.uid() and cs.client_id = sms_threads.client_id
  )
);

drop policy if exists "sms_threads_insert" on public.sms_threads;
create policy "sms_threads_insert"
on public.sms_threads
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
  or exists (
    select 1 from public.client_staff cs
    where cs.user_id = auth.uid() and cs.client_id = sms_threads.client_id
  )
);

drop policy if exists "sms_threads_update" on public.sms_threads;
create policy "sms_threads_update"
on public.sms_threads
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
  or exists (
    select 1 from public.client_staff cs
    where cs.user_id = auth.uid() and cs.client_id = sms_threads.client_id
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
  or exists (
    select 1 from public.client_staff cs
    where cs.user_id = auth.uid() and cs.client_id = sms_threads.client_id
  )
);

drop policy if exists "sms_messages_select" on public.sms_messages;
create policy "sms_messages_select"
on public.sms_messages
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
  or exists (
    select 1 from public.client_users cu
    where cu.user_id = auth.uid() and cu.client_id = sms_messages.client_id
  )
  or exists (
    select 1 from public.client_staff cs
    where cs.user_id = auth.uid() and cs.client_id = sms_messages.client_id
  )
);

-- -------------------------
-- C) Consent enforcement (SMS)
-- -------------------------

create index if not exists contact_consent_lookup_idx
  on public.contact_consent (client_id, contact_id, channel, created_at desc);

create or replace function public.get_latest_consent_status(
  p_client_id uuid,
  p_contact_id uuid,
  p_channel text
)
returns text
language sql
stable
set search_path = public
as $$
  select cc.status
  from public.contact_consent cc
  where cc.client_id = p_client_id
    and cc.contact_id = p_contact_id
    and cc.channel = p_channel
  order by cc.created_at desc
  limit 1;
$$;
