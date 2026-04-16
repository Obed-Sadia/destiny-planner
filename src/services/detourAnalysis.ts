// DestinyPlanner — Analyse des détours
// Détection systémique (même obstacle ≥ 3 projets) et suggestion d'habitude corrective
// v2.1 : détection cross-espace (perso + business via personal_business_link)

import { db } from '../db/schema'
import { supabase } from '../lib/supabase'
import type { Habit } from '../types'

// ─── Types ────────────────────────────────────────────────────

export interface SystemicPattern {
  keyword: string        // Motif d'obstacle normalisé (20 premiers chars)
  count: number          // Nombre de projets distincts affectés
  projectIds: string[]
  detourIds: string[]
}

export interface HabitSuggestion {
  existingHabit: Habit | null     // Habitude existante qui correspond, ou null
  suggestedName: string           // Nom suggéré pour une nouvelle habitude
  rationale: string               // Explication affichée à l'utilisateur
}

// ─── Détection systémique ─────────────────────────────────────

// Retourne tous les patterns d'obstacles qui touchent ≥ 3 projets différents
export async function findSystemicPatterns(): Promise<SystemicPattern[]> {
  try {
    const detours = await db.detour.toArray()

    const groups = new Map<
      string,
      { projectIds: Set<string>; detourIds: string[] }
    >()

    for (const detour of detours) {
      const key = detour.obstacle.toLowerCase().trim().slice(0, 20)
      if (!key) continue

      if (!groups.has(key)) {
        groups.set(key, { projectIds: new Set(), detourIds: [] })
      }
      const group = groups.get(key)!
      if (detour.project_id) group.projectIds.add(detour.project_id)
      group.detourIds.push(detour.id)
    }

    const patterns: SystemicPattern[] = []
    for (const [keyword, { projectIds, detourIds }] of groups) {
      if (projectIds.size >= 3) {
        patterns.push({
          keyword,
          count: projectIds.size,
          projectIds: Array.from(projectIds),
          detourIds,
        })
      }
    }

    return patterns.sort((a, b) => b.count - a.count)
  } catch (error) {
    console.error('detourAnalysis.findSystemicPatterns', error)
    return []
  }
}

// Vérifie si un obstacle spécifique est systémique (en excluant un détour existant)
export async function isObstacleSystemic(
  obstacle: string,
  excludeDetourId?: string,
): Promise<boolean> {
  try {
    const allDetours = await db.detour.toArray()
    const keyword = obstacle.toLowerCase().trim().slice(0, 20)

    const relevant = allDetours.filter((d) => {
      if (excludeDetourId && d.id === excludeDetourId) return false
      return d.obstacle.toLowerCase().trim().slice(0, 20) === keyword
    })

    const uniqueProjects = new Set(
      relevant.map((d) => d.project_id).filter((id): id is string => Boolean(id)),
    )

    return uniqueProjects.size >= 2 // 2 existants + le nouveau = 3 au total
  } catch (error) {
    console.error('detourAnalysis.isObstacleSystemic', error)
    return false
  }
}

// ─── Détection systémique cross-espace ───────────────────────
// Condition : personal_business_link existe ET même obstacle ≥ 3 projets distincts
// (toutes sources confondues : détours perso Dexie + détours business Supabase)

export interface CrossSpaceSystemicPattern {
  keyword: string
  count: number         // Nombre total de projets distincts (perso + business)
  projectIds: string[]  // Tous les project_ids concernés
  detourIds: string[]
  hasBusiness: boolean  // Au moins un projet business impliqué
  hasPersonal: boolean  // Au moins un projet perso impliqué
}

export async function findCrossSpaceSystemicPatterns(): Promise<CrossSpaceSystemicPattern[]> {
  try {
    // 1. Vérifier qu'il existe au moins un lien perso-business
    const links = await db.personal_business_link.toArray()
    if (links.length === 0) return []

    // 2. Charger les détours perso depuis IndexedDB
    const personalDetours = await db.detour.toArray()

    // 3. Charger les détours business Supabase pour les projets liés
    const linkedBizIds = links.map((l) => l.business_project_id)
    const { data: bizDetours, error } = await supabase
      .from('business_detours')
      .select('id, project_id, obstacle')
      .in('project_id', linkedBizIds)

    if (error) return []

    // 4. Grouper par mot-clé (20 premiers chars normalisés)
    type GroupEntry = {
      personalProjectIds: Set<string>
      businessProjectIds: Set<string>
      detourIds: string[]
    }
    const groups = new Map<string, GroupEntry>()

    for (const d of personalDetours) {
      const key = d.obstacle.toLowerCase().trim().slice(0, 20)
      if (!key) continue
      if (!groups.has(key)) {
        groups.set(key, { personalProjectIds: new Set(), businessProjectIds: new Set(), detourIds: [] })
      }
      const g = groups.get(key)!
      if (d.project_id) g.personalProjectIds.add(d.project_id)
      g.detourIds.push(d.id)
    }

    for (const d of (bizDetours ?? [])) {
      const key = d.obstacle.toLowerCase().trim().slice(0, 20)
      if (!key) continue
      if (!groups.has(key)) {
        groups.set(key, { personalProjectIds: new Set(), businessProjectIds: new Set(), detourIds: [] })
      }
      const g = groups.get(key)!
      g.businessProjectIds.add(d.project_id)
      g.detourIds.push(d.id)
    }

    // 5. Retenir les patterns avec ≥ 3 projets distincts (toutes sources)
    const patterns: CrossSpaceSystemicPattern[] = []
    for (const [keyword, { personalProjectIds, businessProjectIds, detourIds }] of groups) {
      const totalCount = personalProjectIds.size + businessProjectIds.size
      if (totalCount >= 3) {
        patterns.push({
          keyword,
          count: totalCount,
          projectIds: [
            ...Array.from(personalProjectIds),
            ...Array.from(businessProjectIds),
          ],
          detourIds,
          hasPersonal: personalProjectIds.size > 0,
          hasBusiness: businessProjectIds.size > 0,
        })
      }
    }

    return patterns.sort((a, b) => b.count - a.count)
  } catch (error) {
    console.error('detourAnalysis.findCrossSpaceSystemicPatterns', error)
    return []
  }
}

// ─── Suggestion d'habitude corrective ────────────────────────

// Catégories d'obstacles avec mots-clés associés
const OBSTACLE_KEYWORDS: Array<{
  keywords: string[]
  suggestedName: string
  rationale: string
}> = [
  {
    keywords: ['procrastination', 'repoussé', 'remettre', 'plus tard', 'délai'],
    suggestedName: 'Discipline quotidienne',
    rationale: "Cet obstacle révèle un besoin de discipline. Une habitude de travail structuré peut vous aider à avancer chaque jour.",
  },
  {
    keywords: ['distraction', 'concentration', 'focus', 'interrompu', 'attention'],
    suggestedName: 'Plages de concentration',
    rationale: "Les distractions répétées indiquent un besoin de protéger des plages de travail en profondeur.",
  },
  {
    keywords: ['fatigue', 'épuisement', 'énergie', 'burnout', 'surmenage'],
    suggestedName: 'Récupération active',
    rationale: "La fatigue systémique nécessite une habitude de récupération — sommeil, sport léger ou méditation.",
  },
  {
    keywords: ['organisation', 'planification', 'oublié', 'priorité', 'agenda'],
    suggestedName: 'Revue hebdomadaire',
    rationale: "Un manque d'organisation récurrent se corrige avec une revue hebdomadaire régulière.",
  },
  {
    keywords: ['peur', 'doute', 'confiance', 'blocage', 'hésitation'],
    suggestedName: 'Ancrage spirituel',
    rationale: "Les blocages intérieurs se surmontent souvent par une pratique spirituelle ou de méditation quotidienne.",
  },
  {
    keywords: ['communication', 'relation', 'conflit', 'incompréhension'],
    suggestedName: 'Conversations intentionnelles',
    rationale: "Les obstacles relationnels nécessitent une habitude de communication proactive et régulière.",
  },
  {
    keywords: ['ressource', 'finances', 'argent', 'budget', 'manque'],
    suggestedName: 'Suivi financier',
    rationale: "Les contraintes de ressources récurrentes méritent une habitude de suivi et de planification financière.",
  },
]

// Retourne une suggestion d'habitude corrective pour un obstacle donné
export function suggestHabitForObstacle(
  obstacle: string,
  habits: Habit[],
): HabitSuggestion {
  const obs = obstacle.toLowerCase()

  // Trouver la catégorie qui correspond le mieux
  let bestMatch: (typeof OBSTACLE_KEYWORDS)[number] | null = null
  let bestScore = 0

  for (const category of OBSTACLE_KEYWORDS) {
    const score = category.keywords.filter((k) => obs.includes(k)).length
    if (score > bestScore) {
      bestScore = score
      bestMatch = category
    }
  }

  // Par défaut si aucune correspondance
  const suggestedName = bestMatch?.suggestedName ?? 'Habitude corrective'
  const rationale =
    bestMatch?.rationale ??
    "Cet obstacle revient régulièrement. Créer une habitude ciblée peut vous aider à le prévenir."

  // Chercher une habitude existante active dont le nom correspond
  const activeHabits = habits.filter((h) => h.active)
  const existingHabit =
    activeHabits.find((h) =>
      h.name.toLowerCase().includes(suggestedName.toLowerCase().split(' ')[0]),
    ) ?? null

  return { existingHabit, suggestedName, rationale }
}
