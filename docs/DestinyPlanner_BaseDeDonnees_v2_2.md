# DestinyPlanner — Base de données v2.2

**Version** : 2.2 — Avril 2026  
**Moteurs** : IndexedDB via Dexie.js v5 (local) + Supabase Postgres (cloud — v2.0+)

---

## 1. Vue d'ensemble

```
IndexedDB (Dexie v5 — 16 tables)          Supabase Postgres
─────────────────────────────────          ──────────────────────────────────
goal                                       personal_goal
domain                                     personal_domain
project                                    personal_project
project_step                               personal_project_step
milestone                                  personal_milestone
action                                     personal_action
time_block                                 personal_time_block
detour                                     personal_detour
journal_entry                              personal_journal_entry
habit                                      personal_habit
habit_check                                personal_habit_check
user_profile          ←→ sync ←→          personal_user_profile
app_preferences                            personal_app_preferences
personal_business_link  ← JAMAIS sync     (n'existe pas côté Supabase)
backup_meta                                —
business_project_cache  ← cache offline   business_projects
                                           business_project_steps
                                           business_milestones
                                           business_members
                                           business_invite_tokens
                                           business_comments
                                           profiles
```

---

## 2. IndexedDB — Schéma Dexie v5 (migrations cumulatives)

```typescript
// Version 1 — MVP perso
db.version(1).stores({
  goal:             'id',
  domain:           'id, sort_order',
  project:          'id, domain_id, status, current_step, created_at',
  project_step:     'id, project_id, step_number, status',
  milestone:        'id, project_id, status, due_date, sort_order',
  action:           'id, milestone_id, date, done',
  detour:           'id, project_id, date, resolved, is_systemic',
  journal_entry:    'id',
  habit:            'id, active, sort_order',
  habit_check:      'id, habit_id, date',
  app_preferences:  'id',
  backup_meta:      'id',
})

// Version 2 — Ajout personal_business_link
db.version(2).stores({
  ...v1,
  personal_business_link: 'id, goal_id, domain_id',
})

// Version 3 — Ajout time_block + user_profile, migration app_preferences (v1.2)
db.version(3).stores({
  ...v2,
  time_block:   'id, date, start_time, action_id, done',
  user_profile: 'id',
}).upgrade(async tx => {
  // Copie champs profil de app_preferences → user_profile
  // Nettoie app_preferences (garde uniquement les champs techniques)
})

// Version 4 — Ajout cache business offline
db.version(4).stores({
  ...v3,
  business_project_cache: 'id, owner_id, status, cached_at',
})

// Version 5 — Ajout tutorial_done sur user_profile (flag Dexie, pas changement schema)
db.version(5).stores({
  ...v4,
  // Aucune table ajoutée — user_profile.tutorial_done ajouté via upgrade()
}).upgrade(async tx => {
  const profile = await tx.table('user_profile').get('singleton')
  if (profile && profile.tutorial_done === undefined) {
    await tx.table('user_profile').update('singleton', { tutorial_done: false })
  }
})

// Règle : ne jamais supprimer une version. Toujours empiler.
```

---

## 3. Tables IndexedDB — Schéma détaillé

### `goal` — But de vie

Un seul enregistrement permanent.

| Champ | Type | Description |
|---|---|---|
| `id` | `'singleton'` | Toujours `'singleton'` |
| `mission` | string | "Pourquoi suis-je né ?" |
| `vision_10_years` | string? | Description concrète à 10 ans |
| `values` | string[] | Max 3 valeurs fondamentales |
| `created_at` | ISO 8601 | |
| `updated_at` | ISO 8601 | |

---

### `domain` — Domaines de vie

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | |
| `name` | string | Ex : "Finances", "Foi & Spiritualité" |
| `icon` | string | Emoji 1 caractère |
| `goal_statement` | string? | Objectif global du domaine |
| `sort_order` | number | |
| `is_default` | boolean | Vrai pour les 6 domaines seedés |
| `created_at` | ISO 8601 | |

**Seeds** : Foi & Spiritualité 🙏, Famille 👨‍👩‍👧, Finances 💰, Santé 💪, Carrière & Vocation 🚀, Éducation 📚

---

### `project` — Projets perso

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | |
| `domain_id` | FK→domain | |
| `title` | string | |
| `current_step` | 1–7 | Étape courante |
| `status` | enum | `draft / active / paused / completed / abandoned` |
| `progress` | 0–100 | Calculé depuis jalons terminés |
| `created_at` | ISO 8601 | |
| `updated_at` | ISO 8601 | |
| `completed_at` | ISO 8601? | |

**Règle** : passe de `draft` à `active` à la validation de l'étape 7 uniquement.

---

### `project_step` — 7 étapes par projet

7 enregistrements auto-créés à la création du projet.

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | |
| `project_id` | FK→project | |
| `step_number` | 1–7 | |
| `status` | enum | `locked / active / completed` |
| `data` | JSON | Données saisies (structure par étape, voir ci-dessous) |
| `completed_at` | ISO 8601? | |

**Données par étape** :

```jsonc
// Étape 1 — Vision claire
{ "title": "", "description": "", "success_image": "" }

// Étape 2 — S'arrêter
{ "reflection": "", "conviction_or_impulse": "" }

// Étape 3 — Estimer (SWOT)
{ "strengths": "", "weaknesses": "", "opportunities": "", "threats": "" }

// Étape 4 — Compter le coût
{ "financial_cost": "", "time_cost": "", "energy_cost": "",
  "relationship_impact": "", "sacrifices": "", "ready_to_pay": false }

// Étape 5 — Calculer
{ "budget_detail": "", "duration_estimate": "",
  "milestones_draft": [{ "title": "", "due_date": "YYYY-MM-DD" }] }

// Étape 6 — Vérifier
{ "resources_available": "", "resources_missing": "",
  "decision": "go | no-go | negotiate", "negotiation_plan": "" }

// Étape 7 — S'engager
{ "success_criteria": "", "kpi_1": "", "kpi_2": "", "kpi_3": "",
  "commitment_statement": "", "start_date": "YYYY-MM-DD" }
```

---

### `milestone` — Jalons

Générés depuis étape 5, créés à la validation de l'étape 7.

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | |
| `project_id` | FK→project | |
| `title` | string | |
| `description` | string? | |
| `due_date` | YYYY-MM-DD? | |
| `status` | enum | `planned / in_progress / completed / blocked / postponed` |
| `sort_order` | number | |
| `completed_at` | ISO 8601? | |
| `created_at` | ISO 8601 | |
| `updated_at` | ISO 8601 | |

---

### `action` — Actions du jour

**Règle absolue** : toute action est liée à un jalon.

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | |
| `milestone_id` | FK→milestone | Obligatoire |
| `title` | string | |
| `date` | YYYY-MM-DD | |
| `estimated_minutes` | number? | Durée estimée (affichée dans le bloc lié) |
| `done` | boolean | |
| `done_at` | ISO 8601? | |
| `created_at` | ISO 8601 | |

**Trace** : action → milestone → project → domain → goal

---

### `time_block` — Blocs horaires 24h

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | |
| `date` | YYYY-MM-DD | |
| `start_time` | HH:MM | Heure début (format 24h) |
| `end_time` | HH:MM | Heure fin |
| `title` | string | Label du bloc |
| `action_id` | FK→action? | Action liée (optionnel) |
| `category` | enum? | `work / rest / spiritual / family / health / free` |
| `color_override` | string? | Hex — surpasse la couleur automatique |
| `notes` | string? | |
| `done` | boolean | Respecté ? (revue du soir) |
| `created_at` | ISO 8601 | |
| `updated_at` | ISO 8601 | |

**Logique couleur** (priorité descendante) :
1. `color_override` si défini
2. Couleur du domaine de l'action liée
3. Couleur de la catégorie (`work→--purple`, `spiritual→--gold`, `family→--green`, `health→--teal`, `rest→--blue`, `free→--surface-2`)
4. `--surface-2` par défaut

**Règles** : durée min 15min · pas de chevauchement · fenêtre configurable (day_start_hour → day_end_hour)

---

### `detour` — Détours (obstacles documentés)

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | |
| `project_id` | FK→project? | |
| `date` | YYYY-MM-DD | |
| `obstacle` | string | |
| `impact` | string | |
| `adjustment` | string | |
| `resolved` | boolean | |
| `resolved_at` | ISO 8601? | |
| `is_systemic` | boolean | Vrai si ≥ 3 fois sur projets différents |
| `linked_habit_id` | FK→habit? | Habitude corrective créée si systémique |
| `created_at` | ISO 8601 | |

---

### `journal_entry` — Entrées quotidiennes

Une entrée par jour. `id` = date au format `YYYY-MM-DD`.

| Champ | Type | Description |
|---|---|---|
| `id` | YYYY-MM-DD | Clé primaire = date |
| `verse_id` | string | FK→constants/verses |
| `quote_id` | string | FK→constants/quotes |
| `declaration` | string? | Déclaration matin |
| `main_action` | string? | 1 action vers la destinée |
| `time_blocking_done` | boolean | Planification 24h faite ? |
| `evening_review` | string? | Bilan du soir |
| `lessons` | string? | Leçons apprises |
| `score_cache` | 0–100? | Score d'attitudes mis en cache |
| `engagement_level` | 1–3 | Niveau d'engagement actif ce jour |
| `created_at` | ISO 8601 | |
| `updated_at` | ISO 8601 | |

---

### `habit` — Habitudes

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | |
| `name` | string | |
| `weight` | 1–100 | Somme des habitudes actives = 100 |
| `frequency` | enum | `daily / weekdays / custom` |
| `active` | boolean | |
| `sort_order` | number | |
| `created_at` | ISO 8601 | |

---

### `habit_check` — Check-ins quotidiens

| Champ | Type | Description |
|---|---|---|
| `id` | `{habit_id}_{date}` | Clé composée |
| `habit_id` | FK→habit | |
| `date` | YYYY-MM-DD | |
| `done` | boolean | |
| `checked_at` | ISO 8601 | |

---

### `user_profile` — Profil utilisateur (singleton)

| Champ | Type | Description |
|---|---|---|
| `id` | `'singleton'` | |
| `first_name` | string | |
| `avatar_emoji` | string? | Emoji personnalisé |
| `avatar_color` | string? | Couleur de fond (hex) |
| `bio` | string? | Max 160 caractères |
| `grade` | enum | `discoverer / planner / builder_diligent / master_builder` |
| `engagement_level` | 1–3 | |
| `streak` | number | Jours consécutifs avec check-in (cross-espace) |
| `streak_best` | number | Meilleur streak historique |
| `last_active_date` | YYYY-MM-DD? | |
| `consecutive_inactive_days` | number | |
| `last_abandoned_project_date` | YYYY-MM-DD? | Perso ET business |
| `total_projects_completed` | number | |
| `total_actions_done` | number | |
| `total_journal_entries` | number | |
| `total_time_blocks_done` | number | Blocs respectés (revue soir) |
| `score_average_30d` | 0–100? | Recalculé à chaque check-in |
| `onboarding_done` | boolean | |
| `tutorial_done` | boolean | **Ajout v5** |
| `created_at` | ISO 8601 | |
| `updated_at` | ISO 8601 | |

---

### `personal_business_link` — Lien local perso ↔ business

> **Règle absolue** : jamais synchronisé vers Supabase.

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | |
| `goal_id` | FK→goal | |
| `domain_id` | FK→domain | |
| `business_project_id` | UUID Supabase | |
| `business_project_title` | string | Titre mis en cache |
| `business_project_status` | enum | `active / paused / completed / abandoned` |
| `created_at` | ISO 8601 | |
| `last_sync_at` | ISO 8601 | Dernière mise à jour du cache |

---

### `app_preferences` — Préférences techniques (singleton)

| Champ | Type | Description |
|---|---|---|
| `id` | `'singleton'` | |
| `dark_mode` | boolean | Default : true |
| `language` | `'fr' \| 'en'` | |
| `notifications_enabled` | boolean | |
| `day_start_hour` | 5–8 | Fenêtre timeline time-blocking |
| `day_end_hour` | 21–24 | |
| `week_start_day` | `'monday' \| 'sunday'` | |
| `created_at` | ISO 8601 | |
| `updated_at` | ISO 8601 | |

---

### `backup_meta` — Méta-données du backup (singleton)

| Champ | Type | Description |
|---|---|---|
| `id` | `'singleton'` | |
| `last_backup_at` | ISO 8601? | |
| `last_backup_method` | `'opfs' \| 'download' \| 'none'` | |
| `last_backup_size_kb` | number? | |
| `opfs_available` | boolean | |

---

### `business_project_cache` — Cache offline business (v4)

Copie locale des projets business pour lecture offline uniquement.

| Champ | Type | Description |
|---|---|---|
| `id` | UUID Supabase | |
| `owner_id` | UUID | |
| `title` | string | |
| `status` | enum | |
| `progress` | 0–100 | |
| `cached_at` | ISO 8601 | |

---

## 4. Supabase — Tables cloud (v2.0+)

### 4.1 Espace personnel — sync depuis IndexedDB

Chaque table `personal_*` duplique sa table locale correspondante avec une colonne `user_id` pour le RLS.

**RLS policy** (identique sur toutes les tables perso) :
```sql
-- SELECT / INSERT / UPDATE / DELETE : user_id = auth.uid()
```

| Table Supabase | Table locale | Particularité |
|---|---|---|
| `personal_goal` | `goal` | `user_id` remplace `id='singleton'` |
| `personal_domain` | `domain` | |
| `personal_project` | `project` | |
| `personal_project_step` | `project_step` | |
| `personal_milestone` | `milestone` | |
| `personal_action` | `action` | |
| `personal_time_block` | `time_block` | |
| `personal_detour` | `detour` | |
| `personal_journal_entry` | `journal_entry` | |
| `personal_habit` | `habit` | |
| `personal_habit_check` | `habit_check` | |
| `personal_user_profile` | `user_profile` | `user_id` remplace `id='singleton'` |
| `personal_app_preferences` | `app_preferences` | `user_id` remplace `id='singleton'` |

**Sync pattern** :
- Pull au login (rempli IndexedDB depuis Supabase)
- Push immédiat à chaque write si connecté, sinon queue localStorage
- Replay auto à reconnexion (MAX_ATTEMPTS=5)
- Migration one-shot `personalMigration.ts` au premier `SIGNED_IN`

---

### 4.2 Espace business — source de vérité Supabase

#### `business_projects`

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | |
| `owner_id` | FK→profiles.id | |
| `title` | string | |
| `description` | string? | |
| `status` | enum | `draft / active / paused / completed / abandoned` |
| `progress` | 0–100 | |
| `current_step` | 1–7 | |
| `template_id` | string? | Template utilisé |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**RLS** : Members can SELECT · Editor/Owner can UPDATE · Owner can DELETE

---

#### `business_project_steps`

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | |
| `project_id` | FK→business_projects | |
| `step_number` | 1–7 | |
| `status` | enum | `locked / active / completed` |
| `data` | jsonb | Structure identique aux étapes perso (prompts entrepreneur) |
| `completed_at` | timestamptz? | |

---

#### `business_milestones`

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | |
| `project_id` | FK→business_projects | |
| `title` | string | |
| `due_date` | date? | |
| `status` | enum | `planned / in_progress / completed / blocked / postponed` |
| `assignee_id` | FK→profiles.id? | Membre responsable |
| `sort_order` | number | |
| `completed_at` | timestamptz? | |

---

#### `business_members`

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | |
| `project_id` | FK→business_projects | |
| `user_id` | FK→profiles.id | |
| `role` | enum | `owner / editor / viewer` |
| `joined_at` | timestamptz | |

**RLS** : Owner/Editor/Viewer can SELECT own · Owner can INSERT/UPDATE/DELETE

---

#### `business_invite_tokens`

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | |
| `project_id` | FK→business_projects | |
| `created_by` | FK→profiles.id | |
| `role` | enum | Rôle accordé à l'invité |
| `token` | string | Unique |
| `expires_at` | timestamptz | `created_at + 7 jours` |
| `used_by` | FK→profiles.id? | |
| `used_at` | timestamptz? | |

---

#### `business_comments`

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | |
| `project_id` | FK→business_projects | |
| `author_id` | FK→profiles.id | |
| `target_type` | enum | `step / milestone` |
| `target_id` | UUID | ID de l'étape ou du jalon |
| `body` | string | Texte (supporte mentions @nom) |
| `mentioned_user_ids` | UUID[] | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

#### `profiles` — Profils utilisateurs OAuth

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | = `auth.uid()` |
| `email` | string | |
| `display_name` | string? | |
| `avatar_url` | string? | Photo OAuth |
| `created_at` | timestamptz | |

**RLS** : PUBLIC SELECT · own UPDATE

---

## 5. Relations et cardinalités

```
goal                 1 ──── * domain
domain               1 ──── * project
project              1 ──── 7 project_step     (exactement 7, auto-créés)
project              1 ──── * milestone
project              1 ──── * detour
milestone            1 ──── * action
action               1 ──── 0..1 time_block
journal_entry (date) 1 ──── * time_block        (via date)
journal_entry (date) 1 ──── * habit_check       (via date)
habit                1 ──── * habit_check
goal                 1 ──── * personal_business_link
domain               1 ──── * personal_business_link

business_projects    1 ──── 7 business_project_steps
business_projects    1 ──── * business_milestones
business_projects    1 ──── * business_members
business_projects    1 ──── * business_invite_tokens
business_projects    1 ──── * business_comments
business_milestones  0..1 ── 1 profiles (assignee)
```

---

## 6. Calculs dérivés (non stockés)

| Valeur | Calcul |
|---|---|
| `project.progress` | `(milestones completed / total) * 100` |
| `score_cache` | `sum(habit.weight pour done habit_checks du jour)` |
| `score_7_days` | `avg(score_cache last 7 journal_entries)` |
| `score_average_30d` | `avg(score_cache last 30 journal_entries)` |
| `streak` | Jours consécutifs avec au moins 1 check-in |
| `streak_reset` | Après exactement 2 jours sans check-in |
| `grade` | `master_builder si streak≥30 ET lastAbandoned>90j · builder_diligent si streak≥14 · planner si engagement_level≥2` |
| `domain.health_status` | `dry/healthy/overloaded/dormant` selon count projets actifs |
| `time_block.duration_minutes` | `(end_time - start_time)` en minutes |
| `detour.is_suggested_systemic` | Vrai si même obstacle ≥ 3 fois sur projets différents |

---

## 7. Structure export JSON (backup)

```jsonc
{
  "version": "2.2",
  "exported_at": "2026-04-17T09:00:00Z",
  "app": "DestinyPlanner",
  "data": {
    "goal": {},
    "domains": [],
    "projects": [],
    "project_steps": [],
    "milestones": [],
    "actions": [],
    "time_blocks": [],
    "detours": [],
    "journal_entries": [],
    "habits": [],
    "habit_checks": [],
    "user_profile": {},
    "personal_business_links": [],
    "app_preferences": {}
  }
}
```

> `personal_business_links` est inclus dans l'export local. Les données business (Supabase) ne sont PAS dans ce backup — Supabase a ses propres backups automatiques.

---

*DestinyPlanner — Base de données v2.2 — Avril 2026*
