// DestinyPlanner — Routine du matin
// Verset, citation, déclaration, action destinée — auto-save 300ms

import { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, CalendarDays, ArrowRight } from 'lucide-react'
import { VerseCard } from '../shared/VerseCard'
import { QuoteCard } from '../shared/QuoteCard'
import { useJournalStore } from '../../stores/useJournalStore'
import { db } from '../../db/schema'
import { VERSES } from '../../constants/verses'
import { QUOTES } from '../../constants/quotes'
import type { JournalEntry } from '../../types'

const STYLE = `
  .morning {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  /* ── En-tête ── */
  .morning-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding-bottom: var(--space-4);
    border-bottom: 1px solid var(--border);
  }

  .morning-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--r-md);
    background: rgba(196, 154, 60, 0.12);
    color: var(--gold);
    flex-shrink: 0;
  }

  .morning-title {
    font-family: var(--font-editorial);
    font-size: var(--text-xl);
    font-weight: 300;
    color: var(--text-1);
    line-height: var(--leading-tight);
  }

  .morning-date-label {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-3);
    margin-top: 2px;
  }

  /* ── Bloc spirituel ── */
  .morning-spiritual {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-5);
    background: rgba(196, 154, 60, 0.04);
    border: 1px solid rgba(196, 154, 60, 0.12);
    border-radius: var(--r-lg);
  }

  /* ── Champs ── */
  .morning-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .morning-field-label {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .morning-textarea {
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

  .morning-textarea:focus {
    border-color: var(--gold);
  }

  .morning-textarea--declaration {
    font-family: var(--font-editorial);
    font-size: var(--text-md);
    font-style: italic;
    min-height: 100px;
  }

  .morning-action-input {
    font-family: var(--font-ui);
    font-size: var(--text-base);
    color: var(--text-1);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: var(--space-3) var(--space-4);
    outline: none;
    line-height: var(--leading-normal);
    transition: border-color var(--transition-fast);
    width: 100%;
    box-sizing: border-box;
  }

  .morning-action-input:focus {
    border-color: var(--gold);
  }

  .morning-saved-indicator {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--green);
    opacity: 0;
    transition: opacity var(--transition-slow);
  }

  .morning-saved-indicator--visible {
    opacity: 1;
  }

  /* ── Widget planification ── */
  .morning-plan-widget {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
  }

  .morning-plan-icon {
    display: flex;
    align-items: center;
    color: var(--blue);
    flex-shrink: 0;
  }

  .morning-plan-body {
    flex: 1;
    min-width: 0;
  }

  .morning-plan-label {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 2px;
  }

  .morning-plan-count {
    font-size: var(--text-sm);
    color: var(--text-2);
  }

  .morning-plan-count strong {
    color: var(--text-1);
    font-weight: var(--weight-semibold);
  }

  .morning-plan-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px;
    background: none;
    border: 1px solid var(--border-2);
    border-radius: var(--r-sm);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--text-2);
    cursor: pointer;
    white-space: nowrap;
    transition: border-color var(--transition-fast), color var(--transition-fast);
    flex-shrink: 0;
  }

  .morning-plan-btn:hover {
    border-color: var(--blue);
    color: var(--blue);
  }
`

// Sélection déterministe par date (même verset toute la journée)
function dayIndex(date: string): number {
  return Math.floor(new Date(date).getTime() / 86400000)
}

interface MorningRoutineProps {
  date: string
  entry: JournalEntry | null
}

export function MorningRoutine({ date, entry }: MorningRoutineProps): JSX.Element {
  const navigate = useNavigate()
  const { saveEntry } = useJournalStore()

  const verse = VERSES[dayIndex(date) % VERSES.length]
  const quote = QUOTES[dayIndex(date) % QUOTES.length]

  const [declaration, setDeclaration] = useState<string>(entry?.declaration ?? '')
  const [mainAction, setMainAction]   = useState<string>(entry?.main_action ?? '')
  const [saved, setSaved] = useState<boolean>(false)
  const [blockCount, setBlockCount] = useState<number>(0)

  // Compte les blocs existants pour ce jour
  useEffect(() => {
    db.time_block.where('date').equals(date).count()
      .then(setBlockCount)
      .catch(console.error)
  }, [date])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync si l'entrée change (chargement différé)
  useEffect(() => {
    setDeclaration(entry?.declaration ?? '')
    setMainAction(entry?.main_action ?? '')
  }, [entry?.id])

  const autosave = useCallback(
    (patch: Partial<Pick<JournalEntry, 'declaration' | 'main_action' | 'verse_id' | 'quote_id'>>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        saveEntry(date, { verse_id: verse.id, quote_id: quote.id, ...patch })
          .then(() => {
            setSaved(true)
            setTimeout(() => setSaved(false), 1500)
          })
          .catch(console.error)
      }, 300)
    },
    [date, verse.id, quote.id, saveEntry],
  )

  function handleDeclaration(value: string): void {
    setDeclaration(value)
    autosave({ declaration: value })
  }

  function handleMainAction(value: string): void {
    setMainAction(value)
    autosave({ main_action: value })
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className="morning">

        {/* En-tête */}
        <div className="morning-header">
          <div className="morning-icon">
            <Sun size={18} />
          </div>
          <div>
            <div className="morning-title">Routine du matin</div>
            <div className="morning-date-label">Commencez par vous ancrer dans la Parole</div>
          </div>
          <span className={`morning-saved-indicator ${saved ? 'morning-saved-indicator--visible' : ''}`}
            style={{ marginLeft: 'auto' }}>
            Enregistré
          </span>
        </div>

        {/* Bloc spirituel */}
        <div className="morning-spiritual">
          <VerseCard verse={verse} />
          <QuoteCard quote={quote} />
        </div>

        {/* Déclaration */}
        <div className="morning-field">
          <label className="morning-field-label">Ma déclaration du matin</label>
          <textarea
            className="morning-textarea morning-textarea--declaration"
            placeholder="Je déclare aujourd'hui que…"
            value={declaration}
            onChange={(e) => handleDeclaration(e.target.value)}
          />
        </div>

        {/* Action destinée */}
        <div className="morning-field">
          <label className="morning-field-label">Mon action destinée pour aujourd'hui</label>
          <input
            className="morning-action-input"
            type="text"
            placeholder="L'action la plus importante que je ferai aujourd'hui…"
            value={mainAction}
            onChange={(e) => handleMainAction(e.target.value)}
          />
        </div>

        {/* Widget planification de la journée */}
        <div className="morning-plan-widget">
          <span className="morning-plan-icon">
            <CalendarDays size={16} />
          </span>
          <div className="morning-plan-body">
            <div className="morning-plan-label">Blocs horaires</div>
            <div className="morning-plan-count">
              {blockCount === 0
                ? 'Aucun bloc planifié pour aujourd\'hui'
                : <><strong>{blockCount}</strong> bloc{blockCount > 1 ? 's' : ''} planifié{blockCount > 1 ? 's' : ''}</>
              }
            </div>
          </div>
          <button className="morning-plan-btn" onClick={() => navigate('/today')}>
            Planifier <ArrowRight size={12} />
          </button>
        </div>

      </div>
    </>
  )
}
