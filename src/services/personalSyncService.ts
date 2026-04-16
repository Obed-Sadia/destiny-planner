// DestinyPlanner — Service de synchronisation espace personnel
// Source de vérité : Supabase. IndexedDB = cache offline.
// - pullFromSupabase() → appelé au login, remplit IndexedDB depuis Supabase
// - pushToSupabase()   → appelé à chaque write, upsert vers Supabase
// - syncPendingWrites() → rejoue la queue offline à la reconnexion

import { supabase } from '@/lib/supabase'
import { db } from '@/db/schema'

// ─── Types ────────────────────────────────────────────────────────

type PersonalTable =
  | 'goal'
  | 'domain'
  | 'project'
  | 'project_step'
  | 'milestone'
  | 'action'
  | 'time_block'
  | 'detour'
  | 'journal_entry'
  | 'habit'
  | 'habit_check'
  | 'user_profile'
  | 'app_preferences'

interface PendingWrite {
  id: string
  table: PersonalTable
  operation: 'upsert' | 'delete'
  record: Record<string, unknown>
  created_at: string
  attempts: number
}

// ─── Constantes ───────────────────────────────────────────────────

const QUEUE_KEY = 'dp_personal_sync_queue'
const MAX_ATTEMPTS = 5

// Tables dont l'id local est 'singleton' — le PK Supabase est user_id
const SINGLETON_TABLES: PersonalTable[] = ['goal', 'user_profile', 'app_preferences']

// Correspondance table locale → table Supabase
const SUPABASE_TABLE: Record<PersonalTable, string> = {
  goal:             'personal_goal',
  domain:           'personal_domain',
  project:          'personal_project',
  project_step:     'personal_project_step',
  milestone:        'personal_milestone',
  action:           'personal_action',
  time_block:       'personal_time_block',
  detour:           'personal_detour',
  journal_entry:    'personal_journal_entry',
  habit:            'personal_habit',
  habit_check:      'personal_habit_check',
  user_profile:     'personal_user_profile',
  app_preferences:  'personal_app_preferences',
}

// ─── Queue offline ────────────────────────────────────────────────

function loadQueue(): PendingWrite[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? (JSON.parse(raw) as PendingWrite[]) : []
  } catch {
    return []
  }
}

function saveQueue(queue: PendingWrite[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {
    // localStorage plein — abandon silencieux
  }
}

function enqueue(table: PersonalTable, operation: PendingWrite['operation'], record: Record<string, unknown>): void {
  const queue = loadQueue()
  queue.push({
    id: crypto.randomUUID(),
    table,
    operation,
    record,
    created_at: new Date().toISOString(),
    attempts: 0,
  })
  saveQueue(queue)
}

// ─── Mapping local ↔ Supabase ─────────────────────────────────────

function toSupabaseRecord(
  table: PersonalTable,
  localRecord: Record<string, unknown>,
  userId: string,
): Record<string, unknown> {
  if (SINGLETON_TABLES.includes(table)) {
    // Les singletons n'ont pas de colonne `id` dans Supabase — PK = user_id
    const { id: _stripped, ...rest } = localRecord
    return { ...rest, user_id: userId }
  }
  return { ...localRecord, user_id: userId }
}

function toLocalRecord(
  table: PersonalTable,
  supabaseRow: Record<string, unknown>,
): Record<string, unknown> {
  const record = { ...supabaseRow }
  if (SINGLETON_TABLES.includes(table)) {
    record['id'] = 'singleton'
  }
  delete record['user_id']
  return record
}

// ─── Accès aux tables Dexie ───────────────────────────────────────

type DexieTable = typeof db.goal
  | typeof db.domain
  | typeof db.project
  | typeof db.project_step
  | typeof db.milestone
  | typeof db.action
  | typeof db.time_block
  | typeof db.detour
  | typeof db.journal_entry
  | typeof db.habit
  | typeof db.habit_check
  | typeof db.user_profile
  | typeof db.app_preferences

function getDexieTable(table: PersonalTable): DexieTable {
  const map: Record<PersonalTable, DexieTable> = {
    goal:            db.goal,
    domain:          db.domain,
    project:         db.project,
    project_step:    db.project_step,
    milestone:       db.milestone,
    action:          db.action,
    time_block:      db.time_block,
    detour:          db.detour,
    journal_entry:   db.journal_entry,
    habit:           db.habit,
    habit_check:     db.habit_check,
    user_profile:    db.user_profile,
    app_preferences: db.app_preferences,
  }
  return map[table]
}

// Cast nécessaire : les noms de table dynamiques échappent au typage générique du client Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any

// ─── Pull depuis Supabase → IndexedDB ────────────────────────────

export async function pullFromSupabase(userId: string): Promise<void> {
  const tables: PersonalTable[] = [
    'goal', 'domain', 'project', 'project_step',
    'milestone', 'action', 'time_block', 'detour',
    'journal_entry', 'habit', 'habit_check',
    'user_profile', 'app_preferences',
  ]

  await Promise.all(tables.map(async (table) => {
    try {
      const { data, error } = await sb
        .from(SUPABASE_TABLE[table])
        .select('*')
        .eq('user_id', userId)

      if (error) throw error
      if (!data || data.length === 0) return

      const dexieTable = getDexieTable(table)
      const localRows = (data as Record<string, unknown>[]).map((row) => toLocalRecord(table, row))

      await db.transaction('rw', dexieTable, async () => {
        await (dexieTable as typeof db.goal).clear()
        await (dexieTable as typeof db.goal).bulkPut(localRows as never[])
      })
    } catch {
      // Échec silencieux par table — l'app reste fonctionnelle avec les données locales
    }
  }))
}

// ─── Push vers Supabase ───────────────────────────────────────────

export async function pushToSupabase(
  table: PersonalTable,
  localRecord: Record<string, unknown>,
  userId: string,
): Promise<void> {
  const record = toSupabaseRecord(table, localRecord, userId)

  try {
    const { error } = await sb.from(SUPABASE_TABLE[table]).upsert(record)
    if (error) throw error
  } catch {
    // Offline ou erreur réseau — on met en queue
    enqueue(table, 'upsert', { ...localRecord })
  }
}

export async function deleteFromSupabase(
  table: PersonalTable,
  localRecord: Record<string, unknown>,
  userId: string,
): Promise<void> {
  if (SINGLETON_TABLES.includes(table)) return // les singletons ne se suppriment pas

  const recordId = localRecord['id'] as string

  try {
    const { error } = await sb.from(SUPABASE_TABLE[table]).delete().eq('id', recordId).eq('user_id', userId)

    if (error) throw error
  } catch {
    enqueue(table, 'delete', { ...localRecord })
  }
}

// ─── Replay de la queue offline ───────────────────────────────────

export async function syncPendingWrites(userId: string): Promise<void> {
  const queue = loadQueue()
  if (queue.length === 0) return

  const remaining: PendingWrite[] = []

  for (const entry of queue) {
    try {
      if (entry.operation === 'upsert') {
        const record = toSupabaseRecord(entry.table, entry.record, userId)
        const { error } = await sb.from(SUPABASE_TABLE[entry.table]).upsert(record)
        if (error) throw error
      } else {
        const recordId = entry.record['id'] as string
        const { error } = await sb.from(SUPABASE_TABLE[entry.table]).delete().eq('id', recordId).eq('user_id', userId)
        if (error) throw error
      }
    } catch (err) {
      const attempts = entry.attempts + 1
      if (attempts < MAX_ATTEMPTS) {
        remaining.push({
          ...entry,
          attempts,
          last_error: err instanceof Error ? err.message : String(err),
        } as PendingWrite)
      }
      // Au-delà de MAX_ATTEMPTS, l'entrée est abandonnée silencieusement
    }
  }

  saveQueue(remaining)
}

export function pendingWritesCount(): number {
  return loadQueue().length
}
