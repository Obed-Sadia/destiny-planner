// DestinyPlanner — Store but de vie (goal singleton)

import { create } from 'zustand'
import { db } from '../db/schema'
import type { Goal } from '../types'
import { pushToSupabase } from '../services/personalSyncService'
import { useAuthStore } from './useAuthStore'

interface GoalStore {
  goal: Goal | null
  load: () => Promise<void>
  saveGoal: (data: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
}

export const useGoalStore = create<GoalStore>((set, get) => ({
  goal: null,

  load: async () => {
    try {
      const goal = await db.goal.get('singleton')
      set({ goal: goal ?? null })
    } catch (error) {
      console.error('useGoalStore.load', error)
    }
  },

  saveGoal: async (data) => {
    try {
      const now = new Date().toISOString()
      const current = get().goal
      const goal: Goal = {
        id: 'singleton',
        ...data,
        created_at: current?.created_at ?? now,
        updated_at: now,
      }
      await db.goal.put(goal)
      set({ goal })
      const userId = useAuthStore.getState().user?.id
      if (userId) {
        void pushToSupabase('goal', goal as unknown as Record<string, unknown>, userId)
      }
    } catch (error) {
      console.error('useGoalStore.saveGoal', error)
    }
  },
}))
