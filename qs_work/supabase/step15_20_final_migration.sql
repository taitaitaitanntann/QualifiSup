-- QualifiSup FINAL hardening / remaining steps 15-20
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
