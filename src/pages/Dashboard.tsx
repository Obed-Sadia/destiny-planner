// DestinyPlanner — Tableau de bord
// Métriques clés, Arbre de la Destinée, accès rapide

import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, subDays } from 'date-fns'
import { Plus, Flame, Target, CheckCircle2, LayoutGrid } from 'lucide-react'
import { useGoalStore } from '../stores/useGoalStore'
import { useUserStore } from '../stores/useUserStore'
import { useProjectStore } from '../stores/useProjectStore'
import { useDomainStore } from '../stores/useDomainStore'
import { usePersonalBusinessLinkStore } from '../stores/usePersonalBusinessLinkStore'
import { db } from '../db/schema'
import type { BusinessProjectCache } from '../db/schema'
import { DestinyTree } from '../components/shared/DestinyTree'
import { EngagementPrompt } from '../components/shared/EngagementPrompt'
import { PersonalBusinessLinkManager } from '../components/shared/PersonalBusinessLinkManager'
import { TutorialModal } from '../components/shared/TutorialModal'
import { QUOTES } from '../constants/quotes'
import type { Action, Milestone } from '../types'

// Couleur identitaire des domaines par sort_order
const DOMAIN_COLORS = ['#C49A3C', '#5A9E6F', '#D4854A', '#2DA58A', '#7B6FD4', '#5B9BD4']
function getDomainColor(sortOrder: number): string {
  return DOMAIN_COLORS[sortOrder % DOMAIN_COLORS.length]
}

// Citation du jour (déterministe par date)
function getDailyQuote(): typeof QUOTES[number] {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  )
  return QUOTES[dayOfYear % QUOTES.length]
}

const STYLE = `
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    animation: fadeIn 200ms ease both;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── En-tête ── */
  .dash-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .dash-header-left {
    min-width: 0;
  }

  .dash-greeting {
    font-family: var(--font-editorial);
    font-size: var(--text-2xl);
    font-weight: 300;
    color: var(--text-1);
    line-height: var(--leading-tight);
    margin-bottom: var(--space-1);
  }

  .dash-greeting strong {
    font-weight: 600;
  }

  .dash-mission {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--gold);
    font-style: italic;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 420px;
  }

  .dash-mission-empty {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-3);
  }

  .dash-btn-new {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 8px 14px;
    background: var(--gold-pale);
    border: 1px solid rgba(196,154,60,0.25);
    border-radius: var(--r-md);
    color: var(--gold-soft);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: background var(--transition-fast), border-color var(--transition-fast);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .dash-btn-new:hover {
    background: rgba(196,154,60,0.18);
    border-color: rgba(196,154,60,0.4);
  }

  /* ── Métriques ── */
  .dash-metrics {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }

  @media (min-width: 640px) {
    .dash-metrics {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .dash-metric {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: var(--space-4);
  }

  .dash-metric-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-2);
    margin-bottom: var(--space-2);
  }

  .dash-metric-value {
    font-family: var(--font-ui);
    font-size: 1.625rem;
    font-weight: var(--weight-bold);
    line-height: 1;
    margin-bottom: 4px;
  }

  .dash-metric-delta {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  /* ── Grille 2 colonnes ── */
  .dash-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  @media (min-width: 768px) {
    .dash-grid {
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }
  }

  .dash-col {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  /* ── Cartes ── */
  .dash-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    overflow: hidden;
  }

  .dash-card-header {
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .dash-card-title {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-2);
  }

  .dash-card-body {
    padding: var(--space-4);
  }

  /* ── Sparkline ── */
  .dash-sparkline-wrap {
    padding: var(--space-4);
  }

  .dash-sparkline-days {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: 52px;
    margin-bottom: 6px;
  }

  .dash-sparkline-bar {
    flex: 1;
    border-radius: 2px 2px 0 0;
    transition: height 400ms ease;
    min-height: 2px;
  }

  .dash-sparkline-labels {
    display: flex;
    gap: 6px;
  }

  .dash-sparkline-label {
    flex: 1;
    text-align: center;
    font-family: var(--font-ui);
    font-size: 9px;
    color: var(--text-3);
  }

  /* ── Projets récents ── */
  .dash-project-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    transition: background var(--transition-fast);
    text-decoration: none;
  }
  .dash-project-row:last-child {
    border-bottom: none;
  }
  .dash-project-row:hover {
    background: var(--surface-2);
  }

  .dash-project-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .dash-project-info {
    flex: 1;
    min-width: 0;
  }

  .dash-project-name {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text-1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 2px;
  }

  .dash-project-meta {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-2);
  }

  .dash-project-progress {
    width: 48px;
    flex-shrink: 0;
  }

  .dash-progress-track {
    height: 3px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 2px;
  }

  .dash-progress-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 500ms ease;
  }

  .dash-progress-label {
    font-family: var(--font-ui);
    font-size: 9px;
    color: var(--text-2);
    text-align: right;
  }

  /* ── Actions du jour ── */
  .dash-action-row {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border);
  }
  .dash-action-row:last-child {
    border-bottom: none;
  }

  .dash-action-check {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1.5px solid var(--border-2);
    flex-shrink: 0;
    margin-top: 1px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color var(--transition-fast), background var(--transition-fast);
    background: none;
    padding: 0;
  }
  .dash-action-check:hover {
    border-color: var(--green);
  }
  .dash-action-check.done {
    border-color: var(--green);
    background: rgba(90,158,111,0.15);
  }

  .dash-action-check-inner {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--green);
  }

  .dash-action-body {
    flex: 1;
    min-width: 0;
  }

  .dash-action-title {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-1);
    line-height: var(--leading-snug);
  }
  .dash-action-title.done {
    text-decoration: line-through;
    color: var(--text-3);
  }

  .dash-action-trace {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-3);
    font-style: italic;
    margin-top: 2px;
  }

  .dash-empty-state {
    padding: var(--space-4);
    text-align: center;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-3);
  }

  /* ── Citation ── */
  .dash-quote {
    background: var(--gold-pale);
    border: 1px solid rgba(196,154,60,0.15);
    border-radius: var(--r-lg);
    padding: var(--space-4);
  }

  .dash-quote-text {
    font-family: var(--font-editorial);
    font-size: var(--text-base);
    font-weight: 300;
    color: var(--gold-soft);
    line-height: var(--leading-normal);
    margin-bottom: var(--space-2);
  }

  .dash-quote-author {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: rgba(196,154,60,0.6);
    text-align: right;
  }

  /* ── Arbre de la Destinée ── */
  .dash-tree-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    overflow: hidden;
  }

  .dash-section-label {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-2);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* ── Résumé santé ── */
  .dash-health-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-3);
  }

  .dash-health-item {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: var(--space-3) var(--space-4);
    text-align: center;
  }

  .dash-health-count {
    font-family: var(--font-ui);
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    line-height: 1;
    margin-bottom: 4px;
  }

  .dash-health-label {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-2);
  }
`

// Noms courts des jours pour le sparkline
const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

interface TodayActionItem {
  action: Action
  milestoneName: string
}

export default function Dashboard(): JSX.Element {
  const navigate = useNavigate()
  const { goal, load: loadGoal } = useGoalStore()
  const { profile, load: loadProfile, updateProfile } = useUserStore()
  const { projects, load: loadProjects } = useProjectStore()
  const { domainsWithHealth, domains, load: loadDomains, refreshHealth } = useDomainStore()

  const { links, load: loadLinks } = usePersonalBusinessLinkStore()

  const [todayItems, setTodayItems] = useState<TodayActionItem[]>([])
  const [milestonesCount, setMilestonesCount] = useState<number>(0)
  const [sparkline, setSparkline] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])
  const [sparkDays, setSparkDays] = useState<string[]>([])
  const [businessProjects, setBusinessProjects] = useState<BusinessProjectCache[]>([])
  const [showTutorial, setShowTutorial] = useState<boolean>(false)
  const quote = getDailyQuote()

  const loadTodayActions = useCallback(async (): Promise<void> => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const actions = await db.action.where('date').equals(today).toArray()
      const top3 = actions.slice(0, 3)

      const milestoneIds = [...new Set(top3.map((a) => a.milestone_id))]
      const milestones = await db.milestone.where('id').anyOf(milestoneIds).toArray()
      const milestoneMap: Record<string, Milestone> = {}
      milestones.forEach((m) => { milestoneMap[m.id] = m })

      setTodayItems(
        top3.map((action) => ({
          action,
          milestoneName: milestoneMap[action.milestone_id]?.title ?? '',
        })),
      )
    } catch (_) {
      // Silence — données non critiques
    }
  }, [])

  const loadSparkline = useCallback(async (): Promise<void> => {
    try {
      const today = new Date()
      const counts: number[] = []
      const labels: string[] = []
      for (let i = 6; i >= 0; i--) {
        const d = subDays(today, i)
        const dateStr = format(d, 'yyyy-MM-dd')
        const count = await db.action
          .where('date').equals(dateStr)
          .filter((a) => a.done)
          .count()
        counts.push(count)
        labels.push(DAY_LABELS[d.getDay()] ?? '')
      }
      setSparkline(counts)
      setSparkDays(labels)
    } catch (_) {
      // Silence
    }
  }, [])

  const loadMilestonesCount = useCallback(async (): Promise<void> => {
    try {
      const count = await db.milestone
        .where('status')
        .anyOf(['in_progress', 'planned'])
        .count()
      setMilestonesCount(count)
    } catch (_) {
      // Silence
    }
  }, [])

  const loadBusinessProjects = useCallback(async (): Promise<void> => {
    try {
      const cached = await db.business_project_cache.toArray()
      setBusinessProjects(cached)
    } catch (_) {
      // Silence — l'espace business peut être absent
    }
  }, [])

  useEffect(() => {
    void loadGoal()
    void loadProfile()
    void loadProjects()
    void loadDomains()
    void loadLinks()
    void loadTodayActions()
    void loadSparkline()
    void loadMilestonesCount()
    void loadBusinessProjects()
  }, [loadGoal, loadProfile, loadProjects, loadDomains, loadLinks, loadTodayActions, loadSparkline, loadMilestonesCount, loadBusinessProjects])

  // Afficher le tutoriel à la première visite du Dashboard
  useEffect(() => {
    if (profile && profile.tutorial_done !== true) {
      setShowTutorial(true)
    }
  }, [profile])

  const handleTutorialClose = useCallback(async (): Promise<void> => {
    setShowTutorial(false)
    try {
      await updateProfile({ tutorial_done: true })
    } catch (_) {
      // Non-critique
    }
  }, [updateProfile])

  // Rafraîchir la santé des domaines quand projets ou liens business changent
  useEffect(() => {
    if (projects.length > 0 || domains.length > 0) {
      refreshHealth(projects, links)
    }
  }, [projects, domains, links, refreshHealth])

  const toggleAction = useCallback(async (id: string): Promise<void> => {
    const item = todayItems.find((i) => i.action.id === id)
    if (!item) return
    try {
      const now = new Date().toISOString()
      const newDone = !item.action.done
      await db.action.update(id, {
        done: newDone,
        done_at: newDone ? now : null,
      })
      setTodayItems((prev) =>
        prev.map((i) =>
          i.action.id === id
            ? { ...i, action: { ...i.action, done: newDone, done_at: newDone ? now : null } }
            : i,
        ),
      )
    } catch (_) {
      // Silence
    }
  }, [todayItems])

  const activeProjects = projects.filter((p) => p.status === 'active')
  const recentProjects = [...projects]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 3)

  const domainMap = Object.fromEntries(domains.map((d) => [d.id, d]))

  const healthSain = domainsWithHealth.filter((d) => d.health_status === 'healthy').length
  const healthSec = domainsWithHealth.filter((d) => d.health_status === 'dry').length
  const healthSur = domainsWithHealth.filter((d) => d.health_status === 'overloaded').length

  const sparkMax = Math.max(...sparkline, 1)

  const firstName = profile?.first_name || ''
  const greeting = firstName ? <>Bonjour, <strong>{firstName}</strong></> : <>Tableau de bord</>

  return (
    <>
      <style>{STYLE}</style>
      <div className="dashboard">

        {/* Suggestion de montée de niveau d'engagement */}
        <EngagementPrompt />

        {/* En-tête */}
        <header className="dash-header">
          <div className="dash-header-left">
            <h1 className="dash-greeting">{greeting}</h1>
            {goal?.mission ? (
              <p className="dash-mission" title={goal.mission}>
                « {goal.mission.slice(0, 60)}{goal.mission.length > 60 ? '…' : ''} »
              </p>
            ) : (
              <p
                className="dash-mission-empty"
                role="button"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/goal')}
              >
                Définir votre but de vie →
              </p>
            )}
          </div>
          <button
            className="dash-btn-new"
            type="button"
            onClick={() => navigate('/projects/new')}
          >
            <Plus size={14} />
            Nouveau projet
          </button>
        </header>

        {/* Métriques clés */}
        <div className="dash-metrics">
          <div className="dash-card dash-metric">
            <div className="dash-metric-label">
              <LayoutGrid size={12} color="var(--purple)" />
              Projets actifs
            </div>
            <div className="dash-metric-value" style={{ color: 'var(--purple)' }}>
              {activeProjects.length}
            </div>
            <div className="dash-metric-delta">{projects.length} au total</div>
          </div>

          <div className="dash-card dash-metric">
            <div className="dash-metric-label">
              <Target size={12} color="var(--gold)" />
              Score
            </div>
            <div className="dash-metric-value" style={{ color: 'var(--gold)' }}>
              {profile?.score_average_30d !== null && profile?.score_average_30d !== undefined
                ? `${Math.round(profile.score_average_30d)}`
                : '—'}
            </div>
            <div className="dash-metric-delta">30 derniers jours</div>
          </div>

          <div className="dash-card dash-metric">
            <div className="dash-metric-label">
              <CheckCircle2 size={12} color="var(--green)" />
              Jalons
            </div>
            <div className="dash-metric-value" style={{ color: 'var(--green)' }}>
              {milestonesCount}
            </div>
            <div className="dash-metric-delta">En cours ou planifiés</div>
          </div>

          <div className="dash-card dash-metric">
            <div className="dash-metric-label">
              <Flame size={12} color="var(--teal)" />
              Streak
            </div>
            <div className="dash-metric-value" style={{ color: 'var(--teal)' }}>
              {profile?.streak ?? 0}
            </div>
            <div className="dash-metric-delta">
              Meilleur : {profile?.streak_best ?? 0}j
            </div>
          </div>
        </div>

        {/* Grille 2 colonnes */}
        <div className="dash-grid">
          {/* Colonne gauche */}
          <div className="dash-col">
            {/* Sparkline activité 7 jours */}
            <div className="dash-card">
              <div className="dash-card-header">
                <span className="dash-card-title">Activité 7 jours</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', fontFamily: 'var(--font-ui)' }}>
                  {sparkline.reduce((s, n) => s + n, 0)} actions
                </span>
              </div>
              <div className="dash-sparkline-wrap">
                <div className="dash-sparkline-days">
                  {sparkline.map((count, i) => {
                    const heightPct = (count / sparkMax) * 100
                    const isToday = i === 6
                    return (
                      <div
                        key={i}
                        className="dash-sparkline-bar"
                        style={{
                          height: `${Math.max(heightPct, 4)}%`,
                          background: isToday
                            ? 'var(--gold)'
                            : count > 0
                              ? 'rgba(196,154,60,0.4)'
                              : 'var(--border)',
                        }}
                        title={`${count} action${count !== 1 ? 's' : ''}`}
                      />
                    )
                  })}
                </div>
                <div className="dash-sparkline-labels">
                  {sparkDays.map((label, i) => (
                    <span key={i} className="dash-sparkline-label">{label}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Projets récents */}
            <div className="dash-card">
              <div className="dash-card-header">
                <span className="dash-card-title">Projets récents</span>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--gold)',
                    fontFamily: 'var(--font-ui)',
                    cursor: 'pointer',
                  }}
                  role="button"
                  onClick={() => navigate('/projects')}
                >
                  Voir tous →
                </span>
              </div>
              {recentProjects.length === 0 ? (
                <div className="dash-empty-state">Aucun projet</div>
              ) : (
                recentProjects.map((project) => {
                  const domain = domainMap[project.domain_id]
                  const color = domain ? getDomainColor(domain.sort_order) : 'var(--text-3)'
                  return (
                    <div
                      key={project.id}
                      className="dash-project-row"
                      role="button"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <div className="dash-project-dot" style={{ background: color }} />
                      <div className="dash-project-info">
                        <div className="dash-project-name">{project.title}</div>
                        <div className="dash-project-meta">
                          {domain?.name ?? '—'} · Étape {project.current_step}/7
                        </div>
                      </div>
                      <div className="dash-project-progress">
                        <div className="dash-progress-track">
                          <div
                            className="dash-progress-fill"
                            style={{
                              width: `${project.progress}%`,
                              background: color,
                            }}
                          />
                        </div>
                        <div className="dash-progress-label">{project.progress}%</div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Colonne droite */}
          <div className="dash-col">
            {/* Actions du jour */}
            <div className="dash-card">
              <div className="dash-card-header">
                <span className="dash-card-title">Actions du jour</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', fontFamily: 'var(--font-ui)' }}>
                  {format(new Date(), 'd MMM')}
                </span>
              </div>
              {todayItems.length === 0 ? (
                <div className="dash-empty-state">Aucune action planifiée aujourd'hui</div>
              ) : (
                todayItems.map(({ action, milestoneName }) => (
                  <div key={action.id} className="dash-action-row">
                    <button
                      type="button"
                      className={`dash-action-check${action.done ? ' done' : ''}`}
                      onClick={() => { void toggleAction(action.id) }}
                      aria-label={action.done ? 'Marquer non faite' : 'Marquer faite'}
                    >
                      {action.done && <div className="dash-action-check-inner" />}
                    </button>
                    <div className="dash-action-body">
                      <div className={`dash-action-title${action.done ? ' done' : ''}`}>
                        {action.title}
                      </div>
                      {milestoneName && (
                        <div className="dash-action-trace">→ {milestoneName}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Citation du jour */}
            <div className="dash-quote">
              <p className="dash-quote-text">« {quote.text} »</p>
              <p className="dash-quote-author">— {quote.author}</p>
            </div>
          </div>
        </div>

        {/* Arbre de la Destinée */}
        <div className="dash-tree-card">
          <div className="dash-section-label">
            Arbre de la Destinée
          </div>
          <DestinyTree
            domainsWithHealth={domainsWithHealth}
            goalMission={goal?.mission ?? null}
          />
        </div>

        {/* Liens perso-business */}
        {goal && (
          <PersonalBusinessLinkManager
            businessProjects={businessProjects}
            goalId={goal.id}
          />
        )}

        {/* Résumé santé domaines */}
        <div className="dash-health-grid">
          <div className="dash-health-item">
            <div className="dash-health-count" style={{ color: 'var(--green)' }}>
              {healthSain}
            </div>
            <div className="dash-health-label">Sains</div>
          </div>
          <div className="dash-health-item">
            <div className="dash-health-count" style={{ color: 'var(--amber)' }}>
              {healthSec}
            </div>
            <div className="dash-health-label">Desséchés</div>
          </div>
          <div className="dash-health-item">
            <div className="dash-health-count" style={{ color: 'var(--coral)' }}>
              {healthSur}
            </div>
            <div className="dash-health-label">Surchargés</div>
          </div>
        </div>

      </div>

      {showTutorial && (
        <TutorialModal onClose={() => { void handleTutorialClose() }} />
      )}
    </>
  )
}
