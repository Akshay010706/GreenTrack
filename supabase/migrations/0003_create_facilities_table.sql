create table facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  lat float8 not null,
  lng float8 not null,
  address text,
  hours text
);
