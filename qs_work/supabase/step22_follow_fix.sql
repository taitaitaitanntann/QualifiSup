-- STEP 22: make follow creation reliable
-- The follow row must not be rolled back just because a notification/activity trigger fails.

alter table public.follows enable row level security;

drop policy if exists "follows_select_authenticated" on public.follows;
create policy "follows_select_authenticated"
on public.follows
for select to authenticated
using (true);

drop policy if exists "follows_insert_self" on public.follows;
create policy "follows_insert_self"
on public.follows
for insert to authenticated
with check (
  follower_id = auth.uid()
  and follower_id <> following_id
);

drop policy if exists "follows_delete_self" on public.follows;
create policy "follows_delete_self"
on public.follows
for delete to authenticated
using (follower_id = auth.uid());

-- Rebuild the follow notification trigger so notification problems cannot block a follow.
create or replace function public.notify_follow_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_mutual boolean;
begin
  begin
    select exists(
      select 1
      from public.follows f
      where f.follower_id = new.following_id
        and f.following_id = new.follower_id
    ) into is_mutual;

    if is_mutual then
      if public.pref_enabled(new.following_id, 'mutual_follow') then
        insert into public.notifications(user_id,type,actor_id,related_id)
        values(new.following_id,'mutual_follow',new.follower_id,new.id);
      end if;

      if public.pref_enabled(new.follower_id, 'mutual_follow') then
        insert into public.notifications(user_id,type,actor_id,related_id)
        values(new.follower_id,'mutual_follow',new.following_id,new.id);
      end if;

      insert into public.activity_logs(user_id,actor_id,type,related_id)
      values(new.following_id,new.follower_id,'mutual_follow',new.id);

      insert into public.activity_logs(user_id,actor_id,type,related_id)
      values(new.follower_id,new.following_id,'mutual_follow',new.id);
    else
      if public.pref_enabled(new.following_id, 'follow') then
        insert into public.notifications(user_id,type,actor_id,related_id)
        values(new.following_id,'follow',new.follower_id,new.id);
      end if;

      insert into public.activity_logs(user_id,actor_id,type,related_id)
      values(new.following_id,new.follower_id,'follow',new.id);
    end if;
  exception when others then
    -- Follow itself is more important than optional notification/activity records.
    null;
  end;

  return new;
end;
$$;

drop trigger if exists trg_follow_event on public.follows;
create trigger trg_follow_event
after insert on public.follows
for each row execute function public.notify_follow_event();

-- Ensure settings exist for every existing profile.
insert into public.notification_settings(user_id)
select p.id
from public.profiles p
on conflict (user_id) do nothing;
