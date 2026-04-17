// DestinyPlanner — Parse et exécute les actions retournées par l'assistant IA
// Interdit d'importer ou appeler quoi que ce soit lié aux projets

import type { AIAction, AIActionResult } from '@/types'
import { useMilestoneStore } from '@/stores/useMilestoneStore'
import { useActionStore } from '@/stores/useActionStore'
import { useTimeBlockStore } from '@/stores/useTimeBlockStore'
import { useDomainStore } from '@/stores/useDomainStore'
import { useDetourStore } from '@/stores/useDetourStore'
import { useHabitStore } from '@/stores/useHabitStore'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && isFinite(v) ? v : fallback
}

export async function executeAIAction(action: AIAction): Promise<AIActionResult> {
  const p = action.params

  try {
    switch (action.type) {
      case 'add_milestone': {
        const projectId = str(p.project_id)
        const title = str(p.title)
        if (!projectId || !title) {
          return { type: 'add_milestone', success: false, label: 'Données manquantes pour le jalon' }
        }
        const milestone = await useMilestoneStore.getState().addMilestone({
          project_id: projectId,
          title,
          description: str(p.description),
          due_date: str(p.due_date) || null,
          status: 'planned',
          sort_order: Date.now(),
        })
        return { type: 'add_milestone', success: true, label: `Jalon "${milestone.title}" ajouté` }
      }

      case 'add_action': {
        const milestoneId = str(p.milestone_id)
        const title = str(p.title)
        if (!milestoneId || !title) {
          return { type: 'add_action', success: false, label: "Données manquantes pour l'action" }
        }
        const action_ = await useActionStore.getState().addAction({
          milestone_id: milestoneId,
          title,
          date: str(p.date) || today(),
          estimated_minutes: typeof p.estimated_minutes === 'number' ? p.estimated_minutes : null,
        })
        return { type: 'add_action', success: true, label: `Action "${action_.title}" ajoutée` }
      }

      case 'add_time_block': {
        const validCategories = ['work', 'rest', 'spiritual', 'family', 'health', 'free'] as const
        type Cat = typeof validCategories[number]
        const rawCat = str(p.category)
        const category: Cat | null = (validCategories as readonly string[]).includes(rawCat)
          ? (rawCat as Cat)
          : null
        const block = await useTimeBlockStore.getState().addBlock({
          date: str(p.date) || today(),
          start_time: str(p.start_time, '09:00'),
          end_time: str(p.end_time, '10:00'),
          title: str(p.title, 'Bloc'),
          action_id: null,
          category,
          color_override: null,
          notes: '',
        })
        if (!block) {
          return { type: 'add_time_block', success: false, label: 'Conflit horaire — bloc non créé' }
        }
        return { type: 'add_time_block', success: true, label: `Bloc "${block.title}" ajouté (${block.start_time}–${block.end_time})` }
      }

      case 'add_domain': {
        const name = str(p.name)
        if (!name) {
          return { type: 'add_domain', success: false, label: 'Nom du domaine manquant' }
        }
        await useDomainStore.getState().addDomain({
          name,
          icon: str(p.icon, '🌱'),
          goal_statement: str(p.goal_statement),
          sort_order: num(p.sort_order, Date.now()),
        })
        return { type: 'add_domain', success: true, label: `Domaine "${name}" ajouté` }
      }

      case 'add_detour': {
        const obstacle = str(p.obstacle)
        if (!obstacle) {
          return { type: 'add_detour', success: false, label: "Description de l'obstacle manquante" }
        }
        await useDetourStore.getState().addDetour({
          project_id: str(p.project_id) || null,
          date: str(p.date) || today(),
          obstacle,
          impact: str(p.impact),
          adjustment: str(p.adjustment),
          linked_habit_id: null,
        })
        return { type: 'add_detour', success: true, label: `Détour "${obstacle.slice(0, 40)}" enregistré` }
      }

      case 'add_habit': {
        const name = str(p.name)
        if (!name) {
          return { type: 'add_habit', success: false, label: "Nom de l'habitude manquant" }
        }
        const validFreqs = ['daily', 'weekdays', 'custom'] as const
        type Freq = typeof validFreqs[number]
        const rawFreq = str(p.frequency)
        const frequency: Freq = (validFreqs as readonly string[]).includes(rawFreq)
          ? (rawFreq as Freq)
          : 'daily'
        await useHabitStore.getState().addHabit({
          name,
          weight: num(p.weight, 10),
          frequency,
          sort_order: num(p.sort_order, Date.now()),
        })
        return { type: 'add_habit', success: true, label: `Habitude "${name}" ajoutée` }
      }

      default:
        return { type: 'none', success: true, label: '' }
    }
  } catch (err) {
    console.error('aiActionParser.executeAIAction', err)
    return { type: action.type, success: false, label: "Erreur lors de l'exécution" }
  }
}
