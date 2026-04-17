# DestinyPlanner — Architecture technique v2.2

**Version** : 2.2 — Avril 2026

> Couvre l'état réel du code : espace perso offline-first + Supabase sync, espace business collaboratif, IA assistant, saisie vocale, PWA.

---

## 1. Principe architectural central

DestinyPlanner est une application **bi-espace** :

- **Espace personnel** : offline-first, 100% client-side. IndexedDB est la source de vérité locale. Depuis v2.0, un sync cloud optionnel (Supabase) s'active après connexion OAuth.
- **Espace business** : cloud-first via Supabase (Postgres + RLS). Cache IndexedDB pour lecture offline. Écriture optimiste avec file de mutations replay.

```
Navigateur de l'utilisateur
│
├── Application React (SPA)
│     ├── UI Components (pages, shared, business, wizard, profile…)
│     ├── State Management (Zustand — 19 stores)
│     ├── Services (sync, score, AI, backup…)
│     └── Business Logic
│
├── Couche de persistance locale (Dexie v5)
│     ├── IndexedDB  — données perso + cache business
│     ├── OPFS       — backup résilient (survit au nettoyage cache)
│     └── JSON file  — backup hebdomadaire (chaque dimanche)
│
└── Supabase (cloud — v2.0+)
      ├── Auth         — OAuth Google + GitHub
      ├── Postgres     — tables perso (sync) + tables business (source vérité)
      ├── RLS          — Row Level Security par user_id / rôle
      └── Edge Functions (Deno)
            ├── ai-chat     — proxy Groq Llama 3.3 70B
            └── push-notify — notifications push VAPID
```

---

## 2. Stack technique

| Couche | Technologie | Version |
|---|---|---|
| Framework UI | React + TypeScript strict | 18.3.1 / 5.5.4 |
| Build | Vite | 5.4.8 |
| State global | Zustand | 4.5.5 |
| Routing | React Router v6 | 6.26.2 |
| Persistance locale | Dexie.js (IndexedDB) | 3.2.7 — schema v5 |
| Persistance cloud | Supabase | 2.103.0 |
| Charts | Recharts | 2.12.7 |
| Icons | Lucide React | 0.441.0 |
| Dates | date-fns | 3.6.0 |
| PWA | vite-plugin-pwa + Workbox | 1.2.0 |
| Déploiement | Vercel (SPA avec vercel.json) | — |

**Bundle cible** : < 300 KB gzippé (v1.x) · < 350 KB (v2.0+ avec Supabase)

---

## 3. Structure des dossiers

```
destinyplanner/
├── docs/
├── public/
│   └── manifest.json
│
├── src/
│   ├── main.tsx
│   ├── App.tsx                         (routes, seeds, auth init, sync)
│   │
│   ├── db/
│   │   ├── schema.ts                   (Dexie — 5 versions empilées)
│   │   ├── migrations.ts               (v1→v5 : migrations Dexie)
│   │   ├── seeds.ts                    (6 domaines + singletons initiaux)
│   │   └── supabase-schema.sql         (schema Supabase — perso + business)
│   │
│   ├── stores/                         (19 stores Zustand)
│   │   ├── — Espace perso —
│   │   ├── useGoalStore.ts
│   │   ├── useDomainStore.ts
│   │   ├── useProjectStore.ts
│   │   ├── useProjectStepStore.ts
│   │   ├── useMilestoneStore.ts
│   │   ├── useActionStore.ts
│   │   ├── useTimeBlockStore.ts
│   │   ├── useJournalStore.ts
│   │   ├── useHabitStore.ts
│   │   ├── useDetourStore.ts
│   │   ├── useUserStore.ts             (profil, stats, grade)
│   │   ├── useAppStore.ts              (préférences techniques)
│   │   ├── — Espace business —
│   │   ├── useBusinessStore.ts         (projets, étapes, jalons — write optimiste)
│   │   ├── useCommentsStore.ts
│   │   ├── useMembersStore.ts
│   │   ├── useBusinessDetourStore.ts
│   │   ├── useCommunityTemplatesStore.ts
│   │   ├── — Transverse —
│   │   ├── useAuthStore.ts             (Supabase Auth — user, session, OAuth)
│   │   ├── usePersonalBusinessLinkStore.ts
│   │   └── useAssistantStore.ts        (fil chat IA, isLoading, actions)
│   │
│   ├── pages/                          (18 routes + RootRedirect)
│   │   ├── Login.tsx
│   │   ├── Onboarding.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Today.tsx
│   │   ├── ProjectList.tsx
│   │   ├── ProjectDetail.tsx
│   │   ├── ProjectWizard.tsx
│   │   ├── Journal.tsx
│   │   ├── Goal.tsx
│   │   ├── Domains.tsx
│   │   ├── Profile.tsx
│   │   ├── Settings.tsx
│   │   ├── Analytics.tsx
│   │   ├── Business.tsx
│   │   ├── BusinessDetail.tsx
│   │   ├── BusinessWizard.tsx
│   │   ├── CommunityTemplates.tsx
│   │   └── InviteAccept.tsx
│   │
│   ├── components/
│   │   ├── shared/
│   │   │   ├── Layout.tsx              (Sidebar + BottomNav + AssistantWidget)
│   │   │   ├── Sidebar.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── DestinyTree.tsx
│   │   │   ├── EngagementPrompt.tsx
│   │   │   ├── AssistantWidget.tsx     (bouton flottant)
│   │   │   ├── AssistantPanel.tsx      (fil chat + micro)
│   │   │   ├── PersonalBusinessLinkManager.tsx
│   │   │   ├── TutorialModal.tsx
│   │   │   ├── VerseCard.tsx
│   │   │   └── QuoteCard.tsx
│   │   ├── business/
│   │   │   ├── BusinessProjectCard.tsx
│   │   │   ├── BusinessDetourLog.tsx
│   │   │   ├── CommentThread.tsx
│   │   │   ├── MentionInput.tsx
│   │   │   ├── InviteModal.tsx
│   │   │   ├── MembersPanel.tsx
│   │   │   ├── TemplateSelector.tsx
│   │   │   └── WhoDoesWhat.tsx
│   │   ├── wizard/                     (Step1Vision … Step7Commit — perso + business)
│   │   ├── project/
│   │   ├── today/                      (TimelineView, TimeBlockCard, ActionList)
│   │   ├── journal/                    (MorningRoutine, EveningReview)
│   │   └── profile/                   (StatCard, GradeBadge, AvatarPicker)
│   │
│   ├── services/
│   │   ├── personalSyncService.ts      (pull/push Supabase ↔ IndexedDB, queue offline)
│   │   ├── personalMigration.ts        (copie locale → Supabase au 1er SIGNED_IN)
│   │   ├── mutationQueue.ts            (file mutations business, replay offline)
│   │   ├── aiActionParser.ts           (parse réponse IA, exécute actions in-app)
│   │   ├── aiContextBuilder.ts         (contexte utilisateur pour IA)
│   │   ├── backup.ts
│   │   ├── score.ts
│   │   ├── domainHealth.ts
│   │   ├── detourAnalysis.ts
│   │   ├── timeBlockValidator.ts
│   │   ├── userStats.ts
│   │   ├── notifications.ts
│   │   ├── pushSubscription.ts
│   │   └── pdf.ts
│   │
│   ├── hooks/
│   │   └── useSpeechRecognition.ts     (Web Speech API — saisie vocale assistant)
│   │
│   ├── workers/
│   │   └── scoreWorker.ts             (calcul score si > 365 habit_checks)
│   │
│   ├── types/index.ts
│   ├── constants/
│   │   ├── verses.ts
│   │   └── quotes.ts
│   └── styles/
│
└── supabase/
    ├── config.toml
    └── functions/
        ├── ai-chat/index.ts            (proxy Groq Llama 3.3 70B — Deno)
        └── push-notify/index.ts        (web-push VAPID — Deno)
```

---

## 4. Flux de données

### 4.1 Flux perso — persistance et sync

```
Action utilisateur (UI)
        │
        ▼
Store Zustand (write immédiat)
        │
        ├─ IndexedDB (Dexie) ← source locale principale
        │
        └─ personalSyncService.ts
              │
              ├─ [connecté] Push immédiat → Supabase (table personal_*)
              └─ [offline]  Enqueue → queue localStorage
                                  → Replay auto à reconnexion (MAX_ATTEMPTS=5)

Au login (SIGNED_IN) :
  1. personalMigration.ts : copie IndexedDB → Supabase (migration one-shot)
  2. personalSyncService.pull() : tire les données Supabase → IndexedDB
```

### 4.2 Flux business — write optimiste

```
Action utilisateur (UI)
        │
        ▼
useBusinessStore (état Zustand — mise à jour immédiate)
        │
        ├─ [connecté] → Supabase (écriture réelle)
        └─ [offline]  → mutationQueue.ts (localStorage)
                              → Replay auto à reconnexion
                              → Cache business_project_cache (lecture offline)
```

### 4.3 IA Assistant

```
Utilisateur saisit un message (texte ou vocal)
        │
        ├─ [vocal] useSpeechRecognition.ts (Web Speech API)
        │           → transcript injecté dans la textarea
        │
        ▼
useAssistantStore.sendMessage(text)
        │
        ├─ aiContextBuilder.ts → snapshot données utilisateur (IndexedDB + Supabase)
        │
        ▼
supabase.functions.invoke('ai-chat')
        │
        ▼
Supabase Edge Function (Deno)
  → System prompt : contexte utilisateur + règles vocabulaire
  → Groq API (Llama 3.3 70B) → réponse JSON {message, action?}
        │
        ▼
aiActionParser.ts → exécute action si type ≠ 'none'
  Actions disponibles : add_milestone, add_action, add_time_block,
                        add_domain, add_detour, add_habit
```

### 4.4 Création d'un projet (inchangé)

```
Sélection domaine → ProjectWizard (7 étapes séquentielles)
Chaque étape : auto-save → IndexedDB
Étape 7 complétée → projet 'draft' → 'active', jalons créés depuis étape 5
```

### 4.5 Time-blocking (inchangé)

```
Routine matin → création blocs horaires
→ timeBlockValidator.ts (min 15min, pas chevauchement, fenêtre jour)
→ IndexedDB (time_block)
→ Timeline 24h (Today.tsx)
Revue soir → blocs cochés → total_time_blocks_done++
```

### 4.6 Persistance perso — 4 couches (inchangé)

```
1. IndexedDB (Dexie — immédiat)
2. OPFS (après chaque write important — survit nettoyage cache)
3. Auto-backup JSON (chaque dimanche) → Downloads
4. Restauration auto si IndexedDB vide + OPFS existe
```

---

## 5. Stores Zustand — 19 stores

### Espace personnel

| Store | Rôle | Source de vérité |
|---|---|---|
| `useGoalStore` | But de vie (singleton) | IndexedDB → Supabase |
| `useDomainStore` | 6 domaines défaut + custom | IndexedDB → Supabase |
| `useProjectStore` | Projets perso + statuts | IndexedDB → Supabase |
| `useProjectStepStore` | 7 étapes par projet | IndexedDB → Supabase |
| `useMilestoneStore` | Jalons avec due_dates | IndexedDB → Supabase |
| `useActionStore` | Actions du jour (liées jalons) | IndexedDB → Supabase |
| `useTimeBlockStore` | Blocs horaires 24h | IndexedDB → Supabase |
| `useJournalStore` | Entrées quotidiennes | IndexedDB → Supabase |
| `useHabitStore` | Habitudes avec poids | IndexedDB → Supabase |
| `useDetourStore` | Obstacles documentés | IndexedDB → Supabase |
| `useUserStore` | Profil, stats, grade | IndexedDB → Supabase |
| `useAppStore` | Préférences techniques | IndexedDB → Supabase |

### Espace business

| Store | Rôle | Source de vérité |
|---|---|---|
| `useBusinessStore` | Projets, étapes, jalons — write optimiste | Supabase + cache IndexedDB |
| `useCommentsStore` | Fil commentaires par étape/jalon | Supabase (online only) |
| `useMembersStore` | Membres, invitations, tokens 7j | Supabase (online only) |
| `useBusinessDetourStore` | Détours business | Supabase |
| `useCommunityTemplatesStore` | Cache templates community | Supabase |

### Transverse

| Store | Rôle | Source de vérité |
|---|---|---|
| `useAuthStore` | User, session OAuth, signIn/Out | Supabase Auth |
| `usePersonalBusinessLinkStore` | Lien local perso ↔ business (jamais sync) | IndexedDB uniquement |
| `useAssistantStore` | Fil chat IA, isOpen, isLoading | Session locale + Edge Function |

---

## 6. Supabase Edge Functions

### `ai-chat` (Deno)

- **Input** : `{ messages: Message[], context: string }`
- **Traitement** : inject contexte dans system prompt → appel Groq API (Llama 3.3 70B) → réponse JSON forcée
- **Output** : `{ message: string, action?: AIAction }`
- **Actions supportées** : `add_milestone | add_action | add_time_block | add_domain | add_detour | add_habit | none`
- **Règles** : français obligatoire, vocabulaire strict, refuse création/modification projets (wizard obligatoire)

### `push-notify` (Deno)

- **Input** : `{ userId: string, title: string, body: string }`
- **Traitement** : lit `user_push_subscriptions` → envoie web-push VAPID
- **Utilisation** : alertes score, rappels deadline, suggestions engagement

---

## 7. Module IA Assistant + Saisie vocale

### AssistantPanel + AssistantWidget

Panneau latéral (340px) accessible via bouton flottant. Fil de chat avec historique de session.

**Saisie** : textarea (texte manuel) + bouton micro (saisie vocale).

**Saisie vocale** (`useSpeechRecognition.ts`) :
- Web Speech API native (Chrome, Edge, Safari 14.1+)
- 0€, zéro backend
- Transcript injecté dans la textarea → utilisateur relit/corrige → envoie
- Bouton grisé automatiquement si navigateur non supporté (Firefox desktop)
- Gestion erreurs : permission refusée, pas de son détecté

**Badges de résultat** : après chaque action IA, un badge inline indique succès/échec avec label.

---

## 8. Module Time-blocking (inchangé — v1.2)

Se référer au document v1.2 pour le détail complet de la logique de validation, de la couleur des blocs et de l'intégration dans la page Aujourd'hui. L'implémentation est stable depuis v1.2.

---

## 9. Module User — Profil (inchangé — v1.2)

Se référer au document v1.2 pour la logique de grade, les statistiques calculées et la structure du profil. L'implémentation est stable depuis v1.2.

---

## 10. Parcours 7 étapes — navigation (inchangé)

```typescript
type StepStatus = 'locked' | 'active' | 'completed'
// Step 1 = active à la création. Step N+1 passe active quand Step N completed.
// Retour toujours possible sur une step completed.
// Auto-save à chaque frappe.
```

---

## 11. Score d'attitudes (inchangé)

```
Score du jour = sum(habit.weight pour chaque habit_check.done = true)
Score 7j      = avg(score_cache last 7 journal_entries)
Score 30j     = avg(score_cache last 30 journal_entries) → user_profile.score_average_30d
Alerte        : 5 jours consécutifs de baisse → notification locale
Streak reset  : après exactement 2 jours sans check-in
Web Worker    : si habit_check > 365 entrées (v1.5)
```

---

## 12. Arbre de la Destinée (inchangé)

```typescript
interface DomainHealth {
  domainId: string
  activeProjects: number    // perso actifs + business liés (lien local)
  pausedProjects: number
  status: 'healthy' | 'dry' | 'overloaded' | 'dormant'
}
```

---

## 13. Routes — 18 pages + RootRedirect

| Page | Route | Auth requise |
|---|---|---|
| Login | `/login` | Non |
| Onboarding | `/onboarding` | Oui |
| Dashboard | `/dashboard` | Oui |
| Aujourd'hui | `/today` | Oui |
| Projets | `/projects` | Oui |
| Nouveau projet | `/projects/new` | Oui |
| Détail projet | `/projects/:id` | Oui |
| Wizard projet | `/projects/:id/wizard` | Oui |
| Journal | `/journal` | Oui |
| But | `/goal` | Oui |
| Domaines | `/domains` | Oui |
| Profil | `/profile` | Oui |
| Paramètres | `/settings` | Oui |
| Analytics | `/analytics` | Oui |
| Business | `/business` | Oui (OAuth) |
| Nouveau projet business | `/business/new` | Oui (OAuth) |
| Détail projet business | `/business/:id` | Oui (OAuth) |
| Wizard business | `/business/:id/wizard` | Oui (OAuth) |
| Templates communautaires | `/community-templates` | Oui (OAuth) |
| Accepter invitation | `/invite/:token` | Non |

**RootRedirect** (`/`) : redirige selon `useAuthStore.user` + `user_profile.onboarding_done`.  
**Lazy loading** : toutes les pages via `React.lazy()` + `Suspense`.

---

## 14. Collaboration business — Rôles et RLS

| Rôle | Voir | Modifier jalons | Commenter | Inviter | Supprimer |
|---|---|---|---|---|---|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editor | ✅ | ✅ | ✅ | ❌ | ❌ |
| Viewer | ✅ | ❌ | ✅ | ❌ | ❌ |

Invitation par token unique (expiration 7j). Suppression soft (7j réversible, Owner uniquement).

---

## 15. Service Worker et PWA

```
Stratégie cache Workbox :
├── App shell (HTML, JS, CSS) → Cache First
├── Versets + citations (statiques) → Cache First
├── Fonts → Cache First
└── Requêtes Supabase → Network First avec fallback cache
```

---

## 16. Contraintes techniques

| Contrainte | Valeur |
|---|---|
| Bundle JS gzippé (v1.x) | < 300 KB |
| Bundle JS gzippé (v2.0+) | < 350 KB |
| First Contentful Paint | < 1.5s |
| Interactions | < 100ms |
| Lighthouse Performance | > 90 |
| Lighthouse Accessibility | > 90 |
| Navigateurs | Chrome 90+, Firefox 88+, Safari 15+, Edge 90+ |
| TypeScript strict | true |
| Tests | Vitest + Testing Library — score, timeBlockValidator, userStats, domainHealth |

---

*DestinyPlanner — Architecture v2.2 — Avril 2026*
