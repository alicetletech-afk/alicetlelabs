alter table public.events add column if not exists early_bird_active boolean not null default false;
alter table public.events add column if not exists early_bird_price numeric(10,2) check (early_bird_price is null or early_bird_price >= 0);
