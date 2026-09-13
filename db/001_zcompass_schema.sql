-- Z-COMPASS — initial schema
-- Run this in YOUR Supabase project: SQL Editor -> New query -> paste -> Run.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  interests text[] not null default '{}',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- -------------------------------------------------------------- categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
drop policy if exists "categories_own" on public.categories;
create policy "categories_own" on public.categories
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- --------------------------------------------------------- clarity entries
create table if not exists public.clarity_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text,
  content text not null default '',
  status text not null default 'open' check (status in ('open', 'explored', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) stored
);

create index if not exists clarity_entries_user_idx on public.clarity_entries (user_id, updated_at desc);
create index if not exists clarity_entries_search_idx on public.clarity_entries using gin (search_vector);
grant select, insert, update, delete on public.clarity_entries to authenticated;
grant all on public.clarity_entries to service_role;
alter table public.clarity_entries enable row level security;
drop policy if exists "clarity_own" on public.clarity_entries;
create policy "clarity_own" on public.clarity_entries
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop trigger if exists clarity_touch on public.clarity_entries;
create trigger clarity_touch before update on public.clarity_entries
  for each row execute function public.touch_updated_at();

-- --------------------------------------------------------------- decisions
create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  clarity_entry_id uuid references public.clarity_entries(id) on delete set null,
  title text not null default 'Untitled decision',
  context text not null default '',
  status text not null default 'draft' check (status in ('draft', 'in_progress', 'saved', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  saved_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(context, ''))
  ) stored
);

create index if not exists decisions_user_idx on public.decisions (user_id, updated_at desc);
create index if not exists decisions_search_idx on public.decisions using gin (search_vector);
grant select, insert, update, delete on public.decisions to authenticated;
grant all on public.decisions to service_role;
alter table public.decisions enable row level security;
drop policy if exists "decisions_own" on public.decisions;
create policy "decisions_own" on public.decisions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop trigger if exists decisions_touch on public.decisions;
create trigger decisions_touch before update on public.decisions
  for each row execute function public.touch_updated_at();

-- helper: does the current user own this decision?
create or replace function public.owns_decision(_decision_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.decisions d where d.id = _decision_id and d.user_id = auth.uid());
$$;

-- ------------------------------------------------------ decision priorities
create table if not exists public.decision_priorities (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  label text not null,
  weight integer not null default 3 check (weight between 1 and 5),
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists decision_priorities_decision_idx on public.decision_priorities (decision_id);
grant select, insert, update, delete on public.decision_priorities to authenticated;
grant all on public.decision_priorities to service_role;
alter table public.decision_priorities enable row level security;
drop policy if exists "decision_priorities_own" on public.decision_priorities;
create policy "decision_priorities_own" on public.decision_priorities
  for all to authenticated using (public.owns_decision(decision_id)) with check (public.owns_decision(decision_id));

-- --------------------------------------------------------- decision options
create table if not exists public.decision_options (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  label text not null,
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists decision_options_decision_idx on public.decision_options (decision_id);
grant select, insert, update, delete on public.decision_options to authenticated;
grant all on public.decision_options to service_role;
alter table public.decision_options enable row level security;
drop policy if exists "decision_options_own" on public.decision_options;
create policy "decision_options_own" on public.decision_options
  for all to authenticated using (public.owns_decision(decision_id)) with check (public.owns_decision(decision_id));

create or replace function public.owns_option(_option_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.decision_options o
    join public.decisions d on d.id = o.decision_id
    where o.id = _option_id and d.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------- option pros/cons
create table if not exists public.option_pros_cons (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references public.decision_options(id) on delete cascade,
  kind text not null check (kind in ('pro', 'con')),
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists option_pros_cons_option_idx on public.option_pros_cons (option_id);
grant select, insert, update, delete on public.option_pros_cons to authenticated;
grant all on public.option_pros_cons to service_role;
alter table public.option_pros_cons enable row level security;
drop policy if exists "option_pros_cons_own" on public.option_pros_cons;
create policy "option_pros_cons_own" on public.option_pros_cons
  for all to authenticated using (public.owns_option(option_id)) with check (public.owns_option(option_id));

-- --------------------------------------------------- option priority scores
create table if not exists public.option_priority_scores (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references public.decision_options(id) on delete cascade,
  priority_id uuid not null references public.decision_priorities(id) on delete cascade,
  score integer not null default 5 check (score between 0 and 10),
  source text not null default 'ai' check (source in ('ai', 'user')),
  unique (option_id, priority_id)
);
create index if not exists option_priority_scores_option_idx on public.option_priority_scores (option_id);
grant select, insert, update, delete on public.option_priority_scores to authenticated;
grant all on public.option_priority_scores to service_role;
alter table public.option_priority_scores enable row level security;
drop policy if exists "option_priority_scores_own" on public.option_priority_scores;
create policy "option_priority_scores_own" on public.option_priority_scores
  for all to authenticated using (public.owns_option(option_id)) with check (public.owns_option(option_id));

-- -------------------------------------------------------- decision sessions
create table if not exists public.decision_sessions (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null unique references public.decisions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stage text not null default 'context'
    check (stage in ('context', 'questions', 'priorities', 'options', 'comparison', 'result')),
  draft jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.decision_sessions to authenticated;
grant all on public.decision_sessions to service_role;
alter table public.decision_sessions enable row level security;
drop policy if exists "decision_sessions_own" on public.decision_sessions;
create policy "decision_sessions_own" on public.decision_sessions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop trigger if exists decision_sessions_touch on public.decision_sessions;
create trigger decision_sessions_touch before update on public.decision_sessions
  for each row execute function public.touch_updated_at();

-- --------------------------------------------------------- compass results
create table if not exists public.compass_results (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  recommended_option_id uuid references public.decision_options(id) on delete set null,
  headline text not null default '',
  summary text not null default '',
  reasoning text not null default '',
  tradeoffs jsonb not null default '[]'::jsonb,
  next_steps jsonb not null default '[]'::jsonb,
  alignment jsonb not null default '[]'::jsonb,
  model text,
  created_at timestamptz not null default now()
);
create index if not exists compass_results_decision_idx on public.compass_results (decision_id, created_at desc);
grant select, insert, update, delete on public.compass_results to authenticated;
grant all on public.compass_results to service_role;
alter table public.compass_results enable row level security;
drop policy if exists "compass_results_own" on public.compass_results;
create policy "compass_results_own" on public.compass_results
  for all to authenticated using (public.owns_decision(decision_id)) with check (public.owns_decision(decision_id));

-- ---------------------------------------------------------------- memories
create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null default '',
  content text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) stored
);
create index if not exists memories_user_idx on public.memories (user_id, updated_at desc);
create index if not exists memories_search_idx on public.memories using gin (search_vector);
grant select, insert, update, delete on public.memories to authenticated;
grant all on public.memories to service_role;
alter table public.memories enable row level security;
drop policy if exists "memories_own" on public.memories;
create policy "memories_own" on public.memories
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop trigger if exists memories_touch on public.memories;
create trigger memories_touch before update on public.memories
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------- progress items
create table if not exists public.progress_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  decision_id uuid references public.decisions(id) on delete set null,
  title text not null,
  detail text,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'done', 'abandoned')),
  due_date date,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(detail, ''))
  ) stored
);
create index if not exists progress_items_user_idx on public.progress_items (user_id, updated_at desc);
create index if not exists progress_items_search_idx on public.progress_items using gin (search_vector);
grant select, insert, update, delete on public.progress_items to authenticated;
grant all on public.progress_items to service_role;
alter table public.progress_items enable row level security;
drop policy if exists "progress_items_own" on public.progress_items;
create policy "progress_items_own" on public.progress_items
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop trigger if exists progress_items_touch on public.progress_items;
create trigger progress_items_touch before update on public.progress_items
  for each row execute function public.touch_updated_at();

-- --------------------------------------------------------- progress updates
create table if not exists public.progress_updates (
  id uuid primary key default gen_random_uuid(),
  progress_item_id uuid not null references public.progress_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);
create index if not exists progress_updates_item_idx on public.progress_updates (progress_item_id, created_at desc);
grant select, insert, update, delete on public.progress_updates to authenticated;
grant all on public.progress_updates to service_role;
alter table public.progress_updates enable row level security;
drop policy if exists "progress_updates_own" on public.progress_updates;
create policy "progress_updates_own" on public.progress_updates
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -------------------------------------------------------------- reflections
create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  decision_id uuid references public.decisions(id) on delete set null,
  outcome text not null default '',
  learned text not null default '',
  satisfaction integer check (satisfaction between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(outcome, '') || ' ' || coalesce(learned, ''))
  ) stored
);
create index if not exists reflections_user_idx on public.reflections (user_id, created_at desc);
create index if not exists reflections_search_idx on public.reflections using gin (search_vector);
grant select, insert, update, delete on public.reflections to authenticated;
grant all on public.reflections to service_role;
alter table public.reflections enable row level security;
drop policy if exists "reflections_own" on public.reflections;
create policy "reflections_own" on public.reflections
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop trigger if exists reflections_touch on public.reflections;
create trigger reflections_touch before update on public.reflections
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------- global search
create or replace function public.global_search(query text, max_results integer default 20)
returns table (
  kind text,
  id uuid,
  title text,
  snippet text,
  updated_at timestamptz,
  rank real
)
language sql
stable
security invoker
set search_path = public
as $$
  with q as (select websearch_to_tsquery('english', query) as tsq),
  hits as (
    select 'clarity'::text as kind, c.id, coalesce(nullif(c.title, ''), left(c.content, 60)) as title,
           left(c.content, 180) as snippet, c.updated_at, ts_rank(c.search_vector, q.tsq) as rank
    from public.clarity_entries c, q where c.search_vector @@ q.tsq
    union all
    select 'decision'::text, d.id, d.title, left(d.context, 180), d.updated_at, ts_rank(d.search_vector, q.tsq)
    from public.decisions d, q where d.search_vector @@ q.tsq
    union all
    select 'memory'::text, m.id, coalesce(nullif(m.title, ''), left(m.content, 60)), left(m.content, 180),
           m.updated_at, ts_rank(m.search_vector, q.tsq)
    from public.memories m, q where m.search_vector @@ q.tsq
    union all
    select 'progress'::text, p.id, p.title, left(coalesce(p.detail, ''), 180), p.updated_at,
           ts_rank(p.search_vector, q.tsq)
    from public.progress_items p, q where p.search_vector @@ q.tsq
    union all
    select 'reflection'::text, r.id, left(r.outcome, 60), left(r.learned, 180), r.updated_at,
           ts_rank(r.search_vector, q.tsq)
    from public.reflections r, q where r.search_vector @@ q.tsq
  )
  select kind, id, title, snippet, updated_at, rank
  from hits
  order by rank desc, updated_at desc
  limit max_results;
$$;

grant execute on function public.global_search(text, integer) to authenticated;
