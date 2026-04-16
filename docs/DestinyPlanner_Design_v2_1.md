# DestinyPlanner — Design System v2.1

**Version** : 2.1 — Avril 2026
**Scope** : Spécifications visuelles et d'interaction — espace personnel v1.x + espace business v2.0
**Ce fichier ne contient pas de code** — référence pour tout développeur ou designer qui implémente l'UI.

> **v2.1 — ajouts** : composants Time-blocking (timeline 24h, bloc horaire, widget matin) et page Profil utilisateur (stats, grade, avatar, compte Supabase).

---

## 1. Direction artistique

### 1.1 Intention

DestinyPlanner est un SaaS premium de planification de vie. Le design doit inspirer confiance, donner envie de revenir chaque matin, et rendre les données vivantes et lisibles. L'utilisateur doit se sentir dans un outil sérieux — pas dans une appli de méditation.

**Positionnement visuel :** entre Notion (données denses) et Linear (dark mode soigné). Ni religieux, ni froid.

### 1.2 Mots-clés visuels

`Premium` · `Dense` · `Vivant` · `Ancré` · `Moderne`

### 1.3 Ce qu'on évite absolument

- Fond blanc ou ivoire — trop "journal intime"
- Illustrations naïves ou icônes colorées enfantines
- Gamification criarde (badges dorés clignotants)
- Style "application religieuse" (vitraux, calligraphie, croix)
- Formulaires longs sur fond blanc
- Animations de chargement inutiles
- Playfair Display ou DM Sans — typographies abandonnées en v2.0

### 1.4 Références visuelles

- **Linear** — dark mode, densité d'info, typographie serrée
- **Raycast** — commandes fluides, espacement généreux dans le dense
- **Vercel Dashboard** — métriques, sparklines, progression
- **Cron** — sidebar propre, navigation épurée

---

## 2. Palette de couleurs

### 2.1 Fond et surfaces (dark mode par défaut)

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0F0E0D` | Fond de l'application — presque noir chaud |
| `--sidebar` | `#141312` | Fond sidebar — légèrement plus clair |
| `--surface` | `#1C1B18` | Cartes, panneaux principaux |
| `--surface-2` | `#242320` | Cartes imbriquées, inputs, zones secondaires |
| `--border` | `#2A2824` | Bordures standard (très subtiles) |
| `--border-2` | `#353330` | Bordures hover, inputs focus off |

Le fond n'est pas `#000000` mais `#0F0E0D` — un noir légèrement chaud qui ne fatigue pas les yeux.

### 2.2 Texte

| Token | Hex | Usage |
|---|---|---|
| `--text-1` | `#F0EDE6` | Texte principal — blanc cassé chaud |
| `--text-2` | `#8A8780` | Texte secondaire — labels, descriptions |
| `--text-3` | `#4A4845` | Texte tertiaire — placeholders, hints |

### 2.3 Accent principal — Or

L'or est la couleur de la planification, de la vision, de la destinée. Seule couleur d'accent globale — utilisée avec parcimonie.

| Variante | Hex | Usage |
|---|---|---|
| `--gold` | `#C49A3C` | CTA principal, bordure active, grade Maître Bâtisseur |
| `--gold-soft` | `#E8C96A` | Icônes highlights, sparklines actives, valeurs métriques |
| `--gold-pale` | `rgba(196,154,60,0.12)` | Fond de carte citation/verset, fond blocs spirituels |
| `--gold-text` | `#8B6914` | Texte sur fond gold pâle (mode light uniquement) |

### 2.4 Couleurs des 7 étapes du wizard

| Étape | Couleur | Hex | Fond teinté |
|---|---|---|---|
| 1 — Vision | Violet | `#7B6FD4` | `rgba(123,111,212,0.18)` |
| 2 — S'arrêter | Bleu | `#5B9BD4` | `rgba(91,155,212,0.15)` |
| 3 — Estimer (SWOT) | Teal | `#2DA58A` | `rgba(45,165,138,0.08)` |
| 4 — Coût | Ambre | `#D4854A` | `rgba(212,133,74,0.15)` |
| 5 — Calculer | Vert | `#5A9E6F` | `rgba(90,158,111,0.15)` |
| 6 — Vérifier | Corail | `#E07070` | `rgba(224,112,112,0.15)` |
| 7 — S'engager | Or | `#C49A3C` | `rgba(196,154,60,0.15)` |

### 2.5 Couleurs sémantiques

| Rôle | Hex | Usage |
|---|---|---|
| `--green` | `#5A9E6F` | Succès, terminé, domaine sain, delta positif |
| `--amber` | `#D4854A` | Attention, pause, obstacle systémique |
| `--coral` | `#E07070` | Danger, bloqué, domaine surchargé |
| `--blue` | `#5B9BD4` | Info, notifications neutres, blocs "rest" |
| `--purple` | `#7B6FD4` | Accent espace perso, blocs "work" |
| `--teal` | `#2DA58A` | Accent espace business, blocs "health" |

### 2.6 Tags et badges — recette standard

```
Fond   : rgba(hex, 0.15–0.18)
Texte  : version claire de la couleur (+30% lightness)
Radius : 6px (--r-sm)
```

| Tag | Fond | Texte |
|---|---|---|
| purple | `rgba(123,111,212,0.18)` | `#A89EE8` |
| teal | `rgba(45,165,138,0.15)` | `#5DCAA5` |
| amber | `rgba(212,133,74,0.15)` | `#E8A870` |
| green | `rgba(90,158,111,0.15)` | `#7DC499` |
| coral | `rgba(224,112,112,0.15)` | `#E89090` |
| gold | `rgba(196,154,60,0.15)` | `#E8C96A` |

### 2.7 Santé des domaines (Arbre de la Destinée)

| État | Couleur ligne | Fond cercle | Condition |
|---|---|---|---|
| Sain | couleur du domaine | `{couleur}22` | 1–2 projets actifs |
| Desséché | `#E07B39` | `rgba(224,123,57,0.15)` | 0 projet actif |
| Surchargé | `#E07070` | `rgba(224,112,112,0.15)` | 3+ projets actifs |
| Endormi | `#4A4845` | `rgba(74,72,69,0.2)` | Tous en pause |

### 2.8 Couleurs des blocs horaires (time-blocking) *(v2.1)*

Les blocs dans la timeline suivent une logique de priorité de couleur :

| Priorité | Source | Couleur |
|---|---|---|
| 1 | `color_override` défini par l'utilisateur | Couleur personnalisée |
| 2 | Domaine de l'action liée | Couleur identitaire du domaine |
| 3 | Catégorie du bloc | Voir tableau ci-dessous |
| 4 | Défaut | `--surface-2` |

| Catégorie | Token | Usage |
|---|---|---|
| `work` | `--purple` | Travail, rédaction, appels, réunions |
| `spiritual` | `--gold` | Prière, lecture biblique, méditation |
| `family` | `--green` | Repas, temps avec les enfants |
| `health` | `--teal` | Sport, marche, médecin |
| `rest` | `--blue` | Sieste, détente, loisirs |
| `free` | `--surface-2` | Non catégorisé |

Style d'un bloc dans la timeline :
```
Fond    : rgba(couleur, 0.15)
Bordure : 2px solid rgba(couleur, 0.4) — côté gauche uniquement (border-left)
Radius  : --r-sm (6px)
```

### 2.9 Mode clair (optionnel, v1.5)

| Élément | Dark | Light |
|---|---|---|
| Background | `#0F0E0D` | `#F5F3EE` |
| Surface | `#1C1B18` | `#FFFFFF` |
| Surface-2 | `#242320` | `#F0EDE6` |
| Texte 1 | `#F0EDE6` | `#1C1B18` |
| Texte 2 | `#8A8780` | `#6B6B6B` |
| Bordure | `#2A2824` | `#E0DDD6` |
| Or | `#C49A3C` | `#B08930` |

---

## 3. Typographie

### 3.1 Familles de polices

| Rôle | Famille | Import |
|---|---|---|
| UI, labels, corps, métriques | **Inter** | Google Fonts — weights: 400, 500, 600, 700 |
| Titres éditoriaux (But de vie, grade) | **Fraunces** | Google Fonts — weights: 400, 600 |
| Chiffres métriques | **Inter** avec `font-variant-numeric: tabular-nums` | — |

Inter est la police standard des SaaS premium (Linear, Vercel, Notion). Fraunces est un serif moderne à caractère fort — réservé aux rares titres "de sens".

### 3.2 Échelle typographique

| Niveau | Famille | Taille | Poids | Interligne | Usage |
|---|---|---|---|---|---|
| `display` | Fraunces | 26px | 600 | 1.2 | Mission de vie, titre d'onboarding |
| `h1` | Inter | 20px | 600 | 1.3 | Titre de page |
| `h2` | Inter | 15px | 600 | 1.4 | Titre de section |
| `h3` | Inter | 13px | 500 | 1.5 | Nom de projet, jalon, action |
| `body` | Inter | 13px | 400 | 1.7 | Corps de texte |
| `small` | Inter | 12px | 400 | 1.6 | Métadonnées, dates, durées |
| `micro` | Inter | 11px | 500 | 1.4 | Tags, badges, compteurs, section-labels |
| `metric` | Inter | 26–28px | 700 | 1.0 | Valeurs clés (score, projets, jours) |
| `verse` | Inter | 13px | 400 italic | 1.8 | Citations et versets |
| `time` | Inter | 11px | 600 | 1.0 | Horaires dans la timeline (09:00, 10:30) |

### 3.3 Section labels — pattern récurrent

```css
font-size      : 11px;
font-weight    : 600;
color          : var(--text-2);
letter-spacing : 0.08em;
text-transform : uppercase;
margin-bottom  : 12px;
```

Exemples : `PROJETS RÉCENTS`, `ACTIONS DU JOUR`, `SCORE D'ATTITUDES`, `TIMELINE`, `STATISTIQUES`

### 3.4 Règles

- Jamais de majuscules complètes sur h1–h3 — uniquement sur les section-labels
- Métriques numériques : `font-variant-numeric: tabular-nums`
- Deltas (`+6pts`, `+2 ce mois`) : 11px sous la valeur, --green ou --coral selon direction
- Versets et citations : toujours italique, jamais gras, sur fond gold-pale
- Horaires dans la timeline : toujours `tabular-nums`, `font-weight 600`, 11px

---

## 4. Espacement et grille

### 4.1 Unité de base : 4px

| Token | Valeur | Usage principal |
|---|---|---|
| `--s-1` | 4px | Gap interne minimum |
| `--s-2` | 8px | Gap entre éléments d'une row |
| `--s-3` | 12px | Padding badge, gap entre petites cartes |
| `--s-4` | 16px | Padding standard d'une carte |
| `--s-5` | 20px | Gap entre sections |
| `--s-6` | 24px | Padding de page |
| `--s-8` | 32px | Espace vertical entre blocs majeurs |

### 4.2 Layout desktop

```
┌─────────────────────────────────────────────────────┐
│ Sidebar 200px fixe    │  Zone contenu fluid          │
│ fond --sidebar        │  max-width 920px             │
│ bordure droite        │  padding 24px                │
│                       │                              │
│  Logo                 │  [Page Header]               │
│  Navigation           │  [Contenu]                   │
│  ───────────          │                              │
│  Avatar + grade       │                              │
└─────────────────────────────────────────────────────┘
```

Mobile (< 768px) : sidebar → barre inférieure 5 onglets, contenu full-width.

### 4.3 Grilles de contenu

| Grille | Colonnes CSS | Usage |
|---|---|---|
| `grid-4` | `repeat(4, 1fr)` | Métriques clés (dashboard) |
| `grid-3` | `repeat(3, 1fr)` | Résumés, statistiques profil |
| `grid-2` | `1fr 1fr` | Sections côte à côte (Today : actions + timeline) |
| `grid-list` | `1fr` | Liste de projets, actions |

Toutes les grilles passent en `1fr` sous 640px.

### 4.4 Rayons de bordure

| Token | Valeur | Usage |
|---|---|---|
| `--r-sm` | 6px | Badges, tags, inputs, step pills, blocs horaires |
| `--r-md` | 10px | Boutons, petites cartes imbriquées |
| `--r-lg` | 14px | Cartes principales |
| `--r-xl` | 20px | Modales, bottom sheets |
| `--r-full` | 9999px | Avatar, check circles |

---

## 5. Composants

### 5.1 Boutons

**Primaire (or)** — une seule instance par écran

```
Fond       : --gold (#C49A3C)
Texte      : #0F0E0D · font-weight 600 · font-size 12px
Padding    : 8px 16px
Radius     : --r-md
Hover      : opacity 0.88
Active     : scale(0.97)
```

**Secondaire (ghost dark)**

```
Fond       : --surface-2
Bordure    : 1px solid --border-2
Texte      : --text-1 · font-weight 500 · font-size 12px
Padding    : 7px 14px
Radius     : --r-md
Hover      : background → --surface
```

**Fantôme destructif**

```
Fond       : transparent · Texte --coral
Hover      : fond rgba(224,112,112,0.08)
```

### 5.2 Cartes

**Carte standard**

```
Fond    : --surface
Bordure : 1px solid --border
Radius  : --r-lg
Padding : 16px
```

**Carte citation/verset**

```
Fond    : --gold-pale
Bordure : 1px solid rgba(196,154,60,0.2)
Radius  : --r-lg
Texte   : italique 13px --text-1 · line-height 1.7
Source  : 11px --gold font-weight 500
```

**Carte alerte (détour systémique)**

```
Fond    : rgba(212,133,74,0.08)
Bordure : 1px solid rgba(212,133,74,0.2)
Radius  : --r-md
Icône   : triangle amber 14px
```

**Carte statistique (profil)** *(v2.1)*

```
Fond    : --surface
Bordure : 1px solid --border
Radius  : --r-lg
Padding : 14px 16px
Layout  : flex · align-items center · gap 12px

Icône   : emoji 18px OU Lucide SVG 16px · couleur identitaire
Label   : 11px · --text-2 · uppercase · letter-spacing 0.06em
Valeur  : 20px · font-weight 700 · --text-1 · tabular-nums
```

### 5.3 Métriques clés — dashboard header

```
Card : --surface · bordure --border · --r-lg · padding 16px

Label   : section-label (11px uppercase) + icône SVG 12px inline
Valeur  : 26px · font-weight 700 · couleur identitaire de la métrique
Delta   : 11px · --green (positif) ou --coral (négatif)
          Exemple : "+6pts cette semaine", "+2 ce mois"
```

### 5.4 Barre de progression

```
Track  : height 4px · --border · radius 2px
Fill   : couleur identitaire du projet ou étape
         transition: width 500ms ease
Label  : 12px · font-weight 600 · couleur identitaire · à droite
```

Règle : si progression = 0, afficher "Pas encore commencé" en --text-3, pas "0%".

### 5.5 Step pills — wizard

7 pills horizontaux pour l'indicateur de progression du wizard.

```
DONE (étape validée)
  background : rgba(couleur-étape, 0.18)
  color      : version claire de la couleur
  border     : 1px solid rgba(couleur-étape, 0.3)
  icône      : check SVG 10px

ACTIVE (étape courante)
  background : rgba(couleur-étape, 0.18)
  color      : version claire
  border     : 1.5px solid couleur-étape  ← plus épais
  icône      : cercle SVG 10px

LOCKED (verrouillée)
  background : --surface-2
  color      : --text-2
  border     : 1px solid --border
  opacity    : 0.35
  cursor     : not-allowed
```

Tap sur LOCKED → vibration haptic (mobile) + tooltip "Complétez d'abord l'étape précédente."

### 5.6 Check box et check circle

**Check box rectangulaire** — actions du jour

```
16px × 16px · border-radius 4px
Off : bordure 1.5px --border-2
On  : fond --green · icône polyline blanche stroke-width 2.5
Transition : all 150ms ease
```

**Check circle** — habitudes

```
20px diamètre · border-radius 50%
Off : bordure 1.5px --border-2
On  : fond --gold · icône polyline blanche
Transition : all 200ms ease + scale(1.15) au moment du clic
```

**Check circle "bloc respecté"** — revue du soir *(v2.1)*

```
18px diamètre · border-radius 50%
Off : bordure 1.5px --border-2 · --text-3
On  : fond couleur du bloc · icône polyline blanche
Transition : all 200ms ease
```

### 5.7 Inputs et formulaires

**Input texte**

```
Height      : 36px
Fond        : --surface-2
Bordure     : 1px solid --border-2
Radius      : --r-md
Padding     : 10px 14px
Font        : 13px Inter · --text-1
Placeholder : --text-3
Focus       : border-color → --gold (pas de box-shadow glow)
```

**Textarea**

```
Même style · min-height 72px · resize: vertical · line-height 1.6
```

**SWOT textarea (étape 3)** — fond teinté par quadrant :

```
Forces        : fond rgba(90,158,111,0.08)  · bordure rgba(90,158,111,0.2)
Faiblesses    : fond rgba(212,133,74,0.08)  · bordure rgba(212,133,74,0.2)
Opportunités  : fond rgba(91,155,212,0.08)  · bordure rgba(91,155,212,0.2)
Menaces       : fond rgba(224,112,112,0.08) · bordure rgba(224,112,112,0.2)

Label quadrant : 10px · font-weight 700 · uppercase · letter-spacing 0.08em
```

**Input horaire (time-blocking)** *(v2.1)*

```
Même style que input texte · width 80px
Font  : 12px · font-weight 600 · tabular-nums · --text-1
Format: HH:MM (24h) — pas d'AM/PM
```

**Label de champ**

```
11px · font-weight 600 · --text-2 · uppercase · letter-spacing 0.05em
margin-bottom : 6px · display block
```

### 5.8 Sidebar — navigation

```
Fond           : --sidebar (#141312)
Bordure droite : 1px solid --border
Largeur        : 200px fixe

Logo
  15px · font-weight 600 · color --gold
  sous-titre : 11px · --text-2 · font-weight 400

Section label
  10px · font-weight 600 · --text-3 · uppercase · letter-spacing 0.08em
  padding : 16px 16px 6px

Nav item
  padding   : 9px 16px · font-size 12px · font-weight 500
  icône SVG : 16px · opacity 0.7 · stroke-width 1.5
  inactif   : --text-2
  hover     : --text-1 · fond --surface
  actif     : --text-1 · fond --surface · bordure droite 2px --gold

Avatar row (bas de sidebar) — lien vers page Profil
  padding    : 12px 16px · border-top 1px solid --border
  cursor     : pointer · hover : fond --surface
  avatar     : 28px · border-radius 50% · fond gold-pale · bordure 1px --gold
               emoji centré 16px OU initiales --gold 11px font-weight 600
  grade      : 10px · --gold · font-weight 500
  flèche     : Lucide ChevronRight 12px · --text-3 · margin-left auto
```

### 5.9 Rows de liste (projets, actions, habitudes)

```
padding        : 11px 0 (projets) / 9px 0 (actions) / 10px 0 (habitudes)
border-bottom  : 1px solid --border · :last-child border-bottom none
cursor         : pointer · hover : opacity 0.8

Icône projet   : 32–36px · --r-md · fond teinté couleur du domaine
Nom            : 13–14px · font-weight 500 · --text-1
Métadonnée     : 11px · --text-2 · "Domaine · Étape · Jalons"
Progression    : valeur 12px font-weight 600 + barre 60px · à droite
```

### 5.10 Sparkline — graphique d'activité

Canvas 2D, résolution ×2 pour Retina.

```
Fond         : transparent
Ligne        : strokeStyle --gold · lineWidth 1.5
Aire         : gradient vertical gold (alpha 0.25) → transparent (0)
Points       : cercle 3px · fond --surface · stroke --gold
Point actif  : fond --gold · label valeur au-dessus (bold 9px)
Labels X     : L M M J V S D · font 9px · --text-3
```

### 5.11 Donut score d'attitudes

```
Canvas 2D · 80px diameter · scale ×2
Arc fond   : strokeStyle --border · lineWidth 7px
Arc fill   : strokeStyle --gold · lineWidth 7px · lineCap round
             Angle de départ : -Math.PI/2 (12h)
Valeur     : texte à côté du canvas 28px font-weight 700 --gold
Delta      : 12px --green en dessous
```

7 points de la semaine sous le donut :

```
18px diamètre · border-radius 50%
score > 75 : --green
score > 60 : --gold
score ≤ 60 : --coral
valeur en blanc 8px centré dans le cercle
```

### 5.12 Arbre de la Destinée — canvas interactif

Canvas 2D ou SVG full-width, hauteur 380px.

```
Nœud central (But de vie)
  Cercle 36px · fond gold-pale · bordure 1.5px --gold 40% opacity
  "Destinée" 13px bold --gold · "But de vie" 10px en dessous

Lignes de connexion (setLineDash [4,4])
  Sain      : rgba(255,255,255,0.12) · lineWidth 1
  Desséché  : rgba(224,123,57,0.3) · lineWidth 1
  Surchargé : rgba(224,112,112,0.4) · lineWidth 1

Nœuds domaines (6 satellites)
  Rayon : 22 + (nb_projets × 5)px
  Fond  : {couleur-domaine}22
  Bordure : couleur-domaine · lineWidth 1.5 si surchargé/desséché
  Nom   : bold 10–13px couleur-domaine
  État  : 9px rgba(255,255,255,0.5)

Interaction onClick
  Distance clic → centre nœud
  Si dist < rayon → afficher état dans zone dédiée (pas de popup flottant)
  Domaine desséché → lien "Créer un projet" dans zone dédiée
```

### 5.13 Timeline 24h — time-blocking *(v2.1)*

Composant `TimelineView.tsx`. Scrollable verticalement. Hauteur visible : 400px desktop, full-height mobile.

```
Layout général
  Colonne gauche  : 40px · horaires (HH:MM) · 11px tabular-nums · --text-3
  Colonne droite  : flex-1 · blocs horaires

Lignes horaires
  border-top 1px solid --border · opacity 0.4
  Toutes les heures : label visible
  Demi-heures       : ligne plus courte · pas de label · opacity 0.2

Bloc horaire (TimeBlockCard)
  Position      : absolute · calculée depuis start_time et end_time
  Padding       : 6px 10px
  Border-left   : 3px solid {couleur-bloc}
  Fond          : rgba({couleur-bloc}, 0.12)
  Radius        : --r-sm
  Min-height    : 24px (représente 15 minutes)

  Layout interne
    Ligne 1 : Titre · 12px · font-weight 500 · --text-1 (tronqué si bloc < 30min)
    Ligne 2 : Durée + catégorie · 10px · --text-2
              Exemple : "45min · Travail"
    Ligne 3 : Traçabilité action liée (si action_id)
              "→ Appeler 3 clients" · 10px italic --text-3

  État DONE (bloc respecté)
    opacity : 0.5
    Titre   : text-decoration line-through
    Check   : icône 10px --green à droite

  Hover
    fond   : rgba({couleur-bloc}, 0.20)
    cursor : pointer

Heure courante (trait rouge)
  position : absolute · border-top 1.5px solid --coral
  Point    : cercle 6px --coral · margin-left -3px
  Visible  : uniquement si l'heure courante est dans la fenêtre du jour
```

**Bouton "+ Ajouter un bloc"**

```
Position : sticky en bas de la timeline
Style    : bouton ghost · fond --surface-2 · bordure dashed 1px --border-2
           "+" Lucide Plus 14px · "Ajouter un bloc" · 12px --text-2
```

### 5.14 Widget time-blocking — routine matin *(v2.1)*

Composant intégré dans `MorningRoutine.tsx`. Accessible depuis la routine du matin.

```
Card --surface · --r-lg · padding 16px

En-tête
  Lucide Calendar 14px --gold
  "Planifier ma journée" · 13px font-weight 500 --text-1
  Badge : "X blocs · Y heures planifiées" · 11px --text-2

Corps (si aucun bloc)
  Message état vide : "Aucun bloc planifié pour aujourd'hui."
  CTA ghost : [+ Ajouter mon premier bloc →]

Corps (si blocs existants)
  Liste compacte des blocs du jour (max 4 visibles)
    Barre couleur 3px · titre · horaire · check circle si done
  Lien "Voir la timeline complète →" si > 4 blocs

Bouton principal
  [Ouvrir la timeline →] → scroll vers la zone timeline dans Today.tsx
```

### 5.15 Grade badge *(v2.1)*

Affiché dans la sidebar (bas) et dans la page Profil.

```
Découvreur
  Fond : --surface-2 · Texte : --text-2 · Icône : Lucide Compass 12px

Planificateur
  Fond : rgba(91,155,212,0.12) · Texte : --blue · Icône : Lucide Map 12px

Bâtisseur Diligent
  Fond : rgba(90,158,111,0.12) · Texte : --green · Icône : Lucide HardHat 12px

Maître Bâtisseur
  Fond : --gold-pale · Texte : --gold · Icône : Lucide Crown 12px
  Border : 1px solid rgba(196,154,60,0.3)
```

### 5.16 Avatar utilisateur *(v2.1)*

Composant partagé — sidebar, page Profil, commentaires business.

```
Taille sidebar  : 28px · border-radius 50%
Taille profil   : 64px · border-radius 50%
Taille comment  : 24px · border-radius 50%

Fond      : avatar_color (défaut --gold-pale)
Contenu   : avatar_emoji centré (taille = 55% du diamètre)
            OU initiales si pas d'emoji (font-weight 600 --gold)
Bordure   : 1.5px solid rgba({avatar_color}, 0.4)
```

**Sélecteur d'avatar (AvatarPicker)** :

```
Grille emoji : 5×4 = 20 emojis prédéfinis
  🌟 🦁 🦅 🔥 ⚡ 🌱 💎 🎯 🚀 🏔️
  🌊 ✨ 🦋 🎶 📖 🌙 ☀️ 🌿 🏗️ 👑

Sélecteur couleur : 8 couleurs
  --gold-pale · rgba(purple,0.2) · rgba(teal,0.2) · rgba(green,0.2)
  rgba(blue,0.2) · rgba(coral,0.15) · rgba(amber,0.15) · --surface-2
```

---

## 6. Visualisations de données

### 6.1 Principes

- Canvas 2D (pas de lib externe pour les viz simples)
- Résolution ×2 : `canvas.width = offsetWidth * 2; ctx.scale(2,2)`
- Fond transparent — la carte fournit le fond
- Or pour la donnée principale, couleurs sémantiques pour les comparaisons
- Labels : Inter 9px, --text-3 pour les axes, --text-1 pour les valeurs actives

### 6.2 Sparkline 7 jours (dashboard)

Line chart avec aire remplie · données : score quotidien · hauteur 60px · couleur --gold

### 6.3 Courbe tendance 30 jours (habitudes et profil)

Même style · hauteur 120px · label "30 derniers jours" en bas gauche. Affiché aussi dans la page Profil pour le score moyen 30j.

### 6.4 Barres de progression projet

Inline dans les rows. CSS pur — jamais de canvas.

```
Largeur : 60px (liste) · 100% (détail projet) · hauteur 4px
Couleur : couleur identitaire du domaine du projet
```

### 6.5 Couverture horaire journée (time-blocking) *(v2.1)*

Barre horizontale dans le widget routine matin.

```
Track  : height 6px · width 100% · --border · radius 3px
Fill   : gradient multi-couleur selon les catégories de blocs planifiés
Label  : "X heures planifiées sur Y disponibles" · 11px --text-2
```

---

## 7. Navigation

### 7.1 Desktop — sidebar (≥ 768px)

6 sections dans la sidebar :

```
PERSO
  Dashboard
  Aujourd'hui      ← timeline time-blocking intégrée
  Projets
  Journal

BUSINESS (v2.0)
  Business

──────────────

[Avatar] Prénom · Grade  [›]  ← lien vers page Profil
```

### 7.2 Mobile — barre inférieure (< 768px)

```
Hauteur  : 56px + safe-area-inset-bottom
Fond     : --sidebar · border-top 1px --border
5 onglets : Accueil · Projets · Aujourd'hui · Journal · Profil

Actif   : icône + label --gold
Inactif : icône + label --text-2 · opacity 0.7
Icône   : Lucide SVG 20px · stroke-width 1.5
Label   : 10px · font-weight 500
```

### 7.3 En-tête de page

```
flex · justify-content space-between · align-items flex-start · margin-bottom 24px

Gauche
  h1 : 20px · font-weight 600 · --text-1 · letter-spacing -0.4px
  Sous-titre : 12px · --text-2 (ou --gold si info critique comme le streak)

Droite
  Bouton primaire (action principale de la page)
```

---

## 8. Écrans clés — wireframes annotés

### 8.1 Dashboard

```
[En-tête] "Bonjour, Jean" / Mission en --gold tronquée 60 chars   [+ Nouveau projet]

[grid-4]  Projets actifs (--purple) / Score (--gold) / Jalons (--green) / Streak (--teal)
          Pattern : icon 12px · label · valeur 26px bold · delta 11px

[grid-2 align-start]
  Gauche                              Droite
  ├─ Card "Activité 7 jours"         ├─ Card "Actions du jour" (cochables)
  │   sparkline canvas gold           │   action-row × 3 · traçabilité → jalon
  └─ Card "Projets récents"          └─ Card citation (--gold-pale)
      project-row × 3
      nom · domaine badge · étape · barre progression
```

### 8.2 Arbre de la Destinée

```
[En-tête] "Arbre de la Destinée"                                  [zone tooltip]

[Card full-width]  Canvas interactif 380px
  Nœud central · 6 satellites · clic → tooltip dans zone header

[grid-3]  Domaines sains (--green) / Desséchés (--amber) / Surchargés (--coral)
```

### 8.3 Wizard — Étape 3 SWOT

```
[En-tête] "Nouveau projet" / nom du projet                        [Sauvegarder brouillon]

[Card pills]  7 step pills · done · done · active · locked × 4

[Bandeau citation]  fond teal-pale · verset ancrage italique

[Card principale]
  Titre : cercle "3" teal 24px + "Analyse SWOT" + nom projet

  [SWOT 2×2]
    Forces (vert)    │ Faiblesses (ambre)
    ─────────────────┼─────────────────
    Opportunités     │ Menaces
    (bleu)           │ (corail)
    Chaque cellule : label 10px uppercase + textarea fond teinté

  Footer : [← Étape précédente]  "Étape 3 sur 7"  [Valider →]
```

### 8.4 Aujourd'hui *(mis à jour v2.1)*

```
[En-tête] "Aujourd'hui" / date + niveau                          [+ Ajouter une action]

[grid-2 align-start]
  Gauche                              Droite
  ├─ Card routine matin (--gold-pale) ├─ Timeline 24h (scrollable, 400px)
  │   verset · déclaration textarea   │   Colonne horaires 40px + blocs
  │   1 action destinée               │   Heure courante (trait --coral)
  │   Widget planification 24h →      │   Blocs colorés par domaine/catégorie
  │                                   │   [+ Ajouter un bloc] sticky bas
  ├─ Card actions du jour             │
  │   action-row × N cochables       │
  │   traçabilité → jalon → projet   │
  │                                   │
  └─ Card donut score + 7 dots       │
```

Mobile : timeline en section scrollable après les actions, accessible par scroll vertical.

### 8.5 Habitudes

```
[En-tête] "Habitudes" / tagline Munroe                           [+ Ajouter]

[grid-2]
  Card check-in du jour               Card tendance 30 jours
  habit-row × N · circles cliquables  canvas courbe gold
  Nom · Poids · Tag pts or
```

### 8.6 Page Profil *(NOUVELLE v2.1)*

```
[En-tête] "Profil"                                               [Modifier]

[Card identité]
  [Avatar 64px]  Prénom (display Fraunces 20px)
                 Bio (13px --text-2, italic si vide)
                 [Grade badge]  [Niveau badge]

[Section "STATISTIQUES"]
[grid-3]
  🔥 Streak actuel      42j
  🏆 Meilleur streak    58j
  ✅ Projets terminés   7
  ⚡ Actions faites     234
  📔 Entrées journal    89
  🕐 Blocs respectés    156

[Card score moyen]
  Section-label "SCORE D'ATTITUDES — 30 JOURS"
  Valeur 28px bold --gold : "78%"
  Sparkline 30j gold · hauteur 60px

[Section "ESPACE BUSINESS"]
  SI NON CONNECTÉ :
    --text-2 13px : "Pour collaborer sur des projets, connecte un compte."
    [Se connecter avec Google]   bouton ghost · logo Google 14px
    [Se connecter avec GitHub]   bouton ghost · logo GitHub 14px

  SI CONNECTÉ :
    Avatar OAuth 28px + email 12px --text-2
    [Gérer mon compte]   bouton ghost secondaire
    [Me déconnecter]     bouton fantôme destructif --coral
```

---

## 9. Animations et micro-interactions

### 9.1 Principes

- Toute animation communique un changement d'état
- Durées courtes — interface réactive
- `@media (prefers-reduced-motion: reduce)` : toutes animations désactivées

### 9.2 Catalogue

| Événement | Animation | Durée | Easing |
|---|---|---|---|
| Navigation entre pages | Fade opacity 0→1 | 150ms | ease-out |
| Check action du jour | Scale 1→1.15→1 + fond --green | 200ms | ease |
| Check habitude | Scale + fond --gold | 200ms | ease |
| Check bloc horaire (revue soir) | fond couleur-bloc · opacity 0.5 | 200ms | ease |
| Création d'un bloc horaire | Slide-in depuis le haut de la timeline | 200ms | ease-out |
| Validation étape wizard | Pill → done + slide vers suivante | 300ms | ease-in-out |
| Barre de progression | Remplissage smooth | 500ms | ease-out |
| Streak augmenté | Counter animé | 400ms | ease-out |
| Grade Maître Bâtisseur | Particules dorées légères (une seule fois) | 2000ms | ease-out |
| Nœud arbre hover | scale(1.05) | 200ms | ease |
| Domaine desséché | Pulsation douce (3 cycles max) | 800ms/cycle | ease-in-out |
| Sauvegarde auto | Icône check apparaît 1.5s puis disparaît | 150ms | fade |
| Bloc horaire hover | fond → rgba(couleur, 0.20) | 150ms | ease |

### 9.3 Ce qu'on n'anime pas

- Le fond de page
- Les textes (pas de typewriter)
- Les icônes en rotation permanente
- Les couleurs de fond de carte
- La timeline (pas d'auto-scroll — l'utilisateur scrolle librement)

---

## 10. Onboarding (3 écrans)

Sans inscription. Rapide.

### Écran 1 — La tour

```
[Illustration SVG minimaliste : silhouette de tour, trait --gold]
Titre (Fraunces 24px) : "Supposons que vous vouliez construire une tour..."
Citation (Inter italic 14px --text-2) : "Ne s'assoit-il pas d'abord pour calculer ?"
Bouton primaire : "Commencer à planifier →"
```

### Écran 2 — Prénom

```
Titre : "Comment vous appelez-vous ?"
Input prénom
Note (--text-3) : "Aucun compte requis. Tout reste sur votre appareil."
Bouton primaire : "Continuer →"
```

### Écran 3 — Niveau

```
Titre : "Combien de temps avez-vous chaque matin ?"
3 cartes radio cliquables :
  ○ 2 min  "Je découvre"         · tag --text-2
  ○ 8 min  "Je m'engage"         · tag --teal
  ○ 15 min "Je bâtis chaque jour"· tag --gold
Bouton primaire : "Démarrer DestinyPlanner →"
```

---

## 11. États vides

| Écran | Message | CTA |
|---|---|---|
| Projets (aucun) | "Quelle tour voulez-vous construire ?" | + Créer mon premier projet |
| Actions du jour | "Une action vers votre destinée, aujourd'hui." | + Ajouter une action |
| Timeline (aucun bloc) | "Planifiez vos 24h avec intention." | + Ajouter un bloc |
| Journal (pas fait) | "Commencez avec intention." | Ouvrir la routine matin |
| Arbre (tous vides) | "Votre destinée attend vos projets." | + Créer un projet |
| Habitudes (aucune) | "Vos attitudes dessinent votre avenir." | + Ajouter une habitude |
| Profil (bio vide) | italic --text-3 : "Ajoutez une courte description." | Icône crayon inline |

```
Style état vide :
  Icône SVG  : 40px · --text-3 · centrée
  Message    : 15px · --text-2 · centré · line-height 1.6
  CTA        : bouton ghost · margin-top 16px
```

---

## 12. Accessibilité

- Contraste : minimum 4.5:1 pour tout texte body sur fond dark
- Focus visible : outline 2px solid --gold sur tous les éléments interactifs clavier
- Cible tactile : minimum 44×44px (nav items, check boxes, habit circles, blocs horaires)
- Labels aria : tout input a un `aria-label` ou `<label>` associé
- Pas de couleur seule : chaque état coloré a aussi un texte ou icône
- Réduction de mouvement : toutes animations sous `@media (prefers-reduced-motion: no-preference)`
- `lang="fr"` sur `<html>`
- Timeline : navigable au clavier (Tab entre blocs, Enter pour ouvrir, Escape pour fermer)

---

## 13. Tokens CSS — référence complète

```css
:root {
  /* Fonds */
  --bg:        #0F0E0D;
  --sidebar:   #141312;
  --surface:   #1C1B18;
  --surface-2: #242320;

  /* Bordures */
  --border:    #2A2824;
  --border-2:  #353330;

  /* Texte */
  --text-1:    #F0EDE6;
  --text-2:    #8A8780;
  --text-3:    #4A4845;

  /* Or */
  --gold:      #C49A3C;
  --gold-soft: #E8C96A;
  --gold-pale: rgba(196, 154, 60, 0.12);

  /* Couleurs sémantiques */
  --green:     #5A9E6F;
  --amber:     #D4854A;
  --coral:     #E07070;
  --blue:      #5B9BD4;
  --purple:    #7B6FD4;
  --teal:      #2DA58A;

  /* Couleurs des 7 étapes */
  --step-1:    #7B6FD4;
  --step-2:    #5B9BD4;
  --step-3:    #2DA58A;
  --step-4:    #D4854A;
  --step-5:    #5A9E6F;
  --step-6:    #E07070;
  --step-7:    #C49A3C;

  /* Rayons */
  --r-sm:   6px;
  --r-md:   10px;
  --r-lg:   14px;
  --r-xl:   20px;
  --r-full: 9999px;

  /* Espacement */
  --s-1: 4px;
  --s-2: 8px;
  --s-3: 12px;
  --s-4: 16px;
  --s-5: 20px;
  --s-6: 24px;
  --s-8: 32px;

  /* Typographie */
  --font-ui:      'Inter', system-ui, sans-serif;
  --font-display: 'Fraunces', 'Playfair Display', Georgia, serif;

  /* Transitions */
  --t-fast: 150ms ease-out;
  --t-base: 200ms ease-out;
  --t-slow: 300ms ease-in-out;
}

/* Mode clair (v1.5) */
@media (prefers-color-scheme: light) {
  :root {
    --bg:        #F5F3EE;
    --sidebar:   #EDEAE4;
    --surface:   #FFFFFF;
    --surface-2: #F0EDE6;
    --border:    #E0DDD6;
    --border-2:  #CCCAC4;
    --text-1:    #1C1B18;
    --text-2:    #6B6B6B;
    --text-3:    #A0A09A;
    --gold:      #B08930;
  }
}
```

---

*DestinyPlanner — Design System v2.1 — Avril 2026*
*v2.0 : base → v2.1 : time-blocking (timeline 24h, blocs horaires, widget matin, revue soir) + profil utilisateur (stats, grade badge, avatar, compte Supabase)*
*"Le noble forme de nobles projets et il persévère dans ses nobles projets." — Ésaïe 32:8*
