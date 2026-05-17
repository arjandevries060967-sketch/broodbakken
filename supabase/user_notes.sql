-- Mijn Broodboek: algemeen notitieblad per gebruiker
-- Voer dit uit in Supabase SQL Editor.

create table if not exists public.user_notes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.user_notes enable row level security;

drop policy if exists "Eigen notitieblad lezen" on public.user_notes;
create policy "Eigen notitieblad lezen"
  on public.user_notes
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Eigen notitieblad opslaan" on public.user_notes;
create policy "Eigen notitieblad opslaan"
  on public.user_notes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Eigen notitieblad aanpassen" on public.user_notes;
create policy "Eigen notitieblad aanpassen"
  on public.user_notes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
