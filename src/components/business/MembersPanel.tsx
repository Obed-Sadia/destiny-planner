// DestinyPlanner — Panel membres d'un projet business
// Overlay slide-in : liste membres, rôles, suppression (owner), bouton inviter

import { useEffect, useState } from 'react'
import { X, UserMinus, ChevronDown, UserPlus } from 'lucide-react'
import { useMembersStore } from '@/stores/useMembersStore'
import { InviteModal } from './InviteModal'
import type { BusinessMemberRole } from '@/lib/supabase.types'

// ─── Helpers ─────────────────────────────────────────────────

const ROLE_LABELS: Record<BusinessMemberRole, string> = {
  owner:  'Propriétaire',
  editor: 'Éditeur',
  viewer: 'Observateur',
}

const AVATAR_PALETTE = ['#2DA58A', '#C49A3C', '#5B9BD4', '#7B6FD4', '#D4854A', '#5A9E6F', '#E07070']

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
  /* Backdrop */
  .mbr-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 14, 13, 0.72);
    z-index: 200;
    animation: mbr-fade-in 180ms ease both;
  }

  @keyframes mbr-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* Panel */
  .mbr-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(400px, 100vw);
    background: var(--sidebar);
    border-left: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    z-index: 201;
    animation: mbr-slide-in 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes mbr-slide-in {
    from { transform: translateX(100%); }
    to   { transform: translateX(0); }
  }

  /* Header */
  .mbr-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-5) var(--space-5) var(--space-4);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .mbr-header-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .mbr-eyebrow {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--teal);
  }

  .mbr-title {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
  }

  .mbr-close {
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

  .mbr-close:hover {
    background: var(--surface-2);
    color: var(--text-1);
  }

  /* Corps scrollable */
  .mbr-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-4) var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  /* Ligne membre */
  .mbr-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    border-radius: var(--r-md);
    transition: background var(--transition-fast);
  }

  .mbr-row:hover { background: var(--surface-2); }

  /* Avatar */
  .mbr-avatar {
    width: 34px;
    height: 34px;
    border-radius: var(--r-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-sm);
    font-weight: var(--weight-bold);
    color: #fff;
    flex-shrink: 0;
    letter-spacing: -0.02em;
  }

  /* Infos membre */
  .mbr-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .mbr-name {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Sélecteur de rôle */
  .mbr-role-wrap {
    position: relative;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .mbr-role-select {
    appearance: none;
    background: transparent;
    border: 1px solid var(--border-2);
    border-radius: var(--r-sm);
    padding: 3px 22px 3px 7px;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--text-2);
    cursor: pointer;
    outline: none;
    transition: border-color var(--transition-base), color var(--transition-base);
  }

  .mbr-role-select:hover,
  .mbr-role-select:focus {
    border-color: var(--teal);
    color: var(--text-1);
  }

  .mbr-role-chevron {
    position: absolute;
    right: 5px;
    pointer-events: none;
    color: var(--text-3);
  }

  /* Badge rôle (owner — non modifiable) */
  .mbr-role-badge {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    padding: 3px 8px;
    border-radius: var(--r-sm);
    background: color-mix(in srgb, var(--gold) 12%, transparent);
    color: var(--gold);
    border: 1px solid color-mix(in srgb, var(--gold) 25%, transparent);
    white-space: nowrap;
  }

  /* Bouton supprimer */
  .mbr-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: var(--r-md);
    border: none;
    background: transparent;
    color: var(--text-3);
    cursor: pointer;
    flex-shrink: 0;
    transition: background var(--transition-base), color var(--transition-base);
  }

  .mbr-remove:hover {
    background: color-mix(in srgb, var(--coral) 15%, transparent);
    color: var(--coral);
  }

  /* Skeleton membres */
  .mbr-skeleton {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-4) var(--space-5);
  }

  .mbr-skeleton-row {
    height: 48px;
    border-radius: var(--r-md);
    background: var(--surface);
    animation: shimmer 1.4s ease infinite;
  }

  @keyframes shimmer {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 0.25; }
  }

  /* Footer */
  .mbr-footer {
    padding: var(--space-4) var(--space-5);
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }

  .mbr-invite-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-3) var(--space-4);
    background: color-mix(in srgb, var(--teal) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--teal) 30%, transparent);
    border-radius: var(--r-md);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--teal);
    cursor: pointer;
    transition: background var(--transition-base), border-color var(--transition-base);
  }

  .mbr-invite-btn:hover {
    background: color-mix(in srgb, var(--teal) 16%, transparent);
    border-color: var(--teal);
  }

  /* Section tokens actifs */
  .mbr-tokens-section {
    margin-top: var(--space-4);
    padding-top: var(--space-4);
    border-top: 1px solid var(--border);
  }

  .mbr-tokens-title {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-3);
    margin-bottom: var(--space-2);
  }

  .mbr-token-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--r-sm);
    background: var(--surface);
    border: 1px solid var(--border);
    margin-bottom: var(--space-2);
  }

  .mbr-token-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .mbr-token-role {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--teal);
  }

  .mbr-token-expires {
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  .mbr-token-revoke {
    font-size: var(--text-xs);
    color: var(--text-3);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: var(--r-sm);
    transition: color var(--transition-base), background var(--transition-base);
    font-family: var(--font-ui);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .mbr-token-revoke:hover {
    color: var(--coral);
    background: color-mix(in srgb, var(--coral) 10%, transparent);
  }
`

// ─── Composant ───────────────────────────────────────────────

interface Props {
  projectId: string
  currentUserId: string
  onClose: () => void
}

export function MembersPanel({ projectId, currentUserId, onClose }: Props): JSX.Element {
  const { members, tokens, loading, loadMembers, loadTokens, changeRole, removeMember, revokeToken } =
    useMembersStore()

  const [showInvite, setShowInvite] = useState(false)
  const [changingRole, setChangingRole] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  const isOwner = members.some((m) => m.user_id === currentUserId && m.role === 'owner')

  useEffect(() => {
    loadMembers(projectId)
    if (isOwner) loadTokens(projectId)
  }, [projectId, isOwner, loadMembers, loadTokens])

  // Recharger les tokens après fermeture de l'invite modal
  function handleInviteClose(): void {
    setShowInvite(false)
    loadTokens(projectId)
  }

  async function handleRoleChange(memberId: string, role: 'editor' | 'viewer'): Promise<void> {
    setChangingRole(memberId)
    try {
      await changeRole(memberId, role)
    } finally {
      setChangingRole(null)
    }
  }

  async function handleRemove(memberId: string): Promise<void> {
    setRemoving(memberId)
    try {
      await removeMember(memberId, projectId)
    } finally {
      setRemoving(null)
    }
  }

  function formatExpiry(expiresAt: string): string {
    const d = new Date(expiresAt)
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  return (
    <>
      <style>{STYLE}</style>

      {/* Backdrop */}
      <div className="mbr-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <aside className="mbr-panel" aria-label="Membres du projet">
        <div className="mbr-header">
          <div className="mbr-header-left">
            <span className="mbr-eyebrow">Collaborateurs</span>
            <span className="mbr-title">Membres du projet</span>
          </div>
          <button type="button" className="mbr-close" onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        {/* Corps */}
        {loading && members.length === 0 ? (
          <div className="mbr-skeleton">
            {[0, 1, 2].map((i) => (
              <div key={i} className="mbr-skeleton-row" />
            ))}
          </div>
        ) : (
          <div className="mbr-body">
            {members.map((m) => {
              const name = m.profile?.display_name || 'Inconnu'
              const isCurrentUser = m.user_id === currentUserId
              const canEdit = isOwner && m.role !== 'owner' && !isCurrentUser

              return (
                <div key={m.id} className="mbr-row">
                  {/* Avatar */}
                  <div
                    className="mbr-avatar"
                    style={{ background: avatarColor(m.user_id) }}
                    aria-hidden="true"
                  >
                    {initials(name)}
                  </div>

                  {/* Nom */}
                  <div className="mbr-info">
                    <span className="mbr-name" title={name}>
                      {name}{isCurrentUser && ' (vous)'}
                    </span>
                  </div>

                  {/* Rôle */}
                  {m.role === 'owner' ? (
                    <span className="mbr-role-badge">{ROLE_LABELS.owner}</span>
                  ) : canEdit ? (
                    <div className="mbr-role-wrap">
                      <select
                        className="mbr-role-select"
                        value={m.role}
                        disabled={changingRole === m.id}
                        onChange={(e) =>
                          handleRoleChange(m.id, e.target.value as 'editor' | 'viewer')
                        }
                        aria-label={`Rôle de ${name}`}
                      >
                        <option value="editor">{ROLE_LABELS.editor}</option>
                        <option value="viewer">{ROLE_LABELS.viewer}</option>
                      </select>
                      <ChevronDown size={11} className="mbr-role-chevron" />
                    </div>
                  ) : (
                    <span style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--weight-semibold)',
                      color: 'var(--text-2)',
                    }}>
                      {ROLE_LABELS[m.role]}
                    </span>
                  )}

                  {/* Supprimer */}
                  {canEdit && (
                    <button
                      type="button"
                      className="mbr-remove"
                      onClick={() => handleRemove(m.id)}
                      disabled={removing === m.id}
                      aria-label={`Retirer ${name}`}
                      title={`Retirer ${name}`}
                    >
                      <UserMinus size={13} />
                    </button>
                  )}
                </div>
              )
            })}

            {/* Tokens d'invitation actifs (owner only) */}
            {isOwner && tokens.length > 0 && (
              <div className="mbr-tokens-section">
                <div className="mbr-tokens-title">Liens d'invitation actifs</div>
                {tokens.map((t) => (
                  <div key={t.id} className="mbr-token-row">
                    <div className="mbr-token-info">
                      <span className="mbr-token-role">
                        {t.role === 'editor' ? 'Éditeur' : 'Observateur'}
                      </span>
                      <span className="mbr-token-expires">
                        Expire le {formatExpiry(t.expires_at)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="mbr-token-revoke"
                      onClick={() => revokeToken(t.id)}
                    >
                      Révoquer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer — bouton inviter (owner uniquement) */}
        {isOwner && (
          <div className="mbr-footer">
            <button
              type="button"
              className="mbr-invite-btn"
              onClick={() => setShowInvite(true)}
            >
              <UserPlus size={15} />
              Inviter un collaborateur
            </button>
          </div>
        )}
      </aside>

      {/* Modal invitation */}
      {showInvite && (
        <InviteModal projectId={projectId} onClose={handleInviteClose} />
      )}
    </>
  )
}
