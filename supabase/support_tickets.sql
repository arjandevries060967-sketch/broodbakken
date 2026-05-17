-- Mijn Broodboek: supporttickets voor gebruikers
-- Voer dit uit in Supabase SQL Editor.
-- Daarna: vervang hieronder jouw@email.nl door je eigen login e-mailadres en voer die insert ook uit.

create table if not exists public.app_developers (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.app_developers enable row level security;

drop policy if exists "Developers mogen developerlijst lezen" on public.app_developers;
create policy "Developers mogen developerlijst lezen"
  on public.app_developers
  for select
  to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  subject text not null,
  message text not null,
  category text not null default 'Vraag',
  priority text not null default 'Normaal',
  status text not null default 'nieuw',
  developer_reply text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_tickets enable row level security;

create index if not exists support_tickets_user_created_idx
  on public.support_tickets (user_id, created_at desc);

create index if not exists support_tickets_created_idx
  on public.support_tickets (created_at desc);

drop policy if exists "Eigen supporttickets of developer lezen" on public.support_tickets;
create policy "Eigen supporttickets of developer lezen"
  on public.support_tickets
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.app_developers d
      where lower(d.email) = lower(auth.jwt() ->> 'email')
    )
  );

drop policy if exists "Eigen supporttickets aanmaken" on public.support_tickets;
create policy "Eigen supporttickets aanmaken"
  on public.support_tickets
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Developer mag supporttickets aanpassen" on public.support_tickets;
create policy "Developer mag supporttickets aanpassen"
  on public.support_tickets
  for update
  to authenticated
  using (
    exists (
      select 1 from public.app_developers d
      where lower(d.email) = lower(auth.jwt() ->> 'email')
    )
  )
  with check (
    exists (
      select 1 from public.app_developers d
      where lower(d.email) = lower(auth.jwt() ->> 'email')
    )
  );

-- Zet jezelf als developer aan, met het e-mailadres waarmee je inlogt:
-- insert into public.app_developers (email)
-- values ('jouw@email.nl')
-- on conflict (email) do nothing;
