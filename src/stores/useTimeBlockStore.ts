// DestinyPlanner — Store blocs horaires (time-blocking 24h)
// Validation via timeBlockValidator avant tout write

import { create } from 'zustand'
import { db } from '../db/schema'
import type { TimeBlock } from '../types'
import { validateTimeBlock } from '../services/timeBlockValidator'
import { pushToSupabase, deleteFromSupabase } from '../services/personalSyncService'
import { useAuthStore } from './useAuthStore'

interface TimeBlockStore {
  blocks: TimeBlock[]
  validationError: string | null
  load: (date: string) => Promise<void>
  addBlock: (
    data: Omit<TimeBlock, 'id' | 'created_at' | 'updated_at' | 'done'>,
    dayStartHour?: number,
    dayEndHour?: number,
  ) => Promise<TimeBlock | null>
  updateBlock: (id: string, data: Partial<Omit<TimeBlock, 'id' | 'created_at'>>) => Promise<void>
  toggleDone: (id: string) => Promise<void>
  deleteBlock: (id: string) => Promise<void>
  clearValidationError: () => void
}

export const useTimeBlockStore = create<TimeBlockStore>((set, get) => ({
  blocks: [],
  validationError: null,

  load: async (date) => {
    try {
      const blocks = await db.time_block
        .where('date')
        .equals(date)
        .sortBy('start_time')
      set({ blocks })
    } catch (error) {
      console.error('useTimeBlockStore.load', error)
    }
  },

  addBlock: async (data, dayStartHour = 5, dayEndHour = 23) => {
    try {
      const { blocks } = get()
      const result = validateTimeBlock(
        { ...data, done: false },
        blocks,
        dayStartHour,
        dayEndHour,
      )

      if (!result.valid) {
        set({ validationError: result.error ?? 'Bloc invalide' })
        return null
      }

      const now = new Date().toISOString()
      const block: TimeBlock = {
        id: crypto.randomUUID(),
        ...data,
        done: false,
        created_at: now,
        updated_at: now,
      }
      await db.time_block.add(block)
      const blocks_updated = [...blocks, block].sort((a, b) =>
        a.start_time.localeCompare(b.start_time),
      )
      set({ blocks: blocks_updated, validationError: null })
      const userId = useAuthStore.getState().user?.id
      if (userId) void pushToSupabase('time_block', block as unknown as Record<string, unknown>, userId)
      return block
    } catch (error) {
      console.error('useTimeBlockStore.addBlock', error)
      throw error
    }
  },

  updateBlock: async (id, data) => {
    try {
      const now = new Date().toISOString()
      const update = { ...data, updated_at: now }
      await db.time_block.update(id, update)
      const blocks = get().blocks
        .map((b) => (b.id === id ? { ...b, ...update } : b))
        .sort((a, b) => a.start_time.localeCompare(b.start_time))
      set({ blocks })
      const userId = useAuthStore.getState().user?.id
      if (userId) {
        const updated = blocks.find((b) => b.id === id)
        if (updated) void pushToSupabase('time_block', updated as unknown as Record<string, unknown>, userId)
      }
    } catch (error) {
      console.error('useTimeBlockStore.updateBlock', error)
    }
  },

  toggleDone: async (id) => {
    try {
      const block = get().blocks.find((b) => b.id === id)
      if (!block) return
      const now = new Date().toISOString()
      const update = { done: !block.done, updated_at: now }
      await db.time_block.update(id, update)
      const updated = { ...block, ...update }
      set((state) => ({
        blocks: state.blocks.map((b) => (b.id === id ? updated : b)),
      }))
      const userId = useAuthStore.getState().user?.id
      if (userId) void pushToSupabase('time_block', updated as unknown as Record<string, unknown>, userId)
    } catch (error) {
      console.error('useTimeBlockStore.toggleDone', error)
    }
  },

  deleteBlock: async (id) => {
    try {
      const toDelete = get().blocks.find((b) => b.id === id)
      await db.time_block.delete(id)
      set((state) => ({ blocks: state.blocks.filter((b) => b.id !== id) }))
      const userId = useAuthStore.getState().user?.id
      if (userId && toDelete) void deleteFromSupabase('time_block', toDelete as unknown as Record<string, unknown>, userId)
    } catch (error) {
      console.error('useTimeBlockStore.deleteBlock', error)
    }
  },

  clearValidationError: () => set({ validationError: null }),
}))
