create schema if not exists learning_os_private;
revoke all on schema learning_os_private from public, anon;

create table public.learning_os_datasets (
  id text primary key,
  label text not null,
  source text not null check (source in ('synthetic', 'course')),
  schema_json jsonb not null,
  seed_sql text not null check (length(seed_sql) between 1 and 500000),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.learning_os_datasets enable row level security;
grant select on public.learning_os_datasets to anon, authenticated;
create policy "Active curriculum is readable" on public.learning_os_datasets
  for select to anon, authenticated using (active);

create table public.learning_os_sessions (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  participant_code text not null check (participant_code ~ '^[A-Za-z0-9_-]{1,32}$'),
  condition text not null check (condition in ('coached', 'answer_first')),
  dataset_id text not null references public.learning_os_datasets(id),
  is_demo boolean not null default true,
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
alter table public.learning_os_sessions enable row level security;
grant select, insert, delete on public.learning_os_sessions to authenticated;
create policy "Learners read own sessions" on public.learning_os_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Learners create own sessions" on public.learning_os_sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Learners delete own sessions" on public.learning_os_sessions
  for delete to authenticated using ((select auth.uid()) = user_id);
create index learning_os_sessions_user_idx on public.learning_os_sessions(user_id);

create table public.learning_os_attempts (
  id uuid primary key,
  session_id uuid not null,
  user_id uuid not null default auth.uid(),
  exercise_id text not null check (exercise_id ~ '^[pbt][1-6]$'),
  phase text not null check (phase in ('practice', 'pretest', 'posttest')),
  payload jsonb not null check (octet_length(payload::text) <= 32000),
  verification_source text not null default 'browser_fixture_check' check (verification_source = 'browser_fixture_check'),
  created_at timestamptz not null default now(),
  foreign key (session_id, user_id) references public.learning_os_sessions(id, user_id) on delete cascade
);
alter table public.learning_os_attempts enable row level security;
grant select, insert on public.learning_os_attempts to authenticated;
create policy "Learners read own attempts" on public.learning_os_attempts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Learners create own attempts" on public.learning_os_attempts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create index learning_os_attempts_owner_session_idx on public.learning_os_attempts(user_id, session_id);

create table learning_os_private.tutor_quotas (
  bucket text primary key,
  calls integer not null default 0,
  created_at timestamptz not null default now()
);
alter table learning_os_private.tutor_quotas enable row level security;
revoke all on learning_os_private.tutor_quotas from public, anon, authenticated;

-- Only this narrow, identity-checked function can update the private counters.
create function learning_os_private.take_tutor_turn() returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  bucket_name text;
  limit_count integer;
  updated_count integer;
begin
  if uid is null then return false; end if;
  for bucket_name, limit_count in
    select v.bucket, v.lim from (values
      ('minute:' || uid::text || ':' || date_trunc('minute', now())::text, 6),
      ('day:' || uid::text || ':' || (now() at time zone 'UTC')::date::text, 30),
      ('global:' || (now() at time zone 'UTC')::date::text, 100)
    ) v(bucket, lim)
  loop
    updated_count := null;
    insert into learning_os_private.tutor_quotas(bucket, calls) values (bucket_name, 1)
    on conflict (bucket) do update set calls = learning_os_private.tutor_quotas.calls + 1
    where learning_os_private.tutor_quotas.calls < limit_count
    returning calls into updated_count;
    if updated_count is null then return false; end if;
  end loop;
  return true;
end;
$$;
revoke all on function learning_os_private.take_tutor_turn() from public, anon;
grant usage on schema learning_os_private to authenticated;
grant execute on function learning_os_private.take_tutor_turn() to authenticated;

create function public.learning_os_take_tutor_turn() returns boolean
language sql security invoker set search_path = '' as $$
  select learning_os_private.take_tutor_turn();
$$;
revoke all on function public.learning_os_take_tutor_turn() from public, anon;
grant execute on function public.learning_os_take_tutor_turn() to authenticated;
