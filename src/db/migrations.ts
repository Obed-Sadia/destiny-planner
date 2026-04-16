// DestinyPlanner — Migrations Dexie
// Migration v2 → v3 : extraction app_preferences → user_profile

import type { Transaction } from 'dexie'

export async function migrateV2ToV3(tx: Transaction): Promise<void> {
  const prefs = await tx.table('app_preferences').get('singleton')
  if (!prefs) return

  await tx.table('user_profile').put({
    id: 'singleton',
    first_name: (prefs.first_name as string | undefined) ?? '',
    avatar_emoji: null,
    avatar_color: null,
    bio: null,
    grade: (prefs.grade as string | undefined) ?? 'discoverer',
    engagement_level: (prefs.engagement_level as number | undefined) ?? 1,
    streak: (prefs.streak as number | undefined) ?? 0,
    streak_best: (prefs.streak as number | undefined) ?? 0,
    last_active_date: (prefs.last_active_date as string | null | undefined) ?? null,
    consecutive_inactive_days: (prefs.consecutive_inactive_days as number | undefined) ?? 0,
    last_abandoned_project_date: (prefs.last_abandoned_project_date as string | null | undefined) ?? null,
    total_projects_completed: 0,
    total_actions_done: 0,
    total_journal_entries: 0,
    total_time_blocks_done: 0,
    score_average_30d: null,
    onboarding_done: (prefs.onboarding_done as boolean | undefined) ?? false,
    created_at: (prefs.created_at as string | undefined) ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  await tx.table('app_preferences').put({
    id: 'singleton',
    dark_mode: (prefs.dark_mode as boolean | undefined) ?? true,
    language: (prefs.language as string | undefined) ?? 'fr',
    notifications_enabled: (prefs.notifications_enabled as boolean | undefined) ?? false,
    day_start_hour: 5,
    day_end_hour: 23,
    week_start_day: 'monday',
    created_at: (prefs.created_at as string | undefined) ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
}
