-- Mijn Broodboek: profielrecords voor nieuwe gebruikers
-- Voer dit uit in Supabase SQL Editor als nieuwe accounts fout gaan met:
-- Database error saving new user.
--
-- Belangrijk: als er al een oude kapotte auth-trigger bestaat, faalt signup nog steeds.
-- Dit script verwijdert de bekende oude Broodboek-profieltriggers en maakt één schone trigger terug.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Zorg dat bestaande profiles-tabellen in ieder geval de kolommen hebben die de app gebruikt.
alter table public.profiles add column if not exists display_name text not null default '';
alter table public.profiles add column if not exists avatar_url text not null default '';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.profiles enable row level security;

drop policy if exists "Profielen lezen" on public.profiles;
create policy "Profielen lezen"
  on public.profiles
  for select
  to authenticated
  using (true);

drop policy if exists "Eigen profiel aanmaken" on public.profiles;
create policy "Eigen profiel aanmaken"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Eigen profiel aanpassen" on public.profiles;
create policy "Eigen profiel aanpassen"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), ''),
    ''
  )
  on conflict (id) do update set
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    updated_at = now();
  return new;
exception when others then
  raise log 'Broodboek profile trigger skipped for user %: %', new.id, sqlerrm;
  return new;
end;
$$;

-- Verwijder bekende oude/kapotte profieltriggers op auth.users.
drop trigger if exists on_auth_user_created_profile on auth.users;
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists handle_new_user on auth.users;
drop trigger if exists create_profile_for_user on auth.users;

create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- Herstel eventueel bestaande auth-gebruikers zonder profiel.
insert into public.profiles (id, display_name, avatar_url)
select id, coalesce(split_part(email, '@', 1), ''), ''
from auth.users
on conflict (id) do nothing;

-- Diagnose: voer dit eventueel los uit als signup nog faalt.
-- Hiermee zie je welke triggers nog op auth.users staan.
-- select
--   t.tgname as trigger_name,
--   p.proname as function_name,
--   n.nspname as function_schema
-- from pg_trigger t
-- join pg_proc p on p.oid = t.tgfoid
-- join pg_namespace n on n.oid = p.pronamespace
-- where t.tgrelid = 'auth.users'::regclass
--   and not t.tgisinternal
-- order by t.tgname;
