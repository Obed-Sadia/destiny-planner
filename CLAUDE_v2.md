# CLAUDE.md — DestinyPlanner

> Ce fichier est lu automatiquement par Claude Code à chaque session. Ne jamais le supprimer.
> Lire en entier avant de commencer toute session de développement.

---

## 1. Vocabulaire strict — règles absolues

| ✅ Terme correct | ❌ Terme interdit | Raison |
|---|---|---|
| **projet** | ~~plan~~ | Il n'y a pas de "plan" dans l'app |
| **les 7 étapes** | ~~checklist~~, ~~processus~~ | Inspiré de Luc 14:28-32 |
| **jalon** | ~~tâche~~, ~~milestone~~ (en UI) | Un jalon est daté et lié à un projet |
| **action du jour** | ~~tâche du jour~~, ~~todo~~ | Toujours liée à un jalon |
| **bloc horaire** | ~~événement~~, ~~réunion~~, ~~créneau~~ | Planification des 24h dans la timeline |
| **détour** | ~~échec~~, ~~problème~~ | Le détour ne stoppe pas le voyage |
| **but** | ~~objectif~~, ~~goal~~ (en UI) | Raison d'être permanente |
| **domaine** | ~~catégorie~~, ~~secteur~~ | Sphère de vie |
| **s'engager** | ~~finaliser~~, ~~terminer~~ | Étape 7 — acte de foi |

**Le mot "plan" n'apparaît nulle part dans l'interface, les labels, les messages ou les prompts.**

---

## 2. Règles métier absolues

### 2.1 Espace personnel — général

- **Action → Jalon → Projet → Domaine → But** : chaîne obligatoire. Pas d'action sans jalon.
- **Étapes séquentielles** : step N+1 inaccessible sans valider step N. Retour toujours possible.
- **Projet actif** : `draft` → `active` uniquement quand step 7 validée.
- **7 project_steps** créés automatiquement à la création du projet. Step 1 = `active`, steps 2–7 = `locked`.
- **Auto-save** à chaque frappe dans le wizard (brouillon en IndexedDB).

### 2.2 Time-blocking

- Durée minimum : **15 minutes** par bloc
- **Pas de chevauchement** sur la même journée (validation dans `timeBlockValidator.ts`)
- Un bloc peut exister **sans** être lié à une action
- Cocher une action liée à un bloc → **coche automatiquement le bloc**
- Cocher un bloc dans la revue du soir → `user_profile.total_time_blocks_done++`
- Créer au moins 1 bloc ce matin → `journal_entry.time_blocking_done = true`
- Fenêtre horaire : configurable dans `app_preferences.day_start_hour` / `day_end_hour`
- **Intégré dans la page Aujourd'hui** — pas une page séparée

### 2.3 Module User (user_profile)

- `user_profile` est un **singleton** (`id = 'singleton'`)
- Distinct de `app_preferences` (qui contient uniquement les préférences techniques)
- Statistiques **recalculées** à chaque action significative (cocher, valider, check-in)
- `streak_best` mis à jour si streak actuel > streak_best
- Grade recalculé à chaque check-in
- Bio : optionnelle, **max 160 caractères**
- Avatar : emoji + couleur de fond — **pas de photo** en v1.x
- En v2.0 : la photo OAuth (Google/GitHub) apparaît dans l'espace business uniquement

### 2.4 Score d'attitudes

- Somme des poids = **100** toujours
- Alerte sur 5 jours consécutifs de baisse
- Streak reset après **exactement 2 jours** sans check-in (pas 1, pas 3)
- Score strictement personnel — jamais visible par les collaborateurs business

### 2.5 Grades et streak (cross-espace)

```
master_builder   : streak ≥ 30j ET aucun abandon depuis 90j (perso ou business)
builder_diligent : streak ≥ 14j
planner          : engagement_level ≥ 2
discoverer       : défaut

Perte master_builder : si projet abandonné (perso ou business) → retour builder_diligent
```

**Activité comptant dans le streak :**
- ✅ Check-in d'habitude
- ✅ Valider une étape (perso ou business — l'utilisateur lui-même)
- ✅ Cocher une action du jour
- ✅ Créer au moins 1 bloc horaire (`time_blocking_done = true`)
- ✅ Cocher un bloc comme "respecté" dans la revue du soir
- ❌ Activité des collaborateurs sur un projet business partagé

### 2.6 Espace business

- 1 Owner par projet business
- Editor ne peut pas inviter ni se promouvoir Owner
- Suppression soft : 7 jours, réversible
- L'activité de l'**utilisateur lui-même** dans l'espace business compte dans le streak

### 2.7 Lien perso-business

- Table `personal_business_link` : **jamais synchronisée** vers Supabase
- Un projet business lié compte comme +1 dans `domain.health_status`
- Supprimé localement si le projet business est supprimé

### 2.8 Détours systémiques

- Signal si même obstacle ≥ 3 fois sur projets différents (cross-espace)
- **Toujours une suggestion** — l'utilisateur confirme avant tout
- Si confirmé : habitude corrective créée automatiquement

---

## 3. Architecture des données — Dexie v3

```typescript
// src/db/schema.ts

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

// Version 2 — Lien perso-business (v2.0)
db.version(2).stores({
  // ... toutes les tables v1
  personal_business_link: 'id, goal_id, domain_id',
})

// Version 3 — Time-blocking + User profile (v1.2)
db.version(3).stores({
  // ... toutes les tables v2
  time_block:   'id, date, start_time, action_id, done',  // NOUVEAU
  user_profile: 'id',                                       // NOUVEAU
}).upgrade(async tx => {
  // Migrer app_preferences → user_profile
  // Voir DATABASE_v1_2.md section 3 pour le code complet
})

// RÈGLE : ne jamais supprimer une version — toujours empiler
```

**Tables principales :**
`goal` · `domain` · `project` · `project_step` · `milestone` · `action` · **`time_block`** · `detour` · `journal_entry` · `habit` · `habit_check` · **`user_profile`** · `personal_business_link` · `app_preferences` · `backup_meta`

---

## 4. Design System — tokens de référence

utiliser le skill frontend-design

### 4.1 Couleurs (CSS variables — dark mode par défaut)

```css
--bg:        #0F0E0D;   /* Fond principal */
--sidebar:   #141312;
--surface:   #1C1B18;   /* Cartes */
--surface-2: #242320;   /* Inputs, cartes imbriquées */
--border:    #2A2824;
--text-1:    #F0EDE6;
--text-2:    #8A8780;
--text-3:    #4A4845;
--gold:      #C49A3C;   /* CTA, grades */
--gold-soft: #E8C96A;
--gold-pale: rgba(196,154,60,0.12);
--green:     #5A9E6F;
--amber:     #D4854A;
--coral:     #E07070;
--blue:      #5B9BD4;
--purple:    #7B6FD4;   /* Accent espace PERSO */
--teal:      #2DA58A;   /* Accent espace BUSINESS */
```

### 4.2 Couleurs des 7 étapes

```css
--step-1: #7B6FD4;  /* Vision */
--step-2: #5B9BD4;  /* S'arrêter */
--step-3: #2DA58A;  /* Estimer/SWOT */
--step-4: #D4854A;  /* Coût */
--step-5: #5A9E6F;  /* Calculer */
--step-6: #E07070;  /* Vérifier */
--step-7: #C49A3C;  /* S'engager */
```

### 4.3 Couleurs des blocs horaires (time-blocking)

```css
/* Catégories — utilisées si pas d'action liée */
work:     var(--purple)
spiritual: var(--gold)
family:   var(--green)
health:   var(--teal)
rest:     var(--blue)
free:     var(--surface-2)

/* Priorité de résolution de couleur d'un bloc :
   1. color_override (si défini)
   2. Couleur du domaine de l'action liée
   3. Couleur de la catégorie
   4. --surface-2 par défaut */
```

### 4.4 Typographie

- **UI** : Inter (400, 500, 600, 700)
- **Titres éditoriaux** : Fraunces (400, 600) — mission de vie, grade
- **Jamais** Playfair Display, **jamais** DM Sans

---

## 5. Structure des dossiers

```
destinyplanner/
├── CLAUDE.md
├── docs/
│   ├── CDC_v2_2.md
│   ├── ARCHITECTURE_v1_2.md
│   ├── DATABASE_v1_2.md
│   └── DESIGN.html et DestinyPlanner_Design_v2_1.md   
|
├── src/
│   ├── db/
│   │   ├── schema.ts              (3 versions Dexie)
│   │   ├── migrations.ts
│   │   ├── seeds.ts
│   │   └── supabase-schema.sql
│   ├── stores/
│   │   ├── useGoalStore.ts
│   │   ├── useDomainStore.ts
│   │   ├── useProjectStore.ts
│   │   ├── useMilestoneStore.ts
│   │   ├── useActionStore.ts
│   │   ├── useTimeBlockStore.ts   ← time-blocking
│   │   ├── useJournalStore.ts
│   │   ├── useHabitStore.ts
│   │   ├── useDetourStore.ts
│   │   ├── useUserStore.ts        ← profil + stats + grade
│   │   └── useAppStore.ts         ← préférences techniques
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Goal.tsx
│   │   ├── Domains.tsx
│   │   ├── ProjectList.tsx
│   │   ├── ProjectDetail.tsx
│   │   ├── ProjectWizard.tsx
│   │   ├── Today.tsx              ← timeline time-blocking intégrée
│   │   ├── Journal.tsx
│   │   ├── Profile.tsx            ← page Profil utilisateur
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── wizard/                ← Step1Vision.tsx ... Step7Commit.tsx
│   │   ├── project/
│   │   ├── today/
│   │   │   ├── TimelineView.tsx   ← timeline 24h scrollable
│   │   │   ├── TimeBlockCard.tsx  ← bloc horaire individuel
│   │   │   └── ActionList.tsx
│   │   ├── journal/
│   │   │   ├── MorningRoutine.tsx ← widget planification 24h
│   │   │   └── EveningReview.tsx  ← revue blocs horaires
│   │   ├── profile/
│   │   │   ├── StatCard.tsx
│   │   │   ├── GradeBadge.tsx
│   │   │   └── AvatarPicker.tsx
│   │   └── shared/
│   ├── services/
│   │   ├── backup.ts
│   │   ├── score.ts
│   │   ├── domainHealth.ts
│   │   ├── detourAnalysis.ts
│   │   ├── timeBlockValidator.ts  ← validation chevauchements
│   │   ├── userStats.ts           ← recalcul stats profil
│   │   └── content.ts
│   ├── workers/
│   │   └── scoreWorker.ts
│   ├── types/index.ts
│   └── constants/
│       ├── verses.ts
│       └── quotes.ts
└── supabase/
```

---

## 6. Ce qu'on n'implémente PAS en v1.x

- Partage de projets perso via Supabase (perso reste 100% local)
- Compte utilisateur pour l'espace perso (aucun compte requis)
- Photo de profil (en v1.x — seulement emoji + couleur)
- Quick capture (reporté à v2.5+)

---

## 7. Références rapides

| Besoin | Fichier |
|---|---|
| Règles métier complètes | `docs/CDC_v2_2.md` |
| Schéma BDD Dexie complet + migrations | `docs/DATABASE_v1_2.md` |
| Tokens CSS, composants, animations | `docs/DESIGN_v2_0.md` |
| Architecture, flux de données | `docs/ARCHITECTURE_v1_2.md` |
| Versets (15) avec step_affinity | `src/constants/verses.ts` |
| Citations Munroe (26) avec tone | `src/constants/quotes.ts` |

---

*CLAUDE.md — DestinyPlanner — Avril 2026*
*Référence v2 : time-blocking + module User ajoutés*
