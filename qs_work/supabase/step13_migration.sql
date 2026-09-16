-- STEP 13: profile/follow relationships, counts and follow notifications
create index if not exists idx_follows_following on public.follows(following_id,created_at desc);
create index if not exists idx_follows_follower on public.follows(follower_id,created_at desc);

-- Keep follow rows readable so profile/follow counts and mutual-follow state can be calculated safely.
alter table public.follows enable row level security;
drop policy if exists "follows_select_authenticated" on public.follows;
create policy "follows_select_authenticated" on public.follows for select to authenticated using (true);

create or replace function public.notify_follow_events() returns trigger
language plpgsql security definer set search_path=public as $$
declare mutual_now boolean;
begin
  insert into public.notifications(user_id,type,actor_id,related_id)
  values(new.following_id,'follow',new.follower_id,new.follower_id);
  select exists(select 1 from public.follows f where f.follower_id=new.following_id and f.following_id=new.follower_id) into mutual_now;
  if mutual_now then
    insert into public.notifications(user_id,type,actor_id,related_id)
    values(new.following_id,'mutual_follow',new.follower_id,new.follower_id),
          (new.follower_id,'mutual_follow',new.following_id,new.following_id);
  end if;
  insert into public.activity_logs(user_id,actor_id,type,related_id)
  values(new.following_id,new.follower_id,'follow',new.follower_id),
        (new.follower_id,new.following_id,'followed_user',new.following_id);
  return new;
end; $$;
drop trigger if exists trg_follow_events on public.follows;
create trigger trg_follow_events after insert on public.follows for each row execute function public.notify_follow_events();

-- Security-definer helpers allow aggregate counts without exposing arbitrary follow rows to unauthenticated clients.
create or replace function public.get_follow_counts(target_user uuid)
returns table(followers bigint, following bigint)
language sql security definer set search_path=public as $$
  select
    (select count(*) from public.follows where following_id=target_user),
    (select count(*) from public.follows where follower_id=target_user);
$$;
revoke all on function public.get_follow_counts(uuid) from public;
grant execute on function public.get_follow_counts(uuid) to authenticated;
