// DestinyPlanner — Store habitudes et check-ins
// Règle : somme des poids des habitudes actives = 100

import { create } from 'zustand'
import { db } from '../db/schema'
import type { Habit, HabitCheck } from '../types'
import { pushToSupabase, deleteFromSupabase } from '../services/personalSyncService'
import { useAuthStore } from './useAuthStore'

interface HabitStore {
  habits: Habit[]
  checks: HabitCheck[]
  weightsValid: boolean
  load: () => Promise<void>
  loadChecksForDate: (date: string) => Promise<void>
  addHabit: (data: Omit<Habit, 'id' | 'created_at' | 'active'>) => Promise<void>
  updateHabit: (id: string, data: Partial<Omit<Habit, 'id' | 'created_at'>>) => Promise<void>
  deleteHabit: (id: string) => Promise<void>
  toggleCheck: (habitId: string, date: string) => Promise<void>
}

function computeWeightsValid(habits: Habit[]): boolean {
  const active = habits.filter((h) => h.active)
  if (active.length === 0) return true
  const total = active.reduce((acc, h) => acc + h.weight, 0)
  return total === 100
}

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  checks: [],
  weightsValid: true,

  load: async () => {
    try {
      const habits = await db.habit.orderBy('sort_order').toArray()
      set({ habits, weightsValid: computeWeightsValid(habits) })
    } catch (error) {
      console.error('useHabitStore.load', error)
    }
  },

  loadChecksForDate: async (date) => {
    try {
      const checks = await db.habit_check.where('date').equals(date).toArray()
      set({ checks })
    } catch (error) {
      console.error('useHabitStore.loadChecksForDate', error)
    }
  },

  addHabit: async (data) => {
    try {
      const now = new Date().toISOString()
      const habit: Habit = {
        id: crypto.randomUUID(),
        ...data,
        active: true,
        created_at: now,
      }
      await db.habit.add(habit)
      const habits = [...get().habits, habit]
      set({ habits, weightsValid: computeWeightsValid(habits) })
      const userId = useAuthStore.getState().user?.id
      if (userId) void pushToSupabase('habit', habit as unknown as Record<string, unknown>, userId)
    } catch (error) {
      console.error('useHabitStore.addHabit', error)
    }
  },

  updateHabit: async (id, data) => {
    try {
      await db.habit.update(id, data)
      const habits = get().habits.map((h) => (h.id === id ? { ...h, ...data } : h))
      set({ habits, weightsValid: computeWeightsValid(habits) })
      const userId = useAuthStore.getState().user?.id
      if (userId) {
        const updated = habits.find((h) => h.id === id)
        if (updated) void pushToSupabase('habit', updated as unknown as Record<string, unknown>, userId)
      }
    } catch (error) {
      console.error('useHabitStore.updateHabit', error)
    }
  },

  deleteHabit: async (id) => {
    try {
      const toDelete = get().habits.find((h) => h.id === id)
      await db.transaction('rw', [db.habit, db.habit_check], async () => {
        await db.habit_check.where('habit_id').equals(id).delete()
        await db.habit.delete(id)
      })
      const habits = get().habits.filter((h) => h.id !== id)
      set({ habits, weightsValid: computeWeightsValid(habits) })
      const userId = useAuthStore.getState().user?.id
      if (userId && toDelete) void deleteFromSupabase('habit', toDelete as unknown as Record<string, unknown>, userId)
    } catch (error) {
      console.error('useHabitStore.deleteHabit', error)
    }
  },

  toggleCheck: async (habitId, date) => {
    try {
      const checkId = `${habitId}_${date}`
      const existing = get().checks.find((c) => c.id === checkId)

      const userId = useAuthStore.getState().user?.id
      if (existing) {
        const updated = { ...existing, done: !existing.done, checked_at: new Date().toISOString() }
        await db.habit_check.put(updated)
        set((state) => ({
          checks: state.checks.map((c) => (c.id === checkId ? updated : c)),
        }))
        if (userId) void pushToSupabase('habit_check', updated as unknown as Record<string, unknown>, userId)
      } else {
        const check: HabitCheck = {
          id: checkId,
          habit_id: habitId,
          date,
          done: true,
          checked_at: new Date().toISOString(),
        }
        await db.habit_check.add(check)
        set((state) => ({ checks: [...state.checks, check] }))
        if (userId) void pushToSupabase('habit_check', check as unknown as Record<string, unknown>, userId)
      }
    } catch (error) {
      console.error('useHabitStore.toggleCheck', error)
    }
  },
}))
