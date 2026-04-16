// DestinyPlanner — Vue Gantt des jalons (Session 31)
// Affiche les jalons avec due_date sur une timeline horizontale via Recharts

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Milestone, MilestoneStatus } from '../../types'

// ─── Couleurs par statut ──────────────────────────────────────

const STATUS_COLOR: Record<MilestoneStatus, string> = {
  planned:   '#C49A3C',   // gold
  in_progress: '#2DA58A', // teal
  completed: '#5A9E6F',   // green
  blocked:   '#D4854A',   // orange
  postponed: '#7B6FD4',   // purple
}

const STATUS_LABEL: Record<MilestoneStatus, string> = {
  planned:    'Planifié',
  in_progress: 'En cours',
  completed:  'Terminé',
  blocked:    'Bloqué',
  postponed:  'Reporté',
}

// ─── CSS ──────────────────────────────────────────────────────

const STYLE = `
  .gantt-root {
    padding: var(--space-4);
  }

  .gantt-empty {
    padding: var(--space-6) var(--space-4);
    text-align: center;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-3);
  }

  .gantt-legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }

  .gantt-legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-2);
  }

  .gantt-legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .gantt-skipped {
    margin-top: var(--space-3);
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-3);
    font-style: italic;
  }

  .gantt-chart-wrap {
    width: 100%;
  }
`

// ─── Tooltip personnalisé ──────────────────────────────────────

interface TooltipPayload {
  due_date: string
  start_label: string
  status: MilestoneStatus
}

function GanttTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ payload: TooltipPayload }>
  label?: string
}): JSX.Element | null {
  if (!active || !payload || payload.length < 2) return null
  const data = payload[1]?.payload
  if (!data) return null
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-2)',
        borderRadius: 'var(--r-md)',
        padding: '8px 12px',
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-xs)',
        maxWidth: 220,
      }}
    >
      <div style={{ color: 'var(--text-1)', fontWeight: 'var(--weight-semibold)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ color: 'var(--text-2)' }}>Début : {data.start_label}</div>
      <div style={{ color: 'var(--text-2)' }}>Échéance : {data.due_date}</div>
      <div style={{ marginTop: 4, color: STATUS_COLOR[data.status] }}>
        {STATUS_LABEL[data.status]}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────

const DAY_MS = 86_400_000

function toMs(dateStr: string): number {
  return new Date(dateStr).getTime()
}

function formatAxis(ms: number): string {
  return format(new Date(ms), 'd MMM', { locale: fr })
}

// ─── Types internes ────────────────────────────────────────────

interface GanttRow {
  name: string        // titre tronqué (YAxis)
  start_offset: number  // ms depuis minMs (barre transparente)
  duration: number    // ms de durée (barre colorée)
  // champs pour tooltip
  due_date: string
  start_label: string
  status: MilestoneStatus
}

// ─── Composant ────────────────────────────────────────────────

interface Props {
  milestones: Milestone[]
  projectCreatedAt: string
}

export function GanttView({ milestones, projectCreatedAt }: Props): JSX.Element {
  const { rows, minMs, maxMs, skippedCount, presentStatuses } = useMemo(() => {
    // Jalons avec due_date uniquement
    const withDate = milestones.filter((m) => m.due_date !== null)
    const skipped = milestones.length - withDate.length

    if (withDate.length === 0) {
      return { rows: [], minMs: 0, maxMs: 0, skippedCount: skipped, presentStatuses: [] as MilestoneStatus[] }
    }

    // Trier par due_date
    const sorted = [...withDate].sort((a, b) => {
      const da = a.due_date ?? ''
      const db_ = b.due_date ?? ''
      return da < db_ ? -1 : da > db_ ? 1 : 0
    })

    // Baseline : début du projet (ou 30 jours avant le premier jalon si project créé avant)
    const projectStart = toMs(projectCreatedAt)
    const firstDue = toMs(sorted[0].due_date!)
    const baseline = Math.min(projectStart, firstDue - DAY_MS)

    const dueDateMs = sorted.map((m) => toMs(m.due_date!))
    const globalMin = Math.min(baseline, ...dueDateMs) - DAY_MS
    const globalMax = Math.max(...dueDateMs) + 7 * DAY_MS

    const ganttRows: GanttRow[] = sorted.map((m, i) => {
      const endMs = toMs(m.due_date!)
      // Start = due_date du jalon précédent (ou baseline pour le premier)
      const startMs = i === 0 ? baseline : toMs(sorted[i - 1].due_date!)
      const duration = Math.max(endMs - startMs, DAY_MS) // minimum 1 jour visible

      return {
        name: m.title.length > 20 ? m.title.slice(0, 18) + '…' : m.title,
        start_offset: startMs - globalMin,
        duration,
        due_date: format(new Date(endMs), 'd MMMM yyyy', { locale: fr }),
        start_label: format(new Date(startMs), 'd MMMM yyyy', { locale: fr }),
        status: m.status,
      }
    })

    const statuses = [...new Set(sorted.map((m) => m.status))] as MilestoneStatus[]

    return {
      rows: ganttRows,
      minMs: globalMin,
      maxMs: globalMax,
      skippedCount: skipped,
      presentStatuses: statuses,
    }
  }, [milestones, projectCreatedAt])

  if (rows.length === 0) {
    return (
      <>
        <style>{STYLE}</style>
        <div className="gantt-empty">
          {milestones.length === 0
            ? 'Aucun jalon à afficher.'
            : 'Aucun jalon ne possède de date d\'échéance.'}
        </div>
      </>
    )
  }

  // Hauteur : 44px par jalon + marges
  const chartHeight = Math.max(rows.length * 44 + 40, 120)
  const xDomain: [number, number] = [0, maxMs - minMs]
  const xTicks = buildTicks(minMs, maxMs)

  return (
    <>
      <style>{STYLE}</style>
      <div className="gantt-root">
        {/* Légende */}
        <div className="gantt-legend">
          {presentStatuses.map((s) => (
            <div key={s} className="gantt-legend-item">
              <div className="gantt-legend-dot" style={{ background: STATUS_COLOR[s] }} />
              {STATUS_LABEL[s]}
            </div>
          ))}
        </div>

        {/* Graphique */}
        <div className="gantt-chart-wrap">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 0, right: 16, bottom: 8, left: 0 }}
              barCategoryGap="30%"
            >
              <XAxis
                type="number"
                domain={xDomain}
                ticks={xTicks}
                tickFormatter={(v: number) => formatAxis(v + minMs)}
                tick={{ fontSize: 10, fill: 'var(--text-3)', fontFamily: 'var(--font-ui)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fontSize: 12, fill: 'var(--text-2)', fontFamily: 'var(--font-ui)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<GanttTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              {/* Barre transparente = décalage depuis le début */}
              <Bar dataKey="start_offset" stackId="g" fill="transparent" isAnimationActive={false} />
              {/* Barre colorée = durée */}
              <Bar dataKey="duration" stackId="g" radius={[3, 3, 3, 3]} isAnimationActive={false}>
                {rows.map((row, i) => (
                  <Cell key={i} fill={STATUS_COLOR[row.status]} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {skippedCount > 0 && (
          <p className="gantt-skipped">
            {skippedCount} jalon{skippedCount > 1 ? 's' : ''} sans date d'échéance non affiché{skippedCount > 1 ? 's' : ''}.
          </p>
        )}
      </div>
    </>
  )
}

// ─── Calcul des ticks de l'axe X ─────────────────────────────

function buildTicks(minMs: number, maxMs: number): number[] {
  const rangeMs = maxMs - minMs
  const rangeDays = rangeMs / DAY_MS

  // Choisir un pas lisible selon la durée totale
  let stepDays: number
  if (rangeDays <= 14) stepDays = 2
  else if (rangeDays <= 60) stepDays = 7
  else if (rangeDays <= 180) stepDays = 14
  else if (rangeDays <= 365) stepDays = 30
  else stepDays = 60

  const stepMs = stepDays * DAY_MS
  const ticks: number[] = []

  // Aligner le premier tick sur minMs
  let current = 0
  while (current <= rangeMs) {
    ticks.push(current)
    current += stepMs
  }
  return ticks
}
