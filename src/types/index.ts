// DestinyPlanner — Types TypeScript (v1.2)
// 15 tables + enums

// ─── Enums ──────────────────────────────────────────────────

export type ProjectStatus = 'draft' | 'active' | 'paused' | 'completed' | 'abandoned'

export type ProjectStepStatus = 'locked' | 'active' | 'completed'

export type MilestoneStatus = 'planned' | 'in_progress' | 'completed' | 'blocked' | 'postponed'

export type TimeBlockCategory = 'work' | 'rest' | 'spiritual' | 'family' | 'health' | 'free'

export type HabitFrequency = 'daily' | 'weekdays' | 'custom'

export type UserGrade = 'discoverer' | 'planner' | 'builder_diligent' | 'master_builder'

export type BackupMethod = 'opfs' | 'download' | 'none'

export type StepDecision = 'go' | 'no-go' | 'negotiate'

// ─── Données par étape (project_step.data) ──────────────────

export interface Step1Data {
  title: string
  description: string
  success_image: string
}

export interface Step2Data {
  reflection: string
  conviction_or_impulse: string
}

export interface Step3Data {
  strengths: string
  weaknesses: string
  opportunities: string
  threats: string
}

export interface Step4Data {
  financial_cost: string
  time_cost: string
  energy_cost: string
  relationship_impact: string
  sacrifices: string
  ready_to_pay: boolean
}

export interface Step5MilestoneDraft {
  title: string
  due_date: string // YYYY-MM-DD
}

export interface Step5Data {
  budget_detail: string
  duration_estimate: string
  milestones_draft: Step5MilestoneDraft[]
}

export interface Step6Data {
  resources_available: string
  resources_missing: string
  decision: StepDecision
  negotiation_plan: string
}

export interface Step7Data {
  success_criteria: string
  kpi_1: string
  kpi_2: string
  kpi_3: string
  commitment_statement: string
  start_date: string // YYYY-MM-DD
}

export type StepData =
  | Step1Data
  | Step2Data
  | Step3Data
  | Step4Data
  | Step5Data
  | Step6Data
  | Step7Data

// ─── Table : goal ────────────────────────────────────────────

export interface Goal {
  id: 'singleton'
  mission: string
  vision_10_years: string
  values: string[]  // max 3
  created_at: string
  updated_at: string
}

// ─── Table : domain ──────────────────────────────────────────

export interface Domain {
  id: string
  name: string
  icon: string
  goal_statement: string
  sort_order: number
  is_default: boolean
  created_at: string
}

// ─── Table : project ─────────────────────────────────────────

export interface Project {
  id: string
  domain_id: string
  title: string
  current_step: number  // 1–7
  status: ProjectStatus
  progress: number      // 0–100
  created_at: string
  updated_at: string
  completed_at: string | null
}

// ─── Table : project_step ────────────────────────────────────

export interface ProjectStep {
  id: string
  project_id: string
  step_number: number   // 1–7
  status: ProjectStepStatus
  data: Partial<StepData>
  completed_at: string | null
}

// ─── Table : milestone ───────────────────────────────────────

export interface Milestone {
  id: string
  project_id: string
  title: string
  description: string
  due_date: string | null   // YYYY-MM-DD
  status: MilestoneStatus
  sort_order: number
  completed_at: string | null
  created_at: string
  updated_at: string
}

// ─── Table : action ──────────────────────────────────────────

export interface Action {
  id: string
  milestone_id: string   // obligatoire — pas d'action sans jalon
  title: string
  date: string           // YYYY-MM-DD
  estimated_minutes: number | null
  done: boolean
  done_at: string | null
  created_at: string
}

// ─── Table : time_block ──────────────────────────────────────

export interface TimeBlock {
  id: string
  date: string           // YYYY-MM-DD
  start_time: string     // HH:MM (24h)
  end_time: string       // HH:MM (24h)
  title: string
  action_id: string | null
  category: TimeBlockCategory | null
  color_override: string | null  // hex ou null
  notes: string
  done: boolean
  created_at: string
  updated_at: string
}

// ─── Table : detour ──────────────────────────────────────────

export interface Detour {
  id: string
  project_id: string | null
  date: string           // YYYY-MM-DD
  obstacle: string
  impact: string
  adjustment: string
  resolved: boolean
  resolved_at: string | null
  is_systemic: boolean
  linked_habit_id: string | null
  created_at: string
}

// ─── Table : journal_entry ───────────────────────────────────

export interface JournalEntry {
  id: string             // YYYY-MM-DD
  verse_id: string
  quote_id: string
  declaration: string
  main_action: string
  time_blocking_done: boolean
  evening_review: string
  lessons: string
  score_cache: number | null  // 0–100
  engagement_level: number    // 1–3
  created_at: string
  updated_at: string
}

// ─── Table : habit ───────────────────────────────────────────

export interface Habit {
  id: string
  name: string
  weight: number         // 1–100, somme des actives = 100
  frequency: HabitFrequency
  active: boolean
  sort_order: number
  created_at: string
}

// ─── Table : habit_check ─────────────────────────────────────

export interface HabitCheck {
  id: string             // {habit_id}_{date}
  habit_id: string
  date: string           // YYYY-MM-DD
  done: boolean
  checked_at: string
}

// ─── Table : user_profile ────────────────────────────────────

export interface UserProfile {
  id: 'singleton'
  first_name: string
  avatar_emoji: string | null
  avatar_color: string | null  // hex
  bio: string | null           // max 160 chars
  grade: UserGrade
  engagement_level: number     // 1–3
  streak: number
  streak_best: number
  last_active_date: string | null  // YYYY-MM-DD
  consecutive_inactive_days: number
  last_abandoned_project_date: string | null  // YYYY-MM-DD
  total_projects_completed: number
  total_actions_done: number
  total_journal_entries: number
  total_time_blocks_done: number
  score_average_30d: number | null  // 0–100
  onboarding_done: boolean
  tutorial_done?: boolean
  created_at: string
  updated_at: string
}

// ─── Table : personal_business_link ──────────────────────────
// Jamais synchronisée vers Supabase — locale uniquement

export interface PersonalBusinessLink {
  id: string
  goal_id: string
  domain_id: string
  business_project_id: string  // UUID Supabase local — jamais sync
  business_project_title: string
  business_project_status: 'active' | 'paused' | 'completed' | 'abandoned'
  created_at: string
  last_sync_at: string
}

// ─── Table : app_preferences ─────────────────────────────────

export interface AppPreferences {
  id: 'singleton'
  dark_mode: boolean
  language: 'fr' | 'en'
  notifications_enabled: boolean
  day_start_hour: number   // 5–8
  day_end_hour: number     // 21–24
  week_start_day: 'monday' | 'sunday'
  created_at: string
  updated_at: string
}

// ─── Table : backup_meta ─────────────────────────────────────

export interface BackupMeta {
  id: 'singleton'
  last_backup_at: string | null
  last_backup_method: BackupMethod
  last_backup_size_kb: number | null
  opfs_available: boolean
}

// ─── Constantes (verses / quotes) ────────────────────────────

export interface Verse {
  id: string
  reference: string
  text: string
  reflection_prompt: string
  step_affinity: number | null  // 1–7 ou null
}

export interface Quote {
  id: string
  text: string
  author: string
  theme: string
  step_affinity: number[]
  tone: 'faith' | 'slow-down' | 'discipline' | 'vision' | 'courage' | 'perseverance'
}

// ─── Statut de santé d'un domaine ────────────────────────────

export type DomainHealthStatus = 'healthy' | 'dry' | 'overloaded' | 'dormant'

export interface DomainWithHealth extends Domain {
  health_status: DomainHealthStatus
  active_projects_count: number
}
