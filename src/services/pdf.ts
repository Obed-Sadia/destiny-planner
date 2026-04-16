// DestinyPlanner — Export PDF via window.print()
// Génère une fenêtre formatée pour impression (vue projet + journal)

import type { Project, ProjectStep, Milestone, JournalEntry } from '../types'

const STEP_NAMES: Record<number, string> = {
  1: 'Vision',
  2: "S'arrêter",
  3: 'Estimer',
  4: 'Coût',
  5: 'Calculer',
  6: 'Vérifier',
  7: "S'engager",
}

const PRINT_STYLES = `
  * { box-sizing: border-box; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    color: #1a1a1a;
    line-height: 1.65;
    max-width: 740px;
    margin: 0 auto;
    padding: 2.5rem 2rem;
  }
  h1 { font-size: 1.75rem; margin: 0 0 0.25rem; }
  h2 {
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #666;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 0.4rem;
    margin: 1.75rem 0 0.75rem;
  }
  .meta { color: #888; font-size: 0.875rem; margin-bottom: 1.5rem; }
  .badge {
    display: inline-block;
    background: #f4f4f4;
    border-radius: 4px;
    padding: 0.15rem 0.5rem;
    font-size: 0.8rem;
    margin-right: 0.4rem;
    font-family: sans-serif;
  }
  .step {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.3rem 0;
    font-family: sans-serif;
    font-size: 0.9rem;
  }
  .step-done { color: #4a8f60; }
  .step-pending { color: #bbb; }
  .milestone {
    display: flex;
    justify-content: space-between;
    padding: 0.45rem 0;
    border-bottom: 1px solid #f2f2f2;
    font-family: sans-serif;
    font-size: 0.9rem;
  }
  .milestone-done { color: #4a8f60; }
  .score {
    font-size: 2.5rem;
    font-weight: bold;
    color: #b8892e;
    font-family: sans-serif;
  }
  .score span { font-size: 1rem; color: #aaa; }
  p { margin: 0.4rem 0 0.8rem; }
  .footer { margin-top: 2.5rem; color: #bbb; font-size: 0.8rem; font-family: sans-serif; }
  @media print {
    body { padding: 0; }
    h2 { page-break-after: avoid; }
  }
`

function openPrintWindow(title: string, bodyHtml: string): void {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return

  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`)

  win.document.close()
  win.focus()
  win.print()
}

// ─── Export projet ────────────────────────────────────────────

export function printProject(
  project: Project,
  steps: ProjectStep[],
  milestones: Milestone[],
): void {
  const completedSteps = steps.filter((s) => s.status === 'completed').length
  const created = new Date(project.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const stepsHtml = steps
    .slice()
    .sort((a, b) => a.step_number - b.step_number)
    .map((s) => {
      const name = STEP_NAMES[s.step_number] ?? `Étape ${s.step_number}`
      const done = s.status === 'completed'
      return `<div class="step ${done ? 'step-done' : 'step-pending'}">
        ${done ? '✓' : '○'} <strong>Étape ${s.step_number}</strong> — ${name}
      </div>`
    })
    .join('')

  const milestonesHtml = milestones.length === 0
    ? '<p style="color:#aaa;font-family:sans-serif;font-size:0.9rem">Aucun jalon.</p>'
    : milestones
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((m) => {
          const due = m.due_date
            ? new Date(m.due_date).toLocaleDateString('fr-FR')
            : '—'
          const done = m.status === 'completed'
          return `<div class="milestone ${done ? 'milestone-done' : ''}">
            <span>${done ? '✓' : '○'} ${m.title}</span>
            <span>${due}</span>
          </div>`
        })
        .join('')

  const body = `
    <h1>${project.title}</h1>
    <div class="meta">
      Créé le ${created}
      &nbsp;·&nbsp;
      <span class="badge">${completedSteps}/7 étapes</span>
      <span class="badge">${project.progress}% accompli</span>
    </div>
    <h2>Les 7 étapes</h2>
    ${stepsHtml}
    <h2>Jalons</h2>
    ${milestonesHtml}
    <div class="footer">DestinyPlanner · Exporté le ${new Date().toLocaleDateString('fr-FR')}</div>
  `

  openPrintWindow(`Projet — ${project.title}`, body)
}

// ─── Export journal ───────────────────────────────────────────

export function printJournalEntry(entry: JournalEntry): void {
  const date = new Date(entry.id).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const scoreHtml = entry.score_cache !== null
    ? `<h2>Score du jour</h2>
       <div class="score">${entry.score_cache}<span>/100</span></div>`
    : ''

  const section = (label: string, content: string | null): string => {
    if (!content?.trim()) return ''
    return `<h2>${label}</h2><p>${content}</p>`
  }

  const body = `
    <h1>Journal du ${date}</h1>
    <div class="meta">Entrée personnelle — DestinyPlanner</div>
    ${section('Déclaration du matin', entry.declaration)}
    ${section('Action de destinée', entry.main_action)}
    ${section('Bilan du soir', entry.evening_review)}
    ${section('Leçons apprises', entry.lessons)}
    ${scoreHtml}
    <div class="footer">DestinyPlanner · Exporté le ${new Date().toLocaleDateString('fr-FR')}</div>
  `

  openPrintWindow(`Journal — ${date}`, body)
}
