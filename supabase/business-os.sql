-- AlicetleLabs Business OS
-- Idempotent migration for Orders, Payments, Rental Bookings, Jobs and settings.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('rental','job')),
  source_id uuid,
  total numeric(10,2) not null check (total >= 0),
  status text not null default 'open' check (status in ('open','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  amount numeric(10,2) not null check (amount > 0),
  paid_at timestamptz not null default now(),
  method text not null default 'transfer' check (method in ('transfer','cash','other')),
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.rental_bookings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid unique references public.orders(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict,
  date_ids uuid[] not null default '{}',
  customer_name text not null,
  line_contact text not null default '',
  start_date date not null,
  end_date date not null,
  pickup_location text not null default '',
  return_location text not null default '',
  rental_total numeric(10,2) not null check (rental_total >= 0),
  booking_status text not null default 'confirmed' check (booking_status in ('confirmed','active','completed','cancelled')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid unique references public.orders(id) on delete restrict,
  customer_name text not null,
  job_name text not null,
  category text not null default 'other',
  received_date date not null default current_date,
  due_date date,
  price numeric(10,2) not null check (price >= 0),
  job_status text not null default 'new' check (job_status in ('new','in_progress','delivered','cancelled')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists orders_source_idx on public.orders(source_type, source_id);
create index if not exists payments_order_idx on public.payments(order_id, paid_at);
create index if not exists rental_bookings_event_idx on public.rental_bookings(event_id, start_date);
create index if not exists jobs_status_idx on public.jobs(job_status, due_date);

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
drop trigger if exists rental_bookings_updated_at on public.rental_bookings;
create trigger rental_bookings_updated_at before update on public.rental_bookings for each row execute function public.set_updated_at();
drop trigger if exists jobs_updated_at on public.jobs;
create trigger jobs_updated_at before update on public.jobs for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.rental_bookings enable row level security;
alter table public.jobs enable row level security;
alter table public.business_settings enable row level security;

grant select,insert,update,delete on public.orders,public.payments,public.rental_bookings,public.jobs,public.business_settings to authenticated;

drop policy if exists "authenticated admins manage orders" on public.orders;
create policy "authenticated admins manage orders" on public.orders for all to authenticated using (true) with check (true);
drop policy if exists "authenticated admins manage payments" on public.payments;
create policy "authenticated admins manage payments" on public.payments for all to authenticated using (true) with check (true);
drop policy if exists "authenticated admins manage rental bookings" on public.rental_bookings;
create policy "authenticated admins manage rental bookings" on public.rental_bookings for all to authenticated using (true) with check (true);
drop policy if exists "authenticated admins manage jobs" on public.jobs;
create policy "authenticated admins manage jobs" on public.jobs for all to authenticated using (true) with check (true);
drop policy if exists "authenticated admins manage business settings" on public.business_settings;
create policy "authenticated admins manage business settings" on public.business_settings for all to authenticated using (true) with check (true);

do $$ begin alter publication supabase_realtime add table public.orders; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.payments; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.rental_bookings; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.jobs; exception when duplicate_object then null; end $$;
