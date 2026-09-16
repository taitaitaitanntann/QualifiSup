create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  qualification_id uuid not null references public.qualifications(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, qualification_id)
);
create index if not exists favorites_user_id_created_at_idx on public.favorites(user_id, created_at desc);
alter table public.favorites enable row level security;
drop policy if exists "favorites_select_own" on public.favorites;
drop policy if exists "favorites_insert_own" on public.favorites;
drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_select_own" on public.favorites for select using (auth.uid() = user_id);
create policy "favorites_insert_own" on public.favorites for insert with check (auth.uid() = user_id);
create policy "favorites_delete_own" on public.favorites for delete using (auth.uid() = user_id);

create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  search_type text not null check (search_type in ('qualification','holder','question')),
  query_text text not null default '',
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists search_history_user_id_created_at_idx on public.search_history(user_id, created_at desc);
alter table public.search_history enable row level security;
drop policy if exists "search_history_select_own" on public.search_history;
drop policy if exists "search_history_insert_own" on public.search_history;
drop policy if exists "search_history_delete_own" on public.search_history;
create policy "search_history_select_own" on public.search_history for select using (auth.uid() = user_id);
create policy "search_history_insert_own" on public.search_history for insert with check (auth.uid() = user_id);
create policy "search_history_delete_own" on public.search_history for delete using (auth.uid() = user_id);
