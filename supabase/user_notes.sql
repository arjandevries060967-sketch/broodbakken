-- Mijn Broodboek: meerdere algemene notitiebladen per gebruiker
-- Voer dit uit in Supabase SQL Editor.

create table if not exists public.user_note_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Naamloos notitieblad',
  content text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_note_pages enable row level security;

create index if not exists user_note_pages_user_sort_idx
  on public.user_note_pages (user_id, sort_order, updated_at desc);

drop policy if exists "Eigen notitiebladen lezen" on public.user_note_pages;
create policy "Eigen notitiebladen lezen"
  on public.user_note_pages
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Eigen notitiebladen aanmaken" on public.user_note_pages;
create policy "Eigen notitiebladen aanmaken"
  on public.user_note_pages
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Eigen notitiebladen aanpassen" on public.user_note_pages;
create policy "Eigen notitiebladen aanpassen"
  on public.user_note_pages
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Eigen notitiebladen verwijderen" on public.user_note_pages;
create policy "Eigen notitiebladen verwijderen"
  on public.user_note_pages
  for delete
  to authenticated
  using (auth.uid() = user_id);
