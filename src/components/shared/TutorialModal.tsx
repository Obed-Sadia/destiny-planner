// DestinyPlanner — Modal tutoriel pour nouveaux arrivants
// 9 étapes : introduction, 6 sections Espace Perso, Espace Business, CTA final

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  X,
  Sparkles,
  LayoutDashboard,
  CalendarCheck,
  FolderKanban,
  BookOpen,
  Target,
  Layers,
  Users,
  Rocket,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────

interface TutorialStep {
  icon: LucideIcon
  iconColorClass: string
  eyebrow: string
  title: string
  description: string
}

interface Props {
  onClose: () => void
}

// ─── Contenu des étapes ──────────────────────────────────────

const STEPS: readonly TutorialStep[] = [
  {
    icon: Sparkles,
    iconColorClass: 'tut-icon--gold',
    eyebrow: 'Bienvenue',
    title: 'Calculez le coût. Bâtissez avec intention.',
    description:
      'DestinyPlanner vous guide à travers les 7 étapes de Myles Munroe pour transformer vos rêves en réalité. Chaque section correspond à une strate de votre édifice. La tour se bâtit pierre par pierre.',
  },
  {
    icon: LayoutDashboard,
    iconColorClass: 'tut-icon--gold',
    eyebrow: 'Espace Perso · 1/6',
    title: 'Le Tableau de bord',
    description:
      'Votre vue d\'ensemble : streak, score, jalons actifs et activité des 7 derniers jours. L\'Arbre de la Destinée relie votre but de vie à vos domaines. Tout commence ici.',
  },
  {
    icon: CalendarCheck,
    iconColorClass: 'tut-icon--teal',
    eyebrow: 'Espace Perso · 2/6',
    title: 'Aujourd\'hui',
    description:
      'Chaque jour commence par vos actions du jour — des jalons liés à vos projets. Associez chaque action à un bloc horaire pour structurer vos heures. La discipline du quotidien construit l\'édifice.',
  },
  {
    icon: FolderKanban,
    iconColorClass: 'tut-icon--purple',
    eyebrow: 'Espace Perso · 3/6',
    title: 'Les Projets',
    description:
      'Un projet traverse 7 étapes : vision, discernement, analyse, coût, planification, ressources, puis engagement. Chaque jalon découpé en actions concrètes vous rapproche de l\'achèvement.',
  },
  {
    icon: BookOpen,
    iconColorClass: 'tut-icon--amber',
    eyebrow: 'Espace Perso · 4/6',
    title: 'Le Journal',
    description:
      'Le matin, planifiez votre journée et notez votre déclaration. Le soir, révisez et notez vos leçons. Ce rituel biquotidien construit votre conscience de bâtisseur.',
  },
  {
    icon: Target,
    iconColorClass: 'tut-icon--coral',
    eyebrow: 'Espace Perso · 5/6',
    title: 'Le But',
    description:
      'Définissez votre mission de vie en une phrase, votre vision à 10 ans et vos 3 valeurs fondamentales. Ce but est l\'étoile polaire de tous vos projets. Sans fondation, la tour chancelle.',
  },
  {
    icon: Layers,
    iconColorClass: 'tut-icon--green',
    eyebrow: 'Espace Perso · 6/6',
    title: 'Les Domaines',
    description:
      'Six sphères de vie plus vos domaines personnalisés. Chaque projet est ancré dans un domaine. L\'Arbre de la Destinée vous montre l\'équilibre de votre édifice.',
  },
  {
    icon: Users,
    iconColorClass: 'tut-icon--teal',
    eyebrow: 'Espace Business',
    title: 'L\'Espace Collaboratif',
    description:
      'Gérez des projets avec une équipe : rôles éditeur ou observateur, jalons partagés et templates communautaires. Cet espace nécessite une connexion. Vos données personnelles restent locales et privées.',
  },
  {
    icon: Rocket,
    iconColorClass: 'tut-icon--gold',
    eyebrow: 'Vous êtes prêt',
    title: 'C\'est parti !',
    description:
      'Votre fondation est posée. Commencez par définir votre but de vie, puis créez votre premier projet. Revenez ici depuis les Paramètres si vous souhaitez revoir ce guide.',
  },
] as const

// ─── Styles ──────────────────────────────────────────────────

const STYLE = `
  .tut-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 14, 13, 0.88);
    z-index: 300;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    animation: tut-fade 180ms ease both;
  }

  @keyframes tut-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .tut-card {
    background: var(--surface);
    border: 1px solid var(--border-2);
    border-radius: var(--r-xl);
    width: 100%;
    max-width: 480px;
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    animation: tut-up 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    max-height: 90dvh;
    overflow-y: auto;
  }

  @keyframes tut-up {
    from { transform: translateY(14px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  @media (max-width: 480px) {
    .tut-overlay {
      align-items: flex-end;
      padding: 0;
    }
    .tut-card {
      border-radius: var(--r-xl) var(--r-xl) 0 0;
      max-width: 100%;
      max-height: 85dvh;
    }
  }

  /* ── Barre de progression ── */
  .tut-dots {
    display: flex;
    gap: var(--space-1);
  }

  .tut-dot {
    height: 3px;
    border-radius: var(--r-full);
    background: var(--border-2);
    flex: 1;
    transition: background var(--transition-slow);
  }

  .tut-dot--active { background: var(--gold); }
  .tut-dot--done   { background: rgba(196, 154, 60, 0.35); }

  /* ── Top bar ── */
  .tut-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .tut-counter {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-3);
    letter-spacing: 0.06em;
  }

  .tut-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--r-sm);
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-3);
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .tut-close:hover {
    background: var(--surface-2);
    color: var(--text-1);
  }

  /* ── Icône ── */
  .tut-icon-wrap {
    width: 52px;
    height: 52px;
    border-radius: var(--r-lg);
    background: var(--surface-2);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .tut-icon--gold { background: var(--gold-pale); border-color: rgba(196, 154, 60, 0.2); }
  .tut-icon--gold svg { color: var(--gold); }

  .tut-icon--teal { background: rgba(45, 165, 138, 0.10); border-color: rgba(45, 165, 138, 0.2); }
  .tut-icon--teal svg { color: var(--teal); }

  .tut-icon--purple { background: rgba(123, 111, 212, 0.10); border-color: rgba(123, 111, 212, 0.2); }
  .tut-icon--purple svg { color: var(--purple); }

  .tut-icon--amber { background: rgba(212, 133, 74, 0.10); border-color: rgba(212, 133, 74, 0.2); }
  .tut-icon--amber svg { color: var(--amber); }

  .tut-icon--coral { background: rgba(224, 112, 112, 0.10); border-color: rgba(224, 112, 112, 0.2); }
  .tut-icon--coral svg { color: var(--coral); }

  .tut-icon--green { background: rgba(90, 158, 111, 0.10); border-color: rgba(90, 158, 111, 0.2); }
  .tut-icon--green svg { color: var(--green); }

  /* ── Eyebrow ── */
  .tut-eyebrow {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.10em;
    color: var(--teal);
  }

  /* ── Titre ── */
  .tut-title {
    font-family: var(--font-editorial);
    font-size: var(--text-2xl);
    font-weight: 600;
    color: var(--text-1);
    line-height: var(--leading-tight);
    margin: 0;
  }

  /* ── Verset (étape 0) ── */
  .tut-verse {
    border-left: 2px solid var(--gold);
    padding: var(--space-3) var(--space-4);
    background: var(--gold-pale);
    border-radius: 0 var(--r-sm) var(--r-sm) 0;
  }

  .tut-verse-text {
    font-family: var(--font-editorial);
    font-size: var(--text-base);
    color: var(--gold-soft);
    font-style: italic;
    line-height: var(--leading-snug);
    margin: 0;
  }

  .tut-verse-ref {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-3);
    margin-top: var(--space-2);
  }

  /* ── Description ── */
  .tut-desc {
    font-family: var(--font-ui);
    font-size: var(--text-base);
    color: var(--text-2);
    line-height: var(--leading-normal);
    margin: 0;
  }

  /* ── Navigation ── */
  .tut-nav {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }

  .tut-btn-skip {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-3);
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--space-2) 0;
    transition: color var(--transition-fast);
  }

  .tut-btn-skip:hover { color: var(--text-2); }

  .tut-btn-prev {
    padding: var(--space-2) var(--space-4);
    background: transparent;
    border: 1px solid var(--border-2);
    border-radius: var(--r-md);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-2);
    cursor: pointer;
    transition: border-color var(--transition-fast), color var(--transition-fast);
  }

  .tut-btn-prev:hover {
    border-color: var(--border-2);
    color: var(--text-1);
  }

  .tut-btn-next {
    padding: var(--space-2) var(--space-5);
    background: var(--teal);
    border: none;
    border-radius: var(--r-md);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: #fff;
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }

  .tut-btn-next:hover { opacity: 0.88; }

  .tut-btn-cta {
    padding: var(--space-3) var(--space-6);
    background: var(--gold);
    border: none;
    border-radius: var(--r-md);
    font-family: var(--font-ui);
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--bg);
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }

  .tut-btn-cta:hover { opacity: 0.88; }
`

// ─── Composant ───────────────────────────────────────────────

export function TutorialModal({ onClose }: Props): JSX.Element {
  const [currentStep, setCurrentStep] = useState<number>(0)

  const step = STEPS[currentStep]
  const Icon = step.icon
  const isFirst = currentStep === 0
  const isLast  = currentStep === STEPS.length - 1

  function handlePrev(): void {
    setCurrentStep((s) => Math.max(0, s - 1))
  }

  function handleNext(): void {
    setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>): void {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className="tut-overlay" onClick={handleBackdropClick}>
        <div
          className="tut-card"
          role="dialog"
          aria-modal="true"
          aria-label="Guide DestinyPlanner"
        >
          {/* Barre de progression */}
          <div className="tut-dots" aria-hidden="true">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`tut-dot${i === currentStep ? ' tut-dot--active' : i < currentStep ? ' tut-dot--done' : ''}`}
              />
            ))}
          </div>

          {/* Top bar */}
          <div className="tut-topbar">
            <span className="tut-counter" aria-live="polite">
              {currentStep + 1} / {STEPS.length}
            </span>
            <button
              type="button"
              className="tut-close"
              onClick={onClose}
              aria-label="Passer le tutoriel"
            >
              <X size={14} />
            </button>
          </div>

          {/* Icône */}
          <div className={`tut-icon-wrap ${step.iconColorClass}`}>
            <Icon size={26} />
          </div>

          {/* Eyebrow */}
          <span className="tut-eyebrow">{step.eyebrow}</span>

          {/* Titre */}
          <h2 className="tut-title">{step.title}</h2>

          {/* Verset — étape 0 uniquement */}
          {isFirst && (
            <div className="tut-verse">
              <p className="tut-verse-text">
                « Car qui d'entre vous, voulant bâtir une tour, ne s'assied d'abord pour calculer la dépense et voir s'il a de quoi l'achever ? »
              </p>
              <p className="tut-verse-ref">Luc 14 : 28</p>
            </div>
          )}

          {/* Description */}
          <p className="tut-desc">{step.description}</p>

          {/* Navigation */}
          <div className="tut-nav">
            {isFirst && (
              <button type="button" className="tut-btn-skip" onClick={onClose}>
                Passer
              </button>
            )}
            {!isFirst && (
              <button type="button" className="tut-btn-prev" onClick={handlePrev}>
                Précédent
              </button>
            )}

            <div style={{ flex: 1 }} />

            {!isLast && (
              <button type="button" className="tut-btn-next" onClick={handleNext}>
                Suivant
              </button>
            )}
            {isLast && (
              <button type="button" className="tut-btn-cta" onClick={onClose}>
                Commencer à bâtir
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
