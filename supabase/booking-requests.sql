-- Customer LINE booking requests: public can create, authenticated admins can review/confirm.
create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  date_ids uuid[] not null default '{}',
  selected_dates date[] not null default '{}',
  start_date date not null,
  end_date date not null,
  pickup_location text not null default '',
  return_location text not null default '',
  rental_total numeric(10,2) not null check (rental_total >= 0),
  message text not null default '',
  request_status text not null default 'pending' check (request_status in ('pending','confirmed','rejected','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists booking_requests_status_idx on public.booking_requests(request_status, created_at desc);
create index if not exists booking_requests_event_idx on public.booking_requests(event_id, start_date);

drop trigger if exists booking_requests_updated_at on public.booking_requests;
create trigger booking_requests_updated_at before update on public.booking_requests for each row execute function public.set_updated_at();

alter table public.booking_requests enable row level security;
grant insert on public.booking_requests to anon;
grant select,update on public.booking_requests to authenticated;

drop policy if exists "public can create booking requests" on public.booking_requests;
create policy "public can create booking requests" on public.booking_requests for insert to anon with check (true);
drop policy if exists "authenticated admins review booking requests" on public.booking_requests;
create policy "authenticated admins review booking requests" on public.booking_requests for select to authenticated using (true);
drop policy if exists "authenticated admins update booking requests" on public.booking_requests;
create policy "authenticated admins update booking requests" on public.booking_requests for update to authenticated using (true) with check (true);

do $$ begin alter publication supabase_realtime add table public.booking_requests; exception when duplicate_object then null; end $$;
