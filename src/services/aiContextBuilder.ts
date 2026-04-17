// DestinyPlanner — Construit un snapshot textuel des données utilisateur
// Injecté dans le system prompt de l'assistant IA

import { db } from '@/db/schema'

export async function buildUserContext(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10)

  const [goal, profile, domains, allProjects, allMilestones, blocks, rawDetours, rawHabits] =
    await Promise.all([
      db.goal.get('singleton'),
      db.user_profile.get('singleton'),
      db.domain.orderBy('sort_order').toArray(),
      db.project.where('status').equals('active').toArray(),
      db.milestone.where('status').anyOf(['planned', 'in_progress']).toArray(),
      db.time_block.where('date').equals(today).sortBy('start_time'),
      db.detour.toArray(),
      db.habit.orderBy('sort_order').toArray(),
    ])

  const detours = rawDetours.filter((d) => !d.resolved)
  const habits = rawHabits.filter((h) => h.active)

  const lines: string[] = [`=== Contexte DestinyPlanner — ${today} ===`, '']

  if (profile) {
    lines.push(`PROFIL: ${profile.first_name} | streak ${profile.streak}j | grade ${profile.grade}`)
    if (profile.score_average_30d != null) {
      lines.push(`Score moyen 30j: ${profile.score_average_30d}/100`)
    }
    lines.push('')
  }

  if (goal?.mission) {
    lines.push(`BUT: ${goal.mission}`)
    if (goal.vision_10_years) lines.push(`Vision 10 ans: ${goal.vision_10_years}`)
    lines.push('')
  }

  if (domains.length > 0) {
    lines.push(`DOMAINES (${domains.length}): ${domains.map((d) => `${d.icon} ${d.name}`).join(' | ')}`)
    lines.push('')
  }

  if (allProjects.length > 0) {
    lines.push(`PROJETS ACTIFS (${allProjects.length}):`)
    for (const p of allProjects) {
      const domain = domains.find((d) => d.id === p.domain_id)
      lines.push(`- ID:${p.id} | "${p.title}" [${domain?.name ?? '?'}] | ${p.progress}% avancé`)
      const pMilestones = allMilestones.filter((m) => m.project_id === p.id)
      if (pMilestones.length > 0) {
        for (const m of pMilestones) {
          lines.push(`    jalon ID:${m.id} | "${m.title}" | ${m.status}${m.due_date ? ` | échéance ${m.due_date}` : ''}`)
        }
      }
    }
    lines.push('')
  } else {
    lines.push('PROJETS ACTIFS: aucun')
    lines.push('')
  }

  if (blocks.length > 0) {
    lines.push(`EMPLOI DU TEMPS AUJOURD'HUI:`)
    for (const b of blocks) {
      lines.push(`- ${b.start_time}–${b.end_time}: "${b.title}" [${b.category ?? 'libre'}]${b.done ? ' ✓' : ''}`)
    }
    lines.push('')
  } else {
    lines.push(`EMPLOI DU JOUR: aucun bloc horaire`)
    lines.push('')
  }

  if (detours.length > 0) {
    lines.push(`DÉTOURS NON RÉSOLUS: ${detours.length}`)
  }

  if (habits.length > 0) {
    lines.push(`HABITUDES ACTIVES: ${habits.map((h) => h.name).join(', ')}`)
  }

  return lines.join('\n')
}
