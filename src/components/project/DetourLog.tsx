// DestinyPlanner — Log des détours d'un projet
// Règle : la suggestion d'habitude corrective n'est jamais automatique — l'utilisateur confirme

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, CheckCircle, AlertTriangle, Lightbulb, RotateCcw } from 'lucide-react'
import { useDetourStore } from '../../stores/useDetourStore'
import { useHabitStore } from '../../stores/useHabitStore'
import { suggestHabitForObstacle, isObstacleSystemic } from '../../services/detourAnalysis'
import { db } from '../../db/schema'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Detour } from '../../types'

const STYLE = `
  .detour-log {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  /* ── En-tête section ── */
  .detour-log-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .detour-log-title {
    font-family: var(--font-ui);
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
  }

  .detour-log-count {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-3);
    background: var(--surface-2);
    padding: 2px 8px;
    border-radius: var(--r-full);
  }

  .detour-log-add-btn {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: 5px 10px;
    background: transparent;
    border: 1px solid var(--border-2);
    border-radius: var(--r-sm);
    color: var(--text-3);
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: border-color var(--transition-fast), color var(--transition-fast);
  }

  .detour-log-add-btn:hover {
    border-color: var(--amber);
    color: var(--amber);
  }

  /* ── Liste ── */
  .detour-log-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .detour-log-empty {
    padding: var(--space-6) var(--space-4);
    text-align: center;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-3);
    font-style: italic;
    background: var(--surface);
    border: 1px dashed var(--border);
    border-radius: var(--r-md);
  }

  /* ── Carte détour ── */
  .detour-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-left: 3px solid var(--amber);
    border-radius: var(--r-md);
    padding: var(--space-3) var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    transition: border-color var(--transition-fast);
  }

  .detour-card--systemic {
    border-left-color: var(--coral);
  }

  .detour-card--resolved {
    border-left-color: var(--green);
    opacity: 0.7;
  }

  .detour-card-top {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .detour-card-body {
    flex: 1;
    min-width: 0;
  }

  .detour-card-obstacle {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text-1);
    margin-bottom: 4px;
  }

  .detour-card-resolved .detour-card-obstacle {
    text-decoration: line-through;
    color: var(--text-3);
  }

  .detour-card-impact {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-2);
    line-height: var(--leading-snug);
    margin-bottom: 4px;
  }

  .detour-card-adjustment {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-2);
    line-height: var(--leading-snug);
  }

  .detour-card-adjustment::before {
    content: '→ ';
    color: var(--text-3);
  }

  .detour-card-meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
    margin-top: var(--space-1);
  }

  .detour-card-date {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  .detour-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    padding: 1px 6px;
    border-radius: var(--r-full);
  }

  .detour-badge--systemic {
    background: rgba(224, 112, 112, 0.12);
    color: var(--coral);
  }

  .detour-badge--resolved {
    background: rgba(90, 158, 111, 0.12);
    color: var(--green);
  }

  .detour-card-actions {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    flex-shrink: 0;
  }

  .detour-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    border-radius: var(--r-sm);
    cursor: pointer;
    color: var(--text-3);
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .detour-icon-btn:hover {
    background: var(--surface-2);
    color: var(--text-2);
  }

  .detour-icon-btn--resolve:hover {
    background: rgba(90, 158, 111, 0.12);
    color: var(--green);
  }

  .detour-icon-btn--reopen:hover {
    background: rgba(212, 133, 74, 0.12);
    color: var(--amber);
  }

  .detour-icon-btn--delete:hover {
    background: rgba(224, 112, 112, 0.12);
    color: var(--coral);
  }

  /* ── Panel suggestion habitude ── */
  .habit-suggestion {
    margin-top: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: rgba(196, 154, 60, 0.06);
    border: 1px solid rgba(196, 154, 60, 0.2);
    border-radius: var(--r-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    animation: suggFadeIn 200ms ease both;
  }

  @keyframes suggFadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .habit-suggestion-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--gold-soft);
  }

  .habit-suggestion-text {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-2);
    line-height: var(--leading-normal);
  }

  .habit-suggestion-name {
    display: inline;
    font-weight: var(--weight-semibold);
    color: var(--text-1);
  }

  .habit-suggestion-actions {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .btn-suggestion-confirm {
    padding: 5px 12px;
    background: var(--gold-pale);
    border: 1px solid rgba(196, 154, 60, 0.3);
    border-radius: var(--r-sm);
    color: var(--gold-soft);
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .btn-suggestion-confirm:hover {
    background: rgba(196, 154, 60, 0.2);
  }

  .btn-suggestion-dismiss {
    padding: 5px 10px;
    background: transparent;
    border: 1px solid var(--border-2);
    border-radius: var(--r-sm);
    color: var(--text-3);
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    cursor: pointer;
    transition: color var(--transition-fast);
  }

  .btn-suggestion-dismiss:hover {
    color: var(--text-2);
  }

  /* ── Formulaire d'ajout ── */
  .detour-form {
    background: rgba(212, 133, 74, 0.06);
    border: 1px solid rgba(212, 133, 74, 0.2);
    border-radius: var(--r-md);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .detour-form-title {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
    margin-bottom: var(--space-1);
  }

  .detour-form-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .detour-form-label {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--text-3);
  }

  .detour-form-input {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-1);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    padding: var(--space-2) var(--space-3);
    outline: none;
    width: 100%;
    box-sizing: border-box;
    transition: border-color var(--transition-fast);
  }

  .detour-form-input:focus {
    border-color: var(--amber);
  }

  .detour-form-textarea {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-1);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    padding: var(--space-2) var(--space-3);
    outline: none;
    resize: vertical;
    min-height: 60px;
    width: 100%;
    box-sizing: border-box;
    transition: border-color var(--transition-fast);
    line-height: var(--leading-normal);
  }

  .detour-form-textarea:focus {
    border-color: var(--amber);
  }

  .detour-form-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }

  .btn-form-cancel {
    padding: 6px 12px;
    background: transparent;
    border: 1px solid var(--border-2);
    border-radius: var(--r-sm);
    color: var(--text-3);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    cursor: pointer;
    transition: color var(--transition-fast);
  }

  .btn-form-cancel:hover {
    color: var(--text-2);
  }

  .btn-form-submit {
    padding: 6px 16px;
    background: rgba(212, 133, 74, 0.15);
    border: 1px solid rgba(212, 133, 74, 0.3);
    border-radius: var(--r-sm);
    color: var(--amber);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .btn-form-submit:hover {
    background: rgba(212, 133, 74, 0.22);
  }

  .btn-form-submit:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

interface FormState {
  obstacle: string
  impact: string
  adjustment: string
}

function blankForm(): FormState {
  return { obstacle: '', impact: '', adjustment: '' }
}

interface SuggestionState {
  detourId: string
  suggestedName: string
  rationale: string
  existingHabitId: string | null
}

interface DetourLogProps {
  projectId: string
}

export function DetourLog({ projectId }: DetourLogProps): JSX.Element {
  const navigate = useNavigate()
  const { addDetour, resolveDetour, deleteDetour } = useDetourStore()
  const habits = useHabitStore((s) => s.habits)

  const [detours, setDetours]           = useState<Detour[]>([])
  const [showForm, setShowForm]         = useState<boolean>(false)
  const [form, setForm]                 = useState<FormState>(blankForm())
  const [submitting, setSubmitting]     = useState<boolean>(false)
  const [suggestion, setSuggestion]     = useState<SuggestionState | null>(null)
  const [dismissed, setDismissed]       = useState<Set<string>>(new Set())

  const loadDetours = useCallback(async (): Promise<void> => {
    try {
      const rows = await db.detour
        .where('project_id')
        .equals(projectId)
        .sortBy('date')
      // Plus récents en premier
      setDetours(rows.reverse())
    } catch (error) {
      console.error('DetourLog.loadDetours', error)
    }
  }, [projectId])

  useEffect(() => {
    loadDetours().catch(console.error)
    useHabitStore.getState().load().catch(console.error)
  }, [loadDetours])

  async function handleSubmit(): Promise<void> {
    if (!form.obstacle.trim() || submitting) return
    setSubmitting(true)
    try {
      const detour = await addDetour({
        project_id: projectId,
        date: new Date().toISOString().slice(0, 10),
        obstacle: form.obstacle.trim(),
        impact: form.impact.trim(),
        adjustment: form.adjustment.trim(),
        linked_habit_id: null,
      })

      setDetours((prev) => [detour, ...prev])
      setForm(blankForm())
      setShowForm(false)

      // Vérifier si l'obstacle est systémique pour proposer une habitude
      const systemic = await isObstacleSystemic(detour.obstacle, detour.id)
      if (systemic) {
        const { suggestedName, rationale, existingHabit } = suggestHabitForObstacle(
          detour.obstacle,
          habits,
        )
        setSuggestion({
          detourId: detour.id,
          suggestedName,
          rationale,
          existingHabitId: existingHabit?.id ?? null,
        })
      }
    } catch (error) {
      console.error('DetourLog.handleSubmit', error)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResolve(id: string): Promise<void> {
    try {
      await resolveDetour(id)
      setDetours((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, resolved: true, resolved_at: new Date().toISOString() } : d,
        ),
      )
    } catch (error) {
      console.error('DetourLog.handleResolve', error)
    }
  }

  async function handleReopen(id: string): Promise<void> {
    try {
      await db.detour.update(id, { resolved: false, resolved_at: null })
      setDetours((prev) =>
        prev.map((d) => (d.id === id ? { ...d, resolved: false, resolved_at: null } : d)),
      )
    } catch (error) {
      console.error('DetourLog.handleReopen', error)
    }
  }

  async function handleDelete(id: string): Promise<void> {
    try {
      await deleteDetour(id)
      setDetours((prev) => prev.filter((d) => d.id !== id))
      if (suggestion?.detourId === id) setSuggestion(null)
    } catch (error) {
      console.error('DetourLog.handleDelete', error)
    }
  }

  function handleConfirmSuggestion(): void {
    // L'utilisateur choisit d'aller créer l'habitude — jamais automatique
    setSuggestion(null)
    navigate('/settings')
  }

  function handleDismissSuggestion(detourId: string): void {
    setSuggestion(null)
    setDismissed((prev) => new Set(prev).add(detourId))
  }

  const unresolved = detours.filter((d) => !d.resolved)
  const resolved   = detours.filter((d) => d.resolved)

  return (
    <>
      <style>{STYLE}</style>
      <div className="detour-log">

        {/* En-tête */}
        <div className="detour-log-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span className="detour-log-title">Détours</span>
            {detours.length > 0 && (
              <span className="detour-log-count">{detours.length}</span>
            )}
          </div>
          {!showForm && (
            <button className="detour-log-add-btn" onClick={() => setShowForm(true)}>
              <Plus size={12} />
              Documenter un détour
            </button>
          )}
        </div>

        {/* Suggestion d'habitude corrective */}
        {suggestion && !dismissed.has(suggestion.detourId) && (
          <div className="habit-suggestion">
            <div className="habit-suggestion-header">
              <Lightbulb size={14} />
              Détour systémique détecté
            </div>
            <p className="habit-suggestion-text">
              {suggestion.rationale}
              {suggestion.existingHabitId ? (
                <> Vous avez déjà une habitude qui peut vous aider.</>
              ) : (
                <> Créer l'habitude{' '}
                  <span className="habit-suggestion-name">« {suggestion.suggestedName} »</span>
                  {' '}dans vos paramètres pourrait prévenir cet obstacle.
                </>
              )}
            </p>
            <div className="habit-suggestion-actions">
              {!suggestion.existingHabitId && (
                <button className="btn-suggestion-confirm" onClick={handleConfirmSuggestion}>
                  Créer l'habitude dans Paramètres
                </button>
              )}
              <button
                className="btn-suggestion-dismiss"
                onClick={() => handleDismissSuggestion(suggestion.detourId)}
              >
                Ignorer
              </button>
            </div>
          </div>
        )}

        {/* Formulaire d'ajout */}
        {showForm && (
          <div className="detour-form">
            <div className="detour-form-title">Documenter un détour</div>

            <div className="detour-form-row">
              <label className="detour-form-label">Obstacle rencontré *</label>
              <input
                className="detour-form-input"
                type="text"
                placeholder="Quel obstacle avez-vous rencontré ?"
                value={form.obstacle}
                onChange={(e) => setForm((s) => ({ ...s, obstacle: e.target.value }))}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit().catch(console.error) }}
              />
            </div>

            <div className="detour-form-row">
              <label className="detour-form-label">Impact sur le projet</label>
              <input
                className="detour-form-input"
                type="text"
                placeholder="Comment cela affecte-t-il votre projet ?"
                value={form.impact}
                onChange={(e) => setForm((s) => ({ ...s, impact: e.target.value }))}
              />
            </div>

            <div className="detour-form-row">
              <label className="detour-form-label">Ajustement prévu</label>
              <textarea
                className="detour-form-textarea"
                placeholder="Comment comptez-vous contourner cet obstacle ?"
                value={form.adjustment}
                onChange={(e) => setForm((s) => ({ ...s, adjustment: e.target.value }))}
              />
            </div>

            <div className="detour-form-footer">
              <button
                className="btn-form-cancel"
                onClick={() => { setShowForm(false); setForm(blankForm()) }}
              >
                Annuler
              </button>
              <button
                className="btn-form-submit"
                disabled={!form.obstacle.trim() || submitting}
                onClick={() => handleSubmit().catch(console.error)}
              >
                <CheckCircle size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Documenter
              </button>
            </div>
          </div>
        )}

        {/* Liste des détours */}
        <div className="detour-log-list">
          {detours.length === 0 && !showForm && (
            <div className="detour-log-empty">
              Aucun détour documenté sur ce projet.
            </div>
          )}

          {/* Détours non résolus en premier */}
          {unresolved.map((detour) => (
            <DetourCard
              key={detour.id}
              detour={detour}
              onResolve={() => handleResolve(detour.id).catch(console.error)}
              onDelete={() => handleDelete(detour.id).catch(console.error)}
            />
          ))}

          {/* Détours résolus en bas */}
          {resolved.map((detour) => (
            <DetourCard
              key={detour.id}
              detour={detour}
              onReopen={() => handleReopen(detour.id).catch(console.error)}
              onDelete={() => handleDelete(detour.id).catch(console.error)}
            />
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Sous-composant carte détour ──────────────────────────────

interface DetourCardProps {
  detour: Detour
  onResolve?: () => void
  onReopen?: () => void
  onDelete: () => void
}

function DetourCard({ detour, onResolve, onReopen, onDelete }: DetourCardProps): JSX.Element {
  const cardClass = [
    'detour-card',
    detour.is_systemic && !detour.resolved ? 'detour-card--systemic' : '',
    detour.resolved ? 'detour-card--resolved' : '',
  ].filter(Boolean).join(' ')

  const dateLabel = format(parseISO(detour.date), 'd MMM', { locale: fr })

  return (
    <div className={cardClass}>
      <div className="detour-card-top">
        <div className="detour-card-body">
          <div className="detour-card-obstacle">{detour.obstacle}</div>
          {detour.impact && (
            <div className="detour-card-impact">{detour.impact}</div>
          )}
          {detour.adjustment && (
            <div className="detour-card-adjustment">{detour.adjustment}</div>
          )}
          <div className="detour-card-meta">
            <span className="detour-card-date">{dateLabel}</span>
            {detour.is_systemic && !detour.resolved && (
              <span className="detour-badge detour-badge--systemic">
                <AlertTriangle size={10} />
                Systémique
              </span>
            )}
            {detour.resolved && (
              <span className="detour-badge detour-badge--resolved">
                <CheckCircle size={10} />
                Résolu
              </span>
            )}
          </div>
        </div>

        <div className="detour-card-actions">
          {!detour.resolved && onResolve && (
            <button
              className="detour-icon-btn detour-icon-btn--resolve"
              onClick={onResolve}
              title="Marquer résolu"
            >
              <CheckCircle size={14} />
            </button>
          )}
          {detour.resolved && onReopen && (
            <button
              className="detour-icon-btn detour-icon-btn--reopen"
              onClick={onReopen}
              title="Rouvrir"
            >
              <RotateCcw size={14} />
            </button>
          )}
          <button
            className="detour-icon-btn detour-icon-btn--delete"
            onClick={onDelete}
            title="Supprimer"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
