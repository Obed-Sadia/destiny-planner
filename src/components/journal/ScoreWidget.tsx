// DestinyPlanner — Widget score d'attitudes (7 jours glissants)
// Affiche la moyenne 7j, les barres journalières, et l'alerte 5j de baisse consécutive

import { useEffect } from 'react'
import { TrendingDown, Flame } from 'lucide-react'
import { useJournalStore } from '../../stores/useJournalStore'
import { useHabitStore } from '../../stores/useHabitStore'
import { calculateDayScore, calculateAverageScore, hasConsecutiveDecline } from '../../services/score'
import { format, subDays, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const STYLE = `
  .score-widget {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .score-widget-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .score-widget-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .score-widget-label {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .score-widget-avg {
    font-family: var(--font-editorial);
    font-size: var(--text-3xl);
    font-weight: 300;
    line-height: 1;
    color: var(--text-1);
  }

  .score-widget-avg span {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-regular);
    color: var(--text-3);
    margin-left: 2px;
  }

  .score-widget-streak {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--gold);
    background: var(--gold-pale);
    padding: 3px 8px;
    border-radius: var(--r-full);
    border: 1px solid rgba(196, 154, 60, 0.2);
  }

  /* ── Barres des 7 jours ── */
  .score-bars {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-1);
    height: 64px;
  }

  .score-bar-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex: 1;
  }

  .score-bar-track {
    width: 100%;
    background: var(--surface-2);
    border-radius: 3px 3px 0 0;
    height: 48px;
    display: flex;
    align-items: flex-end;
    overflow: hidden;
  }

  .score-bar-fill {
    width: 100%;
    border-radius: 3px 3px 0 0;
    transition: height var(--transition-slow);
    min-height: 2px;
  }

  .score-bar-day {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-3);
    text-align: center;
  }

  .score-bar-day--today {
    color: var(--gold);
    font-weight: var(--weight-semibold);
  }

  /* ── Alerte tendancielle ── */
  .score-alert {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: rgba(224, 112, 112, 0.08);
    border: 1px solid rgba(224, 112, 112, 0.2);
    border-radius: var(--r-md);
    animation: swFadeIn 250ms ease both;
  }

  @keyframes swFadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .score-alert-icon {
    color: var(--coral);
    flex-shrink: 0;
    margin-top: 1px;
  }

  .score-alert-text {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--coral);
    line-height: var(--leading-normal);
    margin: 0;
  }

  .score-alert-text strong {
    font-weight: var(--weight-semibold);
  }

  /* ── Score du jour ── */
  .score-today {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .score-today-label {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-2);
    white-space: nowrap;
  }

  .score-today-track {
    flex: 1;
    height: 6px;
    background: var(--surface-2);
    border-radius: var(--r-full);
    overflow: hidden;
  }

  .score-today-fill {
    height: 100%;
    border-radius: var(--r-full);
    transition: width var(--transition-slow);
  }

  .score-today-value {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
    min-width: 32px;
    text-align: right;
  }
`

function scoreColor(score: number): string {
  if (score >= 80) return 'var(--green)'
  if (score >= 60) return 'var(--gold)'
  if (score >= 40) return 'var(--amber)'
  return 'var(--coral)'
}

function last7Days(): string[] {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) =>
    format(subDays(today, 6 - i), 'yyyy-MM-dd'),
  )
}

export function ScoreWidget(): JSX.Element {
  const entries = useJournalStore((s) => s.entries)
  const habits  = useHabitStore((s) => s.habits)
  const checks  = useHabitStore((s) => s.checks)

  const today = format(new Date(), 'yyyy-MM-dd')
  const days  = last7Days()

  useEffect(() => {
    useJournalStore.getState().load(30).catch(console.error)
    useHabitStore.getState().load().catch(console.error)
    useHabitStore.getState().loadChecksForDate(today).catch(console.error)
  }, [today])

  const todayScore = calculateDayScore(checks, habits)

  // Map date → score depuis le cache journal
  const scoreByDate = new Map<string, number>(
    entries
      .filter((e) => e.score_cache !== null)
      .map((e) => [e.id, e.score_cache as number]),
  )
  // Injecter le score live du jour si pas encore mis en cache
  if (checks.length > 0) {
    scoreByDate.set(today, todayScore)
  }

  const avg7 = calculateAverageScore(entries, 7)
  const declining = hasConsecutiveDecline(entries, 5)
  const hasData = scoreByDate.size > 0

  return (
    <>
      <style>{STYLE}</style>
      <div className="score-widget">

        {/* Moyenne 7j + badge du jour */}
        <div className="score-widget-header">
          <div className="score-widget-left">
            <span className="score-widget-label">Score moyen · 7 jours</span>
            <div className="score-widget-avg">
              {hasData ? avg7 : '–'}
              <span>/ 100</span>
            </div>
          </div>

          {todayScore > 0 && (
            <div className="score-widget-streak">
              <Flame size={11} />
              {todayScore} pts aujourd'hui
            </div>
          )}
        </div>

        {/* Barres 7 jours */}
        <div className="score-bars">
          {days.map((date) => {
            const score  = scoreByDate.get(date) ?? 0
            const isToday = date === today
            const dayLabel = isToday
              ? 'auj.'
              : format(parseISO(date), 'EEE', { locale: fr }).slice(0, 2)

            return (
              <div key={date} className="score-bar-col">
                <div className="score-bar-track">
                  {score > 0 && (
                    <div
                      className="score-bar-fill"
                      style={{
                        height: `${score}%`,
                        background: scoreColor(score),
                        opacity: isToday ? 1 : 0.55,
                      }}
                    />
                  )}
                </div>
                <span className={`score-bar-day ${isToday ? 'score-bar-day--today' : ''}`}>
                  {dayLabel}
                </span>
              </div>
            )
          })}
        </div>

        {/* Barre du score du jour */}
        <div className="score-today">
          <span className="score-today-label">Aujourd'hui</span>
          <div className="score-today-track">
            <div
              className="score-today-fill"
              style={{
                width: `${todayScore}%`,
                background: scoreColor(todayScore),
              }}
            />
          </div>
          <span className="score-today-value">{todayScore}</span>
        </div>

        {/* Alerte baisse consécutive 5j */}
        {declining && (
          <div className="score-alert">
            <TrendingDown size={16} className="score-alert-icon" />
            <p className="score-alert-text">
              <strong>Tendance à la baisse.</strong>{' '}
              Votre score a diminué 5 jours consécutifs. Prenez un moment pour identifier l'obstacle.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
