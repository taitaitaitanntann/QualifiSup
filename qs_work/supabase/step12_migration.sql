-- STEP 12: timeline/feed posts, follows and mutual-follow feed
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  body text not null,
  qualification_id uuid references public.qualifications(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_posts_created on public.posts(created_at desc);
create index if not exists idx_posts_user_created on public.posts(user_id,created_at desc);
create index if not exists idx_posts_qualification on public.posts(qualification_id,created_at desc);

alter table public.posts enable row level security;
drop policy if exists "posts_select_public" on public.posts;
create policy "posts_select_public" on public.posts for select to authenticated using (deleted_at is null);
drop policy if exists "posts_insert_self" on public.posts;
create policy "posts_insert_self" on public.posts for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "posts_update_self" on public.posts;
create policy "posts_update_self" on public.posts for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "posts_delete_self" on public.posts;
create policy "posts_delete_self" on public.posts for delete to authenticated using (user_id=auth.uid());

alter table public.follows enable row level security;
drop policy if exists "follows_select_authenticated" on public.follows;
create policy "follows_select_authenticated" on public.follows for select to authenticated using (follower_id=auth.uid() or following_id=auth.uid());
drop policy if exists "follows_insert_self" on public.follows;
create policy "follows_insert_self" on public.follows for insert to authenticated with check (follower_id=auth.uid());
drop policy if exists "follows_delete_self" on public.follows;
create policy "follows_delete_self" on public.follows for delete to authenticated using (follower_id=auth.uid());

-- Public profile fields used by the feed. Keep private account data out of the query.
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles for select to authenticated using (true);

create or replace function public.log_post_activity() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  insert into public.activity_logs(user_id,actor_id,type,related_id)
  values(new.user_id,new.user_id,'post_created',new.id);
  return new;
end; $$;
drop trigger if exists trg_post_activity on public.posts;
create trigger trg_post_activity after insert on public.posts for each row execute function public.log_post_activity();
