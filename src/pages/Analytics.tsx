// DestinyPlanner — Page Statistiques (Session 32)
// Usage local uniquement — espace personnel, jamais de données business

import { useEffect, useState, useCallback } from 'react'
import { startOfWeek, subWeeks, endOfWeek, format } from 'date-fns'
import { fr as frLocale } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
  PieChart,
  Pie,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { useUserStore } from '../stores/useUserStore'
import { useDomainStore } from '../stores/useDomainStore'
import { useProjectStore } from '../stores/useProjectStore'
import { useTranslation } from '../i18n/useTranslation'
import { db } from '../db/schema'

const STYLE = `
  .analytics {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    animation: fadeIn 200ms ease both;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Header ── */
  .analytics-header h1 {
    font-family: var(--font-editorial);
    font-size: var(--text-2xl);
    font-weight: 300;
    color: var(--text-1);
    line-height: var(--leading-tight);
    margin-bottom: var(--space-1);
  }

  .analytics-header p {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-3);
  }

  /* ── Grille métriques ── */
  .analytics-metrics {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }

  @media (min-width: 640px) {
    .analytics-metrics {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .analytics-metric {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: var(--space-4);
  }

  .analytics-metric-label {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-2);
    margin-bottom: var(--space-2);
  }

  .analytics-metric-value {
    font-family: var(--font-ui);
    font-size: 1.75rem;
    font-weight: var(--weight-bold);
    line-height: 1;
    margin-bottom: 4px;
  }

  .analytics-metric-sub {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  /* ── Cartes graphiques ── */
  .analytics-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    overflow: hidden;
  }

  .analytics-card-header {
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border);
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-2);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .analytics-card-body {
    padding: var(--space-4);
  }

  /* ── Grille 2 colonnes pour les charts ── */
  .analytics-charts {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  @media (min-width: 768px) {
    .analytics-charts {
      grid-template-columns: 2fr 1fr;
      align-items: start;
    }
  }

  /* ── Grade + engagement ── */
  .analytics-profile-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }

  @media (min-width: 640px) {
    .analytics-profile-row {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .analytics-badge-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .analytics-badge-label {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-2);
  }

  .analytics-badge-value {
    font-family: var(--font-ui);
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
  }

  /* ── Légende domaines ── */
  .analytics-domain-legend {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-4);
  }

  .analytics-domain-legend-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-2);
  }

  .analytics-domain-legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: var(--space-2);
    flex-shrink: 0;
  }

  .analytics-domain-legend-left {
    display: flex;
    align-items: center;
  }

  .analytics-domain-legend-count {
    font-weight: var(--weight-semibold);
    color: var(--text-1);
  }

  .analytics-empty {
    padding: var(--space-6);
    text-align: center;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-3);
  }
`

const GRADE_LABELS: Record<string, string> = {
  master_builder:   'Maître Bâtisseur',
  builder_diligent: 'Bâtisseur Diligent',
  planner:          'Planificateur',
  discoverer:       'Découvreur',
}

const ENGAGEMENT_LABELS: Record<number, string> = {
  1: 'Explorateur',
  2: 'Engagé',
  3: 'Consacré',
}

const HEALTH_COLORS: Record<string, string> = {
  healthy:    '#5A9E6F',
  dry:        '#C49A3C',
  overloaded: '#D4854A',
  dormant:    '#7B6FD4',
}

interface WeekData {
  label: string
  count: number
}

export default function Analytics(): JSX.Element {
  const { t } = useTranslation()
  const { profile, load: loadProfile } = useUserStore()
  const { domainsWithHealth, domains, load: loadDomains, refreshHealth } = useDomainStore()
  const { projects, load: loadProjects } = useProjectStore()

  const [weeklyData, setWeeklyData] = useState<WeekData[]>([])

  const loadWeeklyActivity = useCallback(async (): Promise<void> => {
    try {
      const today = new Date()
      const weeks: WeekData[] = []
      for (let i = 11; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 })
        const weekEnd = endOfWeek(subWeeks(today, i), { weekStartsOn: 1 })
        const startStr = format(weekStart, 'yyyy-MM-dd')
        const endStr = format(weekEnd, 'yyyy-MM-dd')
        const count = await db.action
          .where('date')
          .between(startStr, endStr, true, true)
          .filter((a) => a.done)
          .count()
        weeks.push({
          label: format(weekStart, 'd MMM', { locale: frLocale }),
          count,
        })
      }
      setWeeklyData(weeks)
    } catch (_) {
      // Silence
    }
  }, [])

  useEffect(() => {
    void loadProfile()
    void loadDomains()
    void loadProjects()
    void loadWeeklyActivity()
  }, [loadProfile, loadDomains, loadProjects, loadWeeklyActivity])

  useEffect(() => {
    if (projects.length > 0 || domains.length > 0) {
      refreshHealth(projects)
    }
  }, [projects, domains, refreshHealth])

  // Données santé des domaines pour le PieChart
  const healthCounts = {
    healthy:    domainsWithHealth.filter((d) => d.health_status === 'healthy').length,
    dry:        domainsWithHealth.filter((d) => d.health_status === 'dry').length,
    overloaded: domainsWithHealth.filter((d) => d.health_status === 'overloaded').length,
    dormant:    domainsWithHealth.filter((d) => d.health_status === 'dormant').length,
  }

  const pieData = (Object.entries(healthCounts) as [string, number][])
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: key, value, color: HEALTH_COLORS[key] }))

  const totalWeekActions = weeklyData.reduce((s, w) => s + w.count, 0)

  return (
    <>
      <style>{STYLE}</style>
      <div className="analytics">

        {/* Header */}
        <div className="analytics-header">
          <h1>{t('analytics.title')}</h1>
          <p>{t('analytics.subtitle')}</p>
        </div>

        {/* Métriques profil */}
        <div className="analytics-metrics">
          <div className="analytics-metric">
            <div className="analytics-metric-label">{t('analytics.streak')}</div>
            <div className="analytics-metric-value" style={{ color: 'var(--teal)' }}>
              {profile?.streak ?? 0}
            </div>
            <div className="analytics-metric-sub">
              {t('analytics.bestStreak')} : {profile?.streak_best ?? 0}{t('analytics.days')}
            </div>
          </div>

          <div className="analytics-metric">
            <div className="analytics-metric-label">{t('analytics.score30d')}</div>
            <div className="analytics-metric-value" style={{ color: 'var(--gold)' }}>
              {profile?.score_average_30d !== null && profile?.score_average_30d !== undefined
                ? Math.round(profile.score_average_30d)
                : '—'}
            </div>
            <div className="analytics-metric-sub">/ 100</div>
          </div>

          <div className="analytics-metric">
            <div className="analytics-metric-label">{t('analytics.projectsDone')}</div>
            <div className="analytics-metric-value" style={{ color: 'var(--green)' }}>
              {profile?.total_projects_completed ?? 0}
            </div>
            <div className="analytics-metric-sub">
              {projects.filter((p) => p.status === 'active').length} actifs
            </div>
          </div>

          <div className="analytics-metric">
            <div className="analytics-metric-label">{t('analytics.actionsDone')}</div>
            <div className="analytics-metric-value" style={{ color: 'var(--purple)' }}>
              {profile?.total_actions_done ?? 0}
            </div>
            <div className="analytics-metric-sub">
              {totalWeekActions} ces 12 semaines
            </div>
          </div>

          <div className="analytics-metric">
            <div className="analytics-metric-label">{t('analytics.journalCount')}</div>
            <div className="analytics-metric-value" style={{ color: 'var(--coral)' }}>
              {profile?.total_journal_entries ?? 0}
            </div>
            <div className="analytics-metric-sub">&nbsp;</div>
          </div>

          <div className="analytics-metric">
            <div className="analytics-metric-label">{t('analytics.blocksCount')}</div>
            <div className="analytics-metric-value" style={{ color: 'var(--teal)' }}>
              {profile?.total_time_blocks_done ?? 0}
            </div>
            <div className="analytics-metric-sub">&nbsp;</div>
          </div>
        </div>

        {/* Grade + engagement */}
        <div className="analytics-profile-row">
          <div className="analytics-badge-card">
            <span className="analytics-badge-label">Grade</span>
            <span className="analytics-badge-value" style={{ color: 'var(--gold)' }}>
              {profile ? GRADE_LABELS[profile.grade] ?? profile.grade : '—'}
            </span>
          </div>
          <div className="analytics-badge-card">
            <span className="analytics-badge-label">Engagement</span>
            <span className="analytics-badge-value">
              {profile
                ? `Niv. ${profile.engagement_level} — ${ENGAGEMENT_LABELS[profile.engagement_level] ?? ''}`
                : '—'}
            </span>
          </div>
          <div className="analytics-badge-card">
            <span className="analytics-badge-label">Domaines</span>
            <span className="analytics-badge-value">
              {domainsWithHealth.length} domaine{domainsWithHealth.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Charts */}
        <div className="analytics-charts">
          {/* Activité hebdomadaire */}
          <div className="analytics-card">
            <div className="analytics-card-header">
              <TrendingUp size={12} />
              {t('analytics.weeklyActivity')}
            </div>
            <div className="analytics-card-body">
              {weeklyData.every((w) => w.count === 0) ? (
                <div className="analytics-empty">{t('analytics.noData')}</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={weeklyData}
                    margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                    barCategoryGap="30%"
                  >
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: 'var(--text-3)', fontFamily: 'var(--font-ui)' }}
                      axisLine={false}
                      tickLine={false}
                      interval={2}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: 'var(--text-3)', fontFamily: 'var(--font-ui)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      contentStyle={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border-2)',
                        borderRadius: 'var(--r-md)',
                        fontFamily: 'var(--font-ui)',
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [value, 'actions']}
                    />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                      {weeklyData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={i === weeklyData.length - 1 ? 'var(--gold)' : 'rgba(196,154,60,0.4)'}
                          fillOpacity={entry.count === 0 ? 0.3 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Santé des domaines */}
          <div className="analytics-card">
            <div className="analytics-card-header">
              {t('analytics.domainHealth')}
            </div>
            {pieData.length === 0 ? (
              <div className="analytics-empty">{t('analytics.noData')}</div>
            ) : (
              <>
                <div style={{ paddingTop: 'var(--space-2)' }}>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={60}
                        dataKey="value"
                        strokeWidth={0}
                        isAnimationActive={false}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="analytics-domain-legend">
                  {(
                    [
                      { key: 'healthy',    label: t('analytics.healthy')    },
                      { key: 'dry',        label: t('analytics.dry')        },
                      { key: 'overloaded', label: t('analytics.overloaded') },
                      { key: 'dormant',    label: t('analytics.dormant')    },
                    ] as const
                  )
                    .filter(({ key }) => healthCounts[key] > 0)
                    .map(({ key, label }) => (
                      <div key={key} className="analytics-domain-legend-item">
                        <div className="analytics-domain-legend-left">
                          <div
                            className="analytics-domain-legend-dot"
                            style={{ background: HEALTH_COLORS[key] }}
                          />
                          {label}
                        </div>
                        <span className="analytics-domain-legend-count">
                          {healthCounts[key]}
                        </span>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </>
  )
}
