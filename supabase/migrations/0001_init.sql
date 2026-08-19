-- BRON: wachtlijst, uitnodigingscodes en bestellingen.
-- Alle tabellen hebben RLS aan zonder policies: alleen de service role
-- (edge functions en het dashboard) kan erbij. De site praat uitsluitend
-- via edge functions met de database.

create table waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  invited_at timestamptz,
  note text
);

create table invite_codes (
  code text primary key,
  source text not null default 'seed',        -- 'seed' | 'order' | 'waitlist'
  issued_to_email text,                        -- aan wie de code is gegeven
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  used_at timestamptz,
  used_by_order uuid
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  product text not null check (product in ('picual5l', 'arbequina1l', 'duo')),
  amount_cents integer not null,
  customer_name text not null,
  email text not null,
  address text not null,
  invite_code text not null references invite_codes(code),
  mollie_payment_id text,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'expired', 'canceled')),
  paid_at timestamptz
);

create index orders_email_idx on orders (email);
create index orders_status_idx on orders (status);
create index invite_codes_used_idx on invite_codes (used_at);

alter table waitlist enable row level security;
alter table invite_codes enable row level security;
alter table orders enable row level security;

-- Adminoverzicht: open het Supabase-dashboard (Table Editor) of query deze view.
create view admin_overview as
select
  (select count(*) from orders where status = 'paid') as betaald,
  (select coalesce(sum(amount_cents), 0) / 100.0 from orders where status = 'paid') as omzet_eur,
  (select count(*) from orders where status = 'pending') as openstaand,
  (select count(*) from waitlist) as wachtlijst,
  (select count(*) from invite_codes where used_at is null) as codes_ongebruikt,
  (select count(*) from invite_codes where used_at is not null) as codes_gebruikt;

-- Startcodes voor je eerste ring: pas het aantal aan en draai dit blok.
-- Codes zijn leesbaar en uniek: BRON-XXXX-XXXX.
insert into invite_codes (code, source)
select 'BRON-' || upper(substr(md5(random()::text), 1, 4)) || '-' || upper(substr(md5(random()::text), 1, 4)), 'seed'
from generate_series(1, 30)
on conflict (code) do nothing;
