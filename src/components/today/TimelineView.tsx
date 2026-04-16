// DestinyPlanner — Timeline 24h scrollable
// Desktop : colonne droite d'Aujourd'hui. Mobile : section en bas.
// Auto-scroll sur l'heure actuelle au montage.

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, AlertCircle } from 'lucide-react'
import { useTimeBlockStore } from '../../stores/useTimeBlockStore'
import { TimeBlockCard, CATEGORY_LABELS } from './TimeBlockCard'
import type { Action, TimeBlockCategory } from '../../types'

// ── Constantes de positionnement ──────────────────────────────
const DAY_START = 5       // 5h00
const DAY_END   = 23      // 23h00
const PX_PER_MIN = 1.5
const HOUR_H     = 60 * PX_PER_MIN  // 90px par heure
const TOTAL_H    = (DAY_END - DAY_START) * HOUR_H // 1620px
const HOURS      = Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => i + DAY_START)

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minToTime(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
}

function nowMinutes(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

// Arrondit au quart d'heure inférieur
function roundToQuarter(minutes: number): number {
  return Math.floor(minutes / 15) * 15
}

function defaultStartTime(): string {
  const m = Math.max(DAY_START * 60, Math.min((DAY_END - 1) * 60, roundToQuarter(nowMinutes())))
  return minToTime(m)
}

function defaultEndTime(start: string): string {
  const m = Math.min(DAY_END * 60, timeToMin(start) + 60)
  return minToTime(m)
}

const CATEGORIES: TimeBlockCategory[] = ['work', 'spiritual', 'family', 'health', 'rest', 'free']

const STYLE = `
  .timeline {
    display: flex;
    flex-direction: column;
    gap: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    overflow: hidden;
  }

  /* ── En-tête ── */
  .timeline-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .timeline-title {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-2);
  }

  .timeline-add-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: var(--gold-pale);
    border: 1px solid rgba(196,154,60,0.25);
    border-radius: var(--r-sm);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--gold-soft);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .timeline-add-btn:hover {
    background: rgba(196,154,60,0.2);
  }

  /* ── Formulaire ── */
  .timeline-form {
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border);
    background: var(--surface-2);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .tf-row {
    display: flex;
    gap: var(--space-2);
    align-items: flex-end;
  }

  .tf-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .tf-field--fixed {
    flex: 0 0 auto;
  }

  .tf-label {
    font-size: var(--text-xs);
    color: var(--text-3);
    font-weight: var(--weight-medium);
  }

  .tf-input,
  .tf-select {
    padding: 6px var(--space-3);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    font-size: var(--text-sm);
    font-family: var(--font-ui);
    color: var(--text-1);
    outline: none;
    transition: border-color var(--transition-fast);
    width: 100%;
    box-sizing: border-box;
  }

  .tf-input:focus,
  .tf-select:focus {
    border-color: var(--gold);
  }

  .tf-select option {
    background: var(--surface-2);
  }

  .tf-error {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--text-xs);
    color: var(--coral);
    padding: 4px 0;
  }

  .tf-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }

  .tf-cancel {
    padding: 5px 12px;
    background: none;
    border: 1px solid var(--border-2);
    border-radius: var(--r-sm);
    font-size: var(--text-xs);
    color: var(--text-2);
    cursor: pointer;
  }

  .tf-submit {
    padding: 5px 14px;
    background: var(--gold);
    border: none;
    border-radius: var(--r-sm);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: #0F0E0D;
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }

  .tf-submit:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* ── Zone scrollable ── */
  .timeline-scroll {
    overflow-y: auto;
    height: 500px;
    position: relative;
    flex-shrink: 0;
  }

  .timeline-ruler {
    position: relative;
    width: 100%;
    height: ${TOTAL_H}px;
    user-select: none;
  }

  /* ── Lignes d'heure ── */
  .tl-hour {
    position: absolute;
    left: 0;
    right: 0;
    display: flex;
    align-items: flex-start;
    pointer-events: none;
  }

  .tl-hour-label {
    width: 36px;
    flex-shrink: 0;
    font-size: 10px;
    color: var(--text-3);
    padding-left: var(--space-2);
    line-height: 1;
    margin-top: -5px;
  }

  .tl-hour-line {
    flex: 1;
    height: 1px;
    background: var(--border);
    margin-top: 0;
  }

  /* ── Blocs positionnés ── */
  .tl-block-wrap {
    position: absolute;
    left: 40px;
    right: var(--space-2);
  }

  /* ── Indicateur "maintenant" ── */
  .tl-now {
    position: absolute;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    pointer-events: none;
    z-index: 2;
  }

  .tl-now-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--coral);
    flex-shrink: 0;
    margin-left: 34px;
  }

  .tl-now-line {
    flex: 1;
    height: 1px;
    background: var(--coral);
    opacity: 0.5;
  }

  /* ── Vide ── */
  .timeline-empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .timeline-empty-text {
    font-size: var(--text-xs);
    color: var(--text-3);
    font-style: italic;
  }
`

interface TimelineViewProps {
  date: string
  actions: Action[]
  onFirstBlockAdded: () => void
}

interface FormState {
  title: string
  start_time: string
  end_time: string
  category: TimeBlockCategory
  action_id: string
}

function makeDefaultForm(): FormState {
  const start = defaultStartTime()
  return {
    title: '',
    start_time: start,
    end_time: defaultEndTime(start),
    category: 'work',
    action_id: '',
  }
}

export function TimelineView({ date, actions, onFirstBlockAdded }: TimelineViewProps): JSX.Element {
  const { blocks, load, addBlock, deleteBlock, validationError, clearValidationError } = useTimeBlockStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(makeDefaultForm())
  const [submitting, setSubmitting] = useState(false)

  // Chargement initial des blocs
  useEffect(() => {
    load(date).catch(console.error)
  }, [date])

  // Auto-scroll sur l'heure actuelle
  useEffect(() => {
    if (!scrollRef.current) return
    const nowMin = nowMinutes()
    if (nowMin < DAY_START * 60 || nowMin > DAY_END * 60) return
    const top = (nowMin - DAY_START * 60) * PX_PER_MIN
    scrollRef.current.scrollTop = Math.max(0, top - 120)
  }, [])

  const handleOpenForm = useCallback((): void => {
    setForm(makeDefaultForm())
    clearValidationError()
    setShowForm(true)
  }, [clearValidationError])

  const handleCloseForm = useCallback((): void => {
    setShowForm(false)
    clearValidationError()
  }, [clearValidationError])

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!form.title.trim() || !form.start_time || !form.end_time) return
    setSubmitting(true)
    try {
      const wasEmpty = blocks.length === 0
      const result = await addBlock({
        date,
        title: form.title.trim(),
        start_time: form.start_time,
        end_time: form.end_time,
        category: form.category,
        action_id: form.action_id || null,
        color_override: null,
        notes: '',
      })
      if (result) {
        if (wasEmpty) onFirstBlockAdded()
        handleCloseForm()
      }
    } finally {
      setSubmitting(false)
    }
  }, [form, blocks, date, addBlock, onFirstBlockAdded, handleCloseForm])

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSubmit() }
    if (e.key === 'Escape') handleCloseForm()
  }

  // Calculs de positionnement
  const now = nowMinutes()
  const nowTop = (now - DAY_START * 60) * PX_PER_MIN
  const isNowVisible = now >= DAY_START * 60 && now <= DAY_END * 60
  const today = new Date().toISOString().slice(0, 10)
  const isToday = date === today

  // Actions non liées à un bloc (pour le select du formulaire)
  const linkedActionIds = new Set(blocks.map(b => b.action_id).filter(Boolean))
  const availableActions = actions.filter(a => !linkedActionIds.has(a.id))

  return (
    <>
      <style>{STYLE}</style>
      <div className="timeline">

        {/* En-tête */}
        <div className="timeline-header">
          <span className="timeline-title">Blocs horaires</span>
          {!showForm && (
            <button className="timeline-add-btn" onClick={handleOpenForm}>
              <Plus size={12} />
              Ajouter
            </button>
          )}
        </div>

        {/* Formulaire d'ajout */}
        {showForm && (
          <div className="timeline-form">
            <div className="tf-field">
              <label className="tf-label">Titre *</label>
              <input
                className="tf-input"
                type="text"
                placeholder="Nom du bloc horaire…"
                value={form.title}
                autoFocus
                maxLength={100}
                onChange={e => setForm(s => ({ ...s, title: e.target.value }))}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="tf-row">
              <div className="tf-field">
                <label className="tf-label">Début</label>
                <input
                  className="tf-input"
                  type="time"
                  value={form.start_time}
                  onChange={e => setForm(s => ({
                    ...s,
                    start_time: e.target.value,
                    end_time: defaultEndTime(e.target.value),
                  }))}
                />
              </div>
              <div className="tf-field">
                <label className="tf-label">Fin</label>
                <input
                  className="tf-input"
                  type="time"
                  value={form.end_time}
                  onChange={e => setForm(s => ({ ...s, end_time: e.target.value }))}
                />
              </div>
              <div className="tf-field">
                <label className="tf-label">Catégorie</label>
                <select
                  className="tf-select"
                  value={form.category}
                  onChange={e => setForm(s => ({ ...s, category: e.target.value as TimeBlockCategory }))}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>
            </div>

            {availableActions.length > 0 && (
              <div className="tf-field">
                <label className="tf-label">Action liée (optionnel)</label>
                <select
                  className="tf-select"
                  value={form.action_id}
                  onChange={e => setForm(s => ({ ...s, action_id: e.target.value }))}
                >
                  <option value="">— Aucune —</option>
                  {availableActions.map(a => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>
            )}

            {validationError && (
              <div className="tf-error">
                <AlertCircle size={12} />
                {validationError}
              </div>
            )}

            <div className="tf-actions">
              <button className="tf-cancel" onClick={handleCloseForm}>Annuler</button>
              <button
                className="tf-submit"
                disabled={!form.title.trim() || submitting}
                onClick={() => void handleSubmit()}
              >
                {submitting ? 'Ajout…' : 'Ajouter'}
              </button>
            </div>
          </div>
        )}

        {/* Timeline scrollable */}
        <div className="timeline-scroll" ref={scrollRef}>
          <div className="timeline-ruler" style={{ height: TOTAL_H }}>

            {/* Lignes d'heures */}
            {HOURS.map(h => (
              <div
                key={h}
                className="tl-hour"
                style={{ top: (h - DAY_START) * HOUR_H }}
              >
                <span className="tl-hour-label">{h}h</span>
                <div className="tl-hour-line" />
              </div>
            ))}

            {/* Indicateur "maintenant" */}
            {isToday && isNowVisible && (
              <div className="tl-now" style={{ top: nowTop }}>
                <div className="tl-now-dot" />
                <div className="tl-now-line" />
              </div>
            )}

            {/* Blocs positionnés */}
            {blocks.map(block => {
              const startMin = timeToMin(block.start_time)
              const endMin   = timeToMin(block.end_time)
              const top    = (startMin - DAY_START * 60) * PX_PER_MIN
              const height = Math.max(28, (endMin - startMin) * PX_PER_MIN)
              return (
                <div
                  key={block.id}
                  className="tl-block-wrap"
                  style={{ top, height }}
                >
                  <TimeBlockCard
                    block={block}
                    onDelete={() => deleteBlock(block.id).catch(console.error)}
                  />
                </div>
              )
            })}

            {/* État vide */}
            {blocks.length === 0 && (
              <div className="timeline-empty">
                <span className="timeline-empty-text">Aucun bloc — planifiez votre journée</span>
              </div>
            )}

          </div>
        </div>

      </div>
    </>
  )
}
