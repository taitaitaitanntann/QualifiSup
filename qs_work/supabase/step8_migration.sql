-- STEP 8: profile/follow/consultation support indexes
create index if not exists idx_follows_following on public.follows(following_id);
create index if not exists idx_consultations_requester on public.consultations(requester_id);
create index if not exists idx_consultations_holder on public.consultations(holder_id);
create index if not exists idx_messages_consultation_created on public.messages(consultation_id, created_at);
create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);

-- Production note: RLS policies must be added before exposing these tables publicly.
