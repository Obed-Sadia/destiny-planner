// DestinyPlanner — Liste des jalons
// Affichée dans ProjectDetail — toggle statut, ajout inline

import { useState, useRef } from 'react'
import { Plus, Check, Circle, AlertCircle, Clock, Pause } from 'lucide-react'
import { useMilestoneStore } from '../../stores/useMilestoneStore'
import type { Milestone, MilestoneStatus } from '../../types'

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function nextStatus(current: MilestoneStatus): MilestoneStatus {
  if (current === 'planned') return 'in_progress'
  if (current === 'in_progress') return 'completed'
  return 'planned'
}

const STATUS_CONFIG: Record<
  MilestoneStatus,
  { label: string; bg: string; text: string; icon: JSX.Element }
> = {
  planned: {
    label: 'Prévu',
    bg: 'var(--surface-2)',
    text: 'var(--text-3)',
    icon: <Circle size={16} />,
  },
  in_progress: {
    label: 'En cours',
    bg: 'var(--tag-amber-bg)',
    text: 'var(--tag-amber-text)',
    icon: <Clock size={16} />,
  },
  completed: {
    label: 'Terminé',
    bg: 'var(--tag-green-bg)',
    text: 'var(--tag-green-text)',
    icon: <Check size={16} strokeWidth={2.5} />,
  },
  blocked: {
    label: 'Bloqué',
    bg: 'var(--tag-coral-bg)',
    text: 'var(--tag-coral-text)',
    icon: <AlertCircle size={16} />,
  },
  postponed: {
    label: 'Reporté',
    bg: 'var(--tag-purple-bg)',
    text: 'var(--tag-purple-text)',
    icon: <Pause size={16} />,
  },
}

const STYLE = `
  .milestone-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .milestone-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    transition: border-color var(--transition-base);
  }

  .milestone-item:hover {
    border-color: var(--border-2);
  }

  .milestone-item--completed {
    opacity: 0.65;
  }

  .milestone-toggle {
    width: 28px;
    height: 28px;
    border-radius: var(--r-full);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    cursor: pointer;
    border: none;
    transition: all var(--transition-base);
  }

  .milestone-toggle:hover {
    transform: scale(1.1);
  }

  .milestone-content {
    flex: 1;
    min-width: 0;
  }

  .milestone-title {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text-1);
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .milestone-item--completed .milestone-title {
    text-decoration: line-through;
    color: var(--text-3);
  }

  .milestone-meta {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-top: 2px;
  }

  .milestone-status-badge {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    padding: 1px var(--space-2);
    border-radius: var(--r-full);
  }

  .milestone-date {
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  .milestone-date--overdue {
    color: var(--coral);
    font-weight: var(--weight-semibold);
  }

  /* Formulaire ajout inline */
  .milestone-add-trigger {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-sm);
    color: var(--text-3);
    border: 1px dashed var(--border-2);
    border-radius: var(--r-md);
    background: transparent;
    cursor: pointer;
    transition: all var(--transition-base);
    margin-top: var(--space-2);
  }

  .milestone-add-trigger:hover {
    border-color: var(--gold);
    color: var(--gold);
    background: var(--gold-pale);
  }

  .milestone-add-form {
    display: flex;
    gap: var(--space-3);
    align-items: center;
    padding: var(--space-3) var(--space-4);
    background: var(--surface);
    border: 1px solid var(--gold);
    border-radius: var(--r-md);
    margin-top: var(--space-2);
  }

  .milestone-add-input {
    flex: 2;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-1);
    background: transparent;
    border: none;
    outline: none;
    caret-color: var(--gold);
  }

  .milestone-add-input::placeholder {
    color: var(--text-3);
    font-style: italic;
  }

  .milestone-add-date {
    flex: 1;
    min-width: 110px;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-1);
    background: var(--surface-2);
    border: 1px solid var(--border-2);
    border-radius: var(--r-sm);
    padding: var(--space-1) var(--space-2);
    outline: none;
    color-scheme: dark;
    transition: border-color var(--transition-base);
  }

  .milestone-add-date:focus {
    border-color: var(--gold);
  }

  .milestone-add-submit {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    background: var(--gold);
    color: var(--bg);
    border: none;
    border-radius: var(--r-sm);
    cursor: pointer;
    transition: background var(--transition-base);
    flex-shrink: 0;
  }

  .milestone-add-submit:hover:not(:disabled) {
    background: var(--gold-soft);
  }

  .milestone-add-submit:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .milestone-add-cancel {
    font-size: var(--text-xs);
    color: var(--text-3);
    padding: var(--space-1);
    cursor: pointer;
    border: none;
    background: transparent;
    transition: color var(--transition-base);
    flex-shrink: 0;
  }

  .milestone-add-cancel:hover {
    color: var(--coral);
  }

  .milestone-empty {
    text-align: center;
    padding: var(--space-8);
    color: var(--text-3);
    font-size: var(--text-sm);
    font-style: italic;
    border: 1px dashed var(--border);
    border-radius: var(--r-md);
  }
`

interface MilestoneListProps {
  milestones: Milestone[]
  projectId: string
}

export function MilestoneList({ milestones, projectId }: MilestoneListProps): JSX.Element {
  const { setStatus, addMilestone } = useMilestoneStore()
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const today = new Date().toISOString().slice(0, 10)

  async function handleToggle(milestone: Milestone): Promise<void> {
    await setStatus(milestone.id, nextStatus(milestone.status))
  }

  async function handleAdd(): Promise<void> {
    if (!newTitle.trim()) return
    await addMilestone({
      project_id: projectId,
      title: newTitle.trim(),
      description: '',
      due_date: newDate || null,
      status: 'planned',
      sort_order: milestones.length,
    })
    setNewTitle('')
    setNewDate('')
    setAdding(false)
  }

  function handleOpenAdd(): void {
    setAdding(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className="milestone-list">
        {milestones.length === 0 && !adding && (
          <div className="milestone-empty">
            Aucun jalon pour l'instant
          </div>
        )}

        {milestones.map((m) => {
          const cfg = STATUS_CONFIG[m.status]
          const isOverdue =
            m.due_date &&
            m.due_date < today &&
            m.status !== 'completed'

          return (
            <div
              key={m.id}
              className={`milestone-item ${m.status === 'completed' ? 'milestone-item--completed' : ''}`}
            >
              <button
                type="button"
                className="milestone-toggle"
                style={{ background: cfg.bg, color: cfg.text }}
                onClick={() => handleToggle(m)}
                aria-label={`Statut : ${cfg.label} — cliquer pour changer`}
                title={`Statut : ${cfg.label}`}
              >
                {cfg.icon}
              </button>

              <div className="milestone-content">
                <div className="milestone-title" title={m.title}>
                  {m.title}
                </div>
                <div className="milestone-meta">
                  <span
                    className="milestone-status-badge"
                    style={{ background: cfg.bg, color: cfg.text }}
                  >
                    {cfg.label}
                  </span>
                  {m.due_date && (
                    <span
                      className={`milestone-date ${isOverdue ? 'milestone-date--overdue' : ''}`}
                    >
                      {isOverdue ? '⚠ ' : ''}{formatDate(m.due_date)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Formulaire ajout */}
        {adding ? (
          <div className="milestone-add-form">
            <input
              ref={inputRef}
              type="text"
              className="milestone-add-input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd()
                if (e.key === 'Escape') setAdding(false)
              }}
              placeholder="Titre du jalon…"
              maxLength={100}
            />
            <input
              type="date"
              className="milestone-add-date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              aria-label="Date d'échéance"
            />
            <button
              type="button"
              className="milestone-add-submit"
              disabled={!newTitle.trim()}
              onClick={handleAdd}
            >
              <Check size={13} strokeWidth={2.5} />
              Ajouter
            </button>
            <button
              type="button"
              className="milestone-add-cancel"
              onClick={() => { setAdding(false); setNewTitle(''); setNewDate('') }}
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="milestone-add-trigger"
            onClick={handleOpenAdd}
          >
            <Plus size={14} />
            Ajouter un jalon
          </button>
        )}
      </div>
    </>
  )
}
