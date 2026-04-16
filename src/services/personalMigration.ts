// DestinyPlanner — Migration one-shot des données locales vers Supabase
// Appelé au premier login d'un utilisateur ayant déjà des données IndexedDB.
// Si Supabase est déjà peuplé, cette fonction ne fait rien.

import { db } from '@/db/schema'
import { pushToSupabase } from './personalSyncService'

const MIGRATION_KEY = 'dp_personal_migration_done'

export async function migrateLocalDataIfNeeded(userId: string): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY) === userId) return

  try {
    const [goal, domains, projects, steps, milestones, actions, timeBlocks,
      detours, journalEntries, habits, habitChecks, userProfile, appPreferences] =
      await Promise.all([
        db.goal.get('singleton'),
        db.domain.toArray(),
        db.project.toArray(),
        db.project_step.toArray(),
        db.milestone.toArray(),
        db.action.toArray(),
        db.time_block.toArray(),
        db.detour.toArray(),
        db.journal_entry.toArray(),
        db.habit.toArray(),
        db.habit_check.toArray(),
        db.user_profile.get('singleton'),
        db.app_preferences.get('singleton'),
      ])

    const pushAll = async (): Promise<void> => {
      if (goal) await pushToSupabase('goal', goal as unknown as Record<string, unknown>, userId)
      if (userProfile) await pushToSupabase('user_profile', userProfile as unknown as Record<string, unknown>, userId)
      if (appPreferences) await pushToSupabase('app_preferences', appPreferences as unknown as Record<string, unknown>, userId)

      for (const d of domains) await pushToSupabase('domain', d as unknown as Record<string, unknown>, userId)
      for (const p of projects) await pushToSupabase('project', p as unknown as Record<string, unknown>, userId)
      for (const s of steps) await pushToSupabase('project_step', s as unknown as Record<string, unknown>, userId)
      for (const m of milestones) await pushToSupabase('milestone', m as unknown as Record<string, unknown>, userId)
      for (const a of actions) await pushToSupabase('action', a as unknown as Record<string, unknown>, userId)
      for (const tb of timeBlocks) await pushToSupabase('time_block', tb as unknown as Record<string, unknown>, userId)
      for (const d of detours) await pushToSupabase('detour', d as unknown as Record<string, unknown>, userId)
      for (const je of journalEntries) await pushToSupabase('journal_entry', je as unknown as Record<string, unknown>, userId)
      for (const h of habits) await pushToSupabase('habit', h as unknown as Record<string, unknown>, userId)
      for (const hc of habitChecks) await pushToSupabase('habit_check', hc as unknown as Record<string, unknown>, userId)
    }

    await pushAll()
    localStorage.setItem(MIGRATION_KEY, userId)
  } catch {
    // Échec silencieux — sera réessayé au prochain login
  }
}
