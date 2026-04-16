-- DestinyPlanner — Schéma Supabase (espace personnel — Session 2 sync)
-- À exécuter dans le SQL Editor de Supabase après supabase-schema.sql
--
-- Tables : personal_goal, personal_domain, personal_project,
--          personal_project_step, personal_milestone, personal_action,
--          personal_time_block, personal_detour, personal_journal_entry,
--          personal_habit, personal_habit_check, personal_user_profile,
--          personal_app_preferences
--
-- Règle RLS uniforme : auth.uid() = user_id (chaque user ne voit que ses données)
-- personal_business_link et backup_meta sont volontairement exclus (local only)

-- ─── personal_goal ───────────────────────────────────────────────
-- Singleton par utilisateur — PK = user_id

create table personal_goal (
  user_id         uuid primary key references auth.users on delete cascade,
  mission         text not null default '',
  vision_10_years text not null default '',
  values          text[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table personal_goal enable row level security;

create policy "personal_goal_own"
  on personal_goal for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── personal_domain ─────────────────────────────────────────────

create table personal_domain (
  id             text primary key,
  user_id        uuid not null references auth.users on delete cascade,
  name           text not null,
  icon           text not null default '',
  goal_statement text not null default '',
  sort_order     smallint not null default 0,
  is_default     boolean not null default false,
  created_at     timestamptz not null default now()
);

alter table personal_domain enable row level security;

create policy "personal_domain_own"
  on personal_domain for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── personal_project ────────────────────────────────────────────

create table personal_project (
  id           text primary key,
  user_id      uuid not null references auth.users on delete cascade,
  domain_id    text not null,
  title        text not null,
  current_step smallint not null default 1 check (current_step between 1 and 7),
  status       text not null default 'draft'
                 check (status in ('draft', 'active', 'paused', 'completed', 'abandoned')),
  progress     smallint not null default 0 check (progress between 0 and 100),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  completed_at timestamptz
);

alter table personal_project enable row level security;

create policy "personal_project_own"
  on personal_project for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── personal_project_step ───────────────────────────────────────

create table personal_project_step (
  id           text primary key,
  user_id      uuid not null references auth.users on delete cascade,
  project_id   text not null,
  step_number  smallint not null check (step_number between 1 and 7),
  status       text not null default 'locked'
                 check (status in ('locked', 'active', 'completed')),
  data         jsonb not null default '{}',
  completed_at timestamptz
);

alter table personal_project_step enable row level security;

create policy "personal_project_step_own"
  on personal_project_step for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── personal_milestone ──────────────────────────────────────────

create table personal_milestone (
  id           text primary key,
  user_id      uuid not null references auth.users on delete cascade,
  project_id   text not null,
  title        text not null,
  description  text not null default '',
  due_date     date,
  status       text not null default 'planned'
                 check (status in ('planned', 'in_progress', 'completed', 'blocked', 'postponed')),
  sort_order   smallint not null default 0,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table personal_milestone enable row level security;

create policy "personal_milestone_own"
  on personal_milestone for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── personal_action ─────────────────────────────────────────────

create table personal_action (
  id                text primary key,
  user_id           uuid not null references auth.users on delete cascade,
  milestone_id      text not null,
  title             text not null,
  date              date not null,
  estimated_minutes smallint,
  done              boolean not null default false,
  done_at           timestamptz,
  created_at        timestamptz not null default now()
);

alter table personal_action enable row level security;

create policy "personal_action_own"
  on personal_action for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── personal_time_block ─────────────────────────────────────────

create table personal_time_block (
  id             text primary key,
  user_id        uuid not null references auth.users on delete cascade,
  date           date not null,
  start_time     text not null,
  end_time       text not null,
  title          text not null default '',
  action_id      text,
  category       text check (category in ('work', 'rest', 'spiritual', 'family', 'health', 'free')),
  color_override text,
  notes          text not null default '',
  done           boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table personal_time_block enable row level security;

create policy "personal_time_block_own"
  on personal_time_block for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── personal_detour ─────────────────────────────────────────────

create table personal_detour (
  id              text primary key,
  user_id         uuid not null references auth.users on delete cascade,
  project_id      text,
  date            date not null,
  obstacle        text not null,
  impact          text not null default '',
  adjustment      text not null default '',
  resolved        boolean not null default false,
  resolved_at     timestamptz,
  is_systemic     boolean not null default false,
  linked_habit_id text,
  created_at      timestamptz not null default now()
);

alter table personal_detour enable row level security;

create policy "personal_detour_own"
  on personal_detour for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── personal_journal_entry ──────────────────────────────────────

create table personal_journal_entry (
  id                  text primary key,   -- YYYY-MM-DD
  user_id             uuid not null references auth.users on delete cascade,
  verse_id            text not null default '',
  quote_id            text not null default '',
  declaration         text not null default '',
  main_action         text not null default '',
  time_blocking_done  boolean not null default false,
  evening_review      text not null default '',
  lessons             text not null default '',
  score_cache         smallint check (score_cache between 0 and 100),
  engagement_level    smallint not null default 1 check (engagement_level between 1 and 3),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id, id)
);

alter table personal_journal_entry enable row level security;

create policy "personal_journal_entry_own"
  on personal_journal_entry for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── personal_habit ──────────────────────────────────────────────

create table personal_habit (
  id         text primary key,
  user_id    uuid not null references auth.users on delete cascade,
  name       text not null,
  weight     smallint not null default 1 check (weight between 1 and 100),
  frequency  text not null default 'daily'
               check (frequency in ('daily', 'weekdays', 'custom')),
  active     boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

alter table personal_habit enable row level security;

create policy "personal_habit_own"
  on personal_habit for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── personal_habit_check ────────────────────────────────────────

create table personal_habit_check (
  id         text primary key,   -- {habit_id}_{date}
  user_id    uuid not null references auth.users on delete cascade,
  habit_id   text not null,
  date       date not null,
  done       boolean not null default false,
  checked_at timestamptz not null default now(),
  unique (user_id, habit_id, date)
);

alter table personal_habit_check enable row level security;

create policy "personal_habit_check_own"
  on personal_habit_check for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── personal_user_profile ───────────────────────────────────────
-- Singleton par utilisateur — PK = user_id

create table personal_user_profile (
  user_id                       uuid primary key references auth.users on delete cascade,
  first_name                    text not null default '',
  avatar_emoji                  text,
  avatar_color                  text,
  bio                           text,
  grade                         text not null default 'discoverer'
                                  check (grade in ('discoverer', 'planner', 'builder_diligent', 'master_builder')),
  engagement_level              smallint not null default 1 check (engagement_level between 1 and 3),
  streak                        integer not null default 0,
  streak_best                   integer not null default 0,
  last_active_date              date,
  consecutive_inactive_days     integer not null default 0,
  last_abandoned_project_date   date,
  total_projects_completed      integer not null default 0,
  total_actions_done            integer not null default 0,
  total_journal_entries         integer not null default 0,
  total_time_blocks_done        integer not null default 0,
  score_average_30d             smallint check (score_average_30d between 0 and 100),
  onboarding_done               boolean not null default false,
  tutorial_done                 boolean not null default false,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

alter table personal_user_profile enable row level security;

create policy "personal_user_profile_own"
  on personal_user_profile for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── personal_app_preferences ────────────────────────────────────
-- Singleton par utilisateur — PK = user_id

create table personal_app_preferences (
  user_id               uuid primary key references auth.users on delete cascade,
  dark_mode             boolean not null default true,
  language              text not null default 'fr' check (language in ('fr', 'en')),
  notifications_enabled boolean not null default true,
  day_start_hour        smallint not null default 6 check (day_start_hour between 5 and 8),
  day_end_hour          smallint not null default 22 check (day_end_hour between 21 and 24),
  week_start_day        text not null default 'monday' check (week_start_day in ('monday', 'sunday')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table personal_app_preferences enable row level security;

create policy "personal_app_preferences_own"
  on personal_app_preferences for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── Index ────────────────────────────────────────────────────────

create index idx_personal_domain_user        on personal_domain (user_id);
create index idx_personal_project_user       on personal_project (user_id);
create index idx_personal_project_domain     on personal_project (user_id, domain_id);
create index idx_personal_project_step_user  on personal_project_step (user_id, project_id);
create index idx_personal_milestone_user     on personal_milestone (user_id, project_id);
create index idx_personal_action_user        on personal_action (user_id, milestone_id);
create index idx_personal_action_date        on personal_action (user_id, date);
create index idx_personal_time_block_date    on personal_time_block (user_id, date);
create index idx_personal_detour_user        on personal_detour (user_id);
create index idx_personal_journal_user       on personal_journal_entry (user_id);
create index idx_personal_habit_user         on personal_habit (user_id, active);
create index idx_personal_habit_check_date   on personal_habit_check (user_id, date);

-- ─── Grants ───────────────────────────────────────────────────────

grant select, insert, update, delete on table public.personal_goal             to authenticated;
grant select, insert, update, delete on table public.personal_domain           to authenticated;
grant select, insert, update, delete on table public.personal_project          to authenticated;
grant select, insert, update, delete on table public.personal_project_step     to authenticated;
grant select, insert, update, delete on table public.personal_milestone        to authenticated;
grant select, insert, update, delete on table public.personal_action           to authenticated;
grant select, insert, update, delete on table public.personal_time_block       to authenticated;
grant select, insert, update, delete on table public.personal_detour           to authenticated;
grant select, insert, update, delete on table public.personal_journal_entry    to authenticated;
grant select, insert, update, delete on table public.personal_habit            to authenticated;
grant select, insert, update, delete on table public.personal_habit_check      to authenticated;
grant select, insert, update, delete on table public.personal_user_profile     to authenticated;
grant select, insert, update, delete on table public.personal_app_preferences  to authenticated;
