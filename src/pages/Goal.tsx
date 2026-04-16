// DestinyPlanner — Page "But de vie"
// Mission, vision 10 ans, 3 valeurs — auto-save 300ms

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useGoalStore } from '@/stores/useGoalStore'

const STYLE = `
  .goal-page {
    max-width: 680px;
    padding-bottom: var(--space-16);
    animation: fadeIn 250ms ease both;
  }

  .goal-header {
    margin-bottom: var(--space-10);
  }

  .goal-eyebrow {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: var(--space-2);
  }

  .goal-title {
    font-family: var(--font-editorial);
    font-size: var(--text-3xl);
    font-weight: 600;
    color: var(--text-1);
    line-height: 1.15;
  }

  .goal-save-indicator {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: var(--text-xs);
    color: var(--text-3);
    margin-top: var(--space-3);
    height: 16px;
    transition: opacity var(--transition-slow);
  }

  .goal-save-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--text-3);
    flex-shrink: 0;
    transition: background var(--transition-base);
  }

  .goal-save-dot.saving {
    background: var(--gold);
    animation: pulse 600ms ease infinite;
  }

  .goal-save-dot.saved {
    background: var(--green);
  }

  .goal-section {
    margin-bottom: var(--space-10);
  }

  .goal-section-header {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--border);
  }

  .goal-section-title {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .goal-section-hint {
    font-size: var(--text-xs);
    color: var(--text-3);
    font-style: italic;
  }

  .goal-textarea-mission {
    width: 100%;
    font-family: var(--font-editorial);
    font-size: var(--text-xl);
    font-weight: 400;
    color: var(--text-1);
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    line-height: var(--leading-snug);
    min-height: 80px;
    caret-color: var(--gold);
  }

  .goal-textarea-mission::placeholder {
    color: var(--text-3);
    font-style: italic;
  }

  .goal-textarea {
    width: 100%;
    font-family: var(--font-ui);
    font-size: var(--text-base);
    color: var(--text-1);
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    line-height: var(--leading-normal);
    min-height: 80px;
    caret-color: var(--gold);
  }

  .goal-textarea::placeholder {
    color: var(--text-3);
  }

  .goal-values-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
    min-height: 32px;
  }

  .goal-value-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px var(--space-3);
    background: var(--gold-pale);
    border: 1px solid rgba(196,154,60,0.25);
    border-radius: var(--r-full);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--gold-soft);
    line-height: 1;
  }

  .goal-value-remove {
    display: flex;
    align-items: center;
    color: var(--gold);
    opacity: 0.6;
    cursor: pointer;
    padding: 0;
    transition: opacity var(--transition-fast);
  }

  .goal-value-remove:hover {
    opacity: 1;
  }

  .goal-value-input-wrap {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .goal-value-input {
    font-size: var(--text-sm);
    color: var(--text-1);
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--border-2);
    padding: 4px 0;
    outline: none;
    width: 180px;
    transition: border-color var(--transition-base);
    caret-color: var(--gold);
  }

  .goal-value-input:focus {
    border-bottom-color: var(--gold);
  }

  .goal-value-input::placeholder {
    color: var(--text-3);
  }

  .goal-value-hint {
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  .goal-value-max {
    font-size: var(--text-xs);
    color: var(--text-3);
    font-style: italic;
    padding: 4px 0;
  }
`

export default function Goal(): JSX.Element {
  const { goal, load, saveGoal } = useGoalStore()

  const [mission, setMission] = useState('')
  const [vision, setVision] = useState('')
  const [values, setValues] = useState<string[]>([])
  const [valueInput, setValueInput] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveIconTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Ref pour éviter la sauvegarde au chargement initial
  const didSync = useRef(false)
  const syncDone = useRef(false)

  useEffect(() => {
    load()
  }, [load])

  // Sync état local depuis le store (une seule fois)
  useEffect(() => {
    if (syncDone.current) return
    if (goal === null) {
      // Aucun but en base → état vide prêt à saisir
      syncDone.current = true
      didSync.current = true
      return
    }
    setMission(goal.mission ?? '')
    setVision(goal.vision_10_years ?? '')
    setValues(goal.values ?? [])
    syncDone.current = true
    // Marque la fin du sync pour bloquer le premier auto-save
    requestAnimationFrame(() => { didSync.current = true })
  }, [goal])

  // Auto-save avec debounce 300ms
  useEffect(() => {
    if (!didSync.current) return
    if (!mission && !vision && values.length === 0) return

    if (saveIconTimer.current) clearTimeout(saveIconTimer.current)
    const timer = setTimeout(async () => {
      setSaveState('saving')
      await saveGoal({ mission, vision_10_years: vision, values })
      setSaveState('saved')
      saveIconTimer.current = setTimeout(() => setSaveState('idle'), 1500)
    }, 300)

    return () => clearTimeout(timer)
  }, [mission, vision, values, saveGoal])

  function handleValueKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addValue()
    }
  }

  function addValue(): void {
    const trimmed = valueInput.trim().replace(/,$/, '')
    if (!trimmed || values.length >= 3 || values.includes(trimmed)) {
      setValueInput('')
      return
    }
    setValues((prev) => [...prev, trimmed])
    setValueInput('')
  }

  function removeValue(val: string): void {
    setValues((prev) => prev.filter((v) => v !== val))
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className="goal-page">
        <div className="goal-header">
          <div className="goal-eyebrow">Fondation</div>
          <h1 className="goal-title">Votre but de vie</h1>
          <div className="goal-save-indicator">
            <span className={`goal-save-dot${saveState !== 'idle' ? ` ${saveState}` : ''}`} />
            {saveState === 'saving' && 'Enregistrement…'}
            {saveState === 'saved'  && 'Sauvegardé'}
          </div>
        </div>

        {/* Mission */}
        <div className="goal-section">
          <div className="goal-section-header">
            <span className="goal-section-title">Mission</span>
            <span className="goal-section-hint">Pourquoi suis-je né ?</span>
          </div>
          <textarea
            className="goal-textarea-mission"
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            placeholder="Je suis né pour…"
            rows={3}
            aria-label="Mission de vie"
          />
        </div>

        {/* Vision 10 ans */}
        <div className="goal-section">
          <div className="goal-section-header">
            <span className="goal-section-title">Vision à 10 ans</span>
            <span className="goal-section-hint">À quoi ressemble ma vie ?</span>
          </div>
          <textarea
            className="goal-textarea"
            value={vision}
            onChange={(e) => setVision(e.target.value)}
            placeholder="Dans 10 ans, ma vie ressemble à…"
            rows={4}
            aria-label="Vision à 10 ans"
          />
        </div>

        {/* Valeurs */}
        <div className="goal-section">
          <div className="goal-section-header">
            <span className="goal-section-title">Valeurs</span>
            <span className="goal-section-hint">Mes filtres de décision (max 3)</span>
          </div>

          {values.length > 0 && (
            <div className="goal-values-list">
              {values.map((v) => (
                <span key={v} className="goal-value-chip">
                  {v}
                  <button
                    className="goal-value-remove"
                    onClick={() => removeValue(v)}
                    aria-label={`Supprimer la valeur ${v}`}
                  >
                    <X size={11} strokeWidth={2.5} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {values.length < 3 ? (
            <div className="goal-value-input-wrap">
              <input
                className="goal-value-input"
                type="text"
                value={valueInput}
                onChange={(e) => setValueInput(e.target.value)}
                onKeyDown={handleValueKeyDown}
                onBlur={addValue}
                placeholder="Ex : Intégrité, Foi, Excellence…"
                maxLength={30}
                aria-label="Ajouter une valeur"
              />
              <span className="goal-value-hint">↵ pour ajouter</span>
            </div>
          ) : (
            <div className="goal-value-max">3 valeurs atteintes</div>
          )}
        </div>
      </div>
    </>
  )
}
