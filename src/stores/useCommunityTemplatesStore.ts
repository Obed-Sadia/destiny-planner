// DestinyPlanner — Store templates communautaires (S36)
// Lecture publique, publication par owner, jamais synchronisé vers l'espace perso.

import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useBusinessStore } from './useBusinessStore'
import type { CommunityTemplate, CommunityTemplateType } from '../lib/supabase.types'
import type { StepData } from '../types'

const PAGE_SIZE = 12

interface CommunityTemplatesState {
  templates: CommunityTemplate[]
  loading: boolean
  error: string | null
  hasMore: boolean
  page: number

  loadTemplates: (filter?: CommunityTemplateType | null, reset?: boolean) => Promise<void>
  loadMore: (filter?: CommunityTemplateType | null) => Promise<void>
  publishTemplate: (projectId: string) => Promise<void>
  useTemplate: (template: CommunityTemplate) => Promise<string>
  reset: () => void
}

export const useCommunityTemplatesStore = create<CommunityTemplatesState>((set, get) => ({
  templates: [],
  loading: false,
  error: null,
  hasMore: true,
  page: 0,

  loadTemplates: async (filter = null, reset = true) => {
    set({ loading: true, error: null })
    const page = reset ? 0 : get().page

    try {
      let query = supabase
        .from('community_templates')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

      if (filter) query = query.eq('template_type', filter)

      const { data, error } = await query
      if (error) throw error

      set({
        templates: reset ? (data ?? []) : [...get().templates, ...(data ?? [])],
        page: page + 1,
        hasMore: (data ?? []).length === PAGE_SIZE,
        loading: false,
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Erreur de chargement', loading: false })
    }
  },

  loadMore: async (filter = null) => {
    if (!get().hasMore || get().loading) return
    await get().loadTemplates(filter, false)
  },

  publishTemplate: async (projectId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    // Charger les données des 7 étapes du projet
    const { data: steps, error: stepsErr } = await supabase
      .from('business_project_steps')
      .select('step_number, data')
      .eq('project_id', projectId)
      .order('step_number', { ascending: true })

    if (stepsErr || !steps) throw stepsErr ?? new Error('Étapes introuvables')

    // Charger les métadonnées du projet
    const { data: project, error: projErr } = await supabase
      .from('business_projects')
      .select('title, description, template_id')
      .eq('id', projectId)
      .single()

    if (projErr || !project) throw projErr ?? new Error('Projet introuvable')

    const templateType = (project.template_id ?? 'product-launch') as CommunityTemplateType

    // Copie immutable des données des 7 étapes
    const stepsData: Record<string, unknown> = {}
    for (const s of steps) {
      stepsData[String(s.step_number)] = s.data
    }

    const { error } = await supabase
      .from('community_templates')
      .insert({
        author_id: user.id,
        title: project.title,
        description: project.description,
        template_type: templateType,
        steps_data: stepsData,
      })

    if (error) throw error
  },

  useTemplate: async (template: CommunityTemplate): Promise<string> => {
    // Convertit les données du template en PrefilledSteps et crée un projet business
    const prefilledSteps: Partial<Record<number, Partial<StepData>>> = {}
    for (const [key, value] of Object.entries(template.steps_data)) {
      const n = parseInt(key, 10)
      if (!isNaN(n)) prefilledSteps[n] = value as Partial<StepData>
    }

    const project = await useBusinessStore.getState().createProject(
      template.title,
      template.description,
      template.template_type,
      prefilledSteps,
    )

    // Incrémenter le compteur d'utilisations
    await supabase
      .from('community_templates')
      .update({ uses_count: template.uses_count + 1 })
      .eq('id', template.id)

    return project.id
  },

  reset: () => set({ templates: [], loading: false, error: null, hasMore: true, page: 0 }),
}))
