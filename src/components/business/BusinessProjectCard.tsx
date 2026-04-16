// DestinyPlanner — Carte projet business
// Accent teal, statuts identiques aux projets perso

import type { BusinessProject } from '../../lib/supabase.types'

const STATUS_LABELS: Record<string, string> = {
  draft:     'Brouillon',
  active:    'Actif',
  paused:    'En pause',
  completed: 'Terminé',
  abandoned: 'Abandonné',
}

const STATUS_COLORS: Record<string, string> = {
  draft:     'var(--text-3)',
  active:    'var(--teal)',
  paused:    'var(--amber)',
  completed: 'var(--green)',
  abandoned: 'var(--coral)',
}

const STYLE = `
  .biz-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    cursor: pointer;
    transition: border-color var(--transition-base), transform var(--transition-fast);
    text-decoration: none;
    color: inherit;
  }

  .biz-card:hover {
    border-color: var(--teal);
    transform: translateY(-1px);
  }

  .biz-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .biz-card-title {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
    line-height: var(--leading-snug);
    flex: 1;
    min-width: 0;
  }

  .biz-card-status {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .biz-card-desc {
    font-size: var(--text-sm);
    color: var(--text-2);
    line-height: var(--leading-snug);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .biz-card-footer {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .biz-card-progress-track {
    flex: 1;
    height: 4px;
    background: var(--border);
    border-radius: var(--r-full);
    overflow: hidden;
  }

  .biz-card-progress-fill {
    height: 100%;
    background: var(--teal);
    border-radius: var(--r-full);
    transition: width 400ms ease;
  }

  .biz-card-step {
    font-size: var(--text-xs);
    color: var(--text-3);
    white-space: nowrap;
    flex-shrink: 0;
  }
`

interface Props {
  project: BusinessProject
  onClick: () => void
}

export function BusinessProjectCard({ project, onClick }: Props): JSX.Element {
  return (
    <>
      <style>{STYLE}</style>
      <div className="biz-card" onClick={onClick} role="button" tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}>
        <div className="biz-card-header">
          <span className="biz-card-title">{project.title}</span>
          <span
            className="biz-card-status"
            style={{ color: STATUS_COLORS[project.status] ?? 'var(--text-3)' }}
          >
            {STATUS_LABELS[project.status] ?? project.status}
          </span>
        </div>

        {project.description && (
          <p className="biz-card-desc">{project.description}</p>
        )}

        <div className="biz-card-footer">
          <div className="biz-card-progress-track">
            <div
              className="biz-card-progress-fill"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <span className="biz-card-step">
            Étape {project.current_step} / 7
          </span>
        </div>
      </div>
    </>
  )
}
