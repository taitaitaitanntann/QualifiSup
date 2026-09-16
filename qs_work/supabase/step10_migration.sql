-- STEP 10: Question board
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
