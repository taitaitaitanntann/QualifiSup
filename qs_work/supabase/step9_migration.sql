-- STEP 9: consultation approval, chat, notifications and basic RLS
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
