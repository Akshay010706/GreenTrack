create table leaderboard (
  id uuid primary key default gen_random_uuid(),
  user_id text unique not null,
  points integer default 0
);
