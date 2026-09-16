-- STEP 21: notification wiring hardening
-- Run after step9 and step11 migrations.

-- Make sure existing profiles have a notification-settings row.
insert into public.notification_settings(user_id)
select p.id
from public.profiles p
on conflict (user_id) do nothing;

-- Recreate the notification triggers so the settings-aware functions from step11
-- are definitely the functions used by the database.
drop trigger if exists trg_consultation_request on public.consultations;
create trigger trg_consultation_request
after insert on public.consultations
for each row execute function public.notify_consultation_request();

drop trigger if exists trg_consultation_status on public.consultations;
create trigger trg_consultation_status
after update on public.consultations
for each row execute function public.notify_consultation_status();

drop trigger if exists trg_new_message on public.messages;
create trigger trg_new_message
after insert on public.messages
for each row execute function public.notify_new_message();

drop trigger if exists trg_follow_event on public.follows;
create trigger trg_follow_event
after insert on public.follows
for each row execute function public.notify_follow_event();

-- Mutual-follow consultations are intentionally inserted as active by the app.
-- Allow both pending requests and direct active consultations.
drop policy if exists "consultations_insert_requester" on public.consultations;
create policy "consultations_insert_requester"
on public.consultations
for insert to authenticated
with check (
  requester_id = auth.uid()
  and requester_id <> holder_id
  and status in ('pending','active')
);

-- Keep notifications private. Server-side trigger functions use SECURITY DEFINER.
drop policy if exists "notifications_select_self" on public.notifications;
create policy "notifications_select_self"
on public.notifications
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "notifications_update_self" on public.notifications;
create policy "notifications_update_self"
on public.notifications
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create index if not exists idx_notifications_user_created
on public.notifications(user_id, created_at desc);

create index if not exists idx_messages_consultation_created
on public.messages(consultation_id, created_at desc);
