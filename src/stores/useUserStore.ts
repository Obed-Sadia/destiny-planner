// DestinyPlanner — Store profil utilisateur (user_profile singleton)
// recalculateStats(), checkAndUpdateGrade(), streak management, engagement progressif

import { create } from 'zustand'
import { db } from '../db/schema'
import type { UserProfile, UserGrade } from '../types'
import { computeUserStats } from '../services/userStats'
import { computeStreakUpdate } from '../services/score'
import { pushToSupabase } from '../services/personalSyncService'
import { useAuthStore } from './useAuthStore'

// Nombre de jours depuis une date YYYY-MM-DD (0 si null)
function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0
  const today = new Date().toISOString().slice(0, 10)
  return Math.floor(
    (new Date(today).getTime() - new Date(dateStr).getTime()) / 86400000,
  )
}

function computeGrade(profile: UserProfile): UserGrade {
  const { streak, last_abandoned_project_date, engagement_level } = profile

  if (streak >= 30) {
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const lastAbandoned = last_abandoned_project_date
      ? new Date(last_abandoned_project_date)
      : null
    if (!lastAbandoned || lastAbandoned < ninetyDaysAgo) {
      return 'master_builder'
    }
  }

  if (streak >= 14) return 'builder_diligent'
  if (engagement_level >= 2) return 'planner'
  return 'discoverer'
}

interface UserStore {
  profile: UserProfile | null
  load: () => Promise<void>
  updateProfile: (data: Partial<Omit<UserProfile, 'id' | 'created_at'>>) => Promise<void>
  recalculateStats: () => Promise<void>
  checkAndUpdateGrade: () => Promise<void>
  recordActivity: () => Promise<void>
  upgradeEngagementLevel: (level: 2 | 3) => Promise<void>
}

function pushProfile(profile: UserProfile): void {
  const userId = useAuthStore.getState().user?.id
  if (userId) void pushToSupabase('user_profile', profile as unknown as Record<string, unknown>, userId)
}

export const useUserStore = create<UserStore>((set, get) => ({
  profile: null,

  load: async () => {
    try {
      const profile = await db.user_profile.get('singleton')
      if (!profile) { set({ profile: null }); return }

      // Rétrogradation silencieuse : 3j d'inactivité → recule d'un niveau (jamais de message négatif)
      const days = daysSince(profile.last_active_date)
      if (days >= 3 && profile.engagement_level > 1) {
        const now = new Date().toISOString()
        const downgraded: UserProfile = {
          ...profile,
          engagement_level: profile.engagement_level - 1,
          updated_at: now,
        }
        await db.user_profile.put(downgraded)
        set({ profile: downgraded })
        pushProfile(downgraded)
      } else {
        set({ profile })
      }
    } catch (error) {
      console.error('useUserStore.load', error)
    }
  },

  updateProfile: async (data) => {
    try {
      const current = get().profile
      if (!current) return
      const now = new Date().toISOString()
      const updated: UserProfile = { ...current, ...data, updated_at: now }
      await db.user_profile.put(updated)
      set({ profile: updated })
      pushProfile(updated)
    } catch (error) {
      console.error('useUserStore.updateProfile', error)
    }
  },

  recalculateStats: async () => {
    try {
      const current = get().profile
      if (!current) return
      const stats = await computeUserStats()
      const now = new Date().toISOString()
      const updated: UserProfile = { ...current, ...stats, updated_at: now }
      await db.user_profile.put(updated)
      set({ profile: updated })
      pushProfile(updated)
    } catch (error) {
      console.error('useUserStore.recalculateStats', error)
    }
  },

  checkAndUpdateGrade: async () => {
    try {
      const current = get().profile
      if (!current) return
      const grade = computeGrade(current)
      if (grade === current.grade) return
      const now = new Date().toISOString()
      const updated: UserProfile = { ...current, grade, updated_at: now }
      await db.user_profile.put(updated)
      set({ profile: updated })
      pushProfile(updated)
    } catch (error) {
      console.error('useUserStore.checkAndUpdateGrade', error)
    }
  },

  // Montée de niveau d'engagement — toujours à l'initiative de l'utilisateur, jamais imposée
  upgradeEngagementLevel: async (level) => {
    try {
      const current = get().profile
      if (!current) return
      if (level <= current.engagement_level) return
      const now = new Date().toISOString()
      const updated: UserProfile = { ...current, engagement_level: level, updated_at: now }
      await db.user_profile.put(updated)
      set({ profile: updated })
      pushProfile(updated)
    } catch (error) {
      console.error('useUserStore.upgradeEngagementLevel', error)
    }
  },

  // Appelé à chaque action comptant dans le streak
  recordActivity: async () => {
    try {
      const current = get().profile
      if (!current) return

      const today = new Date().toISOString().slice(0, 10)
      const { streak, consecutive_inactive_days } = computeStreakUpdate(
        current.last_active_date,
        today,
        current.streak,
      )
      const streak_best = Math.max(streak, current.streak_best)
      const now = new Date().toISOString()

      const updated: UserProfile = {
        ...current,
        streak,
        streak_best,
        consecutive_inactive_days,
        last_active_date: today,
        updated_at: now,
      }
      await db.user_profile.put(updated)
      set({ profile: updated })
      pushProfile(updated)

      await get().checkAndUpdateGrade()
    } catch (error) {
      console.error('useUserStore.recordActivity', error)
    }
  },
}))
