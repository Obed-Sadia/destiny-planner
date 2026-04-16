// DestinyPlanner — Carte projet
// Affichée dans ProjectList — lien vers détail ou wizard selon statut

import { useNavigate } from 'react-router-dom'
import { ChevronRight, Pencil } from 'lucide-react'
import { ProgressBar } from './ProgressBar'
import type { Domain, Project, ProjectStatus } from '../../types'

const ACCENT_COLORS = [
  'var(--gold)',
  'var(--green)',
  'var(--amber)',
  'var(--teal)',
  'var(--purple)',
  'var(--blue)',
]

function accentForDomain(sortOrder: number): string {
  return ACCENT_COLORS[sortOrder % ACCENT_COLORS.length]
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft:     'Brouillon',
  active:    'Actif',
  paused:    'En pause',
  completed: 'Terminé',
  abandoned: 'Abandonné',
}

const STATUS_STYLES: Record<ProjectStatus, { bg: string; text: string }> = {
  draft:     { bg: 'var(--tag-amber-bg)',  text: 'var(--tag-amber-text)' },
  active:    { bg: 'var(--tag-green-bg)',  text: 'var(--tag-green-text)' },
  paused:    { bg: 'var(--tag-purple-bg)', text: 'var(--tag-purple-text)' },
  completed: { bg: 'var(--tag-teal-bg)',   text: 'var(--tag-teal-text)' },
  abandoned: { bg: 'var(--tag-coral-bg)',  text: 'var(--tag-coral-text)' },
}

const STEP_COLORS: Record<number, string> = {
  1: 'var(--step-1)',
  2: 'var(--step-2)',
  3: 'var(--step-3)',
  4: 'var(--step-4)',
  5: 'var(--step-5)',
  6: 'var(--step-6)',
  7: 'var(--step-7)',
}

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STYLE = `
  .project-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    transition: border-color var(--transition-base), box-shadow var(--transition-base),
                transform var(--transition-base);
  }

  .project-card:hover {
    border-color: var(--border-2);
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  .project-card-accent {
    height: 3px;
    width: 100%;
    flex-shrink: 0;
  }

  .project-card-body {
    padding: var(--space-4) var(--space-5);
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .project-card-domain {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  .project-card-domain-icon {
    font-size: 1rem;
    line-height: 1;
  }

  .project-card-title {
    font-family: var(--font-editorial);
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--text-1);
    line-height: 1.25;
  }

  .project-card-meta {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .project-card-badge {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    padding: 2px var(--space-2);
    border-radius: var(--r-full);
  }

  .project-card-step {
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  .project-card-progress {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .project-card-progress-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  .project-card-footer {
    padding: var(--space-3) var(--space-5);
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .project-card-date {
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  .project-card-action {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--r-full);
    border: 1px solid var(--border-2);
    color: var(--text-2);
    background: transparent;
    cursor: pointer;
    transition: all var(--transition-base);
  }

  .project-card:hover .project-card-action {
    border-color: var(--gold);
    color: var(--gold);
  }

  .project-card-action--wizard {
    border-color: var(--step-1);
    color: var(--step-1);
  }

  .project-card-step-dots {
    display: flex;
    gap: 3px;
    align-items: center;
    margin-top: var(--space-1);
  }

  .project-card-step-dot {
    width: 6px;
    height: 6px;
    border-radius: var(--r-full);
    background: var(--border-2);
    transition: background var(--transition-base);
  }

  .project-card-step-dot--done {
    background: var(--green);
  }

  .project-card-step-dot--active {
    width: 8px;
    height: 8px;
  }
`

interface ProjectCardProps {
  project: Project
  domain: Domain | undefined
}

export function ProjectCard({ project, domain }: ProjectCardProps): JSX.Element {
  const navigate = useNavigate()
  const accent = accentForDomain(domain?.sort_order ?? 0)
  const statusStyle = STATUS_STYLES[project.status]
  const isDraft = project.status === 'draft'

  function handleClick(): void {
    if (isDraft) {
      navigate(`/projects/${project.id}/wizard`)
    } else {
      navigate(`/projects/${project.id}`)
    }
  }

  return (
    <>
      <style>{STYLE}</style>
      <div
        className="project-card"
        onClick={handleClick}
        role="article"
        aria-label={project.title}
      >
        <div className="project-card-accent" style={{ background: accent }} />

        <div className="project-card-body">
          {domain && (
            <div className="project-card-domain">
              <span className="project-card-domain-icon" aria-hidden="true">
                {domain.icon}
              </span>
              {domain.name}
            </div>
          )}

          <div className="project-card-title">{project.title}</div>

          <div className="project-card-meta">
            <span
              className="project-card-badge"
              style={{ background: statusStyle.bg, color: statusStyle.text }}
            >
              {STATUS_LABELS[project.status]}
            </span>

            {isDraft && (
              <span
                className="project-card-step"
                style={{ color: STEP_COLORS[project.current_step] ?? 'var(--text-3)' }}
              >
                Étape {project.current_step} / 7
              </span>
            )}
          </div>

          {/* Mini step dots pour les brouillons */}
          {isDraft && (
            <div className="project-card-step-dots" aria-hidden="true">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <div
                  key={n}
                  className={`project-card-step-dot ${
                    n < project.current_step
                      ? 'project-card-step-dot--done'
                      : n === project.current_step
                        ? 'project-card-step-dot--active'
                        : ''
                  }`}
                  style={
                    n === project.current_step
                      ? { background: STEP_COLORS[n] ?? 'var(--gold)' }
                      : undefined
                  }
                />
              ))}
            </div>
          )}

          {/* Barre de progression pour les projets actifs/terminés */}
          {project.status !== 'draft' && (
            <div className="project-card-progress">
              <div className="project-card-progress-label">
                <span>Progression</span>
                <span>{project.progress} %</span>
              </div>
              <ProgressBar
                value={project.progress}
                color={
                  project.status === 'completed'
                    ? 'var(--teal)'
                    : project.status === 'abandoned'
                      ? 'var(--coral)'
                      : 'var(--gold)'
                }
                size="sm"
              />
            </div>
          )}
        </div>

        <div className="project-card-footer">
          <span className="project-card-date">
            {formatUpdatedAt(project.updated_at)}
          </span>

          <button
            type="button"
            className={`project-card-action ${isDraft ? 'project-card-action--wizard' : ''}`}
            onClick={(e) => { e.stopPropagation(); handleClick() }}
            aria-label={isDraft ? "Continuer le wizard" : "Voir le projet"}
          >
            {isDraft ? (
              <>
                <Pencil size={11} />
                Continuer
              </>
            ) : (
              <>
                Voir
                <ChevronRight size={11} />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
