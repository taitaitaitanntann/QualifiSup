-- QualifiSup production database blueprint
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
