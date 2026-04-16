// DestinyPlanner — Store domaines de vie

import { create } from 'zustand'
import { db } from '../db/schema'
import type { Domain, DomainWithHealth, Project, PersonalBusinessLink } from '../types'
import { computeAllDomainsHealth } from '../services/domainHealth'
import { pushToSupabase, deleteFromSupabase } from '../services/personalSyncService'
import { useAuthStore } from './useAuthStore'

interface DomainStore {
  domains: Domain[]
  domainsWithHealth: DomainWithHealth[]
  load: () => Promise<void>
  addDomain: (data: Omit<Domain, 'id' | 'created_at' | 'is_default'>) => Promise<void>
  updateDomain: (id: string, data: Partial<Omit<Domain, 'id' | 'created_at'>>) => Promise<void>
  deleteDomain: (id: string) => Promise<void>
  refreshHealth: (projects: Project[], businessLinks?: PersonalBusinessLink[]) => void
}

export const useDomainStore = create<DomainStore>((set, get) => ({
  domains: [],
  domainsWithHealth: [],

  load: async () => {
    try {
      const domains = await db.domain.orderBy('sort_order').toArray()
      set({ domains, domainsWithHealth: computeAllDomainsHealth(domains, []) })
    } catch (error) {
      console.error('useDomainStore.load', error)
    }
  },

  addDomain: async (data) => {
    try {
      const now = new Date().toISOString()
      const domain: Domain = {
        id: crypto.randomUUID(),
        ...data,
        is_default: false,
        created_at: now,
      }
      await db.domain.add(domain)
      const domains = [...get().domains, domain].sort((a, b) => a.sort_order - b.sort_order)
      set({ domains })
      const userId = useAuthStore.getState().user?.id
      if (userId) {
        void pushToSupabase('domain', domain as unknown as Record<string, unknown>, userId)
      }
    } catch (error) {
      console.error('useDomainStore.addDomain', error)
    }
  },

  updateDomain: async (id, data) => {
    try {
      await db.domain.update(id, data)
      const domains = get().domains.map((d) => (d.id === id ? { ...d, ...data } : d))
      set({ domains })
      const userId = useAuthStore.getState().user?.id
      if (userId) {
        const updated = domains.find((d) => d.id === id)
        if (updated) void pushToSupabase('domain', updated as unknown as Record<string, unknown>, userId)
      }
    } catch (error) {
      console.error('useDomainStore.updateDomain', error)
    }
  },

  deleteDomain: async (id) => {
    try {
      const toDelete = get().domains.find((d) => d.id === id)
      await db.domain.delete(id)
      const domains = get().domains.filter((d) => d.id !== id)
      set({ domains })
      const userId = useAuthStore.getState().user?.id
      if (userId && toDelete) {
        void deleteFromSupabase('domain', toDelete as unknown as Record<string, unknown>, userId)
      }
    } catch (error) {
      console.error('useDomainStore.deleteDomain', error)
    }
  },

  refreshHealth: (projects, businessLinks = []) => {
    const { domains } = get()
    set({ domainsWithHealth: computeAllDomainsHealth(domains, projects, businessLinks) })
  },
}))
