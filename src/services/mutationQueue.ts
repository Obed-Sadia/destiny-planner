// DestinyPlanner — File de mutations business en attente (Session 33)
// Persistée en localStorage — rejoue les writes Supabase à la reconnexion
// Jamais synchronisée vers l'espace perso

const QUEUE_KEY = 'dp_business_mutation_queue'
const MAX_ATTEMPTS = 5

// ─── Types ────────────────────────────────────────────────────

export type MutationType =
  | 'saveStepData'
  | 'completeStep'
  | 'addMilestone'
  | 'assignMilestone'
  | 'updateMilestoneStatus'

export interface SaveStepDataPayload {
  stepId: string
  mergedData: Record<string, unknown>
}

export interface CompleteStepPayload {
  stepId: string
  projectId: string
  stepNum: number
  now: string
}

export interface AddMilestonePayload {
  project_id: string
  title: string
  due_date: string | null
  sort_order: number
  ownerId: string
}

export interface AssignMilestonePayload {
  milestoneId: string
  assigneeId: string | null
  now: string
}

export interface UpdateMilestoneStatusPayload {
  milestoneId: string
  status: string
  now: string
  completedAt: string | null
}

export type MutationPayload =
  | { type: 'saveStepData';          data: SaveStepDataPayload }
  | { type: 'completeStep';          data: CompleteStepPayload }
  | { type: 'addMilestone';          data: AddMilestonePayload }
  | { type: 'assignMilestone';       data: AssignMilestonePayload }
  | { type: 'updateMilestoneStatus'; data: UpdateMilestoneStatusPayload }

export interface PendingMutation {
  id: string
  mutation: MutationPayload
  created_at: string
  attempts: number
  last_error: string | null
}

// ─── Accès localStorage ───────────────────────────────────────

function loadQueue(): PendingMutation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? (JSON.parse(raw) as PendingMutation[]) : []
  } catch {
    return []
  }
}

function saveQueue(queue: PendingMutation[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {
    // localStorage plein — on abandonne silencieusement
  }
}

// ─── API publique ─────────────────────────────────────────────

export function enqueue(mutation: MutationPayload): string {
  const queue = loadQueue()
  const entry: PendingMutation = {
    id: crypto.randomUUID(),
    mutation,
    created_at: new Date().toISOString(),
    attempts: 0,
    last_error: null,
  }
  queue.push(entry)
  saveQueue(queue)
  return entry.id
}

export function dequeue(id: string): void {
  const queue = loadQueue().filter((m) => m.id !== id)
  saveQueue(queue)
}

export function getAll(): PendingMutation[] {
  return loadQueue()
}

export function size(): number {
  return loadQueue().length
}

export function markAttempt(id: string, error: string | null): void {
  const queue = loadQueue().map((m) => {
    if (m.id !== id) return m
    const attempts = m.attempts + 1
    // Abandon après MAX_ATTEMPTS
    if (attempts >= MAX_ATTEMPTS) return null
    return { ...m, attempts, last_error: error }
  }).filter(Boolean) as PendingMutation[]
  saveQueue(queue)
}

export function clear(): void {
  localStorage.removeItem(QUEUE_KEY)
}
