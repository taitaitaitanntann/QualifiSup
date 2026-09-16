-- QualifiSup: all database setup in one file. Run this in Supabase SQL Editor.

\n-- ===== supabase/schema.sql =====\n-- QualifiSup production database blueprint
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  status text not null,
  field text,
  avatar_url text,
  bio text,
  qualification_year integer,
  daily_study_minutes integer,
  study_period_days integer,
  study_methods text[] default '{}',
  consultation_topics text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.qualifications (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  field text not null,
  subfield text,
  qualification_type text,
  implementing_organization text,
  eligibility_status text,
  eligibility_detail text,
  practical_exam boolean,
  official_url text,
  source_name text,
  verification_status text not null default 'unverified',
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.qualification_schedules (
  id uuid primary key default gen_random_uuid(),
  qualification_id uuid not null references public.qualifications(id) on delete cascade,
  fiscal_year integer not null,
  exam_date text,
  application_period text,
  result_period text,
  exam_fee integer,
  exam_format text,
  source_url text,
  verification_status text not null default 'unverified',
  verified_at timestamptz,
  unique(qualification_id,fiscal_year)
);

create table if not exists public.user_qualifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  qualification_id uuid not null references public.qualifications(id) on delete cascade,
  relationship text not null,
  acquisition_year integer,
  daily_study_minutes integer,
  study_period_days integer,
  study_methods text[] default '{}',
  unique(user_id,qualification_id)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  qualification_id uuid not null references public.qualifications(id),
  title text not null,
  body text not null,
  edited boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  body text not null,
  edited boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  created_at timestamptz default now(),
  unique(user_id,target_type,target_id)
);

create table if not exists public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key(follower_id,following_id),
  check(follower_id <> following_id)
);

create table if not exists public.blocks (
  blocker_id uuid references public.profiles(id) on delete cascade,
  blocked_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key(blocker_id,blocked_id)
);

create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete set null,
  holder_id uuid references public.profiles(id) on delete set null,
  qualification_id uuid references public.qualifications(id),
  topic text not null,
  initial_message text,
  status text not null default 'pending',
  decline_reason text,
  created_at timestamptz default now(),
  approved_at timestamptz,
  ended_at timestamptz
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  body text not null,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.consultation_ratings (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  rater_id uuid not null references public.profiles(id) on delete cascade,
  helpful boolean not null,
  reasons text[] default '{}',
  created_at timestamptz default now(),
  unique(consultation_id,rater_id)
);

create table if not exists public.favorites (
  user_id uuid references public.profiles(id) on delete cascade,
  qualification_id uuid references public.qualifications(id) on delete cascade,
  created_at timestamptz default now(),
  primary key(user_id,qualification_id)
);

create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  search_type text not null,
  query text not null,
  filters jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  related_id uuid,
  read_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  notify_result boolean default false,
  status text not null default 'pending',
  result text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

create table if not exists public.qualification_corrections (
  id uuid primary key default gen_random_uuid(),
  qualification_id uuid references public.qualifications(id),
  requester_id uuid references public.profiles(id) on delete set null,
  item text not null,
  proposed_value text,
  evidence_url text,
  status text not null default 'pending',
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

create table if not exists public.qualification_submissions (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete set null,
  name text not null,
  field text,
  organization text,
  official_url text,
  description text,
  evidence_url text,
  status text not null default 'pending',
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  consent_type text not null,
  version text not null,
  consented_at timestamptz default now()
);

-- Before production: enable RLS and write policies for every table.
-- Never expose service_role keys in the browser.

\n-- ===== supabase/step8_migration.sql =====\n-- STEP 8: profile/follow/consultation support indexes
create index if not exists idx_follows_following on public.follows(following_id);
create index if not exists idx_consultations_requester on public.consultations(requester_id);
create index if not exists idx_consultations_holder on public.consultations(holder_id);
create index if not exists idx_messages_consultation_created on public.messages(consultation_id, created_at);
create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);

-- Production note: RLS policies must be added before exposing these tables publicly.

\n-- ===== supabase/step9_migration.sql =====\n-- STEP 9: consultation approval, chat, notifications and basic RLS
create index if not exists idx_messages_sender on public.messages(sender_id);
create index if not exists idx_consultations_status on public.consultations(status);

alter table public.profiles enable row level security;
alter table public.qualifications enable row level security;
alter table public.qualification_schedules enable row level security;
alter table public.user_qualifications enable row level security;
alter table public.follows enable row level security;
alter table public.consultations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- Public/read policies for profile, verified qualification data and public qualification relationships.
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles for select to authenticated using (true);
drop policy if exists "qualifications_select_verified" on public.qualifications;
create policy "qualifications_select_verified" on public.qualifications for select to authenticated using (verification_status='verified');
drop policy if exists "schedules_select_verified" on public.qualification_schedules;
create policy "schedules_select_verified" on public.qualification_schedules for select to authenticated using (verification_status='verified');
drop policy if exists "user_qualifications_select_authenticated" on public.user_qualifications;
create policy "user_qualifications_select_authenticated" on public.user_qualifications for select to authenticated using (true);

-- Follow relationships: users may manage their own outgoing follows.
drop policy if exists "follows_select_authenticated" on public.follows;
create policy "follows_select_authenticated" on public.follows for select to authenticated using (true);
drop policy if exists "follows_insert_self" on public.follows;
create policy "follows_insert_self" on public.follows for insert to authenticated with check (follower_id=auth.uid() and follower_id<>following_id);
drop policy if exists "follows_delete_self" on public.follows;
create policy "follows_delete_self" on public.follows for delete to authenticated using (follower_id=auth.uid());

-- Consultation: requester creates; both participants can read; holder approves/declines; either participant ends.
drop policy if exists "consultations_select_participant" on public.consultations;
create policy "consultations_select_participant" on public.consultations for select to authenticated using (requester_id=auth.uid() or holder_id=auth.uid());
drop policy if exists "consultations_insert_requester" on public.consultations;
create policy "consultations_insert_requester" on public.consultations for insert to authenticated with check (requester_id=auth.uid() and requester_id<>holder_id and status='pending');
drop policy if exists "consultations_update_holder" on public.consultations;
create policy "consultations_update_holder" on public.consultations for update to authenticated using (holder_id=auth.uid()) with check (holder_id=auth.uid());
drop policy if exists "consultations_update_participant_end" on public.consultations;
create policy "consultations_update_participant_end" on public.consultations for update to authenticated using (requester_id=auth.uid() or holder_id=auth.uid()) with check (requester_id=auth.uid() or holder_id=auth.uid());

-- Messages: only participants can read/send while consultation is active.
drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant" on public.messages for select to authenticated using (exists(select 1 from public.consultations c where c.id=consultation_id and (c.requester_id=auth.uid() or c.holder_id=auth.uid())));
drop policy if exists "messages_insert_participant_active" on public.messages;
create policy "messages_insert_participant_active" on public.messages for insert to authenticated with check (sender_id=auth.uid() and exists(select 1 from public.consultations c where c.id=consultation_id and c.status='active' and (c.requester_id=auth.uid() or c.holder_id=auth.uid())));

-- Notifications are private to the recipient. Trigger functions below create them server-side.
drop policy if exists "notifications_select_self" on public.notifications;
create policy "notifications_select_self" on public.notifications for select to authenticated using (user_id=auth.uid());
drop policy if exists "notifications_update_self" on public.notifications;
create policy "notifications_update_self" on public.notifications for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

create or replace function public.notify_consultation_request() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.notifications(user_id,type,actor_id,related_id) values(new.holder_id,'consultation_request',new.requester_id,new.id); return new; end; $$;
drop trigger if exists trg_consultation_request on public.consultations;
create trigger trg_consultation_request after insert on public.consultations for each row execute function public.notify_consultation_request();

create or replace function public.notify_consultation_status() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if old.status='pending' and new.status='active' then insert into public.notifications(user_id,type,actor_id,related_id) values(new.requester_id,'consultation_approved',new.holder_id,new.id);
 elsif old.status='pending' and new.status='declined' then insert into public.notifications(user_id,type,actor_id,related_id) values(new.requester_id,'consultation_declined',new.holder_id,new.id);
 elsif old.status='active' and new.status='ended' then
   insert into public.notifications(user_id,type,actor_id,related_id) values(case when new.requester_id=auth.uid() then new.holder_id else new.requester_id end,'consultation_ended',auth.uid(),new.id);
 end if; return new; end; $$;
drop trigger if exists trg_consultation_status on public.consultations;
create trigger trg_consultation_status after update on public.consultations for each row execute function public.notify_consultation_status();

create or replace function public.notify_new_message() returns trigger language plpgsql security definer set search_path=public as $$
declare recipient uuid; begin select case when requester_id=new.sender_id then holder_id else requester_id end into recipient from public.consultations where id=new.consultation_id; if recipient is not null then insert into public.notifications(user_id,type,actor_id,related_id) values(recipient,'new_message',new.sender_id,new.consultation_id); end if; return new; end; $$;
drop trigger if exists trg_new_message on public.messages;
create trigger trg_new_message after insert on public.messages for each row execute function public.notify_new_message();

-- If a consultation is approved with an initial message, move that message into chat once.
create or replace function public.create_initial_consultation_message() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if old.status='pending' and new.status='active' and new.initial_message is not null and length(trim(new.initial_message))>0 then
   insert into public.messages(consultation_id,sender_id,body) values(new.id,new.requester_id,new.initial_message);
 end if;
 return new;
end; $$;
drop trigger if exists trg_initial_consultation_message on public.consultations;
create trigger trg_initial_consultation_message after update on public.consultations for each row execute function public.create_initial_consultation_message();

-- For mutual-follow direct consultations, the insert trigger will create the initial chat message too.
create or replace function public.create_initial_consultation_message_on_insert() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.status='active' and new.initial_message is not null and length(trim(new.initial_message))>0 then
   insert into public.messages(consultation_id,sender_id,body) values(new.id,new.requester_id,new.initial_message);
 end if;
 return new;
end; $$;
drop trigger if exists trg_initial_consultation_message_insert on public.consultations;
create trigger trg_initial_consultation_message_insert after insert on public.consultations for each row execute function public.create_initial_consultation_message_on_insert();

\n-- ===== supabase/step10_migration.sql =====\n-- STEP 10: Question board
create index if not exists idx_questions_qualification_created on public.questions(qualification_id, created_at desc);
create index if not exists idx_answers_question_created on public.answers(question_id, created_at);
create index if not exists idx_likes_target on public.likes(target_type, target_id);

alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.likes enable row level security;

drop policy if exists "questions_select_public" on public.questions;
create policy "questions_select_public" on public.questions for select to authenticated using (deleted_at is null);
drop policy if exists "questions_insert_self" on public.questions;
create policy "questions_insert_self" on public.questions for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "questions_update_self" on public.questions;
create policy "questions_update_self" on public.questions for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "questions_delete_self" on public.questions;
create policy "questions_delete_self" on public.questions for delete to authenticated using (user_id=auth.uid());

drop policy if exists "answers_select_public" on public.answers;
create policy "answers_select_public" on public.answers for select to authenticated using (deleted_at is null);
drop policy if exists "answers_insert_self" on public.answers;
create policy "answers_insert_self" on public.answers for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "answers_update_self" on public.answers;
create policy "answers_update_self" on public.answers for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "answers_delete_self" on public.answers;
create policy "answers_delete_self" on public.answers for delete to authenticated using (user_id=auth.uid());

drop policy if exists "likes_select_authenticated" on public.likes;
create policy "likes_select_authenticated" on public.likes for select to authenticated using (true);
drop policy if exists "likes_insert_self" on public.likes;
create policy "likes_insert_self" on public.likes for insert to authenticated with check (user_id=auth.uid() and target_type='answer');
drop policy if exists "likes_delete_self" on public.likes;
create policy "likes_delete_self" on public.likes for delete to authenticated using (user_id=auth.uid());

\n-- ===== supabase/step11_migration.sql =====\n-- STEP 11: follow notifications, notification preferences, recent activity
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

\n-- ===== supabase/step12_migration.sql =====\n-- STEP 12: timeline/feed posts, follows and mutual-follow feed
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

\n-- ===== supabase/step13_migration.sql =====\n-- STEP 13: profile/follow relationships, counts and follow notifications
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

\n-- ===== supabase/step14_migration.sql =====\ncreate table if not exists public.favorites (
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

\n-- ===== supabase/step15_20_final_migration.sql =====\n-- QualifiSup FINAL hardening / remaining steps 15-20
-- Run AFTER schema.sql and step8..step14 migrations.
create table if not exists public.admin_users(user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
create table if not exists public.blocks(blocker_id uuid references auth.users(id) on delete cascade, blocked_id uuid references auth.users(id) on delete cascade, created_at timestamptz not null default now(), primary key(blocker_id,blocked_id), check(blocker_id<>blocked_id));
create table if not exists public.notification_settings(user_id uuid primary key references auth.users(id) on delete cascade, consultation_request boolean not null default true, consultation_approved boolean not null default true, consultation_declined boolean not null default true, new_message boolean not null default true, consultation_ended boolean not null default true, follow boolean not null default true, mutual_follow boolean not null default true, updated_at timestamptz not null default now());

alter table public.admin_users enable row level security;
drop policy if exists "admin_users_self" on public.admin_users;
create policy "admin_users_self" on public.admin_users for select to authenticated using (user_id=auth.uid());

alter table public.blocks enable row level security;
drop policy if exists "blocks_select_self" on public.blocks; create policy "blocks_select_self" on public.blocks for select to authenticated using (blocker_id=auth.uid() or blocked_id=auth.uid());
drop policy if exists "blocks_insert_self" on public.blocks; create policy "blocks_insert_self" on public.blocks for insert to authenticated with check (blocker_id=auth.uid());
drop policy if exists "blocks_delete_self" on public.blocks; create policy "blocks_delete_self" on public.blocks for delete to authenticated using (blocker_id=auth.uid());

alter table public.reports enable row level security;
drop policy if exists "reports_insert_self" on public.reports; create policy "reports_insert_self" on public.reports for insert to authenticated with check (reporter_id=auth.uid());
drop policy if exists "reports_select_self" on public.reports; create policy "reports_select_self" on public.reports for select to authenticated using (reporter_id=auth.uid() or exists(select 1 from public.admin_users a where a.user_id=auth.uid()));
drop policy if exists "reports_update_admin" on public.reports; create policy "reports_update_admin" on public.reports for update to authenticated using (exists(select 1 from public.admin_users a where a.user_id=auth.uid())) with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid()));

alter table public.qualification_corrections enable row level security;
drop policy if exists "qualification_corrections_insert_self" on public.qualification_corrections; create policy "qualification_corrections_insert_self" on public.qualification_corrections for insert to authenticated with check (requester_id=auth.uid());
drop policy if exists "qualification_corrections_select_self_admin" on public.qualification_corrections; create policy "qualification_corrections_select_self_admin" on public.qualification_corrections for select to authenticated using (requester_id=auth.uid() or exists(select 1 from public.admin_users a where a.user_id=auth.uid()));
drop policy if exists "qualification_corrections_update_admin" on public.qualification_corrections; create policy "qualification_corrections_update_admin" on public.qualification_corrections for update to authenticated using (exists(select 1 from public.admin_users a where a.user_id=auth.uid())) with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid()));

alter table public.qualification_submissions enable row level security;
drop policy if exists "qualification_submissions_insert_self" on public.qualification_submissions; create policy "qualification_submissions_insert_self" on public.qualification_submissions for insert to authenticated with check (requester_id=auth.uid());
drop policy if exists "qualification_submissions_select_self_admin" on public.qualification_submissions; create policy "qualification_submissions_select_self_admin" on public.qualification_submissions for select to authenticated using (requester_id=auth.uid() or exists(select 1 from public.admin_users a where a.user_id=auth.uid()));
drop policy if exists "qualification_submissions_update_admin" on public.qualification_submissions; create policy "qualification_submissions_update_admin" on public.qualification_submissions for update to authenticated using (exists(select 1 from public.admin_users a where a.user_id=auth.uid())) with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid()));

alter table public.consultation_ratings enable row level security;
drop policy if exists "ratings_select_public" on public.consultation_ratings; create policy "ratings_select_public" on public.consultation_ratings for select to authenticated using (true);
drop policy if exists "ratings_insert_participant" on public.consultation_ratings; create policy "ratings_insert_participant" on public.consultation_ratings for insert to authenticated with check (rater_id=auth.uid() and exists(select 1 from public.consultations c where c.id=consultation_id and c.status='ended' and (c.requester_id=auth.uid() or c.holder_id=auth.uid())));
drop policy if exists "ratings_update_self" on public.consultation_ratings; create policy "ratings_update_self" on public.consultation_ratings for update to authenticated using (rater_id=auth.uid()) with check (rater_id=auth.uid());

alter table public.notification_settings enable row level security;
drop policy if exists "notification_settings_self" on public.notification_settings; create policy "notification_settings_self" on public.notification_settings for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

-- Blocked users should not appear in mutual/follow recommendations. Application queries should also filter blocks.
create index if not exists idx_blocks_blocker on public.blocks(blocker_id); create index if not exists idx_blocks_blocked on public.blocks(blocked_id);
create index if not exists idx_reports_status_created on public.reports(status,created_at desc);
create index if not exists idx_corrections_status_created on public.qualification_corrections(status,created_at desc);
create index if not exists idx_submissions_status_created on public.qualification_submissions(status,created_at desc);
create index if not exists idx_ratings_consultation on public.consultation_ratings(consultation_id);

-- Admin verification helper. Add your own operator UUID manually after account creation:
-- insert into public.admin_users(user_id) values ('YOUR_AUTH_USER_UUID');

