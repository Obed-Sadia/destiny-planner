// DestinyPlanner — Journal quotidien
// Orchestrateur : onglet Matin / Soir + navigation de date

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react'
import { format, subDays, addDays, parseISO, isToday, isFuture } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useJournalStore } from '../stores/useJournalStore'
import { useHabitStore } from '../stores/useHabitStore'
import { MorningRoutine } from '../components/journal/MorningRoutine'
import { EveningReview } from '../components/journal/EveningReview'

const STYLE = `
  .journal {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    animation: jFadeIn 200ms ease both;
  }

  @keyframes jFadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── En-tête ── */
  .journal-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .journal-title {
    font-family: var(--font-editorial);
    font-size: var(--text-2xl);
    font-weight: 300;
    color: var(--text-1);
    line-height: var(--leading-tight);
  }

  /* ── Navigation de date ── */
  .journal-date-nav {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .journal-nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    background: transparent;
    color: var(--text-2);
    cursor: pointer;
    transition: border-color var(--transition-fast), color var(--transition-fast);
    flex-shrink: 0;
  }

  .journal-nav-btn:hover:not(:disabled) {
    border-color: var(--border-2);
    color: var(--text-1);
  }

  .journal-nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .journal-date-label {
    flex: 1;
    text-align: center;
    font-family: var(--font-ui);
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
    color: var(--text-1);
  }

  .journal-today-btn {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--gold);
    background: var(--gold-pale);
    border: 1px solid rgba(196, 154, 60, 0.2);
    border-radius: var(--r-sm);
    padding: 3px 8px;
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .journal-today-btn:hover {
    background: rgba(196, 154, 60, 0.18);
  }

  /* ── Onglets ── */
  .journal-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: var(--space-1);
  }

  .journal-tab {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--r-md);
    border: none;
    background: transparent;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text-3);
    cursor: pointer;
    transition: background var(--transition-base), color var(--transition-base);
  }

  .journal-tab--morning.journal-tab--active {
    background: rgba(196, 154, 60, 0.12);
    color: var(--gold-soft);
  }

  .journal-tab--evening.journal-tab--active {
    background: rgba(91, 155, 212, 0.12);
    color: var(--blue);
  }

  .journal-tab:not(.journal-tab--active):hover {
    background: var(--surface-2);
    color: var(--text-2);
  }

  /* ── Contenu ── */
  .journal-content {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: var(--space-5);
  }
`

type Tab = 'morning' | 'evening'

function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

function defaultTab(): Tab {
  const hour = new Date().getHours()
  return hour >= 14 ? 'evening' : 'morning'
}

export default function Journal(): JSX.Element {
  const [date, setDate]   = useState<string>(todayStr())
  const [tab, setTab]     = useState<Tab>(defaultTab())
  const { entries, load, loadToday } = useJournalStore()

  useEffect(() => {
    load(30).catch(console.error)
    loadToday().catch(console.error)
    useHabitStore.getState().load().catch(console.error)
    useHabitStore.getState().loadChecksForDate(todayStr()).catch(console.error)
  }, [load, loadToday])

  // Recharger les checks quand la date change
  useEffect(() => {
    useHabitStore.getState().loadChecksForDate(date).catch(console.error)
  }, [date])

  const entry = entries.find((e) => e.id === date) ?? null

  const parsedDate = parseISO(date)
  const isTodayDate = isToday(parsedDate)

  function goBack(): void {
    setDate(format(subDays(parsedDate, 1), 'yyyy-MM-dd'))
  }

  function goForward(): void {
    const next = addDays(parsedDate, 1)
    if (!isFuture(next) || isToday(next)) {
      setDate(format(next, 'yyyy-MM-dd'))
    }
  }

  function goToday(): void {
    setDate(todayStr())
  }

  const dateLabel = isTodayDate
    ? "Aujourd'hui"
    : format(parsedDate, 'EEEE d MMMM', { locale: fr })

  return (
    <>
      <style>{STYLE}</style>
      <div className="journal">

        {/* En-tête */}
        <div className="journal-header">
          <h1 className="journal-title">Journal</h1>

          {/* Navigation de date */}
          <div className="journal-date-nav">
            <button className="journal-nav-btn" onClick={goBack} title="Jour précédent">
              <ChevronLeft size={16} />
            </button>

            <span className="journal-date-label">{dateLabel}</span>

            <button
              className="journal-nav-btn"
              onClick={goForward}
              disabled={isTodayDate}
              title="Jour suivant"
            >
              <ChevronRight size={16} />
            </button>

            {!isTodayDate && (
              <button className="journal-today-btn" onClick={goToday}>
                Aujourd'hui
              </button>
            )}
          </div>
        </div>

        {/* Onglets Matin / Soir */}
        <div className="journal-tabs">
          <button
            className={`journal-tab journal-tab--morning ${tab === 'morning' ? 'journal-tab--active' : ''}`}
            onClick={() => setTab('morning')}
          >
            <Sun size={15} />
            Matin
          </button>
          <button
            className={`journal-tab journal-tab--evening ${tab === 'evening' ? 'journal-tab--active' : ''}`}
            onClick={() => setTab('evening')}
          >
            <Moon size={15} />
            Soir
          </button>
        </div>

        {/* Contenu de l'onglet actif */}
        <div className="journal-content">
          {tab === 'morning' ? (
            <MorningRoutine date={date} entry={entry} />
          ) : (
            <EveningReview date={date} entry={entry} />
          )}
        </div>

      </div>
    </>
  )
}
