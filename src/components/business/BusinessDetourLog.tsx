// DestinyPlanner — Log des détours business (v2.1)
// Panel slide-in — visible par tous les membres, ajout ouvert, résolution owner/editor

import { useState, useEffect, useCallback } from 'react'
import {
  X, Plus, CheckCircle, AlertTriangle, Lightbulb,
  RotateCcw, Trash2, Users,
} from 'lucide-react'
import { useBusinessDetourStore } from '@/stores/useBusinessDetourStore'
import { useMembersStore } from '@/stores/useMembersStore'
import { findCrossSpaceSystemicPatterns } from '@/services/detourAnalysis'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { BusinessDetour } from '@/lib/supabase.types'

// ─── Helpers ──────────────────────────────────────────────────

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
  /* ── Backdrop + Panel ── */
  .bdl-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 14, 13, 0.72);
    z-index: 200;
    animation: bdl-fade 180ms ease both;
  }

  @keyframes bdl-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .bdl-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(520px, 100vw);
    background: var(--sidebar);
    border-left: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    z-index: 201;
    animation: bdl-slide 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes bdl-slide {
    from { transform: translateX(100%); }
    to   { transform: translateX(0); }
  }

  /* ── Header ── */
  .bdl-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-5) var(--space-5) var(--space-4);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .bdl-header-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .bdl-eyebrow {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--teal);
  }

  .bdl-title {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
  }

  .bdl-close {
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

  .bdl-close:hover { background: var(--surface-2); color: var(--text-1); }

  /* ── Barre résumé ── */
  .bdl-summary {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-5);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .bdl-summary-item {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
    color: var(--text-2);
  }

  .bdl-summary-count {
    font-weight: var(--weight-bold);
    color: var(--text-1);
  }

  .bdl-summary-item--systemic { color: var(--coral); }
  .bdl-summary-item--systemic .bdl-summary-count { color: var(--coral); }

  .bdl-summary-item--resolved { color: var(--green); }
  .bdl-summary-item--resolved .bdl-summary-count { color: var(--green); }

  /* ── Bouton ajouter (toujours visible) ── */
  .bdl-add-bar {
    padding: var(--space-3) var(--space-5);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .bdl-add-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: color-mix(in srgb, var(--teal) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--teal) 25%, transparent);
    border-radius: var(--r-md);
    color: var(--teal);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: background var(--transition-fast), border-color var(--transition-fast);
  }

  .bdl-add-btn:hover {
    background: color-mix(in srgb, var(--teal) 16%, transparent);
    border-color: color-mix(in srgb, var(--teal) 40%, transparent);
  }

  /* ── Corps ── */
  .bdl-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-4) var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  /* ── Formulaire ── */
  .bdl-form {
    background: color-mix(in srgb, var(--teal) 6%, transparent);
    border: 1px solid color-mix(in srgb, var(--teal) 20%, transparent);
    border-radius: var(--r-md);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .bdl-form-title {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
  }

  .bdl-form-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .bdl-form-label {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--text-3);
  }

  .bdl-form-input {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-1);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    padding: var(--space-2) var(--space-3);
    outline: none;
    width: 100%;
    box-sizing: border-box;
    transition: border-color var(--transition-fast);
    caret-color: var(--teal);
  }

  .bdl-form-input:focus { border-color: var(--teal); }

  .bdl-form-textarea {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-1);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    padding: var(--space-2) var(--space-3);
    outline: none;
    resize: vertical;
    min-height: 56px;
    width: 100%;
    box-sizing: border-box;
    transition: border-color var(--transition-fast);
    line-height: var(--leading-normal);
    caret-color: var(--teal);
  }

  .bdl-form-textarea:focus { border-color: var(--teal); }

  .bdl-form-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }

  .bdl-btn-cancel {
    padding: 5px 12px;
    background: transparent;
    border: 1px solid var(--border-2);
    border-radius: var(--r-sm);
    color: var(--text-3);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    cursor: pointer;
    transition: color var(--transition-fast);
  }

  .bdl-btn-cancel:hover { color: var(--text-2); }

  .bdl-btn-submit {
    padding: 5px 16px;
    background: color-mix(in srgb, var(--teal) 15%, transparent);
    border: 1px solid color-mix(in srgb, var(--teal) 30%, transparent);
    border-radius: var(--r-sm);
    color: var(--teal);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .bdl-btn-submit:hover { background: color-mix(in srgb, var(--teal) 22%, transparent); }
  .bdl-btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Carte détour ── */
  .bdl-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-left: 3px solid var(--amber);
    border-radius: var(--r-md);
    padding: var(--space-3) var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    transition: border-color var(--transition-fast);
  }

  .bdl-card--systemic { border-left-color: var(--coral); }
  .bdl-card--resolved { border-left-color: var(--green); opacity: 0.72; }

  .bdl-card-top {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .bdl-card-body { flex: 1; min-width: 0; }

  .bdl-card-obstacle {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text-1);
    margin-bottom: 3px;
  }

  .bdl-card--resolved .bdl-card-obstacle {
    text-decoration: line-through;
    color: var(--text-3);
  }

  .bdl-card-impact,
  .bdl-card-adjustment {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-2);
    line-height: var(--leading-snug);
    margin-bottom: 2px;
  }

  .bdl-card-adjustment::before { content: '→ '; color: var(--text-3); }

  /* Reporter */
  .bdl-card-reporter {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-1);
    flex-wrap: wrap;
  }

  .bdl-card-avatar {
    width: 18px;
    height: 18px;
    border-radius: var(--r-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: var(--weight-bold);
    color: #fff;
    flex-shrink: 0;
    letter-spacing: -0.02em;
  }

  .bdl-card-reporter-name {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  .bdl-card-date {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  /* Badges */
  .bdl-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    padding: 1px 6px;
    border-radius: var(--r-full);
  }

  .bdl-badge--systemic {
    background: rgba(224, 112, 112, 0.12);
    color: var(--coral);
  }

  .bdl-badge--resolved {
    background: rgba(90, 158, 111, 0.12);
    color: var(--green);
  }

  /* Actions carte */
  .bdl-card-actions {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    flex-shrink: 0;
  }

  .bdl-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    border-radius: var(--r-sm);
    cursor: pointer;
    color: var(--text-3);
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .bdl-icon-btn:hover { background: var(--surface-2); color: var(--text-2); }
  .bdl-icon-btn--resolve:hover { background: rgba(90, 158, 111, 0.12); color: var(--green); }
  .bdl-icon-btn--reopen:hover  { background: rgba(196, 154, 60, 0.12);  color: var(--amber); }
  .bdl-icon-btn--delete:hover  { background: rgba(224, 112, 112, 0.12); color: var(--coral); }

  /* ── Suggestion cross-espace ── */
  .bdl-cross-suggestion {
    padding: var(--space-3) var(--space-4);
    background: rgba(224, 112, 112, 0.06);
    border: 1px solid rgba(224, 112, 112, 0.22);
    border-radius: var(--r-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    animation: bdl-fade 200ms ease both;
  }

  .bdl-cross-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--coral);
  }

  .bdl-cross-text {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-2);
    line-height: var(--leading-normal);
  }

  .bdl-cross-count {
    font-weight: var(--weight-semibold);
    color: var(--text-1);
  }

  .bdl-cross-dismiss {
    align-self: flex-start;
    padding: 3px 10px;
    background: transparent;
    border: 1px solid var(--border-2);
    border-radius: var(--r-sm);
    color: var(--text-3);
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    cursor: pointer;
    transition: color var(--transition-fast);
  }

  .bdl-cross-dismiss:hover { color: var(--text-2); }

  /* ── Séparateur résolus ── */
  .bdl-separator {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: var(--space-2) 0;
  }

  .bdl-separator-line {
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .bdl-separator-label {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-3);
    white-space: nowrap;
  }

  /* ── Empty ── */
  .bdl-empty {
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

  /* ── Skeleton ── */
  .bdl-skeleton {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .bdl-skeleton-row {
    height: 72px;
    border-radius: var(--r-md);
    background: var(--surface);
    animation: shimmer 1.4s ease infinite;
  }

  @keyframes shimmer {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 0.25; }
  }
`

// ─── Types internes ───────────────────────────────────────────

interface FormState {
  obstacle: string
  impact: string
  adjustment: string
}

function blankForm(): FormState {
  return { obstacle: '', impact: '', adjustment: '' }
}

interface CrossSuggestionState {
  keyword: string
  count: number
}

// ─── Composant principal ──────────────────────────────────────

interface Props {
  projectId: string
  currentUserId: string
  onClose: () => void
}

export function BusinessDetourLog({ projectId, currentUserId, onClose }: Props): JSX.Element {
  const { detours: allDetours, loading, load, add, resolve, reopen, remove } =
    useBusinessDetourStore()
  const { members, loadMembers } = useMembersStore()

  const detours = allDetours.filter((d) => d.project_id === projectId)
  const unresolved = detours.filter((d) => !d.resolved)
  const resolved   = detours.filter((d) => d.resolved)
  const systemicCount = detours.filter((d) => d.is_systemic && !d.resolved).length

  const [showForm, setShowForm]     = useState<boolean>(false)
  const [form, setForm]             = useState<FormState>(blankForm())
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [crossSuggestion, setCrossSuggestion] = useState<CrossSuggestionState | null>(null)
  const [crossDismissed, setCrossDismissed]   = useState<boolean>(false)

  const currentMember = members.find((m) => m.user_id === currentUserId)
  const canModerate   = currentMember?.role === 'owner' || currentMember?.role === 'editor'
  const canDelete     = currentMember?.role === 'owner' || currentMember?.role === 'editor'

  const loadData = useCallback((): void => {
    load(projectId).catch(console.error)
    loadMembers(projectId).catch(console.error)
  }, [projectId, load, loadMembers])

  useEffect(() => {
    loadData()
  }, [loadData])

  function getMemberName(userId: string): string {
    const m = members.find((mb) => mb.user_id === userId)
    return m?.profile?.display_name ?? 'Membre'
  }

  async function handleSubmit(): Promise<void> {
    if (!form.obstacle.trim() || submitting) return
    setSubmitting(true)
    try {
      await add({
        project_id: projectId,
        date: new Date().toISOString().slice(0, 10),
        obstacle: form.obstacle.trim(),
        impact: form.impact.trim(),
        adjustment: form.adjustment.trim(),
      })

      setForm(blankForm())
      setShowForm(false)

      // Vérifier les patterns cross-espace après ajout
      if (!crossDismissed) {
        const patterns = await findCrossSpaceSystemicPatterns()
        const match = patterns.find(
          (p) => p.keyword === form.obstacle.toLowerCase().trim().slice(0, 20),
        )
        if (match) {
          setCrossSuggestion({ keyword: match.keyword, count: match.count })
        }
      }
    } catch (error) {
      console.error('BusinessDetourLog.handleSubmit', error)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResolve(id: string): Promise<void> {
    try { await resolve(id, currentUserId) }
    catch (error) { console.error('BusinessDetourLog.handleResolve', error) }
  }

  async function handleReopen(id: string): Promise<void> {
    try { await reopen(id) }
    catch (error) { console.error('BusinessDetourLog.handleReopen', error) }
  }

  async function handleDelete(id: string): Promise<void> {
    try { await remove(id) }
    catch (error) { console.error('BusinessDetourLog.handleDelete', error) }
  }

  return (
    <>
      <style>{STYLE}</style>

      <div className="bdl-backdrop" onClick={onClose} aria-hidden="true" />

      <aside className="bdl-panel" aria-label="Détours du projet">

        {/* ── Header ── */}
        <div className="bdl-header">
          <div className="bdl-header-left">
            <span className="bdl-eyebrow">Business</span>
            <span className="bdl-title">Détours</span>
          </div>
          <button type="button" className="bdl-close" onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        {/* ── Résumé ── */}
        {detours.length > 0 && (
          <div className="bdl-summary">
            <span className="bdl-summary-item">
              <span className="bdl-summary-count">{detours.length}</span>
              détour{detours.length > 1 ? 's' : ''}
            </span>
            {systemicCount > 0 && (
              <span className="bdl-summary-item bdl-summary-item--systemic">
                <AlertTriangle size={11} />
                <span className="bdl-summary-count">{systemicCount}</span>
                systémique{systemicCount > 1 ? 's' : ''}
              </span>
            )}
            {resolved.length > 0 && (
              <span className="bdl-summary-item bdl-summary-item--resolved">
                <CheckCircle size={11} />
                <span className="bdl-summary-count">{resolved.length}</span>
                résolu{resolved.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* ── Bouton ajouter ── */}
        <div className="bdl-add-bar">
          {!showForm ? (
            <button
              type="button"
              className="bdl-add-btn"
              onClick={() => setShowForm(true)}
            >
              <Plus size={13} />
              Documenter un détour
            </button>
          ) : null}
        </div>

        {/* ── Corps ── */}
        <div className="bdl-body">

          {/* Suggestion cross-espace */}
          {crossSuggestion && !crossDismissed && (
            <div className="bdl-cross-suggestion">
              <div className="bdl-cross-header">
                <Lightbulb size={14} />
                Obstacle systémique cross-espace
              </div>
              <p className="bdl-cross-text">
                Cet obstacle (
                <span className="bdl-cross-count">« {crossSuggestion.keyword} »</span>
                ) a été détecté sur{' '}
                <span className="bdl-cross-count">{crossSuggestion.count} projets différents</span>
                {' '}entre vos espaces personnel et business.
                Un pattern aussi récurrent mérite une stratégie globale.
              </p>
              <button
                type="button"
                className="bdl-cross-dismiss"
                onClick={() => { setCrossSuggestion(null); setCrossDismissed(true) }}
              >
                Compris
              </button>
            </div>
          )}

          {/* Formulaire */}
          {showForm && (
            <div className="bdl-form">
              <div className="bdl-form-title">Documenter un détour</div>

              <div className="bdl-form-row">
                <label className="bdl-form-label">Obstacle rencontré *</label>
                <input
                  type="text"
                  className="bdl-form-input"
                  placeholder="Quel obstacle votre équipe a-t-elle rencontré ?"
                  value={form.obstacle}
                  onChange={(e) => setForm((s) => ({ ...s, obstacle: e.target.value }))}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit().catch(console.error) }}
                />
              </div>

              <div className="bdl-form-row">
                <label className="bdl-form-label">Impact sur le projet</label>
                <input
                  type="text"
                  className="bdl-form-input"
                  placeholder="Comment cela affecte-t-il l'avancement ?"
                  value={form.impact}
                  onChange={(e) => setForm((s) => ({ ...s, impact: e.target.value }))}
                />
              </div>

              <div className="bdl-form-row">
                <label className="bdl-form-label">Ajustement prévu</label>
                <textarea
                  className="bdl-form-textarea"
                  placeholder="Quelle stratégie pour contourner cet obstacle ?"
                  value={form.adjustment}
                  onChange={(e) => setForm((s) => ({ ...s, adjustment: e.target.value }))}
                />
              </div>

              <div className="bdl-form-footer">
                <button
                  type="button"
                  className="bdl-btn-cancel"
                  onClick={() => { setShowForm(false); setForm(blankForm()) }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="bdl-btn-submit"
                  disabled={!form.obstacle.trim() || submitting}
                  onClick={() => handleSubmit().catch(console.error)}
                >
                  <CheckCircle size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  {submitting ? 'Envoi…' : 'Documenter'}
                </button>
              </div>
            </div>
          )}

          {/* Skeleton (chargement initial) */}
          {loading && detours.length === 0 && (
            <div className="bdl-skeleton">
              {[0, 1, 2].map((i) => <div key={i} className="bdl-skeleton-row" />)}
            </div>
          )}

          {/* Empty state */}
          {!loading && detours.length === 0 && !showForm && (
            <div className="bdl-empty">
              <Users size={22} strokeWidth={1.5} />
              Aucun détour documenté sur ce projet.<br />
              Tous les membres peuvent en ajouter.
            </div>
          )}

          {/* Détours non résolus */}
          {unresolved.map((d) => (
            <DetourCard
              key={d.id}
              detour={d}
              reporterName={getMemberName(d.reported_by)}
              canModerate={canModerate}
              canDelete={canDelete}
              onResolve={() => handleResolve(d.id).catch(console.error)}
              onDelete={() => handleDelete(d.id).catch(console.error)}
            />
          ))}

          {/* Séparateur + détours résolus */}
          {resolved.length > 0 && (
            <>
              <div className="bdl-separator">
                <div className="bdl-separator-line" />
                <span className="bdl-separator-label">
                  {resolved.length} résolu{resolved.length > 1 ? 's' : ''}
                </span>
                <div className="bdl-separator-line" />
              </div>
              {resolved.map((d) => (
                <DetourCard
                  key={d.id}
                  detour={d}
                  reporterName={getMemberName(d.reported_by)}
                  canModerate={canModerate}
                  canDelete={canDelete}
                  onReopen={() => handleReopen(d.id).catch(console.error)}
                  onDelete={() => handleDelete(d.id).catch(console.error)}
                />
              ))}
            </>
          )}

        </div>
      </aside>
    </>
  )
}

// ─── Sous-composant carte ─────────────────────────────────────

interface DetourCardProps {
  detour: BusinessDetour
  reporterName: string
  canModerate: boolean
  canDelete: boolean
  onResolve?: () => void
  onReopen?: () => void
  onDelete: () => void
}

function DetourCard({
  detour,
  reporterName,
  canModerate,
  canDelete,
  onResolve,
  onReopen,
  onDelete,
}: DetourCardProps): JSX.Element {
  const cardClass = [
    'bdl-card',
    detour.is_systemic && !detour.resolved ? 'bdl-card--systemic' : '',
    detour.resolved ? 'bdl-card--resolved' : '',
  ].filter(Boolean).join(' ')

  const dateLabel = format(parseISO(detour.date), 'd MMM', { locale: fr })
  const color     = avatarColor(detour.reported_by)
  const name      = reporterName

  return (
    <div className={cardClass}>
      <div className="bdl-card-top">
        <div className="bdl-card-body">
          <div className="bdl-card-obstacle">{detour.obstacle}</div>
          {detour.impact && (
            <div className="bdl-card-impact">{detour.impact}</div>
          )}
          {detour.adjustment && (
            <div className="bdl-card-adjustment">{detour.adjustment}</div>
          )}

          <div className="bdl-card-reporter">
            <div
              className="bdl-card-avatar"
              style={{ background: color }}
              aria-hidden="true"
            >
              {initials(name)}
            </div>
            <span className="bdl-card-reporter-name">{name}</span>
            <span className="bdl-card-date">{dateLabel}</span>

            {detour.is_systemic && !detour.resolved && (
              <span className="bdl-badge bdl-badge--systemic">
                <AlertTriangle size={10} />
                Systémique
              </span>
            )}
            {detour.resolved && (
              <span className="bdl-badge bdl-badge--resolved">
                <CheckCircle size={10} />
                Résolu
              </span>
            )}
          </div>
        </div>

        <div className="bdl-card-actions">
          {!detour.resolved && canModerate && onResolve && (
            <button
              type="button"
              className="bdl-icon-btn bdl-icon-btn--resolve"
              onClick={onResolve}
              title="Marquer résolu"
            >
              <CheckCircle size={14} />
            </button>
          )}
          {detour.resolved && canModerate && onReopen && (
            <button
              type="button"
              className="bdl-icon-btn bdl-icon-btn--reopen"
              onClick={onReopen}
              title="Rouvrir"
            >
              <RotateCcw size={14} />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              className="bdl-icon-btn bdl-icon-btn--delete"
              onClick={onDelete}
              title="Supprimer"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
