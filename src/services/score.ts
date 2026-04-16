// DestinyPlanner — Calcul du score d'attitudes, streak, alerte tendancielle

import type { Habit, HabitCheck, JournalEntry } from '../types'

// Score du jour = somme des poids des habitudes cochées
export function calculateDayScore(
  habitChecks: HabitCheck[],
  habits: Habit[],
): number {
  const activeHabits = habits.filter((h) => h.active)
  let score = 0
  for (const check of habitChecks) {
    if (!check.done) continue
    const habit = activeHabits.find((h) => h.id === check.habit_id)
    if (habit) score += habit.weight
  }
  return Math.min(100, score)
}

// Moyenne sur N dernières entrées avec score_cache non null
export function calculateAverageScore(entries: JournalEntry[], days: number = 30): number {
  const scored = entries
    .filter((e) => e.score_cache !== null)
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, days)
    .map((e) => e.score_cache as number)

  if (scored.length === 0) return 0
  return Math.round(scored.reduce((acc, s) => acc + s, 0) / scored.length)
}

// Alerte tendancielle : 5 jours consécutifs de baisse du score
export function hasConsecutiveDecline(entries: JournalEntry[], days: number = 5): boolean {
  const scored = entries
    .filter((e) => e.score_cache !== null)
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, days + 1)

  if (scored.length < days + 1) return false

  for (let i = 0; i < days; i++) {
    const current = scored[i].score_cache as number
    const previous = scored[i + 1].score_cache as number
    if (current >= previous) return false
  }
  return true
}

interface StreakUpdate {
  streak: number
  consecutive_inactive_days: number
}

// Mise à jour du streak — reset après exactement 2 jours sans check-in
// diffDays=1 : consécutif → streak+1
// diffDays=2 : 1 jour manqué → grace, streak inchangé, inactive=1
// diffDays>=3 : 2+ jours manqués → reset à 1
export function computeStreakUpdate(
  lastActiveDate: string | null,
  today: string,
  currentStreak: number,
): StreakUpdate {
  if (!lastActiveDate) {
    return { streak: 1, consecutive_inactive_days: 0 }
  }

  const last = new Date(lastActiveDate)
  const todayDate = new Date(today)
  const diffDays = Math.round(
    (todayDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (diffDays === 0) {
    return { streak: currentStreak, consecutive_inactive_days: 0 }
  }

  if (diffDays === 1) {
    return { streak: currentStreak + 1, consecutive_inactive_days: 0 }
  }

  if (diffDays === 2) {
    // 1 jour manqué — période de grâce
    return { streak: currentStreak, consecutive_inactive_days: 1 }
  }

  // 2+ jours manqués — reset
  return { streak: 1, consecutive_inactive_days: 0 }
}
