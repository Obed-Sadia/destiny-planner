# DestinyPlanner — Base de données v1.2

**Version** : 1.2 — Avril 2026
**Moteur** : IndexedDB via Dexie.js (local, offline-first)
**Aucune donnée envoyée à un serveur en v1.x**

---

## 1. Vue d'ensemble des tables

```
goal                      (1 seul enregistrement — le but de vie)
domain                    (domaines de vie)
project                   (projets — cœur de l'app)
project_step              (les 7 étapes de chaque projet)
milestone                 (jalons d'un projet)
action                    (actions du jour — liées à un milestone)
time_block                (blocs horaires de la journée — time-blocking 24h)
detour                    (obstacles documentés)
journal_entry             (entrées quotidiennes du journal)
habit                     (habitudes à tracker)
habit_check               (check-ins quotidiens des habitudes)
user_profile              (profil utilisateur — stats, grade, préférences)
personal_business_link    (v2.0 — lien local but perso ↔ projet business)
app_preferences           (préférences techniques — thème, langue, notifications)
backup_meta               (méta-données du dernier backup)
```

> **v1.2 — 2 ajouts** : table `time_block` (time-blocking des 24h, intégré dans la page Aujourd'hui) et table `user_profile` (profil complet avec statistiques, distinct de `app_preferences` qui reste technique).

---

## 2. Schéma détaillé

---

### `goal` — Le but de vie

Un seul enregistrement. Le but est permanent.

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| `id` | string | PK, `'singleton'` | Toujours `'singleton'` |
| `mission` | string | required | "Pourquoi suis-je né ?" |
| `vision_10_years` | string | optional | Description concrète à 10 ans |
| `values` | string[] | max 3 | Valeurs fondamentales (filtres de décision) |
| `created_at` | string | ISO 8601 | |
| `updated_at` | string | ISO 8601 | |

---

### `domain` — Domaines de vie

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| `id` | string | PK, UUID | |
| `name` | string | required, unique | Ex : "Finances", "Foi & Spiritualité" |
| `icon` | string | emoji, 1 char | |
| `goal_statement` | string | optional | Objectif global pour ce domaine |
| `sort_order` | number | integer ≥ 0 | |
| `is_default` | boolean | default false | Vrai pour les 6 domaines pré-chargés |
| `created_at` | string | ISO 8601 | |

**Données initiales (seeds) :**

| name | icon |
|---|---|
| Foi & Spiritualité | 🙏 |
| Famille | 👨‍👩‍👧 |
| Finances | 💰 |
| Santé | 💪 |
| Carrière & Vocation | 🚀 |
| Éducation | 📚 |

---

### `project` — Projets

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| `id` | string | PK, UUID | |
| `domain_id` | string | FK → domain.id | Domaine parent |
| `title` | string | required | Titre court du projet |
| `current_step` | number | 1–7 | Étape courante du parcours |
| `status` | enum | required | `draft` / `active` / `paused` / `completed` / `abandoned` |
| `progress` | number | 0–100 | Calculé depuis les jalons terminés |
| `created_at` | string | ISO 8601 | |
| `updated_at` | string | ISO 8601 | |
| `completed_at` | string \| null | ISO 8601 | |

**Statuts :**
- `draft` : parcours des 7 étapes pas encore terminé
- `active` : 7 étapes complétées, jalons en cours
- `paused` : mis en pause volontairement
- `completed` : tous les jalons terminés
- `abandoned` : abandonné (conservé pour l'historique)

**Règle** : `status` passe de `draft` à `active` uniquement quand l'étape 7 est validée.

---

### `project_step` — Les 7 étapes d'un projet

7 enregistrements par projet, créés automatiquement à la création.

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| `id` | string | PK, UUID | |
| `project_id` | string | FK → project.id | |
| `step_number` | number | 1–7, unique/projet | |
| `status` | enum | required | `locked` / `active` / `completed` |
| `data` | object | JSON | Données saisies à cette étape |
| `completed_at` | string \| null | ISO 8601 | |

**Structure du champ `data` par étape :**

```jsonc
// Étape 1 — Vision claire
{ "title": "string", "description": "string", "success_image": "string" }

// Étape 2 — S'arrêter
{ "reflection": "string", "conviction_or_impulse": "string" }

// Étape 3 — Estimer (SWOT)
{ "strengths": "string", "weaknesses": "string", "opportunities": "string", "threats": "string" }

// Étape 4 — Compter le coût
{
  "financial_cost": "string", "time_cost": "string", "energy_cost": "string",
  "relationship_impact": "string", "sacrifices": "string", "ready_to_pay": boolean
}

// Étape 5 — Calculer
{
  "budget_detail": "string", "duration_estimate": "string",
  "milestones_draft": [{ "title": "string", "due_date": "YYYY-MM-DD" }]
}

// Étape 6 — Vérifier les ressources
{
  "resources_available": "string", "resources_missing": "string",
  "decision": "go | no-go | negotiate", "negotiation_plan": "string"
}

// Étape 7 — S'engager
{
  "success_criteria": "string", "kpi_1": "string", "kpi_2": "string", "kpi_3": "string",
  "commitment_statement": "string", "start_date": "YYYY-MM-DD"
}
```

**Règle** : step 1 = `active` à la création, steps 2–7 = `locked`. Une step passe à `active` quand la précédente est `completed`.

---

### `milestone` — Jalons d'un projet

Générés depuis les données de l'étape 5, créés quand l'étape 7 est validée.

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| `id` | string | PK, UUID | |
| `project_id` | string | FK → project.id | |
| `title` | string | required | |
| `description` | string | optional | |
| `due_date` | string \| null | YYYY-MM-DD | |
| `status` | enum | required | `planned` / `in_progress` / `completed` / `blocked` / `postponed` |
| `sort_order` | number | integer ≥ 0 | |
| `completed_at` | string \| null | ISO 8601 | |
| `created_at` | string | ISO 8601 | |
| `updated_at` | string | ISO 8601 | |

---

### `action` — Actions du jour

**Règle absolue** : toute action est liée à un milestone. Pas d'action sans projet.

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| `id` | string | PK, UUID | |
| `milestone_id` | string | FK → milestone.id, required | Jalon parent |
| `title` | string | required | Description de l'action |
| `date` | string | YYYY-MM-DD | Jour prévu |
| `estimated_minutes` | number \| null | optional | Durée estimée en minutes |
| `done` | boolean | default false | |
| `done_at` | string \| null | ISO 8601 | |
| `created_at` | string | ISO 8601 | |

**Trace complète** : action → milestone → project → domain → goal

> **Note** : `estimated_minutes` est le seul champ liant l'action au time-blocking. Quand une action est assignée à un `time_block`, la durée estimée est affichée dans le bloc.

---

### `time_block` — Blocs horaires de la journée *(NOUVEAU v1.2)*

Time-blocking intégré dans la page **Aujourd'hui**. Permet de planifier et visualiser ses 24h avec des créneaux horaires liés aux actions du jour.

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| `id` | string | PK, UUID | |
| `date` | string | YYYY-MM-DD, required | Jour concerné |
| `start_time` | string | HH:MM (24h), required | Heure de début du bloc (ex: "09:00") |
| `end_time` | string | HH:MM (24h), required | Heure de fin du bloc (ex: "10:30") |
| `title` | string | required | Label du bloc (ex: "Rédaction rapport", "Prière") |
| `action_id` | string \| null | FK → action.id | Action liée (optionnel — un bloc peut être libre) |
| `category` | enum | optional | `work` / `rest` / `spiritual` / `family` / `health` / `free` |
| `color_override` | string \| null | hex ou null | Couleur personnalisée (si null → couleur du domaine lié) |
| `notes` | string | optional | Notes contextuelles sur le bloc |
| `done` | boolean | default false | Le bloc a-t-il été respecté ? (revue du soir) |
| `created_at` | string | ISO 8601 | |
| `updated_at` | string | ISO 8601 | |

**Règles métier :**
- Un bloc peut exister sans être lié à une action (ex: "Repas famille", "Sport")
- Un bloc peut être lié à une action — dans ce cas, cocher l'action coche aussi le bloc
- Les blocs ne peuvent pas se chevaucher sur la même journée (validation côté store)
- Durée minimum d'un bloc : 15 minutes
- La journée commence à 05:00 et se termine à 23:59 (configurable dans `app_preferences`)
- La revue du soir affiche les blocs du jour avec leur statut `done`

**Logique de couleur :**
```typescript
// Couleur d'un bloc dans l'ordre de priorité :
// 1. color_override si défini
// 2. Couleur du domaine de l'action liée (si action_id non null)
// 3. Couleur de la catégorie (work → --purple, rest → --blue, spiritual → --gold, etc.)
// 4. --surface-2 par défaut
```

**Vue dans la page Aujourd'hui :**
```
[Timeline 24h scrollable]
05:00  ──────────────────────────────────
06:00  █ Prière (30min) · Foi & Spiritualité · ✓
06:30  ──────────────────────────────────
07:00  █ Sport (60min) · Santé · ✓
08:00  ──────────────────────────────────
09:00  █ Appeler 3 clients (90min) · Carrière · → Jalon "Valider le marché"
10:30  ──────────────────────────────────
...
```

---

### `detour` — Détours (obstacles documentés)

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| `id` | string | PK, UUID | |
| `project_id` | string \| null | FK → project.id | Lié à un projet si applicable |
| `date` | string | YYYY-MM-DD | |
| `obstacle` | string | required | Description de l'obstacle |
| `impact` | string | required | Impact sur le projet |
| `adjustment` | string | required | Ajustement pris |
| `resolved` | boolean | default false | |
| `resolved_at` | string \| null | ISO 8601 | |
| `is_systemic` | boolean | default false | Obstacle récurrent (≥ 3 projets différents) |
| `linked_habit_id` | string \| null | FK → habit.id | Habitude corrective créée si systémique |
| `created_at` | string | ISO 8601 | |

---

### `journal_entry` — Entrées quotidiennes

Une entrée par jour. L'`id` est la date au format `YYYY-MM-DD`.

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| `id` | string | PK, `YYYY-MM-DD` | |
| `verse_id` | string | FK → constants/verses | Verset affiché ce jour |
| `quote_id` | string | FK → constants/quotes | Citation affichée ce jour |
| `declaration` | string | optional | Déclaration personnelle du matin |
| `main_action` | string | optional | "1 action vers la destinée aujourd'hui" |
| `time_blocking_done` | boolean | default false | La planification 24h du matin a-t-elle été faite ? |
| `evening_review` | string | optional | Bilan du soir |
| `lessons` | string | optional | Leçons apprises |
| `score_cache` | number \| null | 0–100 | Score d'attitudes du jour mis en cache |
| `engagement_level` | number | 1–3 | Niveau d'engagement actif ce jour |
| `created_at` | string | ISO 8601 | |
| `updated_at` | string | ISO 8601 | |

> **Champ `time_blocking_done`** : coché dans la routine matin quand l'utilisateur a planifié ses blocs de la journée. Contribue au score d'engagement du jour. Visible dans les statistiques du profil.

---

### `habit` — Habitudes à tracker

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| `id` | string | PK, UUID | |
| `name` | string | required | Ex : "Prière", "Sport", "Lecture" |
| `weight` | number | 1–100 | Importance relative — somme des actives = 100 |
| `frequency` | enum | `daily` / `weekdays` / `custom` | |
| `active` | boolean | default true | |
| `sort_order` | number | integer ≥ 0 | |
| `created_at` | string | ISO 8601 | |

---

### `habit_check` — Check-ins quotidiens

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| `id` | string | PK, `{habit_id}_{date}` | Clé composée |
| `habit_id` | string | FK → habit.id | |
| `date` | string | YYYY-MM-DD | |
| `done` | boolean | required | |
| `checked_at` | string | ISO 8601 | |

---

### `user_profile` — Profil utilisateur *(NOUVEAU v1.2)*

Un seul enregistrement. Contient l'identité, les statistiques personnelles et le grade. Séparé de `app_preferences` (qui reste purement technique).

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| `id` | string | PK, `'singleton'` | |
| `first_name` | string | required | Prénom affiché dans l'app |
| `avatar_emoji` | string | optional, 1 emoji | Avatar emoji personnalisé (ex: "🦁", "🌟") |
| `avatar_color` | string | optional, hex | Couleur de fond de l'avatar (default: `--gold`) |
| `bio` | string | optional, max 160 | Courte description personnelle |
| `grade` | enum | required | `discoverer` / `planner` / `builder_diligent` / `master_builder` |
| `engagement_level` | number | 1–3 | Niveau d'engagement actuel |
| `streak` | number | default 0 | Jours consécutifs avec check-in (cross-espace) |
| `streak_best` | number | default 0 | Meilleur streak historique |
| `last_active_date` | string \| null | YYYY-MM-DD | |
| `consecutive_inactive_days` | number | default 0 | |
| `last_abandoned_project_date` | string \| null | YYYY-MM-DD | Perso ET business — pour condition Maître Bâtisseur |
| `total_projects_completed` | number | default 0 | Compteur cumulatif (perso) |
| `total_actions_done` | number | default 0 | Compteur cumulatif |
| `total_journal_entries` | number | default 0 | Compteur cumulatif |
| `total_time_blocks_done` | number | default 0 | Blocs horaires respectés (revue du soir) |
| `score_average_30d` | number \| null | 0–100 | Score d'attitudes moyen sur 30 jours — recalculé à chaque check-in |
| `onboarding_done` | boolean | default false | Onboarding initial terminé |
| `created_at` | string | ISO 8601 | |
| `updated_at` | string | ISO 8601 | |

**Ce qu'affiche la page Profil :**

```
┌─────────────────────────────────────────┐
│  🦁  Prénom                             │
│       "Bio courte"                      │
│                                         │
│  Grade : Bâtisseur Diligent  🏗️         │
│  Niveau : 3 — Bâtisseur                 │
├─────────────────────────────────────────┤
│  STATISTIQUES                           │
│  🔥 Streak actuel    42 jours           │
│  🏆 Meilleur streak  58 jours           │
│  ✅ Projets terminés  7                 │
│  ⚡ Actions faites   234               │
│  📔 Entrées journal  89                 │
│  🕐 Blocs respectés  156               │
│  📊 Score moy. 30j   78%               │
├─────────────────────────────────────────┤
│  COMPTE BUSINESS (v2.0)                 │
│  [Se connecter avec Google]             │
│  [Se connecter avec GitHub]             │
└─────────────────────────────────────────┘
```

> **Séparation claire** : `user_profile` = qui je suis + mes stats. `app_preferences` = comment l'app se comporte (thème, langue, notifications).

---

### `personal_business_link` — Lien local perso ↔ business *(v2.0)*

> **Règle absolue** : jamais synchronisé vers Supabase. Strictement local.

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| `id` | string | PK, UUID | |
| `goal_id` | string | FK → goal.id | But perso concerné |
| `domain_id` | string | FK → domain.id | Domaine concerné (pour Arbre de la Destinée) |
| `business_project_id` | string | UUID Supabase — JAMAIS sync | ID du projet business |
| `business_project_title` | string | cached | Titre mis en cache pour affichage offline |
| `business_project_status` | enum | cached | `active` / `paused` / `completed` / `abandoned` |
| `created_at` | string | ISO 8601 | |
| `last_sync_at` | string | ISO 8601 | Dernière mise à jour du cache |

---

### `app_preferences` — Préférences techniques

Un seul enregistrement. Contient uniquement les préférences techniques de l'app (ex-champs de profil migrés vers `user_profile`).

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| `id` | string | PK, `'singleton'` | |
| `dark_mode` | boolean | default true | Dark mode activé |
| `language` | string | `'fr'` | Architecture prête pour `'en'` |
| `notifications_enabled` | boolean | default false | |
| `day_start_hour` | number | 5–8, default 5 | Heure de début de la journée dans la timeline (pour time-blocking) |
| `day_end_hour` | number | 21–24, default 23 | Heure de fin de la journée dans la timeline |
| `week_start_day` | enum | `monday` / `sunday`, default `monday` | |
| `created_at` | string | ISO 8601 | |
| `updated_at` | string | ISO 8601 | |

> **Migration v1.2** : les champs `first_name`, `engagement_level`, `grade`, `streak`, `last_active_date`, `consecutive_inactive_days`, `last_abandoned_project_date`, `onboarding_done` sont **déplacés** de `app_preferences` vers `user_profile`. La migration Dexie (version 3) copie ces valeurs puis les supprime de `app_preferences`.

---

### `backup_meta` — Méta-données du backup

| Champ | Type | Contrainte | Description |
|---|---|---|---|
| `id` | string | PK, `'singleton'` | |
| `last_backup_at` | string \| null | ISO 8601 | |
| `last_backup_method` | enum | `opfs` / `download` / `none` | |
| `last_backup_size_kb` | number \| null | | |
| `opfs_available` | boolean | | OPFS supporté par le navigateur |

---

## 3. Index Dexie.js

```typescript
import Dexie from 'dexie'

const db = new Dexie('DestinyPlanner')

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

// Version 2 — Ajout personal_business_link (v2.0)
db.version(2).stores({
  goal:                   'id',
  domain:                 'id, sort_order',
  project:                'id, domain_id, status, current_step, created_at',
  project_step:           'id, project_id, step_number, status',
  milestone:              'id, project_id, status, due_date, sort_order',
  action:                 'id, milestone_id, date, done',
  detour:                 'id, project_id, date, resolved, is_systemic',
  journal_entry:          'id',
  habit:                  'id, active, sort_order',
  habit_check:            'id, habit_id, date',
  personal_business_link: 'id, goal_id, domain_id',
  app_preferences:        'id',
  backup_meta:            'id',
})

// Version 3 — Ajout time_block + user_profile + migration app_preferences (v1.2)
db.version(3).stores({
  goal:                   'id',
  domain:                 'id, sort_order',
  project:                'id, domain_id, status, current_step, created_at',
  project_step:           'id, project_id, step_number, status',
  milestone:              'id, project_id, status, due_date, sort_order',
  action:                 'id, milestone_id, date, done',
  time_block:             'id, date, start_time, action_id, done',  // NOUVEAU
  detour:                 'id, project_id, date, resolved, is_systemic',
  journal_entry:          'id',
  habit:                  'id, active, sort_order',
  habit_check:            'id, habit_id, date',
  user_profile:           'id',                                       // NOUVEAU
  personal_business_link: 'id, goal_id, domain_id',
  app_preferences:        'id',
  backup_meta:            'id',
}).upgrade(async tx => {
  // Migration : copier les champs de profil de app_preferences → user_profile
  const prefs = await tx.table('app_preferences').get('singleton')
  if (prefs) {
    await tx.table('user_profile').put({
      id: 'singleton',
      first_name: prefs.first_name ?? '',
      avatar_emoji: null,
      avatar_color: null,
      bio: null,
      grade: prefs.grade ?? 'discoverer',
      engagement_level: prefs.engagement_level ?? 1,
      streak: prefs.streak ?? 0,
      streak_best: prefs.streak ?? 0,
      last_active_date: prefs.last_active_date ?? null,
      consecutive_inactive_days: prefs.consecutive_inactive_days ?? 0,
      last_abandoned_project_date: prefs.last_abandoned_project_date ?? null,
      total_projects_completed: 0,
      total_actions_done: 0,
      total_journal_entries: 0,
      total_time_blocks_done: 0,
      score_average_30d: null,
      onboarding_done: prefs.onboarding_done ?? false,
      created_at: prefs.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    // Nettoyer app_preferences — garder uniquement les champs techniques
    await tx.table('app_preferences').put({
      id: 'singleton',
      dark_mode: prefs.dark_mode ?? true,
      language: prefs.language ?? 'fr',
      notifications_enabled: prefs.notifications_enabled ?? false,
      day_start_hour: 5,
      day_end_hour: 23,
      week_start_day: 'monday',
      created_at: prefs.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }
})

// Règle : ne jamais supprimer une version — toujours empiler
```

---

## 4. Relations et cardinalités

```
goal                 1 ──── * domain
domain               1 ──── * project
project              1 ──── 7 project_step     (exactement 7, créés automatiquement)
project              1 ──── * milestone
project              1 ──── * detour
milestone            1 ──── * action
action               1 ──── 0..1 time_block    (une action peut être dans 1 bloc horaire)
journal_entry        1 ──── * time_block        (via date — tous les blocs du jour)
journal_entry        1 ──── * habit_check       (via date)
habit                1 ──── * habit_check
goal                 1 ──── * personal_business_link
domain               1 ──── * personal_business_link
```

---

## 5. Calculs dérivés (non stockés)

| Valeur | Calcul |
|---|---|
| `project.progress` | `(milestones completed / milestones total) * 100` |
| `journal_entry.attitude_score` | `sum(habit.weight for each done habit_check of the day)` — mis en cache dans `score_cache` |
| `score_7_days` | `avg(attitude_score for last 7 journal_entries)` |
| `user_profile.score_average_30d` | `avg(score_cache for last 30 journal_entries)` — recalculé à chaque check-in |
| `streak` | jours consécutifs avec au moins 1 check-in (perso ou business) |
| `streak_reset` | après exactement 2 jours sans aucun check-in |
| `alert_tendancielle` | 5 jours consécutifs de baisse du score d'attitudes |
| `action trace` | `action → milestone → project → domain → goal` (jointures Dexie) |
| `domain.health_status` | `dry / healthy / overloaded / dormant` selon count projets actifs (perso + business liés) |
| `time_block.duration_minutes` | `(end_time - start_time)` en minutes — calculé à la volée |
| `day_time_coverage` | pourcentage des heures planifiées vs heures disponibles — affiché dans Today |
| `grade` | `master_builder si streak≥30 ET lastAbandoned>90j` sinon `builder_diligent si streak≥14` |
| `detour.is_suggested_systemic` | vrai si même type d'obstacle ≥ 3 fois sur projets différents (cross-espace) |

---

## 6. Contenu statique (non en base)

```typescript
// src/constants/verses.ts
export const VERSES: Verse[] = [
  {
    id: 'jer-29-11', reference: 'Jérémie 29:11',
    text: 'Car je connais les projets que j\'ai formés pour vous...',
    reflection_prompt: 'Dieu a déjà un projet pour vous. Quel est-il ?',
    step_affinity: null
  },
  // ... 14 autres versets
]

// src/constants/quotes.ts
export const QUOTES: Quote[] = [
  {
    id: 'q-001', text: 'Votre rêve n\'est qu\'un rêve tant qu\'il n\'a pas de projet.',
    theme: 'planification', step_affinity: [], tone: 'faith'
  },
  {
    id: 'q-002', text: 'Planifier demande plus de travail que travailler lui-même.',
    theme: 'discipline', step_affinity: [2, 3], tone: 'slow-down'
  },
  // ... 24 autres citations
]
```

---

## 7. Export JSON (structure du backup v1.2)

```jsonc
{
  "version": "1.2",
  "exported_at": "2026-04-10T09:00:00Z",
  "app": "DestinyPlanner",
  "data": {
    "goal": { /* objet goal */ },
    "domains": [ /* tableau domain */ ],
    "projects": [ /* tableau project */ ],
    "project_steps": [ /* tableau project_step */ ],
    "milestones": [ /* tableau milestone */ ],
    "actions": [ /* tableau action */ ],
    "time_blocks": [ /* tableau time_block — NOUVEAU */ ],
    "detours": [ /* tableau detour */ ],
    "journal_entries": [ /* tableau journal_entry */ ],
    "habits": [ /* tableau habit */ ],
    "habit_checks": [ /* tableau habit_check */ ],
    "user_profile": { /* objet user_profile — NOUVEAU */ },
    "personal_business_links": [ /* tableau personal_business_link — jamais sync Supabase */ ],
    "app_preferences": { /* objet app_preferences */ }
  }
}
```

---

*DestinyPlanner — Base de données v1.2 — Avril 2026*
