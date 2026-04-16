// DestinyPlanner — Seeds
// 6 domaines par défaut + singletons app_preferences + user_profile

import { db } from './schema'
import type { Domain, AppPreferences, UserProfile } from '../types'

// Guard module-level : empêche la double exécution due à StrictMode React
let _seedsPromise: Promise<void> | null = null

const DEFAULT_DOMAINS: Omit<Domain, 'id'>[] = [
  { name: 'Foi & Spiritualité', icon: '🙏', goal_statement: '', sort_order: 0, is_default: true, created_at: '' },
  { name: 'Famille',            icon: '👨‍👩‍👧', goal_statement: '', sort_order: 1, is_default: true, created_at: '' },
  { name: 'Finances',           icon: '💰', goal_statement: '', sort_order: 2, is_default: true, created_at: '' },
  { name: 'Santé',              icon: '💪', goal_statement: '', sort_order: 3, is_default: true, created_at: '' },
  { name: 'Carrière & Vocation',icon: '🚀', goal_statement: '', sort_order: 4, is_default: true, created_at: '' },
  { name: 'Éducation',          icon: '📚', goal_statement: '', sort_order: 5, is_default: true, created_at: '' },
]

function generateId(): string {
  return crypto.randomUUID()
}

async function deduplicateDefaultDomains(): Promise<void> {
  // created_at n'est pas indexé — on charge tout et on déduplique en mémoire
  const all = await db.domain.toArray()
  if (all.length === 0) return

  const seen = new Set<string>()
  const toDelete: string[] = []

  for (const domain of all) {
    if (seen.has(domain.name)) {
      toDelete.push(domain.id)
    } else {
      seen.add(domain.name)
    }
  }

  if (toDelete.length > 0) {
    await db.domain.bulkDelete(toDelete)
  }
}

async function seedDomains(): Promise<void> {
  const existing = await db.domain.count()
  if (existing > 0) return

  const now = new Date().toISOString()
  const domains: Domain[] = DEFAULT_DOMAINS.map((d) => ({
    ...d,
    id: generateId(),
    created_at: now,
  }))

  await db.domain.bulkAdd(domains)
}

async function seedAppPreferences(): Promise<void> {
  const existing = await db.app_preferences.get('singleton')
  if (existing) return

  const now = new Date().toISOString()
  const prefs: AppPreferences = {
    id: 'singleton',
    dark_mode: true,
    language: 'fr',
    notifications_enabled: false,
    day_start_hour: 5,
    day_end_hour: 23,
    week_start_day: 'monday',
    created_at: now,
    updated_at: now,
  }

  await db.app_preferences.add(prefs)
}

async function seedUserProfile(): Promise<void> {
  const existing = await db.user_profile.get('singleton')
  if (existing) return

  const now = new Date().toISOString()
  const profile: UserProfile = {
    id: 'singleton',
    first_name: '',
    avatar_emoji: null,
    avatar_color: null,
    bio: null,
    grade: 'discoverer',
    engagement_level: 1,
    streak: 0,
    streak_best: 0,
    last_active_date: null,
    consecutive_inactive_days: 0,
    last_abandoned_project_date: null,
    total_projects_completed: 0,
    total_actions_done: 0,
    total_journal_entries: 0,
    total_time_blocks_done: 0,
    score_average_30d: null,
    onboarding_done: false,
    created_at: now,
    updated_at: now,
  }

  await db.user_profile.add(profile)
}

async function _doRunSeeds(): Promise<void> {
  await deduplicateDefaultDomains()
  await seedDomains()
  await seedAppPreferences()
  await seedUserProfile()
}

export function runSeeds(): Promise<void> {
  if (!_seedsPromise) {
    _seedsPromise = _doRunSeeds().catch((err) => {
      _seedsPromise = null
      throw err
    })
  }
  return _seedsPromise
}
