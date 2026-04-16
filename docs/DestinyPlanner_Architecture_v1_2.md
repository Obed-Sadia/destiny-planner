# DestinyPlanner — Architecture technique v1.2

**Version** : 1.2 — Avril 2026

> **v1.2 — 2 ajouts** : module Time-blocking (intégré dans la page Aujourd'hui) et module User (page Profil avec statistiques complètes).

---

## 1. Principe architectural central

DestinyPlanner est une application **offline-first, 100% client-side** pour la v1.x. Aucune donnée ne quitte l'appareil de l'utilisateur. Aucun compte n'est requis. Aucun serveur n'est impliqué avant la v2.0.

```
Navigateur de l'utilisateur
│
├── Application React (SPA)
│     ├── UI Components
│     ├── State Management (Zustand)
│     └── Business Logic
│
└── Couche de persistance locale
      ├── IndexedDB  (données principales — via Dexie.js)
      ├── OPFS       (backup résilient — survit au nettoyage de cache)
      └── JSON file  (backup hebdomadaire téléchargé — chaque dimanche)
```

---

## 2. Stack technique

| Couche | Technologie | Raison du choix |
|---|---|---|
| Framework UI | React 18 + TypeScript | Composants réutilisables, typage fort |
| Build tool | Vite | Build rapide, HMR, optimisation bundle |
| State global | Zustand | Léger, sans boilerplate Redux |
| Routing | React Router v6 | Standard, lazy loading des routes |
| Persistance | Dexie.js (wrapper IndexedDB) | API simple sur IndexedDB, support migrations |
| OPFS | File System Access API | Survit au nettoyage de cache navigateur |
| PWA | vite-plugin-pwa + Workbox | Offline, install, cache stratégies |
| Charts | Recharts | Score d'attitudes, sparklines, progression |
| Icons | Lucide React | Léger, cohérent |
| Dates | date-fns | Léger, tree-shakeable |
| Licence | MIT | Open source |

**Bundle cible** : < 300 KB gzippé (< 350 KB avec Supabase en v2.0)
**Déploiement** : Vercel ou Netlify (frontend statique, zéro backend)

---

## 3. Structure des dossiers

```
destinyplanner/
├── CLAUDE.md
├── docs/
│   ├── CDC_v2_1.md
│   ├── ARCHITECTURE_v1_2.md
│   ├── DATABASE_v1_2.md
│   └── DESIGN_v2_0.md
│
├── public/
│   ├── manifest.json
│   └── sw.js
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   │
│   ├── db/
│   │   ├── schema.ts              (Dexie — 3 versions empilées)
│   │   ├── migrations.ts
│   │   ├── seeds.ts
│   │   └── supabase-schema.sql    (v2.0)
│   │
│   ├── stores/
│   │   ├── useGoalStore.ts
│   │   ├── useDomainStore.ts
│   │   ├── useProjectStore.ts
│   │   ├── useMilestoneStore.ts
│   │   ├── useActionStore.ts
│   │   ├── useTimeBlockStore.ts   ← NOUVEAU
│   │   ├── useJournalStore.ts
│   │   ├── useHabitStore.ts
│   │   ├── useDetourStore.ts
│   │   ├── useUserStore.ts        ← NOUVEAU (user_profile)
│   │   └── useAppStore.ts         (app_preferences techniques)
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Goal.tsx
│   │   ├── Domains.tsx
│   │   ├── ProjectList.tsx
│   │   ├── ProjectDetail.tsx
│   │   ├── ProjectWizard.tsx
│   │   ├── Today.tsx              ← contient le time-blocking
│   │   ├── Journal.tsx
│   │   ├── Profile.tsx            ← NOUVEAU (page Profil utilisateur)
│   │   └── Settings.tsx
│   │
│   ├── components/
│   │   ├── wizard/
│   │   │   ├── Step1Vision.tsx ... Step7Commit.tsx
│   │   ├── project/
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── MilestoneList.tsx
│   │   │   ├── DetourLog.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── today/
│   │   │   ├── TimelineView.tsx   ← NOUVEAU — timeline 24h scrollable
│   │   │   ├── TimeBlockCard.tsx  ← NOUVEAU — bloc horaire individuel
│   │   │   └── ActionList.tsx
│   │   ├── journal/
│   │   │   ├── MorningRoutine.tsx ← contient le widget time-blocking matin
│   │   │   └── EveningReview.tsx  ← affiche les blocs du jour pour revue
│   │   ├── profile/
│   │   │   ├── StatCard.tsx       ← NOUVEAU — carte statistique
│   │   │   ├── GradeBadge.tsx     ← NOUVEAU — badge de grade
│   │   │   └── AvatarPicker.tsx   ← NOUVEAU — sélection emoji + couleur
│   │   └── shared/
│   │       ├── VerseCard.tsx
│   │       ├── QuoteCard.tsx
│   │       └── EngagementPrompt.tsx
│   │
│   ├── services/
│   │   ├── backup.ts
│   │   ├── notifications.ts
│   │   ├── content.ts
│   │   ├── score.ts
│   │   ├── domainHealth.ts
│   │   ├── detourAnalysis.ts
│   │   ├── timeBlockValidator.ts  ← NOUVEAU — validation chevauchements
│   │   └── userStats.ts           ← NOUVEAU — calcul stats profil
│   │
│   ├── workers/
│   │   └── scoreWorker.ts         (v1.5)
│   │
│   ├── types/index.ts
│   └── constants/
│       ├── verses.ts
│       └── quotes.ts
│
├── supabase/                      (v2.0)
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Flux de données

### 4.1 Création d'un projet (flux principal)

```
Utilisateur clique "Nouveau projet"
        │
        ▼
Sélectionne un domaine
        │
        ▼
ProjectWizard.tsx s'ouvre — Étape 1 (status: active)
        │
        ▼
Chaque étape validée → écrite en IndexedDB
Step N complétée → Step N+1 passe de locked à active
        │
        ▼
Étape 7 complétée → projet passe en statut "actif"
Jalons générés depuis les données de l'étape 5
        │
        ▼
Projet visible dans ProjectList.tsx et Dashboard.tsx
```

### 4.2 Action du jour (flux tracé)

```
Utilisateur crée une action dans Today.tsx
        │
        ▼
Obligatoirement liée à un Milestone (sélecteur)
        │
        ▼
Action visible dans la liste + assignable à un time_block
        │
        ▼
Traçabilité visible : Action → Jalon → Projet → Domaine → But
```

### 4.3 Time-blocking (flux nouveau)

```
Routine matin — widget "Planifier ma journée"
        │
        ▼
Utilisateur crée des blocs horaires (start_time, end_time, title)
        │
        ▼
Validation chevauchement (timeBlockValidator.ts)
Si OK → persiste en IndexedDB
        │
        ▼
Option : lier un bloc à une action existante du jour
         → action.estimated_minutes affiché dans le bloc
         → couleur du domaine de l'action appliquée au bloc
        │
        ▼
Timeline 24h scrollable visible dans Today.tsx
        │
        ▼
Revue du soir → blocs affichés avec toggle "respecté ?" (done)
Cocher un bloc lié à une action → coche aussi l'action
        │
        ▼
user_profile.total_time_blocks_done++ à chaque bloc coché
journal_entry.time_blocking_done = true (si au moins 1 bloc créé le matin)
```

### 4.4 Flux Profil utilisateur (flux nouveau)

```
Données calculées à chaque mise à jour significative
        │
        ▼
useUserStore.ts aggrège depuis IndexedDB :
  - streak (depuis app_preferences cross-espace)
  - total_projects_completed (count projects status='completed')
  - total_actions_done (count actions done=true)
  - total_journal_entries (count journal_entry)
  - total_time_blocks_done (count time_blocks done=true)
  - score_average_30d (avg score_cache last 30 entries)
        │
        ▼
Recalcul du grade (master_builder / builder_diligent / planner / discoverer)
        │
        ▼
Persisté dans user_profile (singleton)
        │
        ▼
Page Profile.tsx affiche les données depuis useUserStore
```

### 4.5 Persistance (4 couches — inchangé)

```
1. IndexedDB (immédiat, via Dexie)
2. OPFS sync (après chaque write important)
3. Auto-backup JSON (chaque dimanche via SW) → Downloads
4. Restauration auto si IndexedDB vide + backup OPFS existe
```

### 4.6 Calcul du score d'attitudes (inchangé)

**v1.0** : synchrone à la volée, mis en cache dans `journal_entry.score_cache`.
**v1.5** : Web Worker si `habit_check` > 365 entrées.

### 4.7 Arbre de la Destinée (inchangé + projets business liés)

```typescript
interface DomainHealth {
  domainId: string
  activeProjects: number    // perso actifs + business liés avec status='active'
  pausedProjects: number
  status: 'healthy' | 'dry' | 'overloaded' | 'dormant'
}
```

---

## 5. Module Time-blocking — logique détaillée

### 5.1 Contraintes de validation

```typescript
// src/services/timeBlockValidator.ts

interface TimeBlock {
  id: string
  date: string        // YYYY-MM-DD
  start_time: string  // HH:MM
  end_time: string    // HH:MM
  title: string
  action_id?: string
  category?: 'work' | 'rest' | 'spiritual' | 'family' | 'health' | 'free'
  done: boolean
}

function validateTimeBlock(
  newBlock: Omit<TimeBlock, 'id'>,
  existingBlocks: TimeBlock[]
): { valid: boolean; error?: string } {
  // Durée minimum : 15 minutes
  // Pas de chevauchement avec les blocs existants du même jour
  // start_time < end_time
  // Horaires dans la fenêtre configurée (day_start_hour → day_end_hour)
}
```

### 5.2 Intégration dans la page Aujourd'hui

La page `Today.tsx` est organisée en deux colonnes (desktop) :

```
[Colonne gauche]                    [Colonne droite]
─────────────────────               ─────────────────────
Routine matin                       Timeline 24h (scrollable)
  · Verset + citation               ─────────────────────
  · Déclaration                     05:00
  · 1 action destinée               06:00  █ Prière 30min ✓
  · [Planifier ma journée →]        07:00  █ Sport 60min ✓
                                    08:00
Actions du jour                     09:00  █ Appeler clients →
  · action-row cochable             10:30
  · traçabilité → jalon             ...
  · [+ Ajouter une action]          [+ Ajouter un bloc]
```

Sur mobile : timeline en bas, accessible via scroll ou onglet dédié dans la vue Aujourd'hui.

### 5.3 Couleur des blocs horaires

```typescript
function resolveBlockColor(block: TimeBlock, projects: Project[], domains: Domain[]): string {
  // 1. color_override si défini par l'utilisateur
  if (block.color_override) return block.color_override

  // 2. Couleur du domaine de l'action liée
  if (block.action_id) {
    const action = getAction(block.action_id)
    const domain = getDomainForAction(action, projects, domains)
    if (domain) return getDomainColor(domain)
  }

  // 3. Couleur de la catégorie
  const categoryColors: Record<string, string> = {
    work:     'var(--purple)',
    rest:     'var(--blue)',
    spiritual:'var(--gold)',
    family:   'var(--green)',
    health:   'var(--teal)',
    free:     'var(--surface-2)',
  }
  if (block.category) return categoryColors[block.category]

  // 4. Défaut
  return 'var(--surface-2)'
}
```

---

## 6. Module User — logique de la page Profil

### 6.1 Stores impliqués

```typescript
// src/stores/useUserStore.ts
interface UserStore {
  profile: UserProfile
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  recalculateStats: () => Promise<void>   // appelé après chaque action significative
  checkAndUpdateGrade: () => Promise<void>
}

// recalculateStats() effectue les jointures suivantes :
// · count projects where status = 'completed'    → total_projects_completed
// · count actions where done = true              → total_actions_done
// · count journal_entries                        → total_journal_entries
// · count time_blocks where done = true          → total_time_blocks_done
// · avg(score_cache) last 30 journal_entries     → score_average_30d
```

### 6.2 Logique de grade

```typescript
function computeGrade(profile: UserProfile): Grade {
  const { streak, last_abandoned_project_date } = profile

  if (streak >= 30) {
    const ninetyDaysAgo = subDays(new Date(), 90)
    const lastAbandoned = last_abandoned_project_date
      ? parseISO(last_abandoned_project_date)
      : null
    if (!lastAbandoned || lastAbandoned < ninetyDaysAgo) {
      return 'master_builder'
    }
  }
  if (streak >= 14) return 'builder_diligent'
  if (profile.engagement_level >= 2) return 'planner'
  return 'discoverer'
}
```

### 6.3 Avatar

L'avatar est composé d'un emoji + une couleur de fond. Pas de photo de profil en v1.x (pas de stockage binaire local prévu). En v2.0, l'avatar OAuth (photo Google/GitHub) est affiché dans l'espace business uniquement.

```typescript
const DEFAULT_AVATAR_EMOJI = '🌟'
const DEFAULT_AVATAR_COLOR = 'var(--gold-pale)'

// Sélecteur d'emoji : grille de 20 emojis prédéfinis
// Couleur de fond : sélecteur parmi les couleurs sémantiques de l'app
```

---

## 7. Parcours des 7 étapes — logique de navigation (inchangé)

```typescript
type StepStatus = 'locked' | 'active' | 'completed'

// Règle : step N est 'active' seulement si step N-1 est 'completed'
// Règle : step 1 est toujours 'active' à la création
// Règle : on peut revenir à n'importe quelle step 'completed'
// Auto-save à chaque frappe
```

---

## 8. Score d'attitudes — calcul (inchangé)

```typescript
// Score du jour = sum(habit.weight for each done habit_check of the day)
// Score 7j = avg(score_cache for last 7 journal_entries)
// Score 30j = avg(score_cache for last 30 journal_entries) → user_profile.score_average_30d
// Alerte : 5 jours consécutifs de baisse → notification locale
// Streak reset : après exactement 2 jours sans check-in
```

---

## 9. Système d'engagement progressif et grades (cross-espace)

```typescript
type EngagementLevel = 1 | 2 | 3
type Grade = 'discoverer' | 'planner' | 'builder_diligent' | 'master_builder'

// Activité comptant dans le streak :
// ✅ Check-in d'habitude
// ✅ Valider une étape de projet (perso ou business — l'utilisateur lui-même)
// ✅ Cocher une action du jour
// ✅ Créer au moins 1 time_block (time_blocking_done = true)
// ✅ Cocher un bloc horaire comme "respecté"
// ❌ Activité des collaborateurs sur un projet business partagé

// Grade Maître Bâtisseur : streak ≥ 30j ET aucun abandon depuis 90j
// Perte : si projet abandonné (perso ou business) → retour Bâtisseur Diligent
```

---

## 10. Service Worker et PWA (inchangé)

```
Stratégie de cache Workbox :
├── App shell (HTML, JS, CSS) → Cache First
├── Versets et citations (statiques) → Cache First
├── Fonts → Cache First
└── Pas de requêtes réseau (app 100% locale en v1.x)
```

---

## 11. Contraintes techniques

| Contrainte | Valeur |
|---|---|
| Bundle JS gzippé (v1.x) | < 300 KB |
| Bundle JS gzippé (v2.0+) | < 350 KB |
| First Contentful Paint | < 1.5s |
| Interactions (réponse UI) | < 100ms |
| Lighthouse Performance | > 90 |
| Lighthouse Accessibility | > 90 |
| Navigateurs | Chrome 90+, Firefox 88+, Safari 15+, Edge 90+ |
| TypeScript strict | true |
| Tests | Vitest + Testing Library — services critiques : score, timeBlockValidator, userStats, domainHealth |

---

## 12. V2.0 — Extension cloud (Supabase)

Architecture locale inchangée. L'espace business s'appuie sur Supabase + RLS. Le lien perso-business est stocké uniquement en local (`personal_business_link`). En v2.0, la page Profil affiche le compte Supabase connecté et les options OAuth.

---

*DestinyPlanner — Architecture v1.2 — Avril 2026*
