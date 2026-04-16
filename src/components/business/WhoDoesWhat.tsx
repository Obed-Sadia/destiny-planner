// DestinyPlanner — Vue "Qui fait quoi" (v2.1)
// Jalons groupés par responsable, badges deadline, réassignation (owner/editor).

import { useEffect } from 'react'
import { X, AlertTriangle, Clock, CheckCircle2, Ban, Hourglass, Calendar } from 'lucide-react'
import { useBusinessStore } from '@/stores/useBusinessStore'
import { useMembersStore } from '@/stores/useMembersStore'
import type { BusinessMilestone, BusinessMilestoneStatus } from '@/lib/supabase.types'

// ─── Constantes ──────────────────────────────────────────────

const STATUS_LABELS: Record<BusinessMilestoneStatus, string> = {
  planned:     'Planifié',
  in_progress: 'En cours',
  completed:   'Terminé',
  blocked:     'Bloqué',
  postponed:   'Reporté',
}

const STATUS_ICONS: Record<BusinessMilestoneStatus, JSX.Element> = {
  planned:     <Hourglass size={10} />,
  in_progress: <Clock size={10} />,
  completed:   <CheckCircle2 size={10} />,
  blocked:     <Ban size={10} />,
  postponed:   <Clock size={10} />,
}

const STATUS_COLORS: Record<BusinessMilestoneStatus, string> = {
  planned:     'var(--text-3)',
  in_progress: 'var(--blue, #5B9BD4)',
  completed:   'var(--green)',
  blocked:     'var(--coral)',
  postponed:   'var(--amber)',
}

type Urgency = 'overdue' | 'urgent' | 'ok' | 'none'

export function getMilestoneUrgency(m: BusinessMilestone): Urgency {
  if (!m.due_date || m.status === 'completed' || m.status === 'postponed') return 'none'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(m.due_date)
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86400000)
  if (diffDays < 0)  return 'overdue'
  if (diffDays <= 3) return 'urgent'
  return 'ok'
}

function formatDue(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const AVATAR_PALETTE = [
  '#2DA58A', '#C49A3C', '#5B9BD4', '#7B6FD4',
  '#D4854A', '#5A9E6F', '#E07070',
]

function avatarColor(userId: string): string {
  let h = 0
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) | 0
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

function initials(name: string | null | undefined): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0][0].toUpperCase()
}

// ─── Styles ──────────────────────────────────────────────────

const STYLE = `
  .wdw-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 14, 13, 0.72);
    z-index: 200;
    animation: wdw-fade 180ms ease both;
  }

  @keyframes wdw-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .wdw-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(480px, 100vw);
    background: var(--sidebar);
    border-left: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    z-index: 201;
    animation: wdw-slide 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes wdw-slide {
    from { transform: translateX(100%); }
    to   { transform: translateX(0); }
  }

  /* Header */
  .wdw-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-5) var(--space-5) var(--space-4);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .wdw-header-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .wdw-eyebrow {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--teal);
  }

  .wdw-title {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
  }

  .wdw-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: var(--r-md);
    border: none;
    background: transparent;
    color: var(--text-2);
    cursor: pointer;
    transition: background var(--transition-base), color var(--transition-base);
  }

  .wdw-close:hover { background: var(--surface-2); color: var(--text-1); }

  /* Barre résumé */
  .wdw-summary {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-5);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .wdw-summary-item {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
    color: var(--text-2);
  }

  .wdw-summary-count {
    font-weight: var(--weight-bold);
    color: var(--text-1);
  }

  .wdw-summary-item--overdue { color: var(--coral); }
  .wdw-summary-item--overdue .wdw-summary-count { color: var(--coral); }

  .wdw-summary-item--urgent { color: var(--amber); }
  .wdw-summary-item--urgent .wdw-summary-count { color: var(--amber); }

  /* Corps */
  .wdw-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-4) var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  /* Section par assigné */
  .wdw-section {}

  .wdw-section-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
  }

  .wdw-section-avatar {
    width: 26px;
    height: 26px;
    border-radius: var(--r-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: var(--weight-bold);
    color: #fff;
    flex-shrink: 0;
    letter-spacing: -0.02em;
  }

  .wdw-section-avatar--unassigned {
    background: var(--surface-2);
    border: 1.5px dashed var(--border-2);
    color: var(--text-3);
    font-size: 12px;
  }

  .wdw-section-name {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
    flex: 1;
    min-width: 0;
  }

  .wdw-section-count {
    font-size: var(--text-xs);
    color: var(--text-3);
    background: var(--surface-2);
    border-radius: var(--r-full);
    padding: 1px 7px;
  }

  /* Ligne jalon */
  .wdw-milestone {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3);
    border-radius: var(--r-md);
    background: var(--surface);
    border: 1px solid var(--border);
    margin-bottom: var(--space-2);
    transition: border-color var(--transition-base);
  }

  .wdw-milestone:last-child { margin-bottom: 0; }
  .wdw-milestone:hover { border-color: var(--border-2); }

  .wdw-milestone--overdue { border-color: color-mix(in srgb, var(--coral) 30%, transparent); }
  .wdw-milestone--urgent  { border-color: color-mix(in srgb, var(--amber) 30%, transparent); }

  .wdw-milestone-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .wdw-milestone-top {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .wdw-milestone-title {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text-1);
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .wdw-milestone-title--completed {
    text-decoration: line-through;
    color: var(--text-3);
  }

  /* Badge statut */
  .wdw-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    font-weight: var(--weight-semibold);
    padding: 2px 7px;
    border-radius: var(--r-full);
    white-space: nowrap;
    flex-shrink: 0;
    background: color-mix(in srgb, currentColor 12%, transparent);
    border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
  }

  /* Badge deadline */
  .wdw-due-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: var(--text-xs);
    padding: 2px 7px;
    border-radius: var(--r-full);
    white-space: nowrap;
    flex-shrink: 0;
    font-weight: var(--weight-medium);
  }

  .wdw-due-badge--overdue {
    color: var(--coral);
    background: color-mix(in srgb, var(--coral) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--coral) 25%, transparent);
  }

  .wdw-due-badge--urgent {
    color: var(--amber);
    background: color-mix(in srgb, var(--amber) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--amber) 25%, transparent);
  }

  .wdw-due-badge--ok {
    color: var(--text-3);
    background: var(--surface-2);
    border: 1px solid var(--border);
  }

  /* Sélecteur d'assigné */
  .wdw-assign-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    margin-top: var(--space-1);
    align-self: flex-start;
  }

  .wdw-assign-select {
    appearance: none;
    background: transparent;
    border: 1px solid var(--border-2);
    border-radius: var(--r-sm);
    padding: 2px 22px 2px 8px;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-2);
    cursor: pointer;
    outline: none;
    transition: border-color var(--transition-base), color var(--transition-base);
    max-width: 180px;
  }

  .wdw-assign-select:hover,
  .wdw-assign-select:focus { border-color: var(--teal); color: var(--text-1); }

  .wdw-assign-chevron {
    position: absolute;
    right: 5px;
    pointer-events: none;
    color: var(--text-3);
    font-size: 9px;
  }

  /* Empty state */
  .wdw-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-12) var(--space-4);
    text-align: center;
    color: var(--text-3);
    font-size: var(--text-sm);
    font-style: italic;
  }

  /* Skeleton */
  .wdw-skeleton {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-4) var(--space-5);
  }

  .wdw-skeleton-row {
    height: 64px;
    border-radius: var(--r-md);
    background: var(--surface);
    animation: shimmer 1.4s ease infinite;
  }

  @keyframes shimmer {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 0.25; }
  }
`

// ─── Composant ───────────────────────────────────────────────

interface Props {
  projectId: string
  currentUserId: string
  onClose: () => void
}

export function WhoDoesWhat({ projectId, currentUserId, onClose }: Props): JSX.Element {
  const { milestones: allMilestones, loadMilestones, assignMilestone } = useBusinessStore()
  const { members, loading: membersLoading, loadMembers } = useMembersStore()

  const milestones = allMilestones.filter((m) => m.project_id === projectId)

  useEffect(() => {
    loadMilestones(projectId)
    loadMembers(projectId)
  }, [projectId, loadMilestones, loadMembers])

  const currentMember = members.find((m) => m.user_id === currentUserId)
  const canAssign = currentMember?.role === 'owner' || currentMember?.role === 'editor'

  // ── Groupement par assigné ──────────────────────────────────

  const unassigned = milestones.filter((m) => !m.assignee_id)
  const assignedGroups: Array<{ userId: string; name: string; items: BusinessMilestone[] }> = []

  for (const m of milestones) {
    if (!m.assignee_id) continue
    const existing = assignedGroups.find((g) => g.userId === m.assignee_id)
    if (existing) {
      existing.items.push(m)
    } else {
      const member = members.find((mb) => mb.user_id === m.assignee_id)
      assignedGroups.push({
        userId: m.assignee_id,
        name: member?.profile?.display_name ?? 'Inconnu',
        items: [m],
      })
    }
  }

  // ── Compteurs résumé ────────────────────────────────────────

  const overdueCount = milestones.filter((m) => getMilestoneUrgency(m) === 'overdue').length
  const urgentCount  = milestones.filter((m) => getMilestoneUrgency(m) === 'urgent').length

  // ── Render d'un jalon ────────────────────────────────────────

  function renderMilestone(m: BusinessMilestone): JSX.Element {
    const urgency = getMilestoneUrgency(m)
    const statusColor = STATUS_COLORS[m.status]

    return (
      <div
        key={m.id}
        className={`wdw-milestone ${urgency === 'overdue' ? 'wdw-milestone--overdue' : urgency === 'urgent' ? 'wdw-milestone--urgent' : ''}`}
      >
        <div className="wdw-milestone-main">
          <div className="wdw-milestone-top">
            {/* Statut */}
            <span
              className="wdw-status-badge"
              style={{ color: statusColor }}
            >
              {STATUS_ICONS[m.status]}
              {STATUS_LABELS[m.status]}
            </span>

            {/* Titre */}
            <span className={`wdw-milestone-title${m.status === 'completed' ? ' wdw-milestone-title--completed' : ''}`}>
              {m.title}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {/* Deadline */}
            {m.due_date && urgency !== 'none' && (
              <span className={`wdw-due-badge wdw-due-badge--${urgency}`}>
                {urgency === 'overdue'
                  ? <AlertTriangle size={10} />
                  : <Calendar size={10} />
                }
                {urgency === 'overdue' ? `En retard · ${formatDue(m.due_date)}` : `Échéance · ${formatDue(m.due_date)}`}
              </span>
            )}
            {m.due_date && urgency === 'ok' && (
              <span className="wdw-due-badge wdw-due-badge--ok">
                <Calendar size={10} />
                {formatDue(m.due_date)}
              </span>
            )}

            {/* Sélecteur d'assigné */}
            {canAssign && (
              <div className="wdw-assign-wrap">
                <select
                  className="wdw-assign-select"
                  value={m.assignee_id ?? ''}
                  onChange={async (e) => {
                    try {
                      await assignMilestone(m.id, e.target.value || null)
                    } catch { /* silencieux */ }
                  }}
                  aria-label={`Responsable de : ${m.title}`}
                >
                  <option value="">Non assigné</option>
                  {members.map((mb) => (
                    <option key={mb.user_id} value={mb.user_id}>
                      {mb.profile?.display_name ?? 'Inconnu'}
                    </option>
                  ))}
                </select>
                <span className="wdw-assign-chevron">▾</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const isLoading = membersLoading && members.length === 0

  return (
    <>
      <style>{STYLE}</style>

      <div className="wdw-backdrop" onClick={onClose} aria-hidden="true" />

      <aside className="wdw-panel" aria-label="Qui fait quoi">

        {/* Header */}
        <div className="wdw-header">
          <div className="wdw-header-left">
            <span className="wdw-eyebrow">Répartition</span>
            <span className="wdw-title">Qui fait quoi</span>
          </div>
          <button type="button" className="wdw-close" onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        {/* Résumé */}
        {milestones.length > 0 && (
          <div className="wdw-summary">
            <span className="wdw-summary-item">
              <span className="wdw-summary-count">{milestones.length}</span>
              jalon{milestones.length > 1 ? 's' : ''}
            </span>
            {overdueCount > 0 && (
              <span className="wdw-summary-item wdw-summary-item--overdue">
                <AlertTriangle size={11} />
                <span className="wdw-summary-count">{overdueCount}</span>
                en retard
              </span>
            )}
            {urgentCount > 0 && (
              <span className="wdw-summary-item wdw-summary-item--urgent">
                <Clock size={11} />
                <span className="wdw-summary-count">{urgentCount}</span>
                urgent{urgentCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Corps */}
        {isLoading ? (
          <div className="wdw-skeleton">
            {[0, 1, 2].map((i) => <div key={i} className="wdw-skeleton-row" />)}
          </div>
        ) : milestones.length === 0 ? (
          <div className="wdw-empty">
            Aucun jalon pour ce projet.<br />
            Complétez l'étape 5 du wizard pour en créer.
          </div>
        ) : (
          <div className="wdw-body">

            {/* Groupes par assigné */}
            {assignedGroups.map((group) => (
              <div key={group.userId} className="wdw-section">
                <div className="wdw-section-header">
                  <div
                    className="wdw-section-avatar"
                    style={{ background: avatarColor(group.userId) }}
                    aria-hidden="true"
                  >
                    {initials(group.name)}
                  </div>
                  <span className="wdw-section-name">{group.name}</span>
                  <span className="wdw-section-count">{group.items.length}</span>
                </div>
                {group.items.map(renderMilestone)}
              </div>
            ))}

            {/* Non assignés */}
            {unassigned.length > 0 && (
              <div className="wdw-section">
                <div className="wdw-section-header">
                  <div className="wdw-section-avatar wdw-section-avatar--unassigned" aria-hidden="true">
                    ?
                  </div>
                  <span className="wdw-section-name" style={{ color: 'var(--text-2)' }}>
                    Non assignés
                  </span>
                  <span className="wdw-section-count">{unassigned.length}</span>
                </div>
                {unassigned.map(renderMilestone)}
              </div>
            )}

          </div>
        )}

      </aside>
    </>
  )
}
