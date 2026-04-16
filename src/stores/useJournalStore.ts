// DestinyPlanner — Store journal quotidien
// Une entrée par jour (id = YYYY-MM-DD)

import { create } from 'zustand'
import { db } from '../db/schema'
import type { JournalEntry } from '../types'
import { pushToSupabase } from '../services/personalSyncService'
import { useAuthStore } from './useAuthStore'

interface JournalStore {
  entries: JournalEntry[]
  todayEntry: JournalEntry | null
  load: (limit?: number) => Promise<void>
  loadToday: () => Promise<void>
  saveEntry: (date: string, data: Partial<Omit<JournalEntry, 'id' | 'created_at'>>) => Promise<JournalEntry>
  updateScore: (date: string, score: number) => Promise<void>
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export const useJournalStore = create<JournalStore>((set) => ({
  entries: [],
  todayEntry: null,

  load: async (limit = 30) => {
    try {
      const entries = await db.journal_entry
        .orderBy('id')
        .reverse()
        .limit(limit)
        .toArray()
      set({ entries })
    } catch (error) {
      console.error('useJournalStore.load', error)
    }
  },

  loadToday: async () => {
    try {
      const today = todayDate()
      const entry = await db.journal_entry.get(today)
      set({ todayEntry: entry ?? null })
    } catch (error) {
      console.error('useJournalStore.loadToday', error)
    }
  },

  saveEntry: async (date, data) => {
    try {
      const now = new Date().toISOString()
      const existing = await db.journal_entry.get(date)
      const entry: JournalEntry = {
        id: date,
        verse_id: '',
        quote_id: '',
        declaration: '',
        main_action: '',
        time_blocking_done: false,
        evening_review: '',
        lessons: '',
        score_cache: null,
        engagement_level: 1,
        ...(existing ?? {}),
        ...data,
        created_at: existing?.created_at ?? now,
        updated_at: now,
      }
      await db.journal_entry.put(entry)

      const isToday = date === todayDate()
      set((state) => ({
        todayEntry: isToday ? entry : state.todayEntry,
        entries: state.entries.some((e) => e.id === date)
          ? state.entries.map((e) => (e.id === date ? entry : e))
          : [entry, ...state.entries],
      }))
      const userId = useAuthStore.getState().user?.id
      if (userId) void pushToSupabase('journal_entry', entry as unknown as Record<string, unknown>, userId)
      return entry
    } catch (error) {
      console.error('useJournalStore.saveEntry', error)
      throw error
    }
  },

  updateScore: async (date, score) => {
    try {
      const now = new Date().toISOString()
      await db.journal_entry.update(date, { score_cache: score, updated_at: now })
      set((state) => ({
        todayEntry:
          state.todayEntry?.id === date
            ? { ...state.todayEntry, score_cache: score }
            : state.todayEntry,
        entries: state.entries.map((e) =>
          e.id === date ? { ...e, score_cache: score } : e,
        ),
      }))
      const userId = useAuthStore.getState().user?.id
      if (userId) {
        const updated = await db.journal_entry.get(date)
        if (updated) void pushToSupabase('journal_entry', updated as unknown as Record<string, unknown>, userId)
      }
    } catch (error) {
      console.error('useJournalStore.updateScore', error)
    }
  },
}))
