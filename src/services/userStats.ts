// DestinyPlanner — Recalcul des statistiques du profil utilisateur
// Appelé depuis useUserStore.recalculateStats() après chaque action significative

import { db } from '../db/schema'
import { calculateAverageScore } from './score'
import type { UserProfile } from '../types'

interface StatsSnapshot {
  total_projects_completed: number
  total_actions_done: number
  total_journal_entries: number
  total_time_blocks_done: number
  score_average_30d: number | null
}

export async function computeUserStats(): Promise<StatsSnapshot> {
  const [
    completedProjects,
    doneActions,
    journalEntries,
    doneTimeBlocks,
  ] = await Promise.all([
    db.project.where('status').equals('completed').count(),
    db.action.where('done').equals(1).count(),
    db.journal_entry.count(),
    db.time_block.where('done').equals(1).count(),
  ])

  const last30Entries = await db.journal_entry
    .orderBy('id')
    .reverse()
    .limit(30)
    .toArray()

  const score_average_30d =
    last30Entries.some((e) => e.score_cache !== null)
      ? calculateAverageScore(last30Entries, 30)
      : null

  return {
    total_projects_completed: completedProjects,
    total_actions_done: doneActions,
    total_journal_entries: journalEntries,
    total_time_blocks_done: doneTimeBlocks,
    score_average_30d,
  }
}

export function applyStatsToProfile(
  profile: UserProfile,
  stats: StatsSnapshot,
): UserProfile {
  return {
    ...profile,
    ...stats,
    updated_at: new Date().toISOString(),
  }
}
