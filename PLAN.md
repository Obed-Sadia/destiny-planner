se# Plan d'implémentation — DestinyPlanner (Roadmap complète)

## Contexte

DestinyPlanner est une application de planification de vie inspirée des 7 principes de Myles Munroe (Luc 14:28-32). Projet greenfield — aucun code existant. La documentation est complète (CDC, architecture, base de données, design system). L'objectif est d'implémenter le projet entier, de la phase MVP jusqu'à la v2.1+, en suivant la roadmap officielle des 8 phases.

**Contraintes absolues à respecter à chaque session :**
- Vocabulaire strict (projet, jalon, action du jour, bloc horaire, détour, but, domaine, s'engager)
- TypeScript strict partout
- Offline-first jusqu'à la v2.0 (100% local, IndexedDB via Dexie)
- Bundle < 300 KB gzippé (v1.x), < 350 KB (v2.0+)
- Dark mode par défaut, tokens CSS définis dans CLAUDE_v2.md
- Skill `frontend-design` à activer pour tout travail sur l'UI

---

## Phase 1 — MVP Perso (Semaines 1–4)

### Objectif
Permettre à un utilisateur de créer son but de vie, ses domaines, et traverser le parcours des 7 étapes d'un premier projet. Persistance IndexedDB complète.

### Sessions de travail

#### Session 1 — Scaffolding + Design System
**Fichiers créés :**
- `package.json` — dépendances : react 18, typescript, vite, zustand, dexie, react-router-dom v6, lucide-react, date-fns, recharts
- `vite.config.ts`
- `tsconfig.json` (strict: true)
- `src/main.tsx`, `src/App.tsx`
- `index.html`
- `src/styles/tokens.css` — toutes les CSS variables du design system (CLAUDE_v2.md §4)
- `src/styles/global.css` — reset, typographies Inter + Fraunces (Google Fonts)
- `src/types/index.ts` — tous les types TypeScript pour les 15 tables

**Résultat attendu :** app vide qui démarre, design tokens disponibles, types compilés.

#### Session 2 — Base de données Dexie (v1 + v3)
**Fichiers créés :**
- `src/db/schema.ts` — les 3 versions Dexie empilées (v1, v2, v3 avec migration)
- `src/db/seeds.ts` — 6 domaines par défaut + singleton `app_preferences` + singleton `user_profile`
- `src/db/migrations.ts` — logique de migration v2→v3 (app_preferences → user_profile)

**Règle :** le schéma Dexie v3 est implémenté dès le début (pas de migration ultérieure nécessaire). Code de migration issu exactement du fichier `docs/DestinyPlanner_BaseDeDonnees_v1_2.md §3`.

#### Session 3 — Stores Zustand (couche métier)
**Fichiers créés (11 stores) :**
- `src/stores/useGoalStore.ts`
- `src/stores/useDomainStore.ts`
- `src/stores/useProjectStore.ts` — inclut création auto des 7 `project_step` (step 1 active, 2–7 locked)
- `src/stores/useMilestoneStore.ts`
- `src/stores/useActionStore.ts`
- `src/stores/useTimeBlockStore.ts` — inclut validation chevauchement via `timeBlockValidator`
- `src/stores/useJournalStore.ts`
- `src/stores/useHabitStore.ts`
- `src/stores/useDetourStore.ts`
- `src/stores/useUserStore.ts` — recalculateStats(), checkAndUpdateGrade()
- `src/stores/useAppStore.ts`

**Fichiers créés (services) :**
- `src/services/timeBlockValidator.ts` — validation chevauchement 15 min min (code dans `docs/Architecture §5.1`)
- `src/services/score.ts` — calcul score attitudes, streak, alerte 5j baisse
- `src/services/userStats.ts` — recalcul stats profil (code dans `docs/Architecture §6.1`)
- `src/services/domainHealth.ts` — calcul statut sain/desséché/surchargé/endormi

#### Session 4 — Constantes spirituelles
**Fichiers créés :**
- `src/constants/verses.ts` — 15 versets avec `step_affinity`, `reflection_prompt`
- `src/constants/quotes.ts` — 25 citations Munroe + 2 externes avec `theme`, `step_affinity`, `tone`

#### Session 5 — Layout + Navigation + Onboarding
**Fichiers créés :**
- `src/components/shared/Sidebar.tsx` — sidebar 200px fixe (desktop) avec 6 sections
- `src/components/shared/BottomNav.tsx` — barre inférieure mobile (5 onglets)
- `src/components/shared/Layout.tsx`
- `src/pages/Onboarding.tsx` — 3 écrans : "La tour" → Prénom → Niveau d'engagement
- Routing React Router v6 dans `App.tsx` avec lazy loading

#### Session 6 — Modules But de vie + Domaines
**Fichiers créés :**
- `src/pages/Goal.tsx` — saisie mission, vision 10 ans, 3 valeurs
- `src/pages/Domains.tsx` — liste des 6 domaines + domaines personnalisés

#### Session 7 — Wizard des 7 étapes (composants)
**Fichiers créés :**
- `src/pages/ProjectWizard.tsx` — orchestrateur du wizard
- `src/components/wizard/Step1Vision.tsx` — titre, description, image de réussite
- `src/components/wizard/Step2Stop.tsx` — réflexion conviction/impulsion
- `src/components/wizard/Step3SWOT.tsx` — Forces/Faiblesses/Opportunités/Menaces
- `src/components/wizard/Step4Cost.tsx` — coût financier, temps, énergie, relations
- `src/components/wizard/Step5Calculate.tsx` — budget, durée, jalons datés
- `src/components/wizard/Step6Verify.tsx` — ressources vs besoins, décision go/no-go
- `src/components/wizard/Step7Commit.tsx` — critères de succès, KPIs, engagement écrit
- `src/components/shared/VerseCard.tsx`, `src/components/shared/QuoteCard.tsx`

**Règles wizard :**
- Auto-save à chaque frappe (debounce 300ms → Dexie)
- Étape N+1 inaccessible si N non complétée
- Retour toujours possible
- Projet passe draft → active à la validation de l'étape 7
- Jalons générés depuis les données de l'étape 5

#### Session 8 — Liste projets + Détail projet
**Fichiers créés :**
- `src/pages/ProjectList.tsx`
- `src/pages/ProjectDetail.tsx`
- `src/components/project/ProjectCard.tsx`
- `src/components/project/MilestoneList.tsx`
- `src/components/project/ProgressBar.tsx`

---

## Phase 2 — V1.0 Perso (Semaines 5–8)

### Objectif
Dashboard complet avec Arbre de la Destinée, journal quotidien (matin + soir), score d'attitudes pondéré, module détours.

#### Session 9 — Dashboard + Arbre de la Destinée
**Fichiers créés/modifiés :**
- `src/pages/Dashboard.tsx` — métriques, Arbre de la Destinée, accès rapide
- `src/components/shared/DestinyTree.tsx` — vue graphique des domaines (sain/desséché/surchargé/endormi)
- `src/services/domainHealth.ts` — complet avec projets business liés

Couleurs de santé issues du `docs/Design §2.7`.

#### Session 10 — Module Habitudes + Score d'attitudes
**Fichiers créés :**
- `src/pages/Settings.tsx` — gestion des habitudes (poids, fréquence), préférences
- Composants de scoring dans Journal (score glissant 7j, alerte 5j baisse)

**Règle :** somme des poids = 100 toujours. Alerte si 5j consécutifs de baisse.

#### Session 11 — Journal quotidien
**Fichiers créés :**
- `src/pages/Journal.tsx`
- `src/components/journal/MorningRoutine.tsx` — verset, citation, déclaration, 1 action destinée
- `src/components/journal/EveningReview.tsx` — bilan, détours, leçons, score

#### Session 12 — Module Détours
**Fichiers créés :**
- `src/components/project/DetourLog.tsx`
- `src/services/detourAnalysis.ts` — détection systémique (même obstacle ≥ 3 projets)

**Règle :** détour systémique déclenche suggestion d'habitude corrective (jamais automatique — l'utilisateur confirme).

#### Session 13 — Aujourd'hui v1 (actions du jour)
**Fichiers créés :**
- `src/pages/Today.tsx` — version initiale (sans timeline time-blocking)
- `src/components/today/ActionList.tsx`

Traçabilité obligatoire : action → jalon → projet → domaine → but.

#### Session 14 — Système d'engagement progressif
**Fichiers modifiés :**
- `src/stores/useUserStore.ts` — ajout logique des 3 niveaux d'engagement
- `src/components/shared/EngagementPrompt.tsx` — suggestion de montée de niveau (jamais imposée)

---

## Phase 3 — V1.2 Perso (Semaines 9–10)

### Objectif
Time-blocking des 24h intégré dans la page Aujourd'hui + module User (profil, stats, grade, avatar).

#### Session 15 — Time-blocking : composants
**Fichiers créés :**
- `src/components/today/TimelineView.tsx` — timeline 24h scrollable (desktop droite, mobile bas)
- `src/components/today/TimeBlockCard.tsx` — bloc horaire individuel avec style `border-left` coloré
- `src/components/journal/MorningRoutine.tsx` — ajout widget "Planifier ma journée"
- `src/components/journal/EveningReview.tsx` — ajout revue des blocs horaires

**Style des blocs :** fond `rgba(couleur, 0.15)`, `border-left: 2px solid rgba(couleur, 0.4)`, `border-radius: 6px`.

**Mise à jour :**
- `src/pages/Today.tsx` — layout 2 colonnes desktop (actions gauche / timeline droite)
- `src/stores/useTimeBlockStore.ts` — CRUD + validation via `timeBlockValidator.ts`

**Règles :**
- Durée min 15 min, pas de chevauchement
- Cocher action → coche le bloc lié automatiquement
- Cocher bloc dans revue → `user_profile.total_time_blocks_done++`
- `journal_entry.time_blocking_done = true` si ≥ 1 bloc créé le matin

#### Session 16 — Module User : page Profil
**Fichiers créés :**
- `src/pages/Profile.tsx`
- `src/components/profile/StatCard.tsx`
- `src/components/profile/GradeBadge.tsx`
- `src/components/profile/AvatarPicker.tsx` — grille 20 emojis + couleurs sémantiques

**Logique de grade** (code dans `docs/Architecture §6.2`) :
```
master_builder   : streak ≥ 30j ET aucun abandon depuis 90j
builder_diligent : streak ≥ 14j
planner          : engagement_level ≥ 2
discoverer       : défaut
```

**Stats affichées :** streak actuel, meilleur streak, projets terminés, actions faites, entrées journal, blocs respectés, score moy. 30j.

**Section Compte business** : boutons OAuth désactivés (v2.0 placeholder).

---

## Phase 4 — V1.5 Perso (Semaines 11–14)

### Objectif
App installable (PWA), résilience des données à 4 couches, notifications locales, export/import, mode clair.

#### Session 17 — PWA + Service Worker
**Fichiers créés/modifiés :**
- `vite.config.ts` — ajout `vite-plugin-pwa`
- `public/manifest.json`
- Configuration Workbox : Cache First pour app shell, fonts, contenu statique

#### Session 18 — Résilience des données (OPFS + backup JSON)
**Fichiers créés :**
- `src/services/backup.ts` — 4 couches : IndexedDB (principal), OPFS (résilient), JSON hebdo (Downloads), restauration auto

**Règles :**
- `navigator.storage.persist()` au premier lancement
- Auto-backup JSON chaque dimanche
- Alerte si backup > 7 jours
- Restauration auto si IndexedDB vide + backup OPFS disponible

#### Session 19 — Notifications locales + Export PDF
**Fichiers créés :**
- `src/services/notifications.ts` — alerte tendancielle attitudes (5j baisse), deadline jalons
- Export PDF (vue projet, journal) via `window.print()` ou bibliothèque légère

**Fichiers modifiés :**
- `src/services/backup.ts` — ajout export/import JSON complet (structure dans `docs/Database §7`)

#### Session 20 — Mode clair + Web Worker score
**Fichiers créés :**
- Variables CSS mode clair dans `src/styles/tokens.css`
- `src/workers/scoreWorker.ts` — calcul score si `habit_check` > 365 entrées

**Fichiers modifiés :**
- `src/stores/useAppStore.ts` — toggle dark/light
- `src/pages/Settings.tsx` — toggle thème

---

## Phase 5 — V2.0 Business MVP (Semaines 15–20)

### Objectif
Espace business collaboratif : Supabase + auth OAuth + projets entrepreneur + 2 templates + rôles + invitation.

#### Session 21 — Setup Supabase
**Fichiers créés :**
- `src/db/supabase-schema.sql` — tables business avec RLS
- `supabase/` — configuration
- Variables d'environnement : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

#### Session 22 — Auth OAuth (Google + GitHub)
**Fichiers créés :**
- `src/stores/useAuthStore.ts` — session Supabase, gestion token
- `src/pages/Profile.tsx` modifié — section "Compte business" active (OAuth)

**Règle :** l'espace perso reste 100% local et ne requiert aucun compte.

#### Session 23 — Espace business : projets + 7 étapes entrepreneur
**Fichiers créés :**
- `src/pages/Business.tsx` — liste projets business (accent teal)
- Wizard des 7 étapes business : prompts entrepreneur (CDC §5.2)
- Sync Supabase (online) + cache local IndexedDB (offline lecture seule)

#### Session 24 — Rôles + Invitation
**Règles :**
- 1 Owner par projet
- Editor : modifier jalons + commenter, pas d'invitation
- Viewer : voir + commenter, pas de modification
- Invitation par lien unique (expiration 7 jours)
- Suppression soft : 7 jours, réversible

#### Session 25 — Templates (2 premiers)
**Templates implémentés :**
1. Lancement de produit/service
2. Création d'entreprise

Chaque template pré-remplit les 7 étapes avec des prompts métier.

---

## Phase 6 — V2.1 Business (Semaines 21–24)

### Objectif
4 templates restants, commentaires contextuels, vue "qui fait quoi", détours business, systémique cross-espace.

#### Session 26 — 4 templates restants
Templates : Investissement immobilier, Partenariat/joint-venture, Levée de fonds, Mission client/prestation.

#### Session 27 — Commentaires contextuels
Fil de commentaires par étape et par jalon, mentions @nom (asynchrones). Tables Supabase + composants React.

#### Session 28 — Vue "qui fait quoi" + notifications business
Vue des jalons par responsable, notifications deadline, invitations.

#### Session 29 — Détours business + systémique cross-espace
Détours visibles par tous les membres du projet.
Détection systémique cross-espace : si `personal_business_link` existe ET même obstacle ≥ 3 projets différents (perso + business).

---

## Phase 7 — V2.5 (Semaines 25–28)

#### Session 30 — Lien perso-business complet
Table `personal_business_link` — stockée uniquement en local, jamais synchronisée.
Contribution au calcul de santé de l'Arbre de la Destinée.

#### Session 31 — Timeline Gantt
Vue Gantt des jalons via Recharts. Accessible depuis ProjectDetail.

#### Session 32 — Analytics + Internationalisation EN
Statistiques d'utilisation (locale, perso uniquement).
`i18n` : architecture prête, traduction EN des labels.

---

## Phase 8 — V3.0 (Après Semaine 28)

- Mode offline business amélioré (sync optimiste)
- Mentions @nom complètes (notifications push)
- PWA push notifications
- Contributions communautaires (templates partagés)

---

## Fichiers critiques par phase

| Phase | Fichiers clés |
|---|---|
| MVP | `src/db/schema.ts`, `src/types/index.ts`, `src/stores/useProjectStore.ts`, `src/components/wizard/Step*.tsx` |
| V1.0 | `src/pages/Dashboard.tsx`, `src/services/score.ts`, `src/components/journal/` |
| V1.2 | `src/services/timeBlockValidator.ts`, `src/stores/useTimeBlockStore.ts`, `src/components/today/TimelineView.tsx`, `src/pages/Profile.tsx` |
| V1.5 | `src/services/backup.ts`, `vite.config.ts`, `src/workers/scoreWorker.ts` |
| V2.0 | `src/db/supabase-schema.sql`, `src/stores/useAuthStore.ts`, `supabase/` |
| V2.1 | Commentaires, templates restants, détours cross-espace |

---

## Vérification à chaque phase

- `npx tsc --noEmit` — zéro erreur TypeScript strict
- Tester le golden path : onboarding → but de vie → domaine → projet (7 étapes) → actions → journal
- Vérifier dans DevTools que les données persistent en IndexedDB après rechargement
- Lighthouse Performance > 90, Accessibility > 90
- Bundle analyzer (`vite-bundle-visualizer`) pour vérifier < 300 KB gzippé

---

*Plan DestinyPlanner — Avril 2026*
*Référence docs : CLAUDE_v2.md, CDC_v2_2.md, Architecture_v1_2.md, Database_v1_2.md, Design_v2_1.md*
