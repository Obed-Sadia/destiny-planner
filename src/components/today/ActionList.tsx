// DestinyPlanner — Liste des actions du jour
// Traçabilité obligatoire : action → jalon → projet → domaine → but

import { Circle, CheckCircle2, Trash2, Clock } from 'lucide-react'
import type { Action, Domain, Milestone, Project } from '../../types'

export interface TraceInfo {
  milestone: Milestone
  project: Project
  domain: Domain
}

interface ActionListProps {
  actions: Action[]
  traceMap: Record<string, TraceInfo>
  onToggle: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const STYLE = `
  .action-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .action-section-label {
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: var(--space-3) 0 var(--space-1);
  }

  .action-item {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    transition: border-color var(--transition-fast), background var(--transition-fast);
  }

  .action-item:hover {
    border-color: var(--border-2);
    background: var(--surface-2);
  }

  .action-item:hover .action-delete {
    opacity: 1;
  }

  .action-item.action-done {
    opacity: 0.55;
  }

  .action-checkbox {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    margin-top: 1px;
    color: var(--text-3);
    transition: color var(--transition-fast), transform var(--transition-fast);
  }

  .action-checkbox:hover {
    color: var(--gold);
    transform: scale(1.1);
  }

  .action-item.action-done .action-checkbox {
    color: var(--green);
  }

  .action-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .action-title {
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
    color: var(--text-1);
    line-height: var(--leading-snug);
    word-break: break-word;
  }

  .action-item.action-done .action-title {
    text-decoration: line-through;
    color: var(--text-3);
  }

  .action-trace {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
    color: var(--text-3);
    line-height: 1;
  }

  .trace-icon {
    font-size: 11px;
  }

  .trace-path {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .action-duration {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: var(--text-xs);
    color: var(--text-3);
    margin-top: var(--space-1);
  }

  .action-delete {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    color: var(--text-3);
    opacity: 0;
    border-radius: var(--r-xs);
    transition: opacity var(--transition-fast), color var(--transition-fast), background var(--transition-fast);
  }

  .action-delete:hover {
    color: var(--coral);
    background: var(--tag-coral-bg);
  }

  .action-empty {
    padding: var(--space-8) 0;
    text-align: center;
    font-size: var(--text-sm);
    color: var(--text-3);
    font-style: italic;
  }

  @media (max-width: 640px) {
    .action-delete {
      opacity: 1;
    }
  }
`

export function ActionList({ actions, traceMap, onToggle, onDelete }: ActionListProps): JSX.Element {
  const pending = actions.filter((a) => !a.done)
  const done = actions.filter((a) => a.done)

  if (actions.length === 0) {
    return (
      <>
        <style>{STYLE}</style>
        <p className="action-empty">Aucune action du jour — ajoutez-en une ci-dessus.</p>
      </>
    )
  }

  const renderAction = (action: Action): JSX.Element => {
    const trace = traceMap[action.milestone_id]
    return (
      <div key={action.id} className={`action-item${action.done ? ' action-done' : ''}`}>
        <button
          className="action-checkbox"
          onClick={() => onToggle(action.id)}
          aria-label={action.done ? 'Marquer comme non faite' : 'Marquer comme faite'}
        >
          {action.done
            ? <CheckCircle2 size={18} />
            : <Circle size={18} />
          }
        </button>

        <div className="action-body">
          <span className="action-title">{action.title}</span>

          {trace && (
            <span className="action-trace">
              <span className="trace-icon">{trace.domain.icon}</span>
              <span className="trace-path">
                {trace.domain.name} · {trace.project.title} · {trace.milestone.title}
              </span>
            </span>
          )}

          {action.estimated_minutes != null && (
            <span className="action-duration">
              <Clock size={10} />
              {action.estimated_minutes} min
            </span>
          )}
        </div>

        <button
          className="action-delete"
          onClick={() => onDelete(action.id)}
          aria-label="Supprimer l'action"
        >
          <Trash2 size={13} />
        </button>
      </div>
    )
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className="action-list">
        {pending.map(renderAction)}

        {done.length > 0 && (
          <>
            <p className="action-section-label">Accomplies</p>
            {done.map(renderAction)}
          </>
        )}
      </div>
    </>
  )
}
