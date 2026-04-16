// DestinyPlanner — Store détours business (v2.1)
// CRUD Supabase sur business_detours — visible par tous les membres

import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { BusinessDetour } from '../lib/supabase.types'

// ─── Détection systémique business ───────────────────────────
// Même obstacle (20 premiers chars) sur ≥ 3 projets business distincts

async function checkIsSystemicBusiness(
  obstacle: string,
  excludeId?: string,
): Promise<boolean> {
  try {
    const keyword = obstacle.toLowerCase().trim().slice(0, 20)

    const { data, error } = await supabase
      .from('business_detours')
      .select('id, project_id, obstacle')

    if (error || !data) return false

    const relevant = data.filter((d) => {
      if (excludeId && d.id === excludeId) return false
      return d.obstacle.toLowerCase().trim().slice(0, 20) === keyword
    })

    const uniqueProjects = new Set(
      relevant.map((d) => d.project_id).filter(Boolean),
    )

    return uniqueProjects.size >= 2 // 2 existants + le nouveau = 3 au total
  } catch {
    return false
  }
}

// ─── Types ────────────────────────────────────────────────────

interface BusinessDetourInsert {
  project_id: string
  date: string
  obstacle: string
  impact: string
  adjustment: string
}

interface BusinessDetourStore {
  detours: BusinessDetour[]
  loading: boolean
  error: string | null

  load: (projectId: string) => Promise<void>
  add: (data: BusinessDetourInsert) => Promise<BusinessDetour>
  resolve: (id: string, resolvedBy: string) => Promise<void>
  reopen: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

// ─── Store ────────────────────────────────────────────────────

export const useBusinessDetourStore = create<BusinessDetourStore>((set) => ({
  detours: [],
  loading: false,
  error: null,

  load: async (projectId: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('business_detours')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error

      set((state) => ({
        detours: [
          ...state.detours.filter((d) => d.project_id !== projectId),
          ...(data ?? []),
        ],
        loading: false,
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement'
      set({ error: msg, loading: false })
    }
  },

  add: async (data: BusinessDetourInsert) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const is_systemic = await checkIsSystemicBusiness(data.obstacle)

    const { data: inserted, error } = await supabase
      .from('business_detours')
      .insert({
        project_id: data.project_id,
        reported_by: user.id,
        date: data.date,
        obstacle: data.obstacle,
        impact: data.impact,
        adjustment: data.adjustment,
        resolved: false,
        is_systemic,
      })
      .select()
      .single()

    if (error) throw error

    set((state) => ({ detours: [inserted, ...state.detours] }))
    return inserted
  },

  resolve: async (id: string, resolvedBy: string) => {
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('business_detours')
      .update({ resolved: true, resolved_at: now, resolved_by: resolvedBy })
      .eq('id', id)

    if (error) throw error

    set((state) => ({
      detours: state.detours.map((d) =>
        d.id === id
          ? { ...d, resolved: true, resolved_at: now, resolved_by: resolvedBy }
          : d,
      ),
    }))
  },

  reopen: async (id: string) => {
    const { error } = await supabase
      .from('business_detours')
      .update({ resolved: false, resolved_at: null, resolved_by: null })
      .eq('id', id)

    if (error) throw error

    set((state) => ({
      detours: state.detours.map((d) =>
        d.id === id
          ? { ...d, resolved: false, resolved_at: null, resolved_by: null }
          : d,
      ),
    }))
  },

  remove: async (id: string) => {
    const { error } = await supabase
      .from('business_detours')
      .delete()
      .eq('id', id)

    if (error) throw error

    set((state) => ({ detours: state.detours.filter((d) => d.id !== id) }))
  },
}))
