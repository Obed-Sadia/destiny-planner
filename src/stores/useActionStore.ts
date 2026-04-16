// DestinyPlanner — Store actions du jour
// Règle absolue : toute action est liée à un jalon

import { create } from 'zustand'
import { db } from '../db/schema'
import type { Action } from '../types'
import { pushToSupabase, deleteFromSupabase } from '../services/personalSyncService'
import { useAuthStore } from './useAuthStore'

interface ActionStore {
  actions: Action[]
  load: (date: string) => Promise<void>
  loadForMilestone: (milestoneId: string) => Promise<void>
  addAction: (data: Omit<Action, 'id' | 'created_at' | 'done' | 'done_at'>) => Promise<Action>
  updateAction: (id: string, data: Partial<Omit<Action, 'id' | 'created_at'>>) => Promise<void>
  toggleDone: (id: string) => Promise<void>
  deleteAction: (id: string) => Promise<void>
}

export const useActionStore = create<ActionStore>((set, get) => ({
  actions: [],

  load: async (date) => {
    try {
      const actions = await db.action.where('date').equals(date).toArray()
      set({ actions })
    } catch (error) {
      console.error('useActionStore.load', error)
    }
  },

  loadForMilestone: async (milestoneId) => {
    try {
      const actions = await db.action.where('milestone_id').equals(milestoneId).toArray()
      set({ actions })
    } catch (error) {
      console.error('useActionStore.loadForMilestone', error)
    }
  },

  addAction: async (data) => {
    try {
      const now = new Date().toISOString()
      const action: Action = {
        id: crypto.randomUUID(),
        ...data,
        done: false,
        done_at: null,
        created_at: now,
      }
      await db.action.add(action)
      set((state) => ({ actions: [...state.actions, action] }))
      const userId = useAuthStore.getState().user?.id
      if (userId) void pushToSupabase('action', action as unknown as Record<string, unknown>, userId)
      return action
    } catch (error) {
      console.error('useActionStore.addAction', error)
      throw error
    }
  },

  updateAction: async (id, data) => {
    try {
      await db.action.update(id, data)
      const actions = get().actions.map((a) => (a.id === id ? { ...a, ...data } : a))
      set({ actions })
      const userId = useAuthStore.getState().user?.id
      if (userId) {
        const updated = actions.find((a) => a.id === id)
        if (updated) void pushToSupabase('action', updated as unknown as Record<string, unknown>, userId)
      }
    } catch (error) {
      console.error('useActionStore.updateAction', error)
    }
  },

  toggleDone: async (id) => {
    try {
      const action = get().actions.find((a) => a.id === id)
      if (!action) return
      const now = new Date().toISOString()
      const update: Partial<Action> = {
        done: !action.done,
        done_at: !action.done ? now : null,
      }
      await db.action.update(id, update)
      const actions = get().actions.map((a) => (a.id === id ? { ...a, ...update } : a))
      set({ actions })
      const userId = useAuthStore.getState().user?.id
      if (userId) {
        const updated = actions.find((a) => a.id === id)
        if (updated) void pushToSupabase('action', updated as unknown as Record<string, unknown>, userId)
      }
    } catch (error) {
      console.error('useActionStore.toggleDone', error)
    }
  },

  deleteAction: async (id) => {
    try {
      const toDelete = get().actions.find((a) => a.id === id)
      await db.action.delete(id)
      set((state) => ({ actions: state.actions.filter((a) => a.id !== id) }))
      const userId = useAuthStore.getState().user?.id
      if (userId && toDelete) void deleteFromSupabase('action', toDelete as unknown as Record<string, unknown>, userId)
    } catch (error) {
      console.error('useActionStore.deleteAction', error)
    }
  },
}))
