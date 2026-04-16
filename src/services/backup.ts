// DestinyPlanner — Résilience des données (4 couches)
// Couche 1 : IndexedDB via Dexie (principal, toujours actif)
// Couche 2 : OPFS — Origin Private File System (résilient, auto)
// Couche 3 : JSON hebdo — téléchargement chaque dimanche
// Couche 4 : Restauration auto depuis OPFS si IndexedDB vide

import { db } from '../db/schema'
import type {
  Goal,
  Domain,
  Project,
  ProjectStep,
  Milestone,
  Action,
  TimeBlock,
  Detour,
  JournalEntry,
  Habit,
  HabitCheck,
  UserProfile,
  PersonalBusinessLink,
  AppPreferences,
  BackupMeta,
} from '../types'

// ─── Structure du snapshot (§7 de Database v1.2) ─────────────

export interface BackupSnapshot {
  version: '1.2'
  exported_at: string
  app: 'DestinyPlanner'
  data: {
    goal: Goal | null
    domains: Domain[]
    projects: Project[]
    project_steps: ProjectStep[]
    milestones: Milestone[]
    actions: Action[]
    time_blocks: TimeBlock[]
    detours: Detour[]
    journal_entries: JournalEntry[]
    habits: Habit[]
    habit_checks: HabitCheck[]
    user_profile: UserProfile | null
    personal_business_links: PersonalBusinessLink[]
    app_preferences: AppPreferences | null
  }
}

const OPFS_FILENAME = 'destiny-planner-backup.json'
const BACKUP_STALE_DAYS = 7

// ─── Couche 1 : persistence IndexedDB ─────────────────────────

export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

// ─── Couche 2 : OPFS ──────────────────────────────────────────

export function isOPFSAvailable(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'storage' in navigator &&
    'getDirectory' in navigator.storage
  )
}

export async function exportAllData(): Promise<BackupSnapshot> {
  const [
    goal,
    domains,
    projects,
    projectSteps,
    milestones,
    actions,
    timeBlocks,
    detours,
    journalEntries,
    habits,
    habitChecks,
    userProfile,
    personalBusinessLinks,
    appPreferences,
  ] = await Promise.all([
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
    db.personal_business_link.toArray(),
    db.app_preferences.get('singleton'),
  ])

  return {
    version: '1.2',
    exported_at: new Date().toISOString(),
    app: 'DestinyPlanner',
    data: {
      goal: goal ?? null,
      domains,
      projects,
      project_steps: projectSteps,
      milestones,
      actions,
      time_blocks: timeBlocks,
      detours,
      journal_entries: journalEntries,
      habits,
      habit_checks: habitChecks,
      user_profile: userProfile ?? null,
      personal_business_links: personalBusinessLinks,
      app_preferences: appPreferences ?? null,
    },
  }
}

async function importAllData(snapshot: BackupSnapshot): Promise<void> {
  const { data } = snapshot

  await db.transaction(
    'rw',
    [
      db.goal,
      db.domain,
      db.project,
      db.project_step,
      db.milestone,
      db.action,
      db.time_block,
      db.detour,
      db.journal_entry,
      db.habit,
      db.habit_check,
      db.user_profile,
      db.personal_business_link,
      db.app_preferences,
    ],
    async () => {
      if (data.goal) await db.goal.put(data.goal)
      if (data.domains.length > 0) await db.domain.bulkPut(data.domains)
      if (data.projects.length > 0) await db.project.bulkPut(data.projects)
      if (data.project_steps.length > 0) await db.project_step.bulkPut(data.project_steps)
      if (data.milestones.length > 0) await db.milestone.bulkPut(data.milestones)
      if (data.actions.length > 0) await db.action.bulkPut(data.actions)
      if (data.time_blocks.length > 0) await db.time_block.bulkPut(data.time_blocks)
      if (data.detours.length > 0) await db.detour.bulkPut(data.detours)
      if (data.journal_entries.length > 0) await db.journal_entry.bulkPut(data.journal_entries)
      if (data.habits.length > 0) await db.habit.bulkPut(data.habits)
      if (data.habit_checks.length > 0) await db.habit_check.bulkPut(data.habit_checks)
      if (data.user_profile) await db.user_profile.put(data.user_profile)
      if (data.personal_business_links.length > 0)
        await db.personal_business_link.bulkPut(data.personal_business_links)
      if (data.app_preferences) await db.app_preferences.put(data.app_preferences)
    }
  )
}

export async function backupToOPFS(): Promise<void> {
  if (!isOPFSAvailable()) throw new Error('OPFS non disponible sur ce navigateur')

  const snapshot = await exportAllData()
  const json = JSON.stringify(snapshot)
  const sizeKb = Math.round(json.length / 1024)

  const root = await navigator.storage.getDirectory()
  const fileHandle = await root.getFileHandle(OPFS_FILENAME, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(json)
  await writable.close()

  await updateBackupMeta({
    last_backup_at: snapshot.exported_at,
    last_backup_method: 'opfs',
    last_backup_size_kb: sizeKb,
    opfs_available: true,
  })
}

export async function restoreFromOPFS(): Promise<BackupSnapshot | null> {
  if (!isOPFSAvailable()) return null

  try {
    const root = await navigator.storage.getDirectory()
    const fileHandle = await root.getFileHandle(OPFS_FILENAME)
    const file = await fileHandle.getFile()
    const text = await file.text()
    const snapshot = JSON.parse(text) as BackupSnapshot

    await importAllData(snapshot)
    return snapshot
  } catch {
    return null
  }
}

// ─── Couche 3 : JSON hebdo (dimanche) ─────────────────────────

function isSunday(): boolean {
  return new Date().getDay() === 0
}

function triggerJSONDownload(snapshot: BackupSnapshot): void {
  const json = JSON.stringify(snapshot, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const date = new Date().toISOString().split('T')[0]

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `destiny-planner-${date}.json`
  anchor.click()

  URL.revokeObjectURL(url)
}

export async function performSundayBackup(): Promise<boolean> {
  if (!isSunday()) return false

  const meta = await getBackupMeta()
  if (meta?.last_backup_at) {
    const lastBackup = new Date(meta.last_backup_at)
    const diffDays = (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays < 6) return false
  }

  try {
    const snapshot = await exportAllData()
    triggerJSONDownload(snapshot)

    await updateBackupMeta({
      last_backup_at: snapshot.exported_at,
      last_backup_method: 'download',
      last_backup_size_kb: Math.round(JSON.stringify(snapshot).length / 1024),
    })
    return true
  } catch {
    return false
  }
}

// ─── Couche 4 : restauration automatique ──────────────────────

export async function isIndexedDBEmpty(): Promise<boolean> {
  try {
    const [goalCount, domainCount] = await Promise.all([
      db.goal.count(),
      db.domain.count(),
    ])
    return goalCount === 0 && domainCount === 0
  } catch {
    return true
  }
}

export async function autoRestoreIfNeeded(): Promise<boolean> {
  try {
    const empty = await isIndexedDBEmpty()
    if (!empty) return false

    const restored = await restoreFromOPFS()
    return restored !== null
  } catch {
    return false
  }
}

// ─── Utilitaires backup_meta ──────────────────────────────────

export async function getBackupMeta(): Promise<BackupMeta | undefined> {
  try {
    return await db.backup_meta.get('singleton')
  } catch {
    return undefined
  }
}

async function updateBackupMeta(
  partial: Omit<Partial<BackupMeta>, 'id'>
): Promise<void> {
  const existing = await db.backup_meta.get('singleton')
  await db.backup_meta.put({
    id: 'singleton',
    last_backup_at: null,
    last_backup_method: 'none',
    last_backup_size_kb: null,
    opfs_available: isOPFSAvailable(),
    ...existing,
    ...partial,
  })
}

export async function isBackupStale(): Promise<boolean> {
  const meta = await getBackupMeta()
  if (!meta?.last_backup_at) return true

  const diffDays =
    (Date.now() - new Date(meta.last_backup_at).getTime()) / (1000 * 60 * 60 * 24)
  return diffDays > BACKUP_STALE_DAYS
}

// ─── Export / import JSON (déclenché par l'utilisateur) ──────

export async function downloadBackupJSON(): Promise<void> {
  const snapshot = await exportAllData()
  triggerJSONDownload(snapshot)

  await updateBackupMeta({
    last_backup_at: snapshot.exported_at,
    last_backup_method: 'download',
    last_backup_size_kb: Math.round(JSON.stringify(snapshot).length / 1024),
  })
}

export async function importFromJSON(file: File): Promise<BackupSnapshot> {
  const text = await file.text()
  const snapshot = JSON.parse(text) as BackupSnapshot

  if (snapshot.app !== 'DestinyPlanner') {
    throw new Error('Fichier invalide — ce backup ne provient pas de DestinyPlanner')
  }

  await importAllData(snapshot)
  return snapshot
}

// ─── Point d'entrée — appeler dans main.tsx ───────────────────

export async function initBackupService(): Promise<void> {
  try {
    await requestPersistentStorage()
    await autoRestoreIfNeeded()

    if (isOPFSAvailable()) {
      // Backup OPFS en arrière-plan — ne bloque pas l'app
      backupToOPFS().catch(() => undefined)
    }

    await performSundayBackup()
  } catch {
    // La résilience ne bloque jamais le démarrage
  }
}
