// DestinyPlanner — Store lien perso-business (Session 30)
// Stocké uniquement en local (IndexedDB) — jamais synchronisé vers Supabase

import { create } from 'zustand'
import { db } from '../db/schema'
import type { PersonalBusinessLink } from '../types'

interface PersonalBusinessLinkState {
  links: PersonalBusinessLink[]
  load: () => Promise<void>
  addLink: (data: Omit<PersonalBusinessLink, 'id' | 'created_at' | 'last_sync_at'>) => Promise<void>
  removeLink: (id: string) => Promise<void>
  updateLinkStatus: (id: string, status: PersonalBusinessLink['business_project_status']) => Promise<void>
}

export const usePersonalBusinessLinkStore = create<PersonalBusinessLinkState>((set, get) => ({
  links: [],

  load: async (): Promise<void> => {
    try {
      const links = await db.personal_business_link.toArray()
      set({ links })
    } catch (error) {
      console.error('usePersonalBusinessLinkStore.load', error)
    }
  },

  addLink: async (data): Promise<void> => {
    try {
      const now = new Date().toISOString()
      const link: PersonalBusinessLink = {
        id: crypto.randomUUID(),
        ...data,
        created_at: now,
        last_sync_at: now,
      }
      await db.personal_business_link.add(link)
      set({ links: [...get().links, link] })
    } catch (error) {
      console.error('usePersonalBusinessLinkStore.addLink', error)
    }
  },

  removeLink: async (id): Promise<void> => {
    try {
      await db.personal_business_link.delete(id)
      set({ links: get().links.filter((l) => l.id !== id) })
    } catch (error) {
      console.error('usePersonalBusinessLinkStore.removeLink', error)
    }
  },

  updateLinkStatus: async (id, status): Promise<void> => {
    try {
      const now = new Date().toISOString()
      await db.personal_business_link.update(id, { business_project_status: status, last_sync_at: now })
      set({
        links: get().links.map((l) =>
          l.id === id ? { ...l, business_project_status: status, last_sync_at: now } : l,
        ),
      })
    } catch (error) {
      console.error('usePersonalBusinessLinkStore.updateLinkStatus', error)
    }
  },
}))
