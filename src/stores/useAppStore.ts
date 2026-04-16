// DestinyPlanner — Store préférences techniques de l'app (app_preferences)

import { create } from 'zustand'
import { db } from '../db/schema'
import type { AppPreferences } from '../types'
import { pushToSupabase } from '../services/personalSyncService'
import { useAuthStore } from './useAuthStore'

function applyTheme(darkMode: boolean): void {
  if (darkMode) {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', 'light')
  }
}

interface AppStore {
  preferences: AppPreferences | null
  load: () => Promise<void>
  updatePreferences: (data: Partial<Omit<AppPreferences, 'id' | 'created_at'>>) => Promise<void>
  toggleDarkMode: () => Promise<void>
}

const DEFAULT_PREFERENCES: Omit<AppPreferences, 'id'> = {
  dark_mode: true,
  language: 'fr',
  notifications_enabled: false,
  day_start_hour: 5,
  day_end_hour: 23,
  week_start_day: 'monday',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const useAppStore = create<AppStore>((set, get) => ({
  preferences: null,

  load: async () => {
    try {
      const prefs = await db.app_preferences.get('singleton')
      set({ preferences: prefs ?? null })
      applyTheme(prefs?.dark_mode ?? true)
    } catch (error) {
      console.error('useAppStore.load', error)
    }
  },

  updatePreferences: async (data) => {
    try {
      const current = get().preferences
      const now = new Date().toISOString()
      const updated: AppPreferences = {
        ...(current ?? { id: 'singleton', ...DEFAULT_PREFERENCES }),
        ...data,
        id: 'singleton',
        updated_at: now,
      }
      await db.app_preferences.put(updated)
      set({ preferences: updated })
      const userId = useAuthStore.getState().user?.id
      if (userId) void pushToSupabase('app_preferences', updated as unknown as Record<string, unknown>, userId)
    } catch (error) {
      console.error('useAppStore.updatePreferences', error)
    }
  },

  toggleDarkMode: async () => {
    const current = get().preferences
    const nextDarkMode = !(current?.dark_mode ?? true)
    await get().updatePreferences({ dark_mode: nextDarkMode })
    applyTheme(nextDarkMode)
  },
}))
