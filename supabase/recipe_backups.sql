-- Mijn Broodboek: server-side backups per gebruiker
-- Voer dit uit in Supabase SQL Editor.

create table if not exists public.recipe_backups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  reason text not null default 'auto',
  recipe_count integer not null default 0,
  checksum text,
  payload jsonb not null
);

alter table public.recipe_backups enable row level security;

create index if not exists recipe_backups_user_created_idx
  on public.recipe_backups (user_id, created_at desc);

drop policy if exists "Eigen backups lezen" on public.recipe_backups;
create policy "Eigen backups lezen"
  on public.recipe_backups
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Eigen backups aanmaken" on public.recipe_backups;
create policy "Eigen backups aanmaken"
  on public.recipe_backups
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Eigen backups verwijderen" on public.recipe_backups;
create policy "Eigen backups verwijderen"
  on public.recipe_backups
  for delete
  to authenticated
  using (auth.uid() = user_id);
