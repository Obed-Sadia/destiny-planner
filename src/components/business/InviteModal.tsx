// DestinyPlanner — Modal génération lien d'invitation
// Sélection rôle (Editor/Viewer), génération token, copie du lien

import { useState } from 'react'
import { X, Copy, Check, Link, AlertCircle } from 'lucide-react'
import { useMembersStore } from '@/stores/useMembersStore'

// ─── Styles ──────────────────────────────────────────────────

const STYLE = `
  .inv-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 14, 13, 0.85);
    z-index: 300;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    animation: inv-fade 180ms ease both;
  }

  @keyframes inv-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .inv-card {
    background: var(--surface);
    border: 1px solid var(--border-2);
    border-radius: var(--r-xl, 16px);
    width: 100%;
    max-width: 440px;
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    animation: inv-up 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }

  @keyframes inv-up {
    from { transform: translateY(12px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  /* Header */
  .inv-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .inv-header-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .inv-eyebrow {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--teal);
  }

  .inv-title {
    font-family: var(--font-editorial);
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--text-1);
    line-height: 1.2;
  }

  .inv-close {
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
    flex-shrink: 0;
    transition: background var(--transition-base), color var(--transition-base);
  }

  .inv-close:hover {
    background: var(--surface-2);
    color: var(--text-1);
  }

  /* Sélecteur de rôle */
  .inv-role-label {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--text-2);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin-bottom: var(--space-2);
  }

  .inv-role-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2);
  }

  .inv-role-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--r-md);
    border: 1.5px solid var(--border);
    background: transparent;
    cursor: pointer;
    text-align: left;
    transition: border-color var(--transition-base), background var(--transition-base);
    font-family: var(--font-ui);
  }

  .inv-role-card:hover {
    border-color: var(--border-2);
    background: var(--surface-2);
  }

  .inv-role-card--selected {
    border-color: var(--teal) !important;
    background: color-mix(in srgb, var(--teal) 8%, transparent) !important;
  }

  .inv-role-name {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
  }

  .inv-role-desc {
    font-size: var(--text-xs);
    color: var(--text-2);
    line-height: var(--leading-snug);
  }

  /* Bouton générer */
  .inv-generate-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-3) var(--space-4);
    background: var(--teal);
    color: #fff;
    border: none;
    border-radius: var(--r-md);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    cursor: pointer;
    transition: opacity var(--transition-base);
  }

  .inv-generate-btn:hover:not(:disabled) { opacity: 0.88; }
  .inv-generate-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Bloc lien généré */
  .inv-link-block {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    animation: inv-fade 200ms ease both;
  }

  .inv-link-label {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-3);
  }

  .inv-link-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: var(--space-2) var(--space-3);
  }

  .inv-link-icon {
    color: var(--teal);
    flex-shrink: 0;
  }

  .inv-link-text {
    flex: 1;
    font-size: var(--text-xs);
    color: var(--text-2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: monospace;
  }

  .inv-copy-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    padding: 4px 10px;
    border-radius: var(--r-sm);
    border: 1px solid var(--border-2);
    background: transparent;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
    cursor: pointer;
    flex-shrink: 0;
    transition: border-color var(--transition-base), background var(--transition-base);
    white-space: nowrap;
  }

  .inv-copy-btn:hover { border-color: var(--teal); background: var(--surface); }
  .inv-copy-btn--copied { color: var(--green); border-color: var(--green); }

  .inv-expiry-note {
    font-size: var(--text-xs);
    color: var(--text-3);
    text-align: center;
    line-height: var(--leading-snug);
  }

  /* Erreur */
  .inv-error {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    color: var(--coral);
    padding: var(--space-2) var(--space-3);
    background: color-mix(in srgb, var(--coral) 8%, transparent);
    border-radius: var(--r-md);
    border: 1px solid color-mix(in srgb, var(--coral) 20%, transparent);
  }
`

// ─── Composant ───────────────────────────────────────────────

interface Props {
  projectId: string
  onClose: () => void
}

type Role = 'editor' | 'viewer'

export function InviteModal({ projectId, onClose }: Props): JSX.Element {
  const { createInviteToken } = useMembersStore()

  const [selectedRole, setSelectedRole] = useState<Role>('editor')
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate(): Promise<void> {
    setGenerating(true)
    setError(null)
    try {
      const token = await createInviteToken(projectId, selectedRole)
      const link = `${window.location.origin}/invite/${token.token}`
      setGeneratedLink(link)
      setExpiresAt(token.expires_at)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopy(): Promise<void> {
    if (!generatedLink) return
    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Impossible de copier — sélectionnez le lien manuellement')
    }
  }

  function formatExpiry(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className="inv-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="inv-card" role="dialog" aria-modal="true" aria-label="Inviter un collaborateur">

          {/* Header */}
          <div className="inv-header">
            <div className="inv-header-text">
              <span className="inv-eyebrow">Invitation</span>
              <h2 className="inv-title">Inviter un collaborateur</h2>
            </div>
            <button type="button" className="inv-close" onClick={onClose} aria-label="Fermer">
              <X size={16} />
            </button>
          </div>

          {/* Sélection rôle */}
          {!generatedLink && (
            <>
              <div>
                <div className="inv-role-label">Rôle accordé</div>
                <div className="inv-role-grid">
                  <button
                    type="button"
                    className={`inv-role-card ${selectedRole === 'editor' ? 'inv-role-card--selected' : ''}`}
                    onClick={() => setSelectedRole('editor')}
                  >
                    <span className="inv-role-name">Éditeur</span>
                    <span className="inv-role-desc">Modifier les jalons, commenter</span>
                  </button>
                  <button
                    type="button"
                    className={`inv-role-card ${selectedRole === 'viewer' ? 'inv-role-card--selected' : ''}`}
                    onClick={() => setSelectedRole('viewer')}
                  >
                    <span className="inv-role-name">Observateur</span>
                    <span className="inv-role-desc">Voir et commenter uniquement</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="inv-error">
                  <AlertCircle size={13} />
                  {error}
                </div>
              )}

              <button
                type="button"
                className="inv-generate-btn"
                disabled={generating}
                onClick={handleGenerate}
              >
                {generating ? 'Génération…' : 'Générer le lien'}
              </button>
            </>
          )}

          {/* Lien généré */}
          {generatedLink && (
            <div className="inv-link-block">
              <div className="inv-link-label">Lien d'invitation</div>

              <div className="inv-link-row">
                <Link size={13} className="inv-link-icon" />
                <span className="inv-link-text" title={generatedLink}>
                  {generatedLink}
                </span>
                <button
                  type="button"
                  className={`inv-copy-btn ${copied ? 'inv-copy-btn--copied' : ''}`}
                  onClick={handleCopy}
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>

              {expiresAt && (
                <p className="inv-expiry-note">
                  Ce lien est à usage unique et expire le {formatExpiry(expiresAt)}.
                  <br />
                  Partagez-le uniquement avec la personne concernée.
                </p>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  )
}
