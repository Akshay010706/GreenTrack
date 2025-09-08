create table reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  category text not null,
  photo_url text,
  note text,
  lat float8 not null,
  lng float8 not null,
  status text default 'new',
  user_id text not null
);
