-- Users sign in with an email OR a phone number (E.164). Both are verified by
-- the one-time code, so a row only exists once one of them has been proven.
create table if not exists users (
  id             uuid primary key default gen_random_uuid(),
  email          text unique,
  phone          text unique,
  created_at     timestamptz not null default now(),
  last_login_at  timestamptz,
  constraint users_has_identifier check (email is not null or phone is not null)
);
