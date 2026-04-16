// DestinyPlanner — Page Aujourd'hui (avec time-blocking)
// Traçabilité obligatoire : action → jalon → projet → domaine → but

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Plus, X, ChevronDown } from 'lucide-react'
import { db } from '../db/schema'
import { useActionStore } from '../stores/useActionStore'
import { useProjectStore } from '../stores/useProjectStore'
import { useDomainStore } from '../stores/useDomainStore'
import { useTimeBlockStore } from '../stores/useTimeBlockStore'
import { useJournalStore } from '../stores/useJournalStore'
import { ActionList } from '../components/today/ActionList'
import { TimelineView } from '../components/today/TimelineView'
import type { Milestone } from '../types'
import type { TraceInfo } from '../components/today/ActionList'

const STYLE = `
  .today {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    animation: tdFadeIn 200ms ease both;
  }

  /* ── Layout 2 colonnes (desktop) ── */
  .today-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-4);
    align-items: start;
  }

  @media (min-width: 768px) {
    .today-layout {
      grid-template-columns: 1fr 300px;
    }
  }

  .today-left,
  .today-right {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  @keyframes tdFadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── En-tête ── */
  .today-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .today-title {
    font-family: var(--font-editorial);
    font-size: var(--text-2xl);
    font-weight: 300;
    color: var(--text-1);
    line-height: var(--leading-tight);
  }

  .today-date {
    font-size: var(--text-sm);
    color: var(--text-2);
    text-transform: capitalize;
  }

  /* ── Progression ── */
  .today-progress {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .today-progress-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .today-progress-text {
    font-size: var(--text-sm);
    color: var(--text-2);
  }

  .today-progress-pct {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--gold);
  }

  .today-progress-bar {
    height: 4px;
    background: var(--border);
    border-radius: var(--r-full);
    overflow: hidden;
  }

  .today-progress-fill {
    height: 100%;
    background: var(--gold);
    border-radius: var(--r-full);
    transition: width 400ms ease;
  }

  /* ── Bouton ajouter ── */
  .today-add-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: var(--gold-pale);
    border: 1px solid rgba(196, 154, 60, 0.25);
    border-radius: var(--r-md);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--gold-soft);
    cursor: pointer;
    transition: background var(--transition-fast), border-color var(--transition-fast);
    align-self: flex-start;
  }

  .today-add-btn:hover {
    background: rgba(196, 154, 60, 0.2);
    border-color: rgba(196, 154, 60, 0.4);
  }

  /* ── Formulaire d'ajout ── */
  .today-form {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .today-form-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .today-form-title {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
  }

  .today-form-close {
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
    border-radius: var(--r-xs);
    transition: color var(--transition-fast), background var(--transition-fast);
  }

  .today-form-close:hover {
    color: var(--text-1);
    background: var(--border);
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .form-label {
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--text-2);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .form-select,
  .form-input {
    padding: var(--space-2) var(--space-3);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    font-size: var(--text-base);
    font-family: var(--font-ui);
    color: var(--text-1);
    outline: none;
    transition: border-color var(--transition-fast);
    width: 100%;
    box-sizing: border-box;
  }

  .form-select {
    appearance: none;
    cursor: pointer;
    background-image: none;
  }

  .form-select-wrapper {
    position: relative;
  }

  .form-select-arrow {
    position: absolute;
    right: var(--space-3);
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-3);
    pointer-events: none;
  }

  .form-select:focus,
  .form-input:focus {
    border-color: var(--gold);
    background: var(--surface);
  }

  .form-select option {
    background: var(--surface-2);
    color: var(--text-1);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-3);
    align-items: end;
  }

  .form-trace-hint {
    font-size: var(--text-xs);
    color: var(--text-3);
    padding: var(--space-1) var(--space-2);
    background: var(--surface-2);
    border-radius: var(--r-xs);
    border-left: 2px solid var(--gold);
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }

  .form-cancel {
    padding: var(--space-2) var(--space-4);
    background: none;
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    font-size: var(--text-sm);
    color: var(--text-2);
    cursor: pointer;
    transition: border-color var(--transition-fast), color var(--transition-fast);
  }

  .form-cancel:hover {
    border-color: var(--border-2);
    color: var(--text-1);
  }

  .form-submit {
    padding: var(--space-2) var(--space-5);
    background: var(--gold);
    border: none;
    border-radius: var(--r-sm);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: #0F0E0D;
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }

  .form-submit:hover:not(:disabled) {
    opacity: 0.88;
  }

  .form-submit:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* ── Durée estimée ── */
  .form-duration {
    width: 90px;
    flex-shrink: 0;
  }

  /* ── Section actions ── */
  .today-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .today-section-title {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-2);
  }
`

export default function Today(): JSX.Element {
  const today = format(new Date(), 'yyyy-MM-dd')
  const dateLabel = format(new Date(), "EEEE d MMMM", { locale: fr })

  const { actions, load, addAction, toggleDone, deleteAction } = useActionStore()
  const { projects, load: loadProjects } = useProjectStore()
  const { domains, load: loadDomains } = useDomainStore()
  const { blocks, toggleDone: toggleBlockDone } = useTimeBlockStore()
  const { saveEntry } = useJournalStore()

  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [traceMap, setTraceMap] = useState<Record<string, TraceInfo>>({})

  const [showForm, setShowForm] = useState(false)
  const [formMilestoneId, setFormMilestoneId] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formMinutes, setFormMinutes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const titleInputRef = useRef<HTMLInputElement>(null)

  // Chargement initial
  useEffect(() => {
    async function loadAll(): Promise<void> {
      try {
        await Promise.all([load(today), loadProjects(), loadDomains()])
        const activeMilestones = await db.milestone
          .where('status')
          .anyOf(['planned', 'in_progress'])
          .toArray()
        setMilestones(activeMilestones)
      } catch (error) {
        console.error('Today.loadAll', error)
      }
    }
    loadAll()
  }, [today])

  // Construction de la carte de traçabilité
  useEffect(() => {
    const map: Record<string, TraceInfo> = {}
    for (const milestone of milestones) {
      const project = projects.find((p) => p.id === milestone.project_id)
      if (!project) continue
      const domain = domains.find((d) => d.id === project.domain_id)
      if (!domain) continue
      map[milestone.id] = { milestone, project, domain }
    }
    setTraceMap(map)
  }, [milestones, projects, domains])

  // Chargement des jalons manquants (jalons d'actions passées hors planned/in_progress)
  useEffect(() => {
    const missingIds = [...new Set(
      actions
        .map((a) => a.milestone_id)
        .filter((id) => !traceMap[id])
    )]
    if (missingIds.length === 0 || projects.length === 0 || domains.length === 0) return

    db.milestone.bulkGet(missingIds).then((results) => {
      const extra: Record<string, TraceInfo> = {}
      for (const m of results) {
        if (!m) continue
        const project = projects.find((p) => p.id === m.project_id)
        if (!project) continue
        const domain = domains.find((d) => d.id === project.domain_id)
        if (!domain) continue
        extra[m.id] = { milestone: m, project, domain }
      }
      if (Object.keys(extra).length > 0) {
        setTraceMap((prev) => ({ ...prev, ...extra }))
      }
    }).catch(console.error)
  }, [actions, traceMap, projects, domains])

  // Focus sur le champ titre quand le formulaire s'ouvre
  useEffect(() => {
    if (showForm) {
      setTimeout(() => titleInputRef.current?.focus(), 50)
    }
  }, [showForm])

  // Options du select regroupées par domaine
  const milestoneOptions = milestones
    .reduce<Array<{ domainLabel: string; items: Array<{ value: string; label: string }> }>>(
      (groups, milestone) => {
        const trace = traceMap[milestone.id]
        if (!trace) return groups
        const domainLabel = `${trace.domain.icon} ${trace.domain.name}`
        let group = groups.find((g) => g.domainLabel === domainLabel)
        if (!group) {
          group = { domainLabel, items: [] }
          groups.push(group)
        }
        group.items.push({
          value: milestone.id,
          label: `${trace.project.title} — ${milestone.title}`,
        })
        return groups
      },
      []
    )

  const selectedTrace = formMilestoneId ? traceMap[formMilestoneId] : null

  const handleOpenForm = (): void => {
    setShowForm(true)
  }

  const handleCloseForm = (): void => {
    setShowForm(false)
    setFormMilestoneId('')
    setFormTitle('')
    setFormMinutes('')
  }

  const handleSubmit = async (): Promise<void> => {
    if (!formMilestoneId || !formTitle.trim()) return
    setSubmitting(true)
    try {
      await addAction({
        milestone_id: formMilestoneId,
        title: formTitle.trim(),
        date: today,
        estimated_minutes: formMinutes ? parseInt(formMinutes, 10) : null,
      })
      handleCloseForm()
    } catch {
      // Erreur loggée dans le store
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      handleCloseForm()
    }
  }

  // Toggle action + sync bloc lié automatiquement
  const handleToggleAction = async (actionId: string): Promise<void> => {
    const action = actions.find((a) => a.id === actionId)
    if (!action) return
    const willBeDone = !action.done
    await toggleDone(actionId)
    const linkedBlock = blocks.find((b) => b.action_id === actionId)
    if (linkedBlock && linkedBlock.done !== willBeDone) {
      await toggleBlockDone(linkedBlock.id)
    }
  }

  // Premier bloc créé → marque time_blocking_done dans le journal
  const handleFirstBlockAdded = async (): Promise<void> => {
    try {
      await saveEntry(today, { time_blocking_done: true })
    } catch {
      // Non critique
    }
  }

  const completed = actions.filter((a) => a.done).length
  const total = actions.length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="today">
      <style>{STYLE}</style>

      {/* ── En-tête ── */}
      <div className="today-header">
        <h1 className="today-title">Aujourd'hui</h1>
        <span className="today-date">{dateLabel}</span>
      </div>

      {/* ── Progression ── */}
      {total > 0 && (
        <div className="today-progress">
          <div className="today-progress-label">
            <span className="today-progress-text">
              {completed} / {total} action{total > 1 ? 's' : ''} accomplie{completed > 1 ? 's' : ''}
            </span>
            {completed === total && total > 0 && (
              <span className="today-progress-pct">Journée accomplie</span>
            )}
            {completed < total && (
              <span className="today-progress-pct">{progress} %</span>
            )}
          </div>
          <div className="today-progress-bar">
            <div
              className="today-progress-fill"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {/* ── Formulaire d'ajout ── */}
      {showForm ? (
        <div className="today-form">
          <div className="today-form-header">
            <span className="today-form-title">Nouvelle action du jour</span>
            <button className="today-form-close" onClick={handleCloseForm} aria-label="Fermer">
              <X size={16} />
            </button>
          </div>

          {/* Sélecteur de jalon */}
          <div className="form-field">
            <label htmlFor="form-milestone" className="form-label">Jalon *</label>
            <div className="form-select-wrapper">
              <select
                id="form-milestone"
                className="form-select"
                value={formMilestoneId}
                onChange={(e) => setFormMilestoneId(e.target.value)}
              >
                <option value="">— Choisir un jalon —</option>
                {milestoneOptions.map((group) => (
                  <optgroup key={group.domainLabel} label={group.domainLabel}>
                    {group.items.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <span className="form-select-arrow">
                <ChevronDown size={14} />
              </span>
            </div>

            {/* Confirmation de traçabilité */}
            {selectedTrace && (
              <span className="form-trace-hint">
                {selectedTrace.domain.icon} {selectedTrace.domain.name} · {selectedTrace.project.title} · {selectedTrace.milestone.title}
              </span>
            )}
          </div>

          {/* Titre + durée */}
          <div className="form-row">
            <div className="form-field" style={{ flex: 1 }}>
              <label htmlFor="form-title" className="form-label">Titre *</label>
              <input
                ref={titleInputRef}
                id="form-title"
                type="text"
                className="form-input"
                placeholder="Décris l'action à accomplir..."
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={200}
              />
            </div>

            <div className="form-field form-duration">
              <label htmlFor="form-minutes" className="form-label">Min</label>
              <input
                id="form-minutes"
                type="number"
                className="form-input"
                placeholder="—"
                value={formMinutes}
                onChange={(e) => setFormMinutes(e.target.value)}
                onKeyDown={handleKeyDown}
                min={1}
                max={480}
              />
            </div>
          </div>

          <div className="form-actions">
            <button className="form-cancel" onClick={handleCloseForm}>
              Annuler
            </button>
            <button
              className="form-submit"
              onClick={handleSubmit}
              disabled={!formMilestoneId || !formTitle.trim() || submitting}
            >
              Ajouter
            </button>
          </div>
        </div>
      ) : (
        <button className="today-add-btn" onClick={handleOpenForm}>
          <Plus size={16} />
          Ajouter une action du jour
        </button>
      )}

      {/* ── Layout 2 colonnes ── */}
      <div className="today-layout">

        {/* Colonne gauche — Actions */}
        <div className="today-left">
          {total > 0 && (
            <span className="today-section-title">Actions du jour</span>
          )}
          <ActionList
            actions={actions}
            traceMap={traceMap}
            onToggle={handleToggleAction}
            onDelete={deleteAction}
          />
        </div>

        {/* Colonne droite — Timeline */}
        <div className="today-right">
          <TimelineView
            date={today}
            actions={actions}
            onFirstBlockAdded={handleFirstBlockAdded}
          />
        </div>

      </div>
    </div>
  )
}
