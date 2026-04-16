// DestinyPlanner — Page détail d'un projet
// Header, progression, aperçu des 7 étapes, jalons, actions

import { useEffect, useState, Fragment } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Check, Lock, Pencil, Pause, Play, Flag, Trash2, GanttChart, List } from 'lucide-react'
import { useProjectStore } from '@/stores/useProjectStore'
import { useMilestoneStore } from '@/stores/useMilestoneStore'
import { useDomainStore } from '@/stores/useDomainStore'
import { ProgressBar } from '@/components/project/ProgressBar'
import { MilestoneList } from '@/components/project/MilestoneList'
import { GanttView } from '@/components/project/GanttView'
import { DetourLog } from '@/components/project/DetourLog'
import type { ProjectStatus } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft:     'Brouillon',
  active:    'Actif',
  paused:    'En pause',
  completed: 'Terminé',
  abandoned: 'Abandonné',
}

const STATUS_STYLES: Record<ProjectStatus, { bg: string; text: string }> = {
  draft:     { bg: 'var(--tag-amber-bg)',  text: 'var(--tag-amber-text)' },
  active:    { bg: 'var(--tag-green-bg)',  text: 'var(--tag-green-text)' },
  paused:    { bg: 'var(--tag-purple-bg)', text: 'var(--tag-purple-text)' },
  completed: { bg: 'var(--tag-teal-bg)',   text: 'var(--tag-teal-text)' },
  abandoned: { bg: 'var(--tag-coral-bg)',  text: 'var(--tag-coral-text)' },
}

const STEP_NAMES = [
  'Vision',
  "S'arrêter",
  'Estimer',
  'Compter le coût',
  'Calculer',
  'Vérifier',
  "S'engager",
]

const STEP_COLORS: Record<number, string> = {
  1: 'var(--step-1)',
  2: 'var(--step-2)',
  3: 'var(--step-3)',
  4: 'var(--step-4)',
  5: 'var(--step-5)',
  6: 'var(--step-6)',
  7: 'var(--step-7)',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ─── CSS ──────────────────────────────────────────────────────

const STYLE = `
  .project-detail {
    max-width: 760px;
    padding-bottom: var(--space-16);
    animation: fadeIn 250ms ease both;
  }

  .project-detail-back {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-sm);
    color: var(--text-2);
    text-decoration: none;
    margin-bottom: var(--space-6);
    transition: color var(--transition-base);
  }

  .project-detail-back:hover {
    color: var(--text-1);
  }

  /* ── Header ─────────────────────────── */

  .project-detail-header {
    margin-bottom: var(--space-6);
  }

  .project-detail-domain {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    color: var(--text-3);
    margin-bottom: var(--space-3);
  }

  .project-detail-title {
    font-family: var(--font-editorial);
    font-size: var(--text-4xl);
    font-weight: 600;
    color: var(--text-1);
    line-height: 1.1;
    margin-bottom: var(--space-4);
  }

  .project-detail-meta {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .project-detail-badge {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    padding: 3px var(--space-3);
    border-radius: var(--r-full);
  }

  .project-detail-date {
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  /* ── Progression ─────────────────────── */

  .project-detail-progress {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: var(--space-5);
    margin-bottom: var(--space-6);
  }

  .project-detail-progress-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: var(--space-3);
  }

  .project-detail-progress-label {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
  }

  .project-detail-progress-pct {
    font-family: var(--font-editorial);
    font-size: var(--text-2xl);
    font-weight: 600;
    color: var(--gold);
    line-height: 1;
  }

  .project-detail-milestones-summary {
    font-size: var(--text-xs);
    color: var(--text-2);
    margin-top: var(--space-3);
  }

  /* ── Étapes ──────────────────────────── */

  .project-detail-steps {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: var(--space-5);
    margin-bottom: var(--space-6);
  }

  .project-detail-steps-title {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
    margin-bottom: var(--space-4);
  }

  .project-detail-steps-track {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .project-detail-step-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--r-sm);
    text-decoration: none;
    transition: background var(--transition-base);
  }

  .project-detail-step-row--clickable:hover {
    background: var(--surface-2);
  }

  .project-detail-step-dot {
    width: 26px;
    height: 26px;
    border-radius: var(--r-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-xs);
    font-weight: var(--weight-bold);
    flex-shrink: 0;
    border: 2px solid transparent;
  }

  .project-detail-step-dot--done {
    color: #fff;
    border-color: transparent;
  }

  .project-detail-step-dot--active {
    background: transparent;
    border-style: solid;
  }

  .project-detail-step-dot--locked {
    background: var(--surface-2);
    border-color: var(--border-2);
    color: var(--text-3);
  }

  .project-detail-step-name {
    font-size: var(--text-sm);
    color: var(--text-2);
    flex: 1;
  }

  .project-detail-step-row--done .project-detail-step-name {
    color: var(--text-1);
  }

  .project-detail-step-tag {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    padding: 1px var(--space-2);
    border-radius: var(--r-full);
  }

  /* ── Jalons ──────────────────────────── */

  .project-detail-section {
    margin-bottom: var(--space-6);
  }

  .project-detail-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
  }

  .project-detail-section-title {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
  }

  .project-detail-section-count {
    font-size: var(--text-xs);
    color: var(--text-3);
    background: var(--surface-2);
    padding: 2px 8px;
    border-radius: var(--r-full);
  }

  /* ── Toggle Gantt / Liste ───────────── */

  .project-detail-view-toggle {
    display: flex;
    align-items: center;
    gap: 2px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: 2px;
  }

  .project-detail-view-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border: none;
    border-radius: calc(var(--r-md) - 2px);
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
    background: transparent;
    color: var(--text-2);
  }

  .project-detail-view-btn--active {
    background: var(--surface);
    color: var(--text-1);
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }

  /* ── Actions ─────────────────────────── */

  .project-detail-actions {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
    padding-top: var(--space-6);
    border-top: 1px solid var(--border);
  }

  .project-detail-action-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    border-radius: var(--r-md);
    border: 1px solid var(--border-2);
    background: transparent;
    cursor: pointer;
    transition: all var(--transition-base);
  }

  .project-detail-action-btn--primary {
    background: var(--gold);
    color: var(--bg);
    border-color: transparent;
  }

  .project-detail-action-btn--primary:hover {
    background: var(--gold-soft);
  }

  .project-detail-action-btn--neutral {
    color: var(--text-2);
  }

  .project-detail-action-btn--neutral:hover {
    color: var(--text-1);
    border-color: var(--gold);
  }

  .project-detail-action-btn--danger {
    color: var(--coral);
    border-color: var(--coral);
  }

  .project-detail-action-btn--danger:hover {
    background: rgba(224, 112, 112, 0.08);
  }

  /* ── Loading / 404 ───────────────────── */

  .project-detail-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    color: var(--text-2);
    font-size: var(--text-sm);
    font-family: var(--font-ui);
  }
`

// ─── Composant ────────────────────────────────────────────────

export default function ProjectDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const {
    projects,
    steps: allSteps,
    load: loadProjects,
    loadStepsForProject,
    setProjectStatus,
  } = useProjectStore()

  const { milestones, load: loadMilestones } = useMilestoneStore()
  const { domains, load: loadDomains } = useDomainStore()

  const [showGantt, setShowGantt] = useState(false)

  const project = id ? projects.find((p) => p.id === id) : undefined
  const projectSteps = allSteps.filter((s) => s.project_id === id)
  const projectMilestones = milestones.filter((m) => m.project_id === id)
  const domain = domains.find((d) => d.id === project?.domain_id)

  const completedMilestones = projectMilestones.filter((m) => m.status === 'completed').length

  useEffect(() => {
    loadProjects()
    loadDomains()
  }, [loadProjects, loadDomains])

  useEffect(() => {
    if (id) {
      loadStepsForProject(id)
      loadMilestones(id)
    }
  }, [id, loadStepsForProject, loadMilestones])

  async function handleStatus(status: ProjectStatus): Promise<void> {
    if (!id) return
    await setProjectStatus(id, status)
    if (status === 'abandoned') {
      navigate('/projects')
    }
  }

  // ── Loading / 404 ─────────────────────────────────────────

  if (!project) {
    return (
      <>
        <style>{STYLE}</style>
        <div className="project-detail-loading">Chargement…</div>
      </>
    )
  }

  // ── Rendu ─────────────────────────────────────────────────

  const statusStyle = STATUS_STYLES[project.status]
  const isDraft = project.status === 'draft'
  const isActive = project.status === 'active'
  const isPaused = project.status === 'paused'
  const isCompleted = project.status === 'completed'

  return (
    <>
      <style>{STYLE}</style>
      <div className="project-detail">

        {/* Retour */}
        <Link to="/projects" className="project-detail-back">
          <ArrowLeft size={15} />
          Mes projets
        </Link>

        {/* Header */}
        <div className="project-detail-header">
          {domain && (
            <div className="project-detail-domain">
              <span aria-hidden="true">{domain.icon}</span>
              {domain.name}
            </div>
          )}

          <h1 className="project-detail-title">{project.title}</h1>

          <div className="project-detail-meta">
            <span
              className="project-detail-badge"
              style={{ background: statusStyle.bg, color: statusStyle.text }}
            >
              {STATUS_LABELS[project.status]}
            </span>
            <span className="project-detail-date">
              Créé le {formatDate(project.created_at)}
            </span>
          </div>
        </div>

        {/* Progression (uniquement si non-draft) */}
        {!isDraft && (
          <div className="project-detail-progress">
            <div className="project-detail-progress-header">
              <span className="project-detail-progress-label">Progression des jalons</span>
              <span className="project-detail-progress-pct">{project.progress} %</span>
            </div>
            <ProgressBar
              value={project.progress}
              color={isCompleted ? 'var(--teal)' : 'var(--gold)'}
              size="lg"
            />
            {projectMilestones.length > 0 && (
              <p className="project-detail-milestones-summary">
                {completedMilestones} / {projectMilestones.length} jalon
                {projectMilestones.length > 1 ? 's' : ''} complété
                {completedMilestones > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Aperçu des 7 étapes */}
        <div className="project-detail-steps">
          <div className="project-detail-steps-title">
            Parcours des 7 étapes
          </div>
          <div className="project-detail-steps-track">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => {
              const step = projectSteps.find((s) => s.step_number === num)
              const isStepDone = step?.status === 'completed'
              const isStepActive = step?.status === 'active'
              const isStepLocked = !step || step.status === 'locked'
              const stepColor = STEP_COLORS[num] ?? 'var(--gold)'
              const canClick = (isStepDone || isStepActive) && !isCompleted

              const dotClass = [
                'project-detail-step-dot',
                isStepDone ? 'project-detail-step-dot--done' : '',
                isStepActive ? 'project-detail-step-dot--active' : '',
                isStepLocked ? 'project-detail-step-dot--locked' : '',
              ].filter(Boolean).join(' ')

              const dotStyle = isStepDone
                ? { background: stepColor, borderColor: stepColor }
                : isStepActive
                  ? { borderColor: stepColor, color: stepColor }
                  : {}

              const rowClass = [
                'project-detail-step-row',
                isStepDone ? 'project-detail-step-row--done' : '',
                canClick ? 'project-detail-step-row--clickable' : '',
              ].filter(Boolean).join(' ')

              const inner = (
                <Fragment key={num}>
                  <div className={dotClass} style={dotStyle}>
                    {isStepDone ? (
                      <Check size={11} strokeWidth={3} color="#fff" />
                    ) : isStepLocked ? (
                      <Lock size={10} />
                    ) : (
                      num
                    )}
                  </div>
                  <span className="project-detail-step-name">
                    {STEP_NAMES[num - 1]}
                  </span>
                  {isStepActive && (
                    <span
                      className="project-detail-step-tag"
                      style={{ background: `${stepColor}22`, color: stepColor }}
                    >
                      En cours
                    </span>
                  )}
                  {isStepDone && (
                    <span
                      className="project-detail-step-tag"
                      style={{ background: 'var(--tag-green-bg)', color: 'var(--tag-green-text)' }}
                    >
                      Complétée
                    </span>
                  )}
                </Fragment>
              )

              if (canClick) {
                return (
                  <Link
                    key={num}
                    to={`/projects/${id}/wizard`}
                    className={rowClass}
                  >
                    {inner}
                  </Link>
                )
              }

              return (
                <div key={num} className={rowClass}>
                  {inner}
                </div>
              )
            })}
          </div>
        </div>

        {/* Jalons */}
        <div className="project-detail-section">
          <div className="project-detail-section-header">
            <span className="project-detail-section-title">
              Jalons
              {projectMilestones.length > 0 && (
                <span className="project-detail-section-count" style={{ marginLeft: 8 }}>
                  {projectMilestones.length}
                </span>
              )}
            </span>
            {projectMilestones.some((m) => m.due_date !== null) && (
              <div className="project-detail-view-toggle">
                <button
                  type="button"
                  className={`project-detail-view-btn${!showGantt ? ' project-detail-view-btn--active' : ''}`}
                  onClick={() => setShowGantt(false)}
                  aria-pressed={!showGantt}
                >
                  <List size={12} />
                  Liste
                </button>
                <button
                  type="button"
                  className={`project-detail-view-btn${showGantt ? ' project-detail-view-btn--active' : ''}`}
                  onClick={() => setShowGantt(true)}
                  aria-pressed={showGantt}
                >
                  <GanttChart size={12} />
                  Gantt
                </button>
              </div>
            )}
          </div>

          {showGantt ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
              <GanttView
                milestones={projectMilestones}
                projectCreatedAt={project.created_at}
              />
            </div>
          ) : (
            <MilestoneList
              milestones={projectMilestones}
              projectId={project.id}
            />
          )}
        </div>

        {/* Détours */}
        {!isDraft && (
          <div className="project-detail-section">
            <DetourLog projectId={project.id} />
          </div>
        )}

        {/* Actions */}
        <div className="project-detail-actions">
          {isDraft && (
            <button
              type="button"
              className="project-detail-action-btn project-detail-action-btn--primary"
              onClick={() => navigate(`/projects/${id}/wizard`)}
            >
              <Pencil size={14} />
              Continuer le wizard
            </button>
          )}

          {isActive && (
            <>
              <button
                type="button"
                className="project-detail-action-btn project-detail-action-btn--neutral"
                onClick={() => handleStatus('paused')}
              >
                <Pause size={14} />
                Mettre en pause
              </button>
              <button
                type="button"
                className="project-detail-action-btn project-detail-action-btn--neutral"
                onClick={() => handleStatus('completed')}
              >
                <Flag size={14} />
                Marquer terminé
              </button>
            </>
          )}

          {isPaused && (
            <>
              <button
                type="button"
                className="project-detail-action-btn project-detail-action-btn--primary"
                onClick={() => handleStatus('active')}
              >
                <Play size={14} />
                Reprendre
              </button>
              <button
                type="button"
                className="project-detail-action-btn project-detail-action-btn--danger"
                onClick={() => handleStatus('abandoned')}
              >
                <Trash2 size={14} />
                Abandonner
              </button>
            </>
          )}

          {isCompleted && (
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)' }}>
              🎉 Projet terminé — {formatDate(project.updated_at)}
            </span>
          )}
        </div>

      </div>
    </>
  )
}
