-- STEP 11: follow notifications, notification preferences, recent activity
create table if not exists public.notification_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  consultation_request boolean not null default true,
  consultation_approved boolean not null default true,
  consultation_declined boolean not null default true,
  new_message boolean not null default true,
  consultation_ended boolean not null default true,
  follow boolean not null default true,
  mutual_follow boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null,
  related_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_notification_settings_user on public.notification_settings(user_id);
create index if not exists idx_activity_logs_user_created on public.activity_logs(user_id, created_at desc);
create index if not exists idx_activity_logs_actor_created on public.activity_logs(actor_id, created_at desc);

alter table public.notification_settings enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists "notification_settings_select_self" on public.notification_settings;
create policy "notification_settings_select_self" on public.notification_settings for select to authenticated using (user_id=auth.uid());
drop policy if exists "notification_settings_insert_self" on public.notification_settings;
create policy "notification_settings_insert_self" on public.notification_settings for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "notification_settings_update_self" on public.notification_settings;
create policy "notification_settings_update_self" on public.notification_settings for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

drop policy if exists "activity_logs_select_self" on public.activity_logs;
create policy "activity_logs_select_self" on public.activity_logs for select to authenticated using (user_id=auth.uid());

create or replace function public.pref_enabled(target_user uuid, pref text) returns boolean
language plpgsql security definer set search_path=public as $$
declare enabled boolean;
begin
  execute format('select %I from public.notification_settings where user_id=$1', pref) into enabled using target_user;
  return coalesce(enabled, true);
exception when undefined_column then return true;
end; $$;

create or replace function public.ensure_notification_settings() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  insert into public.notification_settings(user_id) values(new.id) on conflict (user_id) do nothing;
  return new;
end; $$;
drop trigger if exists trg_ensure_notification_settings on public.profiles;
create trigger trg_ensure_notification_settings after insert on public.profiles for each row execute function public.ensure_notification_settings();

create or replace function public.notify_follow_event() returns trigger
language plpgsql security definer set search_path=public as $$
declare is_mutual boolean; pref_ok boolean;
begin
  select exists(select 1 from public.follows f where f.follower_id=new.following_id and f.following_id=new.follower_id) into is_mutual;
  if is_mutual then
    pref_ok := public.pref_enabled(new.following_id,'mutual_follow');
    if pref_ok then
      insert into public.notifications(user_id,type,actor_id,related_id) values(new.following_id,'mutual_follow',new.follower_id,new.id);
    end if;
    if public.pref_enabled(new.follower_id,'mutual_follow') then
      insert into public.notifications(user_id,type,actor_id,related_id) values(new.follower_id,'mutual_follow',new.following_id,new.id);
    end if;
    insert into public.activity_logs(user_id,actor_id,type,related_id) values(new.following_id,new.follower_id,'mutual_follow',new.id);
    insert into public.activity_logs(user_id,actor_id,type,related_id) values(new.follower_id,new.following_id,'mutual_follow',new.id);
  else
    if public.pref_enabled(new.following_id,'follow') then
      insert into public.notifications(user_id,type,actor_id,related_id) values(new.following_id,'follow',new.follower_id,new.id);
    end if;
    insert into public.activity_logs(user_id,actor_id,type,related_id) values(new.following_id,new.follower_id,'follow',new.id);
  end if;
  return new;
end; $$;
drop trigger if exists trg_follow_event on public.follows;
create trigger trg_follow_event after insert on public.follows for each row execute function public.notify_follow_event();

-- Keep activity logs for consultation lifecycle and messages as a lightweight audit/feed for the user.
create or replace function public.log_consultation_activity() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' then
    insert into public.activity_logs(user_id,actor_id,type,related_id,metadata) values(new.requester_id,new.holder_id,'consultation_requested',new.id,jsonb_build_object('status',new.status));
    insert into public.activity_logs(user_id,actor_id,type,related_id,metadata) values(new.holder_id,new.requester_id,'consultation_received',new.id,jsonb_build_object('status',new.status));
  elsif old.status is distinct from new.status then
    if new.status='active' then
      insert into public.activity_logs(user_id,actor_id,type,related_id) values(new.requester_id,new.holder_id,'consultation_approved',new.id);
    elsif new.status='declined' then
      insert into public.activity_logs(user_id,actor_id,type,related_id) values(new.requester_id,new.holder_id,'consultation_declined',new.id);
    elsif new.status='ended' then
      insert into public.activity_logs(user_id,actor_id,type,related_id) values(new.requester_id,new.holder_id,'consultation_ended',new.id);
      insert into public.activity_logs(user_id,actor_id,type,related_id) values(new.holder_id,new.requester_id,'consultation_ended',new.id);
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists trg_consultation_activity on public.consultations;
create trigger trg_consultation_activity after insert or update on public.consultations for each row execute function public.log_consultation_activity();

create or replace function public.log_message_activity() returns trigger
language plpgsql security definer set search_path=public as $$
declare recipient uuid;
begin
  select case when requester_id=new.sender_id then holder_id else requester_id end into recipient from public.consultations where id=new.consultation_id;
  if recipient is not null then
    insert into public.activity_logs(user_id,actor_id,type,related_id) values(recipient,new.sender_id,'new_message',new.consultation_id);
  end if;
  return new;
end; $$;
drop trigger if exists trg_message_activity on public.messages;
create trigger trg_message_activity after insert on public.messages for each row execute function public.log_message_activity();

create or replace function public.notify_consultation_request() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if public.pref_enabled(new.holder_id,'consultation_request') then
   insert into public.notifications(user_id,type,actor_id,related_id) values(new.holder_id,'consultation_request',new.requester_id,new.id);
 end if;
 return new;
end; $$;

create or replace function public.notify_consultation_status() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if old.status='pending' and new.status='active' then
   if public.pref_enabled(new.requester_id,'consultation_approved') then insert into public.notifications(user_id,type,actor_id,related_id) values(new.requester_id,'consultation_approved',new.holder_id,new.id); end if;
 elsif old.status='pending' and new.status='declined' then
   if public.pref_enabled(new.requester_id,'consultation_declined') then insert into public.notifications(user_id,type,actor_id,related_id) values(new.requester_id,'consultation_declined',new.holder_id,new.id); end if;
 elsif old.status='active' and new.status='ended' then
   if public.pref_enabled(case when new.requester_id=auth.uid() then new.holder_id else new.requester_id end,'consultation_ended') then
     insert into public.notifications(user_id,type,actor_id,related_id) values(case when new.requester_id=auth.uid() then new.holder_id else new.requester_id end,'consultation_ended',auth.uid(),new.id);
   end if;
 end if; return new;
end; $$;

create or replace function public.notify_new_message() returns trigger language plpgsql security definer set search_path=public as $$
declare recipient uuid;
begin
 select case when requester_id=new.sender_id then holder_id else requester_id end into recipient from public.consultations where id=new.consultation_id;
 if recipient is not null and public.pref_enabled(recipient,'new_message') then
   insert into public.notifications(user_id,type,actor_id,related_id) values(recipient,'new_message',new.sender_id,new.consultation_id);
 end if; return new;
end; $$;
