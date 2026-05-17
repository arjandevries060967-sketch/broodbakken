-- Mijn Broodboek: profielrecords voor nieuwe gebruikers
-- Voer dit uit in Supabase SQL Editor als nieuwe accounts fout gaan met:
-- Database error saving new user.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- Herstel eventueel bestaande auth-gebruikers zonder profiel:
insert into public.profiles (id, display_name, avatar_url)
select id, coalesce(split_part(email, '@', 1), ''), ''
from auth.users
on conflict (id) do nothing;
