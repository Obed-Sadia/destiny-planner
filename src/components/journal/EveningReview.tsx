// DestinyPlanner — Bilan du soir
// Bilan, détours de la journée, leçons, score d'attitudes

import { useRef, useState, useEffect, useCallback } from 'react'
import { Moon, Plus, X, CheckCircle, AlertTriangle } from 'lucide-react'
import { useJournalStore } from '../../stores/useJournalStore'
import { useHabitStore } from '../../stores/useHabitStore'
import { useDetourStore } from '../../stores/useDetourStore'
import { useTimeBlockStore } from '../../stores/useTimeBlockStore'
import { useUserStore } from '../../stores/useUserStore'
import { calculateDayScore } from '../../services/score'
import { ScoreWidget } from './ScoreWidget'
import { TimeBlockCard } from '../today/TimeBlockCard'
import { db } from '../../db/schema'
import type { JournalEntry, Detour } from '../../types'

const STYLE = `
  .evening {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  /* ── En-tête ── */
  .evening-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding-bottom: var(--space-4);
    border-bottom: 1px solid var(--border);
  }

  .evening-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--r-md);
    background: rgba(91, 155, 212, 0.1);
    color: var(--blue);
    flex-shrink: 0;
  }

  .evening-title {
    font-family: var(--font-editorial);
    font-size: var(--text-xl);
    font-weight: 300;
    color: var(--text-1);
    line-height: var(--leading-tight);
  }

  .evening-date-label {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-3);
    margin-top: 2px;
  }

  .evening-saved {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--green);
    opacity: 0;
    transition: opacity var(--transition-slow);
    margin-left: auto;
  }

  .evening-saved--visible {
    opacity: 1;
  }

  /* ── Champs ── */
  .evening-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .evening-field-label {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .evening-textarea {
    font-family: var(--font-ui);
    font-size: var(--text-base);
    color: var(--text-1);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: var(--space-3) var(--space-4);
    resize: vertical;
    outline: none;
    line-height: var(--leading-normal);
    transition: border-color var(--transition-fast);
    min-height: 80px;
    width: 100%;
    box-sizing: border-box;
  }

  .evening-textarea:focus {
    border-color: var(--blue);
  }

  /* ── Section détours ── */
  .detour-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .detour-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .detour-add-btn {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: 4px 10px;
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

  .detour-add-btn:hover {
    border-color: var(--amber);
    color: var(--amber);
  }

  .detour-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .detour-empty {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-3);
    font-style: italic;
    padding: var(--space-3) 0;
  }

  /* ── Carte détour ── */
  .detour-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-left: 3px solid var(--amber);
    border-radius: var(--r-md);
    padding: var(--space-3) var(--space-4);
    display: flex;
    gap: var(--space-3);
    align-items: flex-start;
  }

  .detour-card--systemic {
    border-left-color: var(--coral);
  }

  .detour-card-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .detour-obstacle {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text-1);
  }

  .detour-adjustment {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-2);
    line-height: var(--leading-snug);
  }

  .detour-systemic-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--coral);
    background: rgba(224, 112, 112, 0.12);
    padding: 2px 6px;
    border-radius: var(--r-full);
    margin-top: 4px;
    align-self: flex-start;
  }

  .detour-delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: var(--text-3);
    cursor: pointer;
    border-radius: var(--r-sm);
    flex-shrink: 0;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .detour-delete-btn:hover {
    background: rgba(224, 112, 112, 0.12);
    color: var(--coral);
  }

  /* ── Formulaire ajout détour ── */
  .detour-form {
    background: rgba(212, 133, 74, 0.06);
    border: 1px solid rgba(212, 133, 74, 0.2);
    border-radius: var(--r-md);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .detour-form-row {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
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

  .detour-form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }

  .btn-detour-cancel {
    padding: 5px 12px;
    background: transparent;
    border: 1px solid var(--border-2);
    border-radius: var(--r-sm);
    color: var(--text-3);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    cursor: pointer;
    transition: color var(--transition-fast);
  }

  .btn-detour-cancel:hover {
    color: var(--text-2);
  }

  .btn-detour-save {
    padding: 5px 14px;
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

  .btn-detour-save:hover {
    background: rgba(212, 133, 74, 0.22);
  }

  .btn-detour-save:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* ── Revue des blocs ── */
  .blocks-review {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .blocks-review-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .blocks-review-empty {
    font-size: var(--text-sm);
    color: var(--text-3);
    font-style: italic;
    padding: var(--space-2) 0;
  }
`

interface DetourFormState {
  obstacle: string
  impact: string
  adjustment: string
}

function blankDetourForm(): DetourFormState {
  return { obstacle: '', impact: '', adjustment: '' }
}

interface EveningReviewProps {
  date: string
  entry: JournalEntry | null
}

export function EveningReview({ date, entry }: EveningReviewProps): JSX.Element {
  const { saveEntry, updateScore } = useJournalStore()
  const habits = useHabitStore((s) => s.habits)
  const checks = useHabitStore((s) => s.checks)
  const { addDetour, deleteDetour } = useDetourStore()
  const { blocks, load: loadBlocks, toggleDone: toggleBlockDone } = useTimeBlockStore()
  const { profile, updateProfile } = useUserStore()

  const [eveningReview, setEveningReview] = useState<string>(entry?.evening_review ?? '')
  const [lessons, setLessons]             = useState<string>(entry?.lessons ?? '')
  const [detours, setDetours]             = useState<Detour[]>([])
  const [showDetourForm, setShowDetourForm] = useState<boolean>(false)
  const [detourForm, setDetourForm]       = useState<DetourFormState>(blankDetourForm())
  const [saved, setSaved]                 = useState<boolean>(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync si l'entrée change (chargement différé)
  useEffect(() => {
    setEveningReview(entry?.evening_review ?? '')
    setLessons(entry?.lessons ?? '')
  }, [entry?.id])

  // Charger les détours et blocs du jour
  useEffect(() => {
    db.detour.where('date').equals(date).toArray()
      .then(setDetours)
      .catch(console.error)
    loadBlocks(date).catch(console.error)
  }, [date])

  const autosave = useCallback(
    (patch: Partial<Pick<JournalEntry, 'evening_review' | 'lessons'>>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        try {
          await saveEntry(date, patch)
          // Recalculer et persister le score à chaque sauvegarde du soir
          const score = calculateDayScore(checks, habits)
          await updateScore(date, score)
          setSaved(true)
          setTimeout(() => setSaved(false), 1500)
        } catch (error) {
          console.error('EveningReview.autosave', error)
        }
      }, 300)
    },
    [date, checks, habits, saveEntry, updateScore],
  )

  function handleEveningReview(value: string): void {
    setEveningReview(value)
    autosave({ evening_review: value })
  }

  function handleLessons(value: string): void {
    setLessons(value)
    autosave({ lessons: value })
  }

  async function handleAddDetour(): Promise<void> {
    if (!detourForm.obstacle.trim()) return
    try {
      const detour = await addDetour({
        project_id: null,
        date,
        obstacle: detourForm.obstacle.trim(),
        impact: detourForm.impact.trim(),
        adjustment: detourForm.adjustment.trim(),
        linked_habit_id: null,
      })
      setDetours((prev) => [...prev, detour])
      setDetourForm(blankDetourForm())
      setShowDetourForm(false)
    } catch (error) {
      console.error('EveningReview.handleAddDetour', error)
    }
  }

  // Toggle bloc + incrément total_time_blocks_done si passage à done
  async function handleBlockToggle(blockId: string): Promise<void> {
    const block = blocks.find((b) => b.id === blockId)
    if (!block) return
    const willBeDone = !block.done
    await toggleBlockDone(blockId)
    if (willBeDone && profile) {
      await updateProfile({ total_time_blocks_done: profile.total_time_blocks_done + 1 })
    }
  }

  async function handleDeleteDetour(id: string): Promise<void> {
    try {
      await deleteDetour(id)
      setDetours((prev) => prev.filter((d) => d.id !== id))
    } catch (error) {
      console.error('EveningReview.handleDeleteDetour', error)
    }
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className="evening">

        {/* En-tête */}
        <div className="evening-header">
          <div className="evening-icon">
            <Moon size={18} />
          </div>
          <div>
            <div className="evening-title">Bilan du soir</div>
            <div className="evening-date-label">Prenez le temps de réfléchir à votre journée</div>
          </div>
          <span className={`evening-saved ${saved ? 'evening-saved--visible' : ''}`}>
            Enregistré
          </span>
        </div>

        {/* Score d'attitudes */}
        <ScoreWidget />

        {/* Bilan de la journée */}
        <div className="evening-field">
          <label className="evening-field-label">Bilan de ma journée</label>
          <textarea
            className="evening-textarea"
            placeholder="Comment s'est passée ma journée ? Qu'est-ce que j'ai accompli ?"
            value={eveningReview}
            rows={4}
            onChange={(e) => handleEveningReview(e.target.value)}
          />
        </div>

        {/* Détours */}
        <div className="detour-section">
          <div className="detour-section-header">
            <span className="evening-field-label">Détours rencontrés</span>
            {!showDetourForm && (
              <button className="detour-add-btn" onClick={() => setShowDetourForm(true)}>
                <Plus size={12} />
                Ajouter un détour
              </button>
            )}
          </div>

          <div className="detour-list">
            {detours.length === 0 && !showDetourForm && (
              <p className="detour-empty">Aucun détour aujourd'hui.</p>
            )}

            {detours.map((detour) => (
              <div
                key={detour.id}
                className={`detour-card ${detour.is_systemic ? 'detour-card--systemic' : ''}`}
              >
                <div className="detour-card-body">
                  <span className="detour-obstacle">{detour.obstacle}</span>
                  {detour.adjustment && (
                    <span className="detour-adjustment">→ {detour.adjustment}</span>
                  )}
                  {detour.is_systemic && (
                    <span className="detour-systemic-badge">
                      <AlertTriangle size={11} />
                      Détour systémique
                    </span>
                  )}
                </div>
                <button
                  className="detour-delete-btn"
                  onClick={() => handleDeleteDetour(detour.id).catch(console.error)}
                  title="Supprimer"
                >
                  <X size={13} />
                </button>
              </div>
            ))}

            {showDetourForm && (
              <div className="detour-form">
                <div className="detour-form-row">
                  <label className="detour-form-label">Obstacle rencontré *</label>
                  <input
                    className="detour-form-input"
                    type="text"
                    placeholder="Quel obstacle avez-vous rencontré ?"
                    value={detourForm.obstacle}
                    onChange={(e) => setDetourForm((s) => ({ ...s, obstacle: e.target.value }))}
                    autoFocus
                  />
                </div>
                <div className="detour-form-row">
                  <label className="detour-form-label">Impact</label>
                  <input
                    className="detour-form-input"
                    type="text"
                    placeholder="Quel a été l'impact sur votre journée ?"
                    value={detourForm.impact}
                    onChange={(e) => setDetourForm((s) => ({ ...s, impact: e.target.value }))}
                  />
                </div>
                <div className="detour-form-row">
                  <label className="detour-form-label">Ajustement prévu</label>
                  <textarea
                    className="detour-form-textarea"
                    placeholder="Comment comptez-vous vous adapter ?"
                    value={detourForm.adjustment}
                    onChange={(e) => setDetourForm((s) => ({ ...s, adjustment: e.target.value }))}
                  />
                </div>
                <div className="detour-form-actions">
                  <button
                    className="btn-detour-cancel"
                    onClick={() => { setShowDetourForm(false); setDetourForm(blankDetourForm()) }}
                  >
                    Annuler
                  </button>
                  <button
                    className="btn-detour-save"
                    disabled={!detourForm.obstacle.trim()}
                    onClick={() => handleAddDetour().catch(console.error)}
                  >
                    <CheckCircle size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    Documenter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Revue des blocs horaires */}
        <div className="blocks-review">
          <span className="evening-field-label">Blocs horaires respectés</span>
          {blocks.length === 0 ? (
            <p className="blocks-review-empty">Aucun bloc planifié pour cette journée.</p>
          ) : (
            <div className="blocks-review-list">
              {blocks.map((block) => (
                <TimeBlockCard
                  key={block.id}
                  block={block}
                  onToggle={() => { void handleBlockToggle(block.id) }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Leçons reçues */}
        <div className="evening-field">
          <label className="evening-field-label">Leçons reçues</label>
          <textarea
            className="evening-textarea"
            placeholder="Qu'ai-je appris aujourd'hui ? Quelle leçon vais-je retenir ?"
            value={lessons}
            rows={3}
            onChange={(e) => handleLessons(e.target.value)}
          />
        </div>

      </div>
    </>
  )
}
