-- Z-COMPASS — Compass discovery experience v2
-- Run after 001_zcompass_schema.sql in YOUR Supabase project.

alter table public.decision_sessions
  drop constraint if exists decision_sessions_stage_check;

alter table public.decision_sessions
  add constraint decision_sessions_stage_check check (
    stage in (
      'context', 'questions', 'priorities', 'options', 'comparison', 'result',
      'situation', 'map', 'discovery', 'paths', 'pressure', 'future', 'north'
    )
  );

alter table public.decision_sessions
  add column if not exists experience_version integer not null default 1
  check (experience_version in (1, 2));

grant select, insert, update, delete on public.decision_sessions to authenticated;
grant all on public.decision_sessions to service_role;

alter table public.compass_results
  add column if not exists compass_map jsonb,
  add column if not exists discovery jsonb,
  add column if not exists paths jsonb,
  add column if not exists pressure_test jsonb,
  add column if not exists future_glance jsonb,
  add column if not exists assumptions jsonb,
  add column if not exists change_conditions jsonb,
  add column if not exists next_move text,
  add column if not exists experience_version integer not null default 1
  check (experience_version in (1, 2));

grant select, insert, update, delete on public.compass_results to authenticated;
grant all on public.compass_results to service_role;
