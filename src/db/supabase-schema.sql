-- DestinyPlanner — Schéma Supabase (espace business v2.0)
-- À exécuter dans le SQL Editor de Supabase ou via supabase db push
--
-- Tables : profiles, business_projects, business_project_steps,
--          business_milestones, business_actions, business_members,
--          business_detours, business_comments, business_invite_tokens

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Helper : is_project_member() ────────────────────────────
-- Utilisé dans les RLS pour vérifier l'appartenance à un projet
create or replace function is_project_member(p_project_id uuid)
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (
    select 1 from business_members
    where project_id = p_project_id
      and user_id = auth.uid()
  );
end;
$$;

-- Variante avec filtre de rôle
create or replace function has_project_role(p_project_id uuid, p_roles text[])
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (
    select 1 from business_members
    where project_id = p_project_id
      and user_id = auth.uid()
      and role = any(p_roles)
  );
end;
$$;

-- ─── Table : profiles ─────────────────────────────────────────
-- Profil public lié à auth.users — créé automatiquement à l'inscription
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  display_name text not null default '',
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_authenticated"
  on profiles for select
  to authenticated
  using (true);

create policy "profiles_insert_own"
  on profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on profiles for update
  to authenticated
  using (id = auth.uid());

-- Trigger : création automatique du profil à l'inscription
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email, ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Table : business_projects ────────────────────────────────
create table business_projects (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references auth.users on delete cascade,
  title         text not null,
  description   text not null default '',
  current_step  smallint not null default 1 check (current_step between 1 and 7),
  status        text not null default 'draft'
                  check (status in ('draft', 'active', 'paused', 'completed', 'abandoned')),
  progress      smallint not null default 0 check (progress between 0 and 100),
  template_id   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  deleted_by    uuid references auth.users
);

alter table business_projects enable row level security;

create policy "business_projects_select_member"
  on business_projects for select
  to authenticated
  using (
    deleted_at is null
    and (owner_id = auth.uid() or is_project_member(id))
  );

create policy "business_projects_insert_authenticated"
  on business_projects for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "business_projects_update_owner_editor"
  on business_projects for update
  to authenticated
  using (has_project_role(id, array['owner', 'editor']));

-- Pas de DELETE physique — soft delete via deleted_at (owner uniquement)
create policy "business_projects_softdelete_owner"
  on business_projects for update
  to authenticated
  using (has_project_role(id, array['owner']))
  with check (deleted_by = auth.uid());

-- ─── Table : business_project_steps ──────────────────────────
create table business_project_steps (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references business_projects on delete cascade,
  step_number  smallint not null check (step_number between 1 and 7),
  status       text not null default 'locked'
                 check (status in ('locked', 'active', 'completed')),
  data         jsonb not null default '{}',
  completed_at timestamptz,
  unique (project_id, step_number)
);

alter table business_project_steps enable row level security;

create policy "business_steps_select_member"
  on business_project_steps for select
  to authenticated
  using (is_project_member(project_id));

create policy "business_steps_update_owner_editor"
  on business_project_steps for update
  to authenticated
  using (has_project_role(project_id, array['owner', 'editor']));

-- INSERT géré par trigger côté serveur (7 steps à la création du projet)
create policy "business_steps_insert_owner"
  on business_project_steps for insert
  to authenticated
  with check (has_project_role(project_id, array['owner']));

-- Trigger : créer 7 étapes à la création d'un projet
create or replace function create_business_project_steps()
returns trigger
language plpgsql
security definer
as $$
declare
  i smallint;
begin
  for i in 1..7 loop
    insert into business_project_steps (project_id, step_number, status)
    values (new.id, i, case when i = 1 then 'active' else 'locked' end);
  end loop;

  -- Ajouter le créateur comme owner dans business_members
  insert into business_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'owner');

  return new;
end;
$$;

create trigger on_business_project_created
  after insert on business_projects
  for each row execute procedure create_business_project_steps();

-- ─── Table : business_milestones ──────────────────────────────
create table business_milestones (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references business_projects on delete cascade,
  assignee_id  uuid references auth.users on delete set null,
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

alter table business_milestones enable row level security;

create policy "business_milestones_select_member"
  on business_milestones for select
  to authenticated
  using (is_project_member(project_id));

create policy "business_milestones_insert_owner_editor"
  on business_milestones for insert
  to authenticated
  with check (has_project_role(project_id, array['owner', 'editor']));

create policy "business_milestones_update_owner_editor"
  on business_milestones for update
  to authenticated
  using (has_project_role(project_id, array['owner', 'editor']));

create policy "business_milestones_delete_owner"
  on business_milestones for delete
  to authenticated
  using (has_project_role(project_id, array['owner']));

-- ─── Table : business_actions ─────────────────────────────────
create table business_actions (
  id                uuid primary key default uuid_generate_v4(),
  milestone_id      uuid not null references business_milestones on delete cascade,
  project_id        uuid not null references business_projects on delete cascade,
  created_by        uuid not null references auth.users on delete cascade,
  title             text not null,
  date              date not null,
  estimated_minutes smallint,
  done              boolean not null default false,
  done_at           timestamptz,
  created_at        timestamptz not null default now()
);

alter table business_actions enable row level security;

create policy "business_actions_select_member"
  on business_actions for select
  to authenticated
  using (is_project_member(project_id));

create policy "business_actions_insert_owner_editor"
  on business_actions for insert
  to authenticated
  with check (
    has_project_role(project_id, array['owner', 'editor'])
    and created_by = auth.uid()
  );

create policy "business_actions_update_owner_editor"
  on business_actions for update
  to authenticated
  using (has_project_role(project_id, array['owner', 'editor']));

create policy "business_actions_delete_owner_creator"
  on business_actions for delete
  to authenticated
  using (
    has_project_role(project_id, array['owner'])
    or created_by = auth.uid()
  );

-- ─── Table : business_members ─────────────────────────────────
create table business_members (
  id         uuid primary key default uuid_generate_v4(),
  project_id uuid not null references business_projects on delete cascade,
  user_id    uuid not null references auth.users on delete cascade,
  role       text not null check (role in ('owner', 'editor', 'viewer')),
  joined_at  timestamptz not null default now(),
  unique (project_id, user_id)
);

alter table business_members enable row level security;

create policy "business_members_select_member"
  on business_members for select
  to authenticated
  using (is_project_member(project_id));

-- INSERT géré par trigger (owner à la création) + invitation acceptée
create policy "business_members_insert_owner_or_self"
  on business_members for insert
  to authenticated
  with check (
    has_project_role(project_id, array['owner'])
    or user_id = auth.uid()
  );

create policy "business_members_update_owner"
  on business_members for update
  to authenticated
  using (has_project_role(project_id, array['owner']));

create policy "business_members_delete_owner_or_self"
  on business_members for delete
  to authenticated
  using (
    has_project_role(project_id, array['owner'])
    or user_id = auth.uid()
  );

-- ─── Table : business_detours ─────────────────────────────────
create table business_detours (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references business_projects on delete cascade,
  reported_by uuid not null references auth.users on delete cascade,
  date        date not null,
  obstacle    text not null,
  impact      text not null default '',
  adjustment  text not null default '',
  resolved    boolean not null default false,
  resolved_at timestamptz,
  resolved_by uuid references auth.users on delete set null,
  is_systemic boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table business_detours enable row level security;

create policy "business_detours_select_member"
  on business_detours for select
  to authenticated
  using (is_project_member(project_id));

create policy "business_detours_insert_member"
  on business_detours for insert
  to authenticated
  with check (
    is_project_member(project_id)
    and reported_by = auth.uid()
  );

create policy "business_detours_update_owner_reporter"
  on business_detours for update
  to authenticated
  using (
    has_project_role(project_id, array['owner'])
    or reported_by = auth.uid()
  );

create policy "business_detours_delete_owner"
  on business_detours for delete
  to authenticated
  using (has_project_role(project_id, array['owner']));

-- ─── Table : business_comments ────────────────────────────────
create table business_comments (
  id                  uuid primary key default uuid_generate_v4(),
  project_id          uuid not null references business_projects on delete cascade,
  author_id           uuid not null references auth.users on delete cascade,
  target_type         text not null check (target_type in ('step', 'milestone')),
  target_id           uuid not null,
  body                text not null,
  mentioned_user_ids  text[],
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table business_comments enable row level security;

create policy "business_comments_select_member"
  on business_comments for select
  to authenticated
  using (is_project_member(project_id));

create policy "business_comments_insert_member"
  on business_comments for insert
  to authenticated
  with check (
    is_project_member(project_id)
    and author_id = auth.uid()
  );

create policy "business_comments_update_own"
  on business_comments for update
  to authenticated
  using (author_id = auth.uid());

create policy "business_comments_delete_own_or_owner"
  on business_comments for delete
  to authenticated
  using (
    author_id = auth.uid()
    or has_project_role(project_id, array['owner'])
  );

-- ─── Table : business_invite_tokens ───────────────────────────
create table business_invite_tokens (
  id         uuid primary key default uuid_generate_v4(),
  project_id uuid not null references business_projects on delete cascade,
  created_by uuid not null references auth.users on delete cascade,
  token      text not null unique default encode(gen_random_bytes(24), 'hex'),
  role       text not null check (role in ('editor', 'viewer')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_by    uuid references auth.users on delete set null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

alter table business_invite_tokens enable row level security;

-- L'owner peut voir et créer des tokens d'invitation
create policy "invite_tokens_select_owner"
  on business_invite_tokens for select
  to authenticated
  using (has_project_role(project_id, array['owner']));

create policy "invite_tokens_insert_owner"
  on business_invite_tokens for insert
  to authenticated
  with check (
    has_project_role(project_id, array['owner'])
    and created_by = auth.uid()
  );

-- Tout utilisateur authentifié peut consommer un token (UPDATE used_by/used_at)
create policy "invite_tokens_consume_authenticated"
  on business_invite_tokens for update
  to authenticated
  using (
    used_by is null
    and expires_at > now()
  )
  with check (used_by = auth.uid());

create policy "invite_tokens_delete_owner"
  on business_invite_tokens for delete
  to authenticated
  using (has_project_role(project_id, array['owner']));

-- ─── Table : user_push_subscriptions (S34) ───────────────────
create table user_push_subscriptions (
  user_id    uuid primary key references auth.users on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  updated_at timestamptz not null default now()
);

alter table user_push_subscriptions enable row level security;

create policy "push_sub_select_own"
  on user_push_subscriptions for select
  to authenticated
  using (user_id = auth.uid());

create policy "push_sub_upsert_own"
  on user_push_subscriptions for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "push_sub_update_own"
  on user_push_subscriptions for update
  to authenticated
  using (user_id = auth.uid());

create policy "push_sub_delete_own"
  on user_push_subscriptions for delete
  to authenticated
  using (user_id = auth.uid());

-- ─── Table : community_templates (S36) ──────────────────────
create table community_templates (
  id             uuid primary key default uuid_generate_v4(),
  author_id      uuid not null references auth.users on delete cascade,
  title          text not null,
  description    text not null default '',
  template_type  text not null check (template_type in (
                   'product-launch', 'company-creation', 'real-estate',
                   'partnership', 'fundraising', 'client-mission'
                 )),
  steps_data     jsonb not null,
  uses_count     integer not null default 0,
  created_at     timestamptz not null default now()
);

alter table community_templates enable row level security;

-- Lecture publique (même non authentifié)
create policy "community_templates_select_all"
  on community_templates for select
  using (true);

-- Écriture authentifiée
create policy "community_templates_insert_authenticated"
  on community_templates for insert
  to authenticated
  with check (author_id = auth.uid());

-- Suppression owner uniquement
create policy "community_templates_delete_own"
  on community_templates for delete
  to authenticated
  using (author_id = auth.uid());

create index idx_community_templates_type on community_templates (template_type);
create index idx_community_templates_author on community_templates (author_id);

-- ─── Trigger : mentions push (S35) ───────────────────────────
create extension if not exists pg_net;

create or replace function notify_comment_mentions()
returns trigger
language plpgsql
security definer
as $$
declare
  uid  text;
  svc  text := 'https://oqkhlhgqujomjmsbxkia.supabase.co';
  key  text := current_setting('app.service_role_key', true);
begin
  if new.mentioned_user_ids is null then
    return new;
  end if;

  foreach uid in array new.mentioned_user_ids loop
    continue when uid = new.author_id::text;

    perform net.http_post(
      url     := svc || '/functions/v1/push-notify',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || key
      ),
      body    := jsonb_build_object(
        'userId', uid,
        'title',  'Nouvelle mention',
        'body',   'Vous avez été mentionné dans un commentaire'
      )
    );
  end loop;

  return new;
end;
$$;

create trigger on_comment_insert
  after insert on business_comments
  for each row execute function notify_comment_mentions();

-- ─── Index ────────────────────────────────────────────────────
create index idx_biz_projects_owner      on business_projects (owner_id);
create index idx_biz_projects_status     on business_projects (status) where deleted_at is null;
create index idx_biz_steps_project       on business_project_steps (project_id);
create index idx_biz_milestones_project  on business_milestones (project_id);
create index idx_biz_milestones_assignee on business_milestones (assignee_id);
create index idx_biz_actions_milestone   on business_actions (milestone_id);
create index idx_biz_actions_project     on business_actions (project_id);
create index idx_biz_members_project     on business_members (project_id);
create index idx_biz_members_user        on business_members (user_id);
create index idx_biz_detours_project     on business_detours (project_id);
create index idx_biz_comments_target     on business_comments (project_id, target_type, target_id);
create index idx_biz_invite_token        on business_invite_tokens (token);
create index idx_biz_invite_project      on business_invite_tokens (project_id);

-- ─── Grants : permissions d'accès pour le rôle authenticated ─────────────────
grant select, insert, update, delete on table public.business_projects      to authenticated;
grant select, insert, update, delete on table public.business_project_steps to authenticated;
grant select, insert, update, delete on table public.business_members       to authenticated;
grant select, insert, update, delete on table public.business_milestones    to authenticated;
grant select, insert, update, delete on table public.business_actions       to authenticated;
grant select, insert, update, delete on table public.business_detours       to authenticated;
grant select, insert, update, delete on table public.business_comments      to authenticated;
grant select, insert, update, delete on table public.business_invite_tokens to authenticated;

-- ─── RPC : accept_project_invite ──────────────────────────────
-- Consomme un token d'invitation de façon atomique :
-- valide le token, ajoute le membre, marque le token comme utilisé.
-- security definer → s'exécute avec les droits du propriétaire de la fonction,
-- contournant le RLS pour les opérations internes.
create or replace function accept_project_invite(p_token text)
returns json
language plpgsql
security definer
as $$
declare
  v_token  business_invite_tokens;
  v_uid    uuid;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- Verrouiller le token pour éviter les double-consommations concurrentes
  select * into v_token
  from business_invite_tokens
  where token     = p_token
    and used_by   is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'INVALID_OR_EXPIRED_TOKEN';
  end if;

  -- Si déjà membre, on renvoie quand même le project_id sans erreur
  if exists (
    select 1 from business_members
    where project_id = v_token.project_id
      and user_id    = v_uid
  ) then
    raise exception 'ALREADY_MEMBER:%', v_token.project_id;
  end if;

  -- Ajouter le membre
  insert into business_members (project_id, user_id, role)
  values (v_token.project_id, v_uid, v_token.role);

  -- Consommer le token
  update business_invite_tokens
  set used_by  = v_uid,
      used_at  = now()
  where id = v_token.id;

  return json_build_object(
    'project_id', v_token.project_id,
    'role',       v_token.role
  );
end;
$$;
