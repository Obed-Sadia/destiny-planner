// DestinyPlanner — Store jalons
// Recalcule project.progress après chaque changement de statut

import { create } from 'zustand'
import { db } from '../db/schema'
import type { Milestone, MilestoneStatus } from '../types'

interface MilestoneStore {
  milestones: Milestone[]
  load: (projectId: string) => Promise<void>
  addMilestone: (data: Omit<Milestone, 'id' | 'created_at' | 'updated_at' | 'completed_at'>) => Promise<Milestone>
  updateMilestone: (id: string, data: Partial<Omit<Milestone, 'id' | 'created_at'>>) => Promise<void>
  setStatus: (id: string, status: MilestoneStatus) => Promise<void>
  deleteMilestone: (id: string) => Promise<void>
}

async function recalculateProjectProgress(projectId: string): Promise<void> {
  const milestones = await db.milestone.where('project_id').equals(projectId).toArray()
  if (milestones.length === 0) return
  const completed = milestones.filter((m) => m.status === 'completed').length
  const progress = Math.round((completed / milestones.length) * 100)
  await db.project.update(projectId, { progress, updated_at: new Date().toISOString() })
}

export const useMilestoneStore = create<MilestoneStore>((set, get) => ({
  milestones: [],

  load: async (projectId) => {
    try {
      const milestones = await db.milestone
        .where('project_id')
        .equals(projectId)
        .sortBy('sort_order')
      set({ milestones })
    } catch (error) {
      console.error('useMilestoneStore.load', error)
    }
  },

  addMilestone: async (data) => {
    try {
      const now = new Date().toISOString()
      const milestone: Milestone = {
        id: crypto.randomUUID(),
        ...data,
        completed_at: null,
        created_at: now,
        updated_at: now,
      }
      await db.milestone.add(milestone)
      set((state) => ({ milestones: [...state.milestones, milestone] }))
      return milestone
    } catch (error) {
      console.error('useMilestoneStore.addMilestone', error)
      throw error
    }
  },

  updateMilestone: async (id, data) => {
    try {
      const now = new Date().toISOString()
      const update = { ...data, updated_at: now }
      await db.milestone.update(id, update)
      set((state) => ({
        milestones: state.milestones.map((m) => (m.id === id ? { ...m, ...update } : m)),
      }))
    } catch (error) {
      console.error('useMilestoneStore.updateMilestone', error)
    }
  },

  setStatus: async (id, status) => {
    try {
      const now = new Date().toISOString()
      const update: Partial<Milestone> = {
        status,
        updated_at: now,
        completed_at: status === 'completed' ? now : null,
      }
      await db.milestone.update(id, update)
      const milestones = get().milestones.map((m) => (m.id === id ? { ...m, ...update } : m))
      set({ milestones })

      const milestone = milestones.find((m) => m.id === id)
      if (milestone) {
        await recalculateProjectProgress(milestone.project_id)
      }
    } catch (error) {
      console.error('useMilestoneStore.setStatus', error)
    }
  },

  deleteMilestone: async (id) => {
    try {
      const milestone = get().milestones.find((m) => m.id === id)
      await db.transaction('rw', [db.milestone, db.action], async () => {
        await db.action.where('milestone_id').equals(id).delete()
        await db.milestone.delete(id)
      })
      set((state) => ({ milestones: state.milestones.filter((m) => m.id !== id) }))
      if (milestone) {
        await recalculateProjectProgress(milestone.project_id)
      }
    } catch (error) {
      console.error('useMilestoneStore.deleteMilestone', error)
    }
  },
}))
