// DestinyPlanner — Web Worker : calcul du score d'attitudes
// Utilisé quand habit_check dépasse 365 entrées (évite de bloquer le thread principal)

import type { Habit, HabitCheck } from '../types'

// ─── Types messages ───────────────────────────────────────────

export interface ScoreWorkerInput {
  habitChecks: HabitCheck[]
  habits: Habit[]
}

export interface ScoreDayResult {
  date: string
  score: number
}

export interface ScoreWorkerOutput {
  averageScore30d: number
  dailyScores: ScoreDayResult[]
}

// ─── Calcul du score d'un jour ────────────────────────────────

function calculateDayScore(checks: HabitCheck[], habits: Habit[]): number {
  const activeHabits = habits.filter((h) => h.active)
  let score = 0
  for (const check of checks) {
    if (!check.done) continue
    const habit = activeHabits.find((h) => h.id === check.habit_id)
    if (habit) score += habit.weight
  }
  return Math.min(100, score)
}

// ─── Traitement principal ─────────────────────────────────────

function computeScores(input: ScoreWorkerInput): ScoreWorkerOutput {
  const { habitChecks, habits } = input

  // Grouper les checks par date
  const byDate = new Map<string, HabitCheck[]>()
  for (const check of habitChecks) {
    const existing = byDate.get(check.date) ?? []
    existing.push(check)
    byDate.set(check.date, existing)
  }

  // Calculer le score pour chaque jour, trier et prendre les 30 derniers
  const dailyScores: ScoreDayResult[] = Array.from(byDate.entries())
    .map(([date, checks]) => ({
      date,
      score: calculateDayScore(checks, habits),
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30)

  const averageScore30d =
    dailyScores.length > 0
      ? Math.round(
          dailyScores.reduce((acc, d) => acc + d.score, 0) / dailyScores.length,
        )
      : 0

  return { averageScore30d, dailyScores }
}

// ─── Écoute des messages ──────────────────────────────────────

self.onmessage = (event: MessageEvent<ScoreWorkerInput>) => {
  const result = computeScores(event.data)
  self.postMessage(result)
}
