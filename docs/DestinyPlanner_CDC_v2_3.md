# DestinyPlanner — Cahier des charges v2.3

> *« Votre rêve n'est qu'un rêve tant qu'il n'a pas de projet. »* — Dr Myles Munroe

**Version** : 2.3 — Avril 2026  
**Licence** : Open source, MIT  
**Historique** : v1.0 → v1.1 (engagement progressif, scoring pondéré) → v2.0 (espace business) → v2.1 (design system, vocabulaire, BDD unifiée) → v2.2 (time-blocking, module User) → **v2.3 (IA assistant + saisie vocale, sync perso Supabase, analytics, templates community)**

---

## Table des matières

1. [Présentation du projet](#1-présentation-du-projet)
2. [Objectifs du projet](#2-objectifs-du-projet)
3. [Architecture bi-espace](#3-architecture-bi-espace)
4. [Espace personnel](#4-espace-personnel)
5. [Espace business collaboratif](#5-espace-business-collaboratif)
6. [Templates de projets business](#6-templates-de-projets-business)
7. [Système de collaboration](#7-système-de-collaboration)
8. [IA Assistant](#8-ia-assistant)
9. [Système d'engagement progressif et grades](#9-système-dengagement-progressif-et-grades)
10. [Système de scoring pondéré](#10-système-de-scoring-pondéré)
11. [Spécifications techniques](#11-spécifications-techniques)
12. [Résilience des données](#12-résilience-des-données)
13. [Design et expérience utilisateur](#13-design-et-expérience-utilisateur)
14. [Règles métier](#14-règles-métier)
15. [Banque de contenu spirituel](#15-banque-de-contenu-spirituel)
16. [Roadmap de développement](#16-roadmap-de-développement)
17. [Critères de succès](#17-critères-de-succès)

---

## 1. Présentation du projet

### 1.1 Contexte et origine

DestinyPlanner est né d'une prédication du Dr Myles Munroe intitulée « Les 7 principes puissants de planification de Jésus — Transforme Ton Futur ». Message central : les deux forces les plus puissantes de la vie sont le temps et le changement. Le seul outil pour les maîtriser est la planification.

Jésus lui-même, dans Luc 14:28-32, enseigne un processus en 7 étapes : avoir une vision claire, s'arrêter, estimer, compter le coût, calculer, vérifier les ressources, s'engager.

### 1.2 Vision du produit

**DestinyPlanner** accompagne l'utilisateur dans deux dimensions :

- **Dimension personnelle** : buts de vie, domaines, projets guidés par les 7 étapes, gestion des 24h (time-blocking), journal de vision, score d'attitudes, profil avec statistiques. Données 100% locales, aucun compte requis. Sync cloud optionnel après connexion OAuth.
- **Dimension entrepreneuriale** : projets business collaboratifs avec templates métier, système de rôles et commentaires contextuels.
- **Assistant IA** : chat contextuel (Groq Llama 3.3 70B) avec saisie vocale, capable d'exécuter des actions in-app (ajouter jalons, actions, blocs horaires, domaines, détours, habitudes).

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
| **S'engager** | Valider la 7e étape d'un projet | Jamais "committer", "signer", "valider" |

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
11. **(v2.0+)** Sync cloud optionnel données perso (Supabase — activé après connexion OAuth)
12. **(v2.1+)** Commentaires contextuels, vue "qui fait quoi", analytics
13. **(v2.3)** **IA Assistant contextuel avec saisie vocale**

---

## 3. Architecture bi-espace

### 3.1 Principe

| | Espace personnel | Espace business |
|---|---|---|
| **Stockage principal** | IndexedDB (offline-first) | Supabase Postgres (source de vérité) |
| **Sync cloud** | Supabase optionnel (après OAuth) | Toujours Supabase |
| **Compte requis** | Non (sync optionnel avec compte) | Oui (OAuth Google/GitHub) |
| **Visibilité** | Toi uniquement | Toi + collaborateurs invités |
| **Offline** | Oui (complet, 100%) | Oui (lecture + cache + écriture optimiste) |

### 3.2 Lien perso-business (optionnel, privé)

L'utilisateur peut lier un but personnel à un projet business. Ce lien est stocké **uniquement en local** (table `personal_business_link`), jamais synchronisé. Les collaborateurs ne savent pas qu'un lien existe. Un projet business lié compte dans le calcul de santé du domaine concerné (Arbre de la Destinée).

### 3.3 Offline business — comportement réel

Le mode offline business n'est pas uniquement lecture seule. L'écriture optimiste est supportée :
- Les mutations (jalons, étapes) sont appliquées immédiatement en mémoire (Zustand)
- Elles sont enqueued dans `mutationQueue` (localStorage)
- Replay automatique à la reconnexion (MAX_ATTEMPTS=5)
- Le cache `business_project_cache` (IndexedDB) permet la lecture offline

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

### 4.5 Module Time-blocking des 24h

**Principe** : planifier sa journée en créneaux horaires. Intégré dans la page **Aujourd'hui** — pas une page séparée.

#### Fonctionnement

- **Routine matin** : widget "Planifier ma journée" accessible depuis la routine du matin.
- **Timeline** : vue chronologique 24h scrollable, visible à droite (desktop) ou en bas (mobile).
- **Lien action ↔ bloc** : cocher l'action coche automatiquement le bloc lié.
- **Revue du soir** : blocs affichés avec toggle "respecté ?" → alimente `total_time_blocks_done`.

#### Catégories de blocs

| Catégorie | Couleur | Exemples |
|---|---|---|
| `work` | --purple | Rédaction, réunion, appels clients |
| `spiritual` | --gold | Prière, lecture biblique, méditation |
| `family` | --green | Repas famille, temps avec les enfants |
| `health` | --teal | Sport, marche, médecin |
| `rest` | --blue | Sieste, détente, loisirs |
| `free` | --surface-2 | Non catégorisé |

#### Règles

- Durée minimum : 15 minutes · Pas de chevauchement · Fenêtre configurable (défaut : 05h00 → 23h59)
- Un bloc peut exister sans être lié à une action

### 4.6 Module Journal quotidien

**Routine matin** : verset du jour, citation de Munroe, déclaration personnelle, 1 action vers la destinée, widget time-blocking.

**Revue du soir** : bilan, détours, leçons, score d'attitudes, revue des blocs.

### 4.7 Module Score d'attitudes

- Habitudes définies avec poids (total = 100%)
- Score glissant sur 7 jours + moyenne 30 jours (profil)
- Alerte si baisse sur 5 jours consécutifs
- Streak, reset après 2 jours sans check-in

### 4.8 Module Détours

- Créé depuis un projet ou depuis la revue du soir
- Champs : obstacle, impact, ajustement, résolu
- Détour systémique si même type d'obstacle ≥ 3 fois sur projets différents (cross-espace)
- Si systémique confirmé : habitude corrective créée automatiquement

### 4.9 Module User — Profil

**Page dédiée** accessible depuis la sidebar (avatar + grade).

```
┌─────────────────────────────────────────┐
│  🦁  Prénom                             │
│       "Bio courte (160 car. max)"       │
│  Grade : Bâtisseur Diligent             │
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

**Avatar** : emoji (grille 20) + couleur de fond. Pas de photo en v1.x. En v2.0+, photo OAuth visible dans l'espace business uniquement.

### 4.10 Module Arbre de la Destinée

| État | Condition | Signal |
|---|---|---|
| Sain | 1–2 projets actifs | Vert |
| Desséché | 0 projet actif | Orange |
| Surchargé | 3+ projets actifs | Rouge |
| Endormi | Projets tous en pause | Gris |

Les projets business liés localement comptent dans la santé du domaine concerné.

### 4.11 Analytics

Page dédiée (`/analytics`) : métriques d'engagement, completion rates par template, détours résurgents, tendances score.

---

## 5. Espace business collaboratif

### 5.1 Vue d'ensemble

Projets entrepreneuriaux collaboratifs traversant les mêmes 7 étapes avec prompts adaptés à l'entrepreneuriat et templates métier pré-remplis.

Design : accent **teal (`#2DA58A`)** à la place du violet perso.

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

- Création avec template, parcours 7 étapes, statuts identiques à l'espace perso
- Jalons datés avec responsable assigné
- Vue "qui fait quoi" : jalons avec assignés, statuts, deadlines
- Commentaires contextuels : fil par étape et par jalon, mentions @nom, édition/suppression
- Détours business : historique visible par tous les membres
- Templates communautaires : galerie de templates partagés par la communauté

---

## 6. Templates de projets business

6 templates métier + projet vierge. Chaque template pré-remplit les 7 étapes avec prompts entrepreneur adaptés.

| Template | Usage |
|---|---|
| Lancement de produit/service | Nom, marché, SWOT concurrentiel, coût MVP, KPIs lancement |
| Investissement immobilier | Type de bien, cashflow, rendement, simulation crédit |
| Création d'entreprise | Mission, burn rate, break-even, statut juridique |
| Partenariat / joint-venture | Apports, gouvernance, clauses de sortie |
| Levée de fonds | Montant, type, dilution, pitch deck, data room |
| Mission client / prestation | Scope, tarif, échéancier, NPS |

---

## 7. Système de collaboration

| Rôle | Voir | Modifier jalons | Commenter | Inviter | Supprimer |
|---|---|---|---|---|---|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editor | ✅ | ✅ | ✅ | ❌ | ❌ |
| Viewer | ✅ | ❌ | ✅ | ❌ | ❌ |

Invitation par lien unique (expiration 7 jours). Suppression soft : délai 7 jours, réversible. 1 Owner par projet.

---

## 8. IA Assistant

### 8.1 Vue d'ensemble

Assistant conversationnel accessible depuis un panneau latéral (340px) via un bouton flottant. Fil de chat avec historique de session. Contextuel : l'IA reçoit un snapshot des données actuelles de l'utilisateur.

**Moteur** : Groq Llama 3.3 70B via Supabase Edge Function `ai-chat` (Deno).  
**Coût** : 0€ (quota gratuit Groq).

### 8.2 Saisie — deux modes

**Texte** : textarea + touche Entrée (ou bouton Envoyer). Maj+Entrée pour nouvelle ligne.

**Vocal** : bouton micro entre la textarea et le bouton Envoyer.
- Technologie : **Web Speech API native** (0€, zéro backend, zéro clé API)
- Clic → enregistrement ON (bouton rouge pulsant, icône MicOff)
- Clic → arrêt → transcript injecté dans la textarea
- Utilisateur relit/corrige avant d'envoyer (pas d'auto-envoi)
- Navigateurs supportés : Chrome, Edge, Safari 14.1+. Bouton grisé sur Firefox desktop.
- Erreurs gérées inline : permission refusée, aucun son détecté

### 8.3 Actions in-app

L'IA peut exécuter les actions suivantes directement dans l'app (sans navigation) :

| Action | Effet |
|---|---|
| `add_milestone` | Crée un jalon sur un projet existant |
| `add_action` | Crée une action du jour liée à un jalon |
| `add_time_block` | Crée un bloc horaire pour aujourd'hui |
| `add_domain` | Crée un nouveau domaine custom |
| `add_detour` | Documente un obstacle |
| `add_habit` | Crée une nouvelle habitude |

Chaque action est confirmée par un badge inline (succès / échec).

### 8.4 Règles de l'IA

- Répond **uniquement en français**
- Utilise le **vocabulaire strict** de l'app (jalon, bloc horaire, détour — jamais task, meeting, mistake)
- **Refuse** de créer ou modifier des projets (le wizard 7 étapes est obligatoire)
- Réponses JSON uniquement (côté backend)

---

## 9. Système d'engagement progressif et grades

### 9.1 Niveaux

| Niveau | Condition | Temps/jour | Ce qu'on fait |
|---|---|---|---|
| 1 — Découvreur | Défaut | 2 min | 1 action du jour + verset |
| 2 — Planificateur | Suggéré après 7j actifs | 8 min | Journal matin + actions + score |
| 3 — Bâtisseur | Suggéré après 7j au niv.2 | 15 min | Journal complet + time-blocking + revue du soir |

Promotion **suggérée, jamais imposée**. Rétrogradation douce après 3 jours d'inactivité.

### 9.2 Grades

| Grade | Condition |
|---|---|
| Découvreur | Défaut |
| Planificateur | Niveau 2 ou 3 |
| Bâtisseur Diligent | Streak ≥ 14j |
| Maître Bâtisseur | Streak ≥ 30j + 0 abandon depuis 90j |

Perte du grade Maître Bâtisseur si projet abandonné (perso ou business) dans les 90j.

### 9.3 Ce qui compte dans le streak (cross-espace)

✅ Check-in d'habitude · ✅ Valider une étape · ✅ Cocher une action · ✅ Créer au moins 1 bloc horaire · ✅ Valider une étape business (l'utilisateur lui-même)

❌ Activité des collaborateurs sur un projet partagé

---

## 10. Système de scoring pondéré

- Habitudes définies avec poids (total = 100%)
- Score du jour = somme des poids des habitudes cochées
- Score 7j = moyenne glissante · Score 30j = affiché dans le profil
- Alerte : 5 jours consécutifs de baisse → notification locale
- Streak reset : après exactement 2 jours sans check-in
- Score strictement personnel — jamais visible par les collaborateurs

---

## 11. Spécifications techniques

### 11.1 Stack

| Couche | Technologie | Version |
|---|---|---|
| Framework UI | React + TypeScript strict | 18.3.1 / 5.5.4 |
| Build | Vite | 5.4.8 |
| State | Zustand (19 stores) | 4.5.5 |
| Routing | React Router v6 | 6.26.2 |
| Persistance locale | Dexie.js v5 (IndexedDB — 16 tables) | 3.2.7 |
| Persistance business | Supabase (Postgres + RLS) | 2.103.0 |
| Sync perso | Supabase (pull/push + queue offline) | — |
| Edge Functions | Supabase Deno (ai-chat + push-notify) | — |
| IA | Groq API — Llama 3.3 70B | — |
| Saisie vocale | Web Speech API (native navigateur) | — |
| Charts | Recharts | 2.12.7 |
| Icons | Lucide React | 0.441.0 |
| Dates | date-fns | 3.6.0 |
| PWA | vite-plugin-pwa + Workbox | 1.2.0 |
| Tests | Vitest + Testing Library | — |
| Déploiement | Vercel (SPA avec vercel.json) | — |

### 11.2 Schéma de données

Se référer au document **DestinyPlanner — Base de données v2.2** pour le schéma Dexie v5 complet et les tables Supabase.

### 11.3 Contraintes de performance

| Contrainte | Valeur |
|---|---|
| Bundle JS gzippé (v1.x) | < 300 KB |
| Bundle JS gzippé (v2.0+) | < 350 KB |
| First Contentful Paint | < 1.5s |
| Interactions | < 100ms |
| Lighthouse Performance | > 90 |
| Lighthouse Accessibility | > 90 |

---

## 12. Résilience des données

### 12.1 Espace personnel — 4 couches locales + sync cloud

| Couche | Mécanisme |
|---|---|
| 1 | IndexedDB (principale — Dexie v5) |
| 2 | OPFS — survit au nettoyage de cache |
| 3 | Auto-backup JSON hebdomadaire (dimanche) → Downloads |
| 4 | Restauration auto si IndexedDB vide + OPFS existe |
| 5 (opt.) | Sync Supabase (pull/push après connexion OAuth) |

### 12.2 Espace business — Supabase

Backups Supabase automatiques. Cache IndexedDB pour lecture offline + écriture optimiste (mutationQueue). Replay auto à reconnexion. Export JSON d'un projet disponible avant suppression de compte.

---

## 13. Design et expérience utilisateur

> **Référence** : *DestinyPlanner — Design System v2.1* — unique pour toute l'application.

### 13.1 Direction artistique

| Élément | Valeur |
|---|---|
| Fond | `#0F0E0D` (noir chaud) — dark mode par défaut |
| Accent perso | Violet `#7B6FD4` |
| Accent business | Teal `#2DA58A` |
| Or (CTA, grades) | `#C49A3C` |
| Rouge enregistrement | `#E05050` (bouton micro actif) |
| Typographie | Inter (UI) + Fraunces (titres éditoriaux) |

### 13.2 Navigation — 6 sections

Sidebar desktop (200px fixe) / barre inférieure mobile (5 onglets + profil via avatar) :

1. **Dashboard** — Arbre de la Destinée + métriques
2. **Aujourd'hui** — actions du jour + timeline time-blocking 24h
3. **Projets** — projets personnels (accent violet)
4. **Journal** — routine matin + revue du soir
5. **Business** — projets collaboratifs (accent teal)
6. **Profil** — avatar + grade → ouvre la page Profil

**Assistant IA** : bouton flottant accessible depuis toutes les pages.

### 13.3 Parcours utilisateur type

**Première utilisation** : onboarding 3 écrans → premier but de vie → premier projet → wizard 7 étapes.

**Journée type (niveau 3)** :
1. Aujourd'hui → routine matin → verset → déclaration → 1 action → time-blocking
2. Dans la journée : cocher actions et blocs · Utiliser l'assistant vocal pour ajouter jalons
3. Soir : revue → bilan → blocs respectés → score → leçons

---

## 14. Règles métier

### 14.1 Parcours guidé

- Pas d'accès à l'étape N+1 sans valider l'étape N
- Retour toujours possible à une étape complétée
- Projet actif uniquement après validation de l'étape 7
- Auto-save à chaque frappe dans le wizard

### 14.2 Time-blocking

- Durée minimum : 15 minutes · Pas de chevauchement · Fenêtre configurable
- Cocher une action liée → coche automatiquement le bloc
- Cocher un bloc (revue soir) → `total_time_blocks_done++`

### 14.3 Module User

- `user_profile` est un singleton (1 enregistrement)
- Stats recalculées à chaque action significative
- Grade recalculé à chaque check-in
- Bio : optionnelle, 160 caractères max
- Avatar : emoji + couleur de fond (pas de photo en v1.x)
- `tutorial_done` : flag stocké en Dexie v5

### 14.4 Collaboration

- 1 Owner par projet business
- Editor ne peut pas inviter ni se promouvoir Owner
- Suppression soft : 7 jours, réversible
- Seul l'Owner supprime

### 14.5 Score d'attitudes

- Somme des poids = 100 toujours
- Alerte sur 5 jours de baisse consécutive
- Streak reset après exactement 2 jours sans check-in
- Score strictement personnel

### 14.6 Engagement progressif

- Promotion suggérée, jamais imposée
- Rétrogradation douce après 3 jours d'inactivité
- Aucun message négatif

### 14.7 Lien perso-business

- Stocké uniquement en local — jamais synchronisé
- Contribue au calcul de santé de l'Arbre de la Destinée
- Supprimé localement si le projet business est supprimé

### 14.8 Détours systémiques

- Signal si même obstacle ≥ 3 fois sur projets différents
- Toujours une suggestion — l'utilisateur confirme
- Si confirmé : habitude corrective créée automatiquement

### 14.9 IA Assistant

- L'IA refuse toute création ou modification de projet (wizard obligatoire)
- Saisie vocale : 1 dictée = 1 transcript injecté dans la textarea (pas d'auto-envoi)
- Historique de chat : session locale uniquement (non persisté entre sessions)
- Langue de réponse : français obligatoire

---

## 15. Banque de contenu spirituel

### 15.1 Versets (15)

Jérémie 29:11, Proverbes 20:18, Proverbes 21:5, Proverbes 16:1, Proverbes 12:5, Proverbes 19:21, Ésaïe 32:8, Ecclésiaste 9:10, Éphésiens 3:20, Proverbes 16:3, Proverbes 16:9, Luc 14:28-32, Apocalypse 13:8, Hébreux 12:2, Psaume 23:4.

### 15.2 Citations de Munroe (25) — contextuelles

Stockées avec `theme`, `step_affinity`, `tone` (`slow-down / courage / faith / discipline`).

À l'étape 3 (SWOT) → citations `slow-down` prioritaires. À l'étape 7 → citations `courage`.

### 15.3 Citations externes (2)

- **Zig Ziglar** : « Si vous n'avez pas d'objectif pour chaque jour, vous êtes simplement un rêveur. »
- **Gordon Inkley** : « On ne peut pas labourer un champ simplement en le retournant dans son esprit. »

---

## 16. Roadmap de développement

| Phase | Statut | Livrables |
|---|---|---|
| **MVP perso** (S1–4) | ✅ LIVRÉ | 7 étapes + buts de vie + engagement niv.1 + IndexedDB + OPFS + responsive |
| **V1.0 perso** (S5–8) | ✅ LIVRÉ | Dashboard + Arbre de la Destinée + journal + score pondéré + détours |
| **V1.2 perso** (S9–10) | ✅ LIVRÉ | Time-blocking 24h + module User (profil + stats + grades) |
| **V1.5 perso** (S11–14) | ✅ LIVRÉ | PWA offline + auto-backup + notifications + export + mode clair |
| **V2.0 business MVP** (S15–20) | ✅ LIVRÉ | Supabase + OAuth + espace business + 7 étapes entrepreneur + templates + rôles + invitation + sync perso |
| **V2.1 business** (S21–24) | ✅ LIVRÉ | 6 templates + commentaires + "qui fait quoi" + analytics + détours business |
| **V2.3 — IA + Vocal** | ✅ LIVRÉ | Assistant IA contextuel (Groq Llama 3.3 70B) + saisie vocale (Web Speech API) |
| **V2.5** | 📋 PLANIFIÉ | Timeline Gantt + lien perso-business complet + i18n EN |
| **V3.0** | 📋 PLANIFIÉ | Offline business amélioré + PWA push + contributions communautaires |

---

## 17. Critères de succès

### 17.1 KPIs — espace perso

- Rétention à 7 jours > 50%
- Taux de complétion du parcours 7 étapes > 60%
- Journal ≥ 5 jours/semaine (utilisateurs niv.2+)
- Score d'attitudes en hausse après 30 jours
- Taux de promotion niv.1 → niv.2 > 35% à 14 jours
- Taux d'adoption time-blocking > 40% (utilisateurs niv.3)
- **Taux d'adoption assistant vocal > 20% des sessions assistant**

### 17.2 KPIs — espace business

- Collaborateurs par projet > 2.5
- Adoption des templates > 70%
- Complétion 7 étapes business > 50%
- Commentaires par projet > 10 à 30 jours
- Jalons terminés dans les délais > 60%

### 17.3 KPIs techniques

- Lighthouse Performance > 90
- Lighthouse Accessibility > 90
- First Contentful Paint < 1.5s
- Bundle < 300 KB (v1.x), < 350 KB (v2.0+)
- Zéro perte de données perso en production

---

> *« Tu fais le projet, mais Dieu détermine les étapes. »* — Dr Myles Munroe

---

*DestinyPlanner — Cahier des charges v2.3 — Avril 2026*  
*Open source — Licence MIT*
