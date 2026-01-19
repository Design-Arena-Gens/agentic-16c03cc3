create table if not exists public.shein_raw_snapshots (
  snapshot_id text not null,
  goods_id text not null,
  category text not null,
  review_num integer not null default 0,
  payload jsonb not null,
  collected_at timestamptz not null default timezone('utc', now()),
  inserted_at timestamptz not null default timezone('utc', now()),
  primary key (snapshot_id, goods_id)
);

create table if not exists public.shein_outliers (
  product_id text primary key,
  snapshot_id text not null,
  category text not null,
  payload jsonb not null,
  price_brl numeric not null,
  review_growth_weekly numeric not null,
  collected_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists shein_raw_snapshots_category_idx on public.shein_raw_snapshots(category, collected_at desc);
create index if not exists shein_outliers_category_idx on public.shein_outliers(category, collected_at desc);
