# DestinyPlanner — Cahier des charges v2.2

> *« Votre rêve n'est qu'un rêve tant qu'il n'a pas de projet. »* — Dr Myles Munroe

**Version** : 2.2 — Avril 2026
**Licence** : Open source, MIT
**Historique** : v1.0 → v1.1 (engagement progressif, résilience, scoring pondéré) → v2.0 (espace business collaboratif) → v2.1 (alignement design system, vocabulaire strict, schéma BDD unifié) → **v2.2 (time-blocking des 24h réintégré, module User avec profil et statistiques)**

---

## Table des matières

1. [Présentation du projet](#1-présentation-du-projet)
2. [Objectifs du projet](#2-objectifs-du-projet)
3. [Architecture bi-espace](#3-architecture-bi-espace)
4. [Espace personnel](#4-espace-personnel)
5. [Espace business collaboratif](#5-espace-business-collaboratif)
6. [Templates de projets business](#6-templates-de-projets-business)
7. [Système de collaboration](#7-système-de-collaboration)
8. [Système d'engagement progressif et grades](#8-système-dengagement-progressif-et-grades)
9. [Système de scoring pondéré](#9-système-de-scoring-pondéré)
10. [Spécifications techniques](#10-spécifications-techniques)
11. [Résilience des données](#11-résilience-des-données)
12. [Design et expérience utilisateur](#12-design-et-expérience-utilisateur)
13. [Règles métier](#13-règles-métier)
14. [Banque de contenu spirituel](#14-banque-de-contenu-spirituel)
15. [Roadmap de développement](#15-roadmap-de-développement)
16. [Critères de succès](#16-critères-de-succès)

---

## 1. Présentation du projet

### 1.1 Contexte et origine

DestinyPlanner est né d'une prédication du Dr Myles Munroe intitulée « Les 7 principes puissants de planification de Jésus — Transforme Ton Futur ». Message central : les deux forces les plus puissantes de la vie sont le temps et le changement. Le seul outil pour les maîtriser est la planification.

Jésus lui-même, dans Luc 14:28-32, enseigne un processus en 7 étapes : avoir une vision claire, s'arrêter, estimer, compter le coût, calculer, vérifier les ressources, s'engager.

### 1.2 Vision du produit

**DestinyPlanner** accompagne l'utilisateur dans deux dimensions :

- **Dimension personnelle** : buts de vie, domaines, projets guidés par les 7 étapes, gestion des 24h (time-blocking), journal de vision, score d'attitudes, profil avec statistiques. Données 100% locales, aucun compte requis.
- **Dimension entrepreneuriale** : projets business collaboratifs avec templates métier, système de rôles et commentaires contextuels.

### 1.3 Vocabulaire de l'app (strict — les deux espaces)

| Terme | Définition | Ce que ce n'est PAS |
|---|---|---|
| **But** | Raison d'être profonde, permanente | Pas un objectif SMART |
| **Domaine** | Grande sphère de vie (Foi, Famille, Finances...) | Pas une catégorie de tâches |
| **Projet** | Tout ce qui mérite les 7 étapes | **Le mot "plan" n'existe pas dans l'app** |
| **Les 7 étapes** | Parcours guidé obligatoire de chaque projet | Pas une checklist optionnelle |
| **Jalon** | Étape datée et mesurable produite par les 7 étapes | Pas une simple tâche |
| **Action du jour** | Ce qu'on fait aujourd'hui pour avancer sur un jalon | Toujours liée à un jalon → projet → but |
| **Bloc horaire** | Créneau planifié dans la journée (time-blocking) | Pas une alarme, pas une réunion |
| **Détour** | Obstacle documenté avec ajustement de route | Pas un échec |

### 1.4 Cible utilisateur

Solopreneurs, investisseurs, porteurs de projets, entrepreneurs collaboratifs, croyants désireux d'aligner planification et principes bibliques, jeunes adultes (16–30 ans), 16 à 71 ans. Contexte francophone africain et diaspora en priorité.

### 1.5 Modèle économique

Gratuit pour tous, open source MIT.

---

## 2. Objectifs du projet

### 2.1 Objectifs fonctionnels

1. Parcours guidé des 7 principes — personnel et business
2. Tableau de bord de vie — buts, projets, jalons, Arbre de la Destinée
3. **Time-blocking des 24h** — planifier chaque jour par créneaux horaires liés aux actions
4. **Module User** — profil, grade, statistiques personnelles complètes
5. Journal quotidien — routine matin + revue du soir
6. Score d'attitudes pondéré — tracking des habitudes avec alertes tendancielles
7. Engagement progressif à 3 niveaux (2 min → 8 min → 15 min/jour)
8. **(v2.0+)** Espace business collaboratif avec rôles et permissions
9. **(v2.0+)** 6 templates de projets business avec prompts entrepreneur
10. **(v2.0+)** Authentification OAuth (Google/GitHub) via Supabase

---

## 3. Architecture bi-espace

### 3.1 Principe

| | Espace personnel | Espace business |
|---|---|---|
| **Stockage** | 100% local (IndexedDB + OPFS) | Supabase (Postgres + Realtime) |
| **Compte requis** | Non | Oui (OAuth Google/GitHub) |
| **Visibilité** | Toi uniquement | Toi + collaborateurs invités |
| **Offline** | Oui (complet) | Oui (lecture seule avec sync au retour) |

### 3.2 Lien perso-business (optionnel, privé)

L'utilisateur peut lier un but personnel à un projet business. Ce lien est stocké **uniquement en local** (table `personal_business_link`), jamais synchronisé. Les collaborateurs ne savent pas qu'un lien existe. Un projet business lié compte dans le calcul de santé du domaine concerné (Arbre de la Destinée).

---

## 4. Espace personnel

### 4.1 Module But de vie

- Saisir sa mission de vie en une phrase
- Écrire sa vision à 10 ans
- Définir 3 valeurs fondamentales
- Le but s'affiche en titre de l'app — rappel quotidien

### 4.2 Module Domaines

- 6 domaines pré-chargés : Foi & Spiritualité, Famille, Finances, Santé, Carrière & Vocation, Éducation
- Domaines personnalisés (nom + icône + objectif global)
- Chaque domaine affiche le nombre de projets actifs (perso + business liés)

### 4.3 Module Projets — les 7 étapes

Tout projet appartient à un domaine. Sa création déclenche le parcours des 7 étapes séquentielles. Pas de formulaire libre.

| # | Étape | Ce qu'on saisit | Verset |
|---|---|---|---|
| 1 | Vision claire | Titre, description, image de réussite | Luc 14:28 |
| 2 | S'arrêter | Réflexion : conviction ou impulsion ? | Luc 14:28 |
| 3 | Estimer (SWOT) | Forces, Faiblesses, Opportunités, Menaces | Proverbes 21:5 |
| 4 | Compter le coût | Financier, temps, énergie, relations, sacrifices | Luc 14:28 |
| 5 | Calculer | Budget, durée, jalons datés | Luc 14:28 |
| 6 | Vérifier | Ressources vs besoins. Décision : go / no-go / négocier | Luc 14:31 |
| 7 | S'engager | Critères de succès mesurables, engagement écrit | Luc 14:30 |

### 4.4 Module Actions du jour

Chaque action est obligatoirement liée à un jalon. Traçabilité toujours visible : Action → Jalon → Projet → Domaine → But. Une action peut être assignée à un bloc horaire dans la timeline 24h.

### 4.5 Module Time-blocking des 24h *(v1.2)*

**Principe** : planifier sa journée en créneaux horaires. Intégré dans la page **Aujourd'hui** — pas une page séparée.

#### Fonctionnement

- **Routine matin** : widget "Planifier ma journée" accessible depuis la routine du matin. L'utilisateur crée ses blocs horaires pour la journée (start_time, end_time, label).
- **Timeline** : vue chronologique 24h scrollable, visible à droite de la page Aujourd'hui (desktop) ou en bas (mobile). Chaque bloc est coloré selon le domaine de l'action liée, ou selon sa catégorie.
- **Lien action ↔ bloc** : un bloc peut être lié à une action du jour. Cocher l'action dans la liste coche automatiquement le bloc dans la timeline.
- **Revue du soir** : les blocs du jour sont affichés avec un toggle "respecté ?" pour la revue. Cela alimente les statistiques du profil.

#### Catégories de blocs

| Catégorie | Couleur | Exemples |
|---|---|---|
| `work` | --purple | Rédaction, réunion, appels clients |
| `spiritual` | --gold | Prière, lecture biblique, méditation |
| `family` | --green | Repas famille, temps avec les enfants |
| `health` | --teal | Sport, marche, médecin |
| `rest` | --blue | Sieste, détente, loisirs |
| `free` | --surface-2 | Non catégorisé |

#### Règles du time-blocking

- Durée minimum d'un bloc : 15 minutes
- Pas de chevauchement sur la même journée (validation automatique)
- Fenêtre horaire configurable dans les paramètres (défaut : 05h00 → 23h59)
- Un bloc peut exister sans être lié à une action (ex: "Repas", "Sport libre")
- `journal_entry.time_blocking_done = true` si au moins 1 bloc a été créé ce matin
- Les blocs respectés (`done = true`) alimentent `user_profile.total_time_blocks_done`

#### Vue dans la page Aujourd'hui

```
[Colonne gauche]                    [Colonne droite — Timeline]
─────────────────────               ─────────────────────────────────
Card routine matin                  05:00
  · Verset + citation               06:00  ████ Prière (30min) ✓
  · Déclaration                     06:30
  · 1 action destinée               07:00  ████████ Sport (60min) ✓
  · [Planifier ma journée →]        08:00
                                    09:00  ████████████ Appeler clients (90min)
Card actions du jour                         → Jalon : Valider le marché
  · action-row × N cochables       10:30
  · traçabilité                     11:00  ██ Lecture (30min)
  · [+ Ajouter une action]          ...
                                    [+ Ajouter un bloc]
```

### 4.6 Module Journal quotidien

**Routine matin** : verset du jour, citation de Munroe, déclaration personnelle, 1 action vers la destinée, widget time-blocking (planifier les 24h).

**Revue du soir** : bilan de la journée, détours rencontrés, leçons apprises, score d'attitudes, revue des blocs horaires (respecté / non respecté).

### 4.7 Module Score d'attitudes

- Habitudes définies par l'utilisateur avec poids (total = 100%)
- Score glissant sur 7 jours + moyenne 30 jours (dans le profil)
- Alerte si baisse sur 5 jours consécutifs
- Streak, reset après 2 jours sans check-in

### 4.8 Module Détours

- Créé depuis un projet ou depuis la revue du soir
- Champs : obstacle, impact, ajustement, résolu
- Détour systémique si même type d'obstacle ≥ 3 fois sur projets différents (cross-espace)
- Si systémique confirmé : habitude corrective créée automatiquement

### 4.9 Module User — Profil *(v1.2)*

**Page dédiée accessible depuis la sidebar** (avatar + grade en bas de sidebar sur desktop, onglet dédié sur mobile).

#### Contenu du profil

```
┌─────────────────────────────────────────┐
│  🦁  Prénom                             │
│       "Bio courte (160 car. max)"       │
│  Grade : Bâtisseur Diligent             │
│  Niveau 3 — Bâtisseur                  │
├─────────────────────────────────────────┤
│  STATISTIQUES PERSONNELLES              │
│  🔥 Streak actuel       42 jours        │
│  🏆 Meilleur streak     58 jours        │
│  ✅ Projets terminés    7               │
│  ⚡ Actions faites      234             │
│  📔 Entrées journal     89              │
│  🕐 Blocs respectés     156            │
│  📊 Score moy. 30j      78%            │
├─────────────────────────────────────────┤
│  COMPTE BUSINESS (v2.0)                 │
│  [Se connecter avec Google]             │
│  [Se connecter avec GitHub]             │
│  [Déconnexion / Gérer le compte]        │
└─────────────────────────────────────────┘
```

#### Personnalisation

- **Avatar** : emoji (grille de 20 emojis prédéfinis) + couleur de fond (parmi les couleurs sémantiques)
- **Prénom** : modifiable à tout moment
- **Bio** : optionnelle, 160 caractères max
- Pas de photo de profil en v1.x — en v2.0, la photo OAuth (Google/GitHub) est visible dans l'espace business uniquement

#### Statistiques calculées à la volée

| Statistique | Source | Recalcul |
|---|---|---|
| Streak actuel | `user_profile.streak` | À chaque check-in |
| Meilleur streak | `user_profile.streak_best` | Mis à jour si streak dépasse le record |
| Projets terminés | `count(project where status='completed')` | À chaque projet complété |
| Actions faites | `count(action where done=true)` | À chaque action cochée |
| Entrées journal | `count(journal_entry)` | À chaque entrée créée |
| Blocs respectés | `count(time_block where done=true)` | À chaque revue du soir |
| Score moy. 30j | `avg(score_cache) last 30 entries` | À chaque check-in d'habitude |

### 4.10 Module Arbre de la Destinée

Vue graphique depuis le Dashboard.

| État | Condition | Signal |
|---|---|---|
| Sain | 1–2 projets actifs | Vert |
| Desséché | 0 projet actif | Orange — alerte |
| Surchargé | 3+ projets actifs | Rouge — alerte dispersion |
| Endormi | Projets tous en pause | Gris |

Les projets business liés localement comptent dans le calcul de santé du domaine concerné. La vue est actionnable : cliquer sur un domaine desséché propose de créer un projet.

---

## 5. Espace business collaboratif *(v2.0+)*

### 5.1 Vue d'ensemble

Projets entrepreneuriaux collaboratifs traversant les mêmes 7 étapes avec prompts adaptés à l'entrepreneuriat et templates métier pré-remplis.

Design : accent **teal (`#2DA58A`)** à la place du violet perso. Tous les autres tokens du Design System sont identiques — il n'y a pas de Design System séparé pour le business.

### 5.2 Les 7 étapes — version entrepreneur

| # | Étape | Prompt entrepreneur |
|---|---|---|
| 1 | Vision claire | « Décris ton projet comme si tu l'expliquais à un investisseur en 2 minutes. Quelle est la tour que tu veux construire ? » |
| 2 | S'arrêter | « Avant de foncer, assieds-toi. Est-ce une conviction profonde ou une impulsion ? » |
| 3 | Estimer (SWOT) | « Quelles sont tes forces face à la concurrence ? Quelles menaces pourraient faire échouer ce projet ? Sois honnête. » |
| 4 | Compter le coût | « Combien va te coûter ce projet en argent, en temps et en énergie ? Es-tu prêt à payer ce prix ? » |
| 5 | Calculer | « Chiffre tout. Combien pour le MVP ? Quand atteins-tu le point d'équilibre ? » |
| 6 | Vérifier | « Avec tes ressources actuelles, peux-tu lancer ? Si non, avec qui peux-tu négocier ? » |
| 7 | S'engager | « Comment sauras-tu que tu as réussi ? Quels sont les 3 indicateurs qui te disent que le projet est terminé ? » |

### 5.3 Fonctionnalités

**Gestion de projets** : création avec template, parcours 7 étapes, statuts identiques à l'espace perso.

**Jalons et responsables** : jalons datés avec responsable assigné, vue « qui fait quoi », notifications deadline.

**Commentaires contextuels** : fil de commentaires par étape et par jalon, mentions @nom, asynchrones.

**Détours business** : documentation obstacles, historique visible par tous les membres, détour systémique cross-espace si lien local existe.

---

## 6. Templates de projets business *(v2.0+)*

6 templates métier + projet vierge. Chaque template pré-remplit les 7 étapes. Versionnés — les projets existants conservent la version utilisée.

| Template | Usage |
|---|---|
| Lancement de produit/service | Nom, marché, SWOT concurrentiel, coût MVP, KPIs lancement |
| Investissement immobilier | Type de bien, cashflow, rendement, simulation crédit |
| Création d'entreprise | Mission, burn rate, break-even, statut juridique |
| Partenariat / joint-venture | Apports, gouvernance, clauses de sortie |
| Levée de fonds | Montant, type, dilution, pitch deck, data room |
| Mission client / prestation | Scope, tarif, échéancier, NPS |

---

## 7. Système de collaboration *(v2.0+)*

| Rôle | Voir | Modifier jalons | Commenter | Inviter | Supprimer |
|---|---|---|---|---|---|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editor | ✅ | ✅ | ✅ | ❌ | ❌ |
| Viewer | ✅ | ❌ | ✅ | ❌ | ❌ |

Invitation par lien unique (expiration 7 jours). Suppression soft : délai 7 jours, réversible.

---

## 8. Système d'engagement progressif et grades

### 8.1 Niveaux

| Niveau | Condition | Temps/jour | Ce qu'on fait |
|---|---|---|---|
| 1 — Découvreur | Défaut | 2 min | 1 action du jour + verset |
| 2 — Planificateur | Suggéré après 7j actifs | 8 min | Journal matin + actions + score |
| 3 — Bâtisseur | Suggéré après 7j au niv.2 | 15 min | Journal complet + time-blocking + revue du soir |

Promotion **suggérée, jamais imposée**. Rétrogradation douce après 3 jours d'inactivité. Jamais de message négatif.

### 8.2 Grades

| Grade | Condition |
|---|---|
| Découvreur | Défaut |
| Planificateur | Niveau 2 ou 3 |
| Bâtisseur Diligent | Streak ≥ 14j |
| Maître Bâtisseur | Streak ≥ 30j + 0 abandon depuis 90j |

Perte du grade Maître Bâtisseur si projet abandonné (perso ou business) dans les 90j suivants.

### 8.3 Ce qui compte dans le streak (cross-espace)

✅ Check-in d'habitude — ✅ Valider une étape — ✅ Cocher une action — ✅ Créer au moins 1 bloc horaire — ✅ Valider une étape business (l'utilisateur lui-même)

❌ Activité des collaborateurs sur un projet partagé

---

## 9. Système de scoring pondéré

- Habitudes définies avec poids (total = 100%)
- Score du jour = somme des poids des habitudes cochées
- Score 7j = moyenne glissante, Score 30j = affiché dans le profil
- Alerte : 5 jours consécutifs de baisse → notification locale
- Streak reset : après exactement 2 jours sans check-in
- Score strictement personnel — jamais visible par les collaborateurs business

---

## 10. Spécifications techniques

### 10.1 Stack

| Couche | Technologie |
|---|---|
| Framework UI | React 18 + TypeScript strict |
| Build | Vite |
| State | Zustand |
| Routing | React Router v6 |
| Persistance locale | Dexie.js v3 (IndexedDB) + OPFS |
| Persistance business | Supabase (Postgres + RLS + Realtime) |
| Auth | Supabase Auth — OAuth Google + GitHub |
| Charts | Recharts |
| Icons | Lucide React |
| Dates | date-fns |
| PWA | vite-plugin-pwa + Workbox |
| Tests | Vitest + Testing Library |
| Déploiement | Vercel / Netlify |

### 10.2 Schéma de données local (résumé)

Se référer au document **DestinyPlanner — Base de données v1.2** pour le schéma Dexie complet.

Tables : `goal`, `domain`, `project`, `project_step`, `milestone`, `action`, **`time_block`** *(nouveau)*, `detour`, `journal_entry`, `habit`, `habit_check`, **`user_profile`** *(nouveau)*, `personal_business_link`, `app_preferences`, `backup_meta`.

**Dexie version 3** ajoute `time_block` et `user_profile`, et migre les champs de profil depuis `app_preferences`.

### 10.3 Contraintes de performance

| Contrainte | Valeur |
|---|---|
| Bundle JS gzippé (v1.x) | < 300 KB |
| Bundle JS gzippé (v2.0+) | < 350 KB |
| First Contentful Paint | < 1.5s |
| Interactions | < 100ms |
| Lighthouse Performance | > 90 |
| Lighthouse Accessibility | > 90 |

---

## 11. Résilience des données

### 11.1 Espace personnel — 4 couches

| Couche | Mécanisme |
|---|---|
| 1 | IndexedDB (principale) |
| 2 | OPFS — survit au nettoyage de cache |
| 3 | Auto-backup JSON hebdomadaire (chaque dimanche) → Downloads |
| 4 | Restauration auto si IndexedDB vide + backup OPFS existe |

`navigator.storage.persist()` au premier lancement. Alerte si backup > 7 jours.

### 11.2 Espace business — Supabase

Backups Supabase automatiques. Cache local IndexedDB pour lecture offline. Resync au retour en ligne. Export JSON d'un projet disponible avant suppression de compte.

---

## 12. Design et expérience utilisateur

> **Référence** : *DestinyPlanner — Design System v2.0* — unique pour toute l'application.

### 12.1 Direction artistique

| Élément | Valeur |
|---|---|
| Fond | `#0F0E0D` (noir chaud) — dark mode par défaut |
| Accent perso | Violet `#7B6FD4` |
| Accent business | Teal `#2DA58A` |
| Accent time-blocking | Couleur du domaine lié ou catégorie |
| Or (CTA, grades) | `#C49A3C` |
| Typographie | Inter (UI) + Fraunces (titres éditoriaux) |

### 12.2 Navigation — 6 sections

Sidebar desktop (200px fixe) / barre inférieure mobile (5 onglets + profil via avatar) :

1. **Dashboard** — vue d'ensemble (Arbre de la Destinée + métriques)
2. **Aujourd'hui** — actions du jour + timeline time-blocking 24h
3. **Projets** — projets personnels (accent violet)
4. **Journal** — routine matin + revue du soir
5. **Business** — projets collaboratifs (accent teal) *(v2.0+)*
6. **Profil** — avatar + grade en bas de sidebar → ouvre la page Profil

### 12.3 Parcours utilisateur type

**Première utilisation** : onboarding 3 écrans (La tour → Prénom → Niveau d'engagement) → premier but de vie → premier projet personnel → parcours des 7 étapes.

**Journée type (niveau 3 — Bâtisseur)** :
1. Ouvrir Aujourd'hui → routine matin → verset → déclaration → 1 action destinée → planifier les 24h (time-blocking)
2. Dans la journée : cocher les actions et blocs au fil de l'eau
3. Soir : revue → bilan → blocs respectés → score d'attitudes → leçons

---

## 13. Règles métier

### 13.1 Parcours guidé (perso et business)

- Pas d'accès à l'étape N+1 sans valider l'étape N
- Retour toujours possible à une étape précédente
- Projet actif uniquement après validation de l'étape 7
- Auto-save à chaque frappe dans le wizard

### 13.2 Time-blocking

- Durée minimum : 15 minutes par bloc
- Pas de chevauchement sur la même journée (validation automatique)
- Un bloc peut exister sans être lié à une action
- Cocher une action liée à un bloc → coche automatiquement le bloc
- Cocher un bloc dans la revue du soir → `user_profile.total_time_blocks_done++`
- La fenêtre horaire de la journée est configurable (paramètres)

### 13.3 Module User

- `user_profile` est un singleton (1 seul enregistrement)
- Les statistiques sont recalculées à chaque action significative (cocher une action, valider une étape, check-in d'habitude)
- Le grade est recalculé à chaque check-in
- `streak_best` est mis à jour si le streak actuel dépasse le record
- La bio est optionnelle et limitée à 160 caractères
- L'avatar est composé d'un emoji + couleur de fond (pas de photo en v1.x)

### 13.4 Collaboration (v2.0+)

- 1 Owner par projet business
- Editor ne peut pas inviter ni se promouvoir Owner
- Suppression soft : 7 jours, réversible
- Seul l'Owner supprime

### 13.5 Score d'attitudes

- Somme des poids = 100 toujours
- Alerte sur 5 jours consécutifs de baisse
- Streak reset après exactement 2 jours sans check-in
- Score strictement personnel

### 13.6 Engagement progressif

- Promotion suggérée, jamais imposée
- Rétrogradation douce après 3 jours d'inactivité
- Aucun message négatif

### 13.7 Lien perso-business

- Stocké uniquement en local — jamais synchronisé
- Contribue au calcul de santé de l'Arbre de la Destinée
- Supprimé localement si le projet business est supprimé

### 13.8 Détours systémiques

- Signal si même obstacle ≥ 3 fois sur projets différents
- Toujours une suggestion — l'utilisateur confirme
- Si confirmé : habitude corrective créée automatiquement

---

## 14. Banque de contenu spirituel

### 14.1 Versets (15)

Jérémie 29:11, Proverbes 20:18, Proverbes 21:5, Proverbes 16:1, Proverbes 12:5, Proverbes 19:21, Ésaïe 32:8, Ecclésiaste 9:10, Éphésiens 3:20, Proverbes 16:3, Proverbes 16:9, Luc 14:28-32, Apocalypse 13:8, Hébreux 12:2, Psaume 23:4.

### 14.2 Citations de Munroe (25) — contextuelles

- « Votre rêve n'est qu'un rêve tant qu'il n'a pas de plan. »
- « Un plan ne vous dit pas seulement ce que vous voulez faire. Il vous dit aussi ce que vous ne voulez pas faire. »
- « Un bon plan est comme une carte routière. »
- « Il est préférable de modifier un plan que de ne pas en avoir. »
- « Les plans peuvent changer, mais le but reste permanent. »
- « Nous planifions notre pauvreté en ne planifiant pas notre prospérité. »
- « Que vous réussissiez ou que vous échouiez dépend du plan que vous avez ou que vous n'avez pas. »
- « Le succès attend un plan. »
- « Planifier demande plus de travail que travailler lui-même. »
- « Si la vie était un arc et que vous étiez la flèche, la planification déterminerait la direction et la destination de votre vol. »
- « La planification sans action est inutile, mais l'action sans plan est dangereuse. »
- « La meilleure façon de prédire l'avenir est de l'inventer. »
- « Si vous n'avez pas de destination, n'importe quelle route vous y mènera. »
- « Le bon n'est pas toujours le bon pour vous. »
- « La vie n'est pas seulement mesurée par les choses que vous faites, mais aussi par les choses que vous refusez de faire. »
- « Nos rêves peuvent être réels, mais ce sont nos plans qui leur donnent souffle. »
- « Arrêtez de demander à Dieu un plan. Donnez-lui un plan. »
- « Si vous ne concevez pas votre vie, quelqu'un d'autre le fera à votre place. »
- « Ne choisissez jamais un combat que vous ne pouvez pas gagner. »
- « Le plus grand acte de foi, c'est la planification. »
- « Là où vous êtes aujourd'hui n'est pas permanent. Ne mesurez pas votre vie par votre situation actuelle. Mesurez-la par vos pensées. »
- « Tu fais le plan, mais Dieu détermine les étapes. »
- « Ne me présente jamais un chiffre vague. »
- « Fais un plan même lorsque les chances sont contre toi. »
- « Négocier n'est pas un compromis. Négocier, c'est raisonner pour ton avantage. »
 

Stockées avec `theme`, `step_affinity`, `tone` (`slow-down` / `courage` / `faith` / `discipline`). À l'étape 3 (SWOT), les citations `slow-down` sont prioritaires. À l'étape 7, les citations `courage`.

### 14.3 Citations externes (2)

- **Zig Ziglar** : « Si vous n'avez pas d'objectif pour chaque jour, vous êtes simplement un rêveur. »
- **Gordon Inkley** : « On ne peut pas labourer un champ simplement en le retournant dans son esprit. »

### 14.4 Dans l'espace business

Verset affiché en haut de chaque étape du parcours entrepreneur. Prompt entrepreneur juste en dessous. Un collaborateur non-croyant voit le verset comme une citation inspirante.

---

## 15. Roadmap de développement

| Phase | Période | Livrables |
|---|---|---|
| **MVP perso** | S1–4 | 7 étapes + buts de vie + niveau 1 engagement + persistance IndexedDB + OPFS + responsive |
| **V1.0 perso** | S5–8 | Dashboard + Arbre de la Destinée + journal + score pondéré + module Détours |
| **V1.2 perso** | S9–10 | **Time-blocking des 24h** + **module User (profil + stats)** |
| **V1.5 perso** | S11–14 | PWA offline + auto-backup + notifications + export PDF + import/export JSON + mode clair |
| **V2.0 business MVP** | S15–20 | Supabase + auth OAuth + espace business + 7 étapes entrepreneur + 2 premiers templates + rôles + invitation |
| **V2.1 business** | S21–24 | 4 templates restants + commentaires contextuels + vue "qui fait quoi" + notifications + détours business |
| **V2.5** | S25–28 | Timeline Gantt + lien perso-business complet + analytics + internationalisation EN |
| **V3.0** | Après S28 | Mode offline business amélioré + mention @nom + PWA push + contributions communautaires |

---

## 16. Critères de succès

### 16.1 KPIs — espace perso

- Rétention à 7 jours > 50%
- Taux de complétion du parcours 7 étapes > 60%
- Journal ≥ 5 jours/semaine (utilisateurs niv.2+)
- Score d'attitudes en hausse après 30 jours
- Taux de promotion niv.1 → niv.2 > 35% à 14 jours
- **Taux d'adoption time-blocking > 40% (utilisateurs niv.3)**

### 16.2 KPIs — espace business (v2.0+)

- Collaborateurs par projet > 2.5
- Adoption des templates > 70%
- Complétion 7 étapes business > 50%
- Commentaires par projet > 10 à 30 jours
- Jalons terminés dans les délais > 60%

### 16.3 KPIs techniques

- Lighthouse Performance > 90
- Lighthouse Accessibility > 90
- First Contentful Paint < 1.5s
- Bundle < 300 KB (v1.x), < 350 KB (v2.0+)
- Zéro perte de données perso en production

---

> *« Tu fais le projet, mais Dieu détermine les étapes. »* — Dr Myles Munroe

---

*DestinyPlanner — Cahier des charges v2.2 — Avril 2026*
*Open source — Licence MIT*
