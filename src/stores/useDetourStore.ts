// DestinyPlanner — Store détours (obstacles documentés)
// Détection automatique is_systemic : même type d'obstacle sur ≥ 3 projets différents

import { create } from 'zustand'
import { db } from '../db/schema'
import type { Detour } from '../types'
import { pushToSupabase, deleteFromSupabase } from '../services/personalSyncService'
import { useAuthStore } from './useAuthStore'

interface DetourStore {
  detours: Detour[]
  load: (projectId?: string) => Promise<void>
  addDetour: (data: Omit<Detour, 'id' | 'created_at' | 'resolved' | 'resolved_at' | 'is_systemic'>) => Promise<Detour>
  updateDetour: (id: string, data: Partial<Omit<Detour, 'id' | 'created_at'>>) => Promise<void>
  resolveDetour: (id: string) => Promise<void>
  deleteDetour: (id: string) => Promise<void>
}

// Détection systémique : même obstacle (correspondance mot-clé) sur ≥ 3 projets différents
async function checkIsSystemic(obstacle: string, excludeId?: string): Promise<boolean> {
  const allDetours = await db.detour.toArray()
  const relevant = allDetours.filter((d) => {
    if (excludeId && d.id === excludeId) return false
    return d.obstacle.toLowerCase().includes(obstacle.toLowerCase().slice(0, 20))
  })
  const uniqueProjects = new Set(relevant.map((d) => d.project_id).filter(Boolean))
  return uniqueProjects.size >= 2 // 2 existants + le nouveau = 3 au total
}

export const useDetourStore = create<DetourStore>((set, get) => ({
  detours: [],

  load: async (projectId) => {
    try {
      const detours = projectId
        ? await db.detour.where('project_id').equals(projectId).sortBy('date')
        : await db.detour.orderBy('date').reverse().toArray()
      set({ detours })
    } catch (error) {
      console.error('useDetourStore.load', error)
    }
  },

  addDetour: async (data) => {
    try {
      const now = new Date().toISOString()
      const is_systemic = await checkIsSystemic(data.obstacle)
      const detour: Detour = {
        id: crypto.randomUUID(),
        ...data,
        resolved: false,
        resolved_at: null,
        is_systemic,
        created_at: now,
      }
      await db.detour.add(detour)
      set((state) => ({ detours: [detour, ...state.detours] }))
      const userId = useAuthStore.getState().user?.id
      if (userId) void pushToSupabase('detour', detour as unknown as Record<string, unknown>, userId)
      return detour
    } catch (error) {
      console.error('useDetourStore.addDetour', error)
      throw error
    }
  },

  updateDetour: async (id, data) => {
    try {
      await db.detour.update(id, data)
      const detours = get().detours.map((d) => (d.id === id ? { ...d, ...data } : d))
      set({ detours })
      const userId = useAuthStore.getState().user?.id
      if (userId) {
        const updated = detours.find((d) => d.id === id)
        if (updated) void pushToSupabase('detour', updated as unknown as Record<string, unknown>, userId)
      }
    } catch (error) {
      console.error('useDetourStore.updateDetour', error)
    }
  },

  resolveDetour: async (id) => {
    try {
      const now = new Date().toISOString()
      const update = { resolved: true, resolved_at: now }
      await db.detour.update(id, update)
      const detours = get().detours.map((d) => (d.id === id ? { ...d, ...update } : d))
      set({ detours })
      const userId = useAuthStore.getState().user?.id
      if (userId) {
        const updated = detours.find((d) => d.id === id)
        if (updated) void pushToSupabase('detour', updated as unknown as Record<string, unknown>, userId)
      }
    } catch (error) {
      console.error('useDetourStore.resolveDetour', error)
    }
  },

  deleteDetour: async (id) => {
    try {
      const toDelete = get().detours.find((d) => d.id === id)
      await db.detour.delete(id)
      set((state) => ({ detours: state.detours.filter((d) => d.id !== id) }))
      const userId = useAuthStore.getState().user?.id
      if (userId && toDelete) void deleteFromSupabase('detour', toDelete as unknown as Record<string, unknown>, userId)
    } catch (error) {
      console.error('useDetourStore.deleteDetour', error)
    }
  },
}))
