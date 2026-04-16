// DestinyPlanner — Store projets
// Création automatique des 7 project_step (step 1 active, 2–7 locked)
// Transition draft → active quand étape 7 validée

import { create } from 'zustand'
import { db } from '../db/schema'
import type { Project, ProjectStep, ProjectStatus, StepData } from '../types'
import { pushToSupabase, deleteFromSupabase } from '../services/personalSyncService'
import { useAuthStore } from './useAuthStore'

interface ProjectStore {
  projects: Project[]
  steps: ProjectStep[]
  load: () => Promise<void>
  addProject: (domainId: string, title: string) => Promise<Project>
  updateProject: (id: string, data: Partial<Omit<Project, 'id' | 'created_at'>>) => Promise<void>
  loadStepsForProject: (projectId: string) => Promise<void>
  saveStepData: (stepId: string, data: Partial<StepData>) => Promise<void>
  completeStep: (stepId: string, projectId: string, stepNumber: number) => Promise<void>
  setProjectStatus: (id: string, status: ProjectStatus) => Promise<void>
  deleteProject: (id: string) => Promise<void>
}

function createProjectSteps(projectId: string): ProjectStep[] {
  return Array.from({ length: 7 }, (_, i) => ({
    id: crypto.randomUUID(),
    project_id: projectId,
    step_number: i + 1,
    status: i === 0 ? ('active' as const) : ('locked' as const),
    data: {},
    completed_at: null,
  }))
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  steps: [],

  load: async () => {
    try {
      const projects = await db.project.orderBy('created_at').reverse().toArray()
      set({ projects })
    } catch (error) {
      console.error('useProjectStore.load', error)
    }
  },

  addProject: async (domainId, title) => {
    try {
      const now = new Date().toISOString()
      const project: Project = {
        id: crypto.randomUUID(),
        domain_id: domainId,
        title,
        current_step: 1,
        status: 'draft',
        progress: 0,
        created_at: now,
        updated_at: now,
        completed_at: null,
      }
      const steps = createProjectSteps(project.id)

      await db.transaction('rw', [db.project, db.project_step], async () => {
        await db.project.add(project)
        await db.project_step.bulkAdd(steps)
      })

      set((state) => ({ projects: [project, ...state.projects] }))

      const userId = useAuthStore.getState().user?.id
      if (userId) {
        void pushToSupabase('project', project as unknown as Record<string, unknown>, userId)
        for (const step of steps) {
          void pushToSupabase('project_step', step as unknown as Record<string, unknown>, userId)
        }
      }

      return project
    } catch (error) {
      console.error('useProjectStore.addProject', error)
      throw error
    }
  },

  updateProject: async (id, data) => {
    try {
      const now = new Date().toISOString()
      const update = { ...data, updated_at: now }
      await db.project.update(id, update)
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? { ...p, ...update } : p)),
      }))
      const userId = useAuthStore.getState().user?.id
      if (userId) {
        const updated = get().projects.find((p) => p.id === id)
        if (updated) void pushToSupabase('project', updated as unknown as Record<string, unknown>, userId)
      }
    } catch (error) {
      console.error('useProjectStore.updateProject', error)
    }
  },

  loadStepsForProject: async (projectId) => {
    try {
      const steps = await db.project_step
        .where('project_id')
        .equals(projectId)
        .sortBy('step_number')
      set({ steps })
    } catch (error) {
      console.error('useProjectStore.loadStepsForProject', error)
    }
  },

  saveStepData: async (stepId, data) => {
    try {
      const step = get().steps.find((s) => s.id === stepId)
      if (!step) return
      const merged = { ...step.data, ...data }
      await db.project_step.update(stepId, { data: merged })
      set((state) => ({
        steps: state.steps.map((s) => (s.id === stepId ? { ...s, data: merged } : s)),
      }))
      const userId = useAuthStore.getState().user?.id
      if (userId) {
        const updatedStep = { ...step, data: merged }
        void pushToSupabase('project_step', updatedStep as unknown as Record<string, unknown>, userId)
      }
    } catch (error) {
      console.error('useProjectStore.saveStepData', error)
    }
  },

  completeStep: async (stepId, projectId, stepNumber) => {
    try {
      const now = new Date().toISOString()

      await db.transaction('rw', [db.project, db.project_step], async () => {
        // Marquer l'étape courante completed
        await db.project_step.update(stepId, { status: 'completed', completed_at: now })

        if (stepNumber < 7) {
          // Déverrouiller l'étape suivante
          const nextStep = await db.project_step
            .where('project_id').equals(projectId)
            .and((s) => s.step_number === stepNumber + 1)
            .first()
          if (nextStep) {
            await db.project_step.update(nextStep.id, { status: 'active' })
          }
          await db.project.update(projectId, {
            current_step: stepNumber + 1,
            updated_at: now,
          })
        } else {
          // Étape 7 validée → projet passe en active
          await db.project.update(projectId, {
            status: 'active',
            current_step: 7,
            updated_at: now,
          })
        }
      })

      // Recharger les steps et projets
      await get().loadStepsForProject(projectId)
      const updated = await db.project.get(projectId)
      if (updated) {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === projectId ? updated : p)),
        }))
        const userId = useAuthStore.getState().user?.id
        if (userId) {
          void pushToSupabase('project', updated as unknown as Record<string, unknown>, userId)
          const freshSteps = await db.project_step.where('project_id').equals(projectId).toArray()
          for (const s of freshSteps) {
            void pushToSupabase('project_step', s as unknown as Record<string, unknown>, userId)
          }
        }
      }
    } catch (error) {
      console.error('useProjectStore.completeStep', error)
    }
  },

  setProjectStatus: async (id, status) => {
    try {
      const now = new Date().toISOString()
      const update: Partial<Project> = {
        status,
        updated_at: now,
        completed_at: status === 'completed' ? now : undefined,
      }
      await db.project.update(id, update)
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? { ...p, ...update } : p)),
      }))
      const userId = useAuthStore.getState().user?.id
      if (userId) {
        const updated = get().projects.find((p) => p.id === id)
        if (updated) void pushToSupabase('project', updated as unknown as Record<string, unknown>, userId)
      }
    } catch (error) {
      console.error('useProjectStore.setProjectStatus', error)
    }
  },

  deleteProject: async (id) => {
    try {
      const toDelete = get().projects.find((p) => p.id === id)
      await db.transaction('rw', [db.project, db.project_step, db.milestone, db.action], async () => {
        await db.project_step.where('project_id').equals(id).delete()
        const milestones = await db.milestone.where('project_id').equals(id).toArray()
        for (const m of milestones) {
          await db.action.where('milestone_id').equals(m.id).delete()
        }
        await db.milestone.where('project_id').equals(id).delete()
        await db.project.delete(id)
      })
      set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }))
      const userId = useAuthStore.getState().user?.id
      if (userId && toDelete) {
        void deleteFromSupabase('project', toDelete as unknown as Record<string, unknown>, userId)
      }
    } catch (error) {
      console.error('useProjectStore.deleteProject', error)
    }
  },
}))
