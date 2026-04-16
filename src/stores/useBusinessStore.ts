// DestinyPlanner — Store business (v2.0 + sync optimiste v3.0)
// Writes optimistes : appliqués localement immédiatement, enqueués si offline
// La file est rejouée automatiquement à la reconnexion

import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { db } from '../db/schema'
import * as MQ from '../services/mutationQueue'
import type {
  BusinessProject, BusinessProjectStep, BusinessProjectStatus,
  BusinessMilestone, BusinessMilestoneStatus, Database,
} from '../lib/supabase.types'
import type { StepData, Step5Data } from '../types'

type PrefilledSteps = Partial<Record<number, Partial<StepData>>>

type ProjectUpdate = Database['public']['Tables']['business_projects']['Update']

interface MilestoneInsert {
  project_id: string
  title: string
  due_date: string | null
  sort_order: number
}

interface BusinessState {
  projects: BusinessProject[]
  steps: BusinessProjectStep[]
  milestones: BusinessMilestone[]
  loading: boolean
  error: string | null
  pendingCount: number   // mutations en attente de sync

  loadProjects: () => Promise<void>
  loadStepsForProject: (projectId: string) => Promise<void>
  createProject: (title: string, description: string, templateId?: string, prefilledSteps?: PrefilledSteps) => Promise<BusinessProject>
  saveStepData: (stepId: string, patch: Partial<StepData>) => Promise<void>
  completeStep: (stepId: string, projectId: string, stepNum: number) => Promise<void>
  addMilestone: (params: MilestoneInsert) => Promise<void>
  loadMilestones: (projectId: string) => Promise<void>
  assignMilestone: (milestoneId: string, assigneeId: string | null) => Promise<void>
  updateMilestoneStatus: (milestoneId: string, status: BusinessMilestoneStatus) => Promise<void>
  replayQueue: () => Promise<void>
  refreshPendingCount: () => void
}

export const useBusinessStore = create<BusinessState>((set, get) => ({
  projects: [],
  steps: [],
  milestones: [],
  loading: false,
  error: null,
  pendingCount: MQ.size(),

  refreshPendingCount: () => set({ pendingCount: MQ.size() }),

  loadProjects: async () => {
    set({ loading: true, error: null })

    try {
      if (!navigator.onLine) {
        const cached = await db.business_project_cache.toArray()
        set({ projects: cached as unknown as BusinessProject[], loading: false })
        return
      }

      const { data, error } = await supabase
        .from('business_projects')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Mise à jour du cache offline
      await db.business_project_cache.clear()
      if (data.length > 0) {
        await db.business_project_cache.bulkPut(
          data.map((p) => ({ ...p, cached_at: new Date().toISOString() })),
        )
      }

      set({ projects: data, loading: false })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement'
      set({ error: msg, loading: false })

      // Fallback cache si Supabase échoue
      try {
        const cached = await db.business_project_cache.toArray()
        set({ projects: cached as unknown as BusinessProject[] })
      } catch { /* cache vide */ }
    }
  },

  loadStepsForProject: async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('business_project_steps')
        .select('*')
        .eq('project_id', projectId)
        .order('step_number', { ascending: true })

      if (error) throw error

      // Remplacer les étapes de ce projet dans le store
      set((state) => ({
        steps: [
          ...state.steps.filter((s) => s.project_id !== projectId),
          ...data,
        ],
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur chargement étapes'
      set({ error: msg })
    }
  },

  createProject: async (title: string, description: string, templateId?: string, prefilledSteps?: PrefilledSteps) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Non authentifié')
    const user = session.user

    const { data, error } = await supabase
      .from('business_projects')
      .insert({
        title,
        description,
        template_id: templateId ?? null,
      })
      .select()
      .single()

    if (error) throw error

    set((state) => ({ projects: [data, ...state.projects] }))

    // Mettre à jour le cache
    await db.business_project_cache.put({ ...data, cached_at: new Date().toISOString() })

    // Pré-remplir les étapes si un template a été sélectionné
    if (prefilledSteps && Object.keys(prefilledSteps).length > 0) {
      const { data: steps, error: stepsError } = await supabase
        .from('business_project_steps')
        .select('*')
        .eq('project_id', data.id)
        .order('step_number', { ascending: true })

      if (!stepsError && steps) {
        // Mettre à jour chaque étape avec les données du template
        await Promise.all(
          steps.map(async (step) => {
            const stepData = prefilledSteps[step.step_number]
            if (!stepData) return
            await supabase
              .from('business_project_steps')
              .update({ data: stepData as Record<string, unknown> })
              .eq('id', step.id)
          }),
        )

        // Injecter les étapes pré-remplies dans le store local
        const stepsWithData = steps.map((s) => {
          const d = prefilledSteps[s.step_number]
          return d ? { ...s, data: d as Record<string, unknown> } : s
        })
        set((state) => ({
          steps: [
            ...state.steps.filter((s) => s.project_id !== data.id),
            ...stepsWithData,
          ],
        }))
      }
    }

    return data
  },

  saveStepData: async (stepId: string, patch: Partial<StepData>) => {
    const existing = get().steps.find((s) => s.id === stepId)
    const merged = { ...(existing?.data ?? {}), ...(patch as Record<string, unknown>) }

    // Mise à jour optimiste immédiate
    set((state) => ({
      steps: state.steps.map((s) => s.id === stepId ? { ...s, data: merged } : s),
    }))

    if (!navigator.onLine) {
      MQ.enqueue({ type: 'saveStepData', data: { stepId, mergedData: merged } })
      set({ pendingCount: MQ.size() })
      return
    }

    try {
      const { error } = await supabase
        .from('business_project_steps')
        .update({ data: merged })
        .eq('id', stepId)
      if (error) throw error
    } catch (err) {
      MQ.enqueue({ type: 'saveStepData', data: { stepId, mergedData: merged } })
      set({ pendingCount: MQ.size() })
    }
  },

  completeStep: async (stepId: string, projectId: string, stepNum: number) => {
    const now = new Date().toISOString()
    const newCurrentStep = Math.min(stepNum + 1, 7)
    const newProgress = stepNum === 7 ? 100 : Math.round((stepNum / 7) * 100)

    // Mise à jour optimiste immédiate
    set((state) => ({
      steps: state.steps.map((s) => {
        if (s.id === stepId) return { ...s, status: 'completed', completed_at: now }
        if (s.project_id === projectId && s.step_number === stepNum + 1 && stepNum < 7)
          return { ...s, status: 'active' }
        return s
      }),
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, current_step: newCurrentStep, progress: newProgress, updated_at: now,
              ...(stepNum === 7 ? { status: 'active' as BusinessProjectStatus, progress: 100 } : {}) }
          : p,
      ),
    }))

    if (!navigator.onLine) {
      MQ.enqueue({ type: 'completeStep', data: { stepId, projectId, stepNum, now } })
      set({ pendingCount: MQ.size() })
      return
    }

    try {
      // 1. Marquer complétée
      const { error: e1 } = await supabase
        .from('business_project_steps')
        .update({ status: 'completed', completed_at: now })
        .eq('id', stepId)
      if (e1) throw e1

      // 2. Débloquer suivante
      if (stepNum < 7) {
        const { error: e2 } = await supabase
          .from('business_project_steps')
          .update({ status: 'active' })
          .eq('project_id', projectId)
          .eq('step_number', stepNum + 1)
        if (e2) throw e2
      }

      // 3. Mettre à jour le projet
      const projectPatch: ProjectUpdate = {
        current_step: newCurrentStep,
        progress: newProgress,
        updated_at: now,
      }
      if (stepNum === 7) {
        projectPatch.status = 'active' as BusinessProjectStatus
        projectPatch.progress = 100
      }
      const { data: updatedProject, error: e3 } = await supabase
        .from('business_projects')
        .update(projectPatch)
        .eq('id', projectId)
        .select()
        .single()
      if (e3) throw e3

      // 4. Synchroniser store + cache avec les données Supabase
      set((state) => ({
        projects: state.projects.map((p) => p.id === projectId ? updatedProject : p),
      }))
      await db.business_project_cache.put({ ...updatedProject, cached_at: new Date().toISOString() })
    } catch {
      MQ.enqueue({ type: 'completeStep', data: { stepId, projectId, stepNum, now } })
      set({ pendingCount: MQ.size() })
    }
  },

  addMilestone: async ({ project_id, title, due_date, sort_order }: MilestoneInsert) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Non authentifié')
    const user = session.user

    // Jalon optimiste local (ID temporaire remplacé par Supabase au replay)
    const tempId = `tmp_${crypto.randomUUID()}`
    const now = new Date().toISOString()
    const optimistic = {
      id: tempId,
      project_id,
      title,
      due_date,
      sort_order,
      description: '',
      status: 'planned' as const,
      assignee_id: null,
      completed_at: null,
      created_at: now,
      updated_at: now,
    }
    set((state) => ({
      milestones: [...state.milestones, optimistic as unknown as BusinessMilestone],
    }))

    if (!navigator.onLine) {
      MQ.enqueue({ type: 'addMilestone', data: { project_id, title, due_date, sort_order, ownerId: user.id } })
      set({ pendingCount: MQ.size() })
      return
    }

    try {
      const { data, error } = await supabase
        .from('business_milestones')
        .insert({ project_id, title, due_date, sort_order, description: '', status: 'planned' })
        .select()
        .single()
      if (error) throw error
      // Remplacer le jalon temporaire par la version Supabase
      set((state) => ({
        milestones: state.milestones.map((m) => m.id === tempId ? data : m),
      }))
    } catch {
      MQ.enqueue({ type: 'addMilestone', data: { project_id, title, due_date, sort_order, ownerId: user.id } })
      set({ pendingCount: MQ.size() })
    }
  },

  loadMilestones: async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('business_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true })

      if (error) throw error

      set((state) => ({
        milestones: [
          ...state.milestones.filter((m) => m.project_id !== projectId),
          ...data,
        ],
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur jalons'
      set({ error: msg })
    }
  },

  assignMilestone: async (milestoneId: string, assigneeId: string | null) => {
    const now = new Date().toISOString()

    // Mise à jour optimiste immédiate
    set((state) => ({
      milestones: state.milestones.map((m) =>
        m.id === milestoneId ? { ...m, assignee_id: assigneeId, updated_at: now } : m,
      ),
    }))

    if (!navigator.onLine) {
      MQ.enqueue({ type: 'assignMilestone', data: { milestoneId, assigneeId, now } })
      set({ pendingCount: MQ.size() })
      return
    }

    try {
      const { error } = await supabase
        .from('business_milestones')
        .update({ assignee_id: assigneeId, updated_at: now })
        .eq('id', milestoneId)
      if (error) throw error
    } catch {
      MQ.enqueue({ type: 'assignMilestone', data: { milestoneId, assigneeId, now } })
      set({ pendingCount: MQ.size() })
    }
  },

  updateMilestoneStatus: async (milestoneId: string, status: BusinessMilestoneStatus) => {
    const now = new Date().toISOString()
    const completedAt = status === 'completed' ? now : null

    // Mise à jour optimiste immédiate
    set((state) => ({
      milestones: state.milestones.map((m) =>
        m.id === milestoneId
          ? { ...m, status, updated_at: now, completed_at: completedAt ?? m.completed_at }
          : m,
      ),
    }))

    if (!navigator.onLine) {
      MQ.enqueue({ type: 'updateMilestoneStatus', data: { milestoneId, status, now, completedAt } })
      set({ pendingCount: MQ.size() })
      return
    }

    try {
      const { error } = await supabase
        .from('business_milestones')
        .update({ status, updated_at: now, completed_at: completedAt })
        .eq('id', milestoneId)
      if (error) throw error
    } catch {
      MQ.enqueue({ type: 'updateMilestoneStatus', data: { milestoneId, status, now, completedAt } })
      set({ pendingCount: MQ.size() })
    }
  },

  replayQueue: async () => {
    const queue = MQ.getAll()
    if (queue.length === 0) return

    for (const entry of queue) {
      try {
        const { mutation } = entry
        switch (mutation.type) {
          case 'saveStepData': {
            const { stepId, mergedData } = mutation.data
            const { error } = await supabase
              .from('business_project_steps')
              .update({ data: mergedData })
              .eq('id', stepId)
            if (error) throw error
            break
          }
          case 'completeStep': {
            const { stepId, projectId, stepNum, now } = mutation.data
            const { error: e1 } = await supabase
              .from('business_project_steps')
              .update({ status: 'completed', completed_at: now })
              .eq('id', stepId)
            if (e1) throw e1
            if (stepNum < 7) {
              await supabase
                .from('business_project_steps')
                .update({ status: 'active' })
                .eq('project_id', projectId)
                .eq('step_number', stepNum + 1)
            }
            const newProgress = stepNum === 7 ? 100 : Math.round((stepNum / 7) * 100)
            const patch: ProjectUpdate = {
              current_step: Math.min(stepNum + 1, 7),
              progress: newProgress,
              updated_at: now,
              ...(stepNum === 7 ? { status: 'active' as BusinessProjectStatus, progress: 100 } : {}),
            }
            await supabase.from('business_projects').update(patch).eq('id', projectId)
            break
          }
          case 'addMilestone': {
            const { project_id, title, due_date, sort_order } = mutation.data
            const { error } = await supabase
              .from('business_milestones')
              .insert({ project_id, title, due_date, sort_order, description: '', status: 'planned' })
            if (error) throw error
            break
          }
          case 'assignMilestone': {
            const { milestoneId, assigneeId, now } = mutation.data
            const { error } = await supabase
              .from('business_milestones')
              .update({ assignee_id: assigneeId, updated_at: now })
              .eq('id', milestoneId)
            if (error) throw error
            break
          }
          case 'updateMilestoneStatus': {
            const { milestoneId, status, now, completedAt } = mutation.data
            const { error } = await supabase
              .from('business_milestones')
              .update({ status: status as BusinessMilestoneStatus, updated_at: now, completed_at: completedAt })
              .eq('id', milestoneId)
            if (error) throw error
            break
          }
        }
        MQ.dequeue(entry.id)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue'
        MQ.markAttempt(entry.id, msg)
      }
    }

    set({ pendingCount: MQ.size() })

    // Recharger les projets pour refléter l'état Supabase
    await get().loadProjects()
  },
}))

// Export du type Step5Data pour le wizard
export type { Step5Data }
