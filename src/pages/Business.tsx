// DestinyPlanner — Espace Business
// Liste des projets collaboratifs, accent teal, auth-gated

import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useBusinessStore } from '@/stores/useBusinessStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { BusinessProjectCard } from '@/components/business/BusinessProjectCard'

const STYLE = `
  .business {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    animation: fadeIn 200ms ease both;
  }

  .business-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .business-eyebrow {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--teal);
    margin-bottom: var(--space-1);
  }

  .business-title {
    font-family: var(--font-editorial);
    font-size: var(--text-3xl);
    font-weight: 300;
    color: var(--text-1);
    line-height: 1.2;
  }

  .business-new-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: var(--teal);
    color: #fff;
    border: none;
    border-radius: var(--r-md);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: opacity var(--transition-base);
    font-family: var(--font-ui);
  }

  .business-new-btn:hover { opacity: 0.88; }

  /* ── Bannière offline ── */
  .business-offline-banner {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: color-mix(in srgb, var(--amber) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--amber) 25%, transparent);
    border-radius: var(--r-md);
    font-size: var(--text-xs);
    color: var(--amber);
  }

  /* ── Bannière sync en attente ── */
  .business-sync-banner {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: color-mix(in srgb, var(--teal) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--teal) 20%, transparent);
    border-radius: var(--r-md);
    font-size: var(--text-xs);
    color: var(--teal);
  }

  .business-sync-btn {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    background: none;
    border: 1px solid color-mix(in srgb, var(--teal) 35%, transparent);
    border-radius: var(--r-sm);
    color: var(--teal);
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: background var(--transition-fast);
  }
  .business-sync-btn:hover {
    background: color-mix(in srgb, var(--teal) 12%, transparent);
  }
  .business-sync-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ── Auth gate ── */
  .business-auth-gate {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    padding: var(--space-16) var(--space-6);
    text-align: center;
  }

  .business-auth-icon {
    font-size: 2.5rem;
    line-height: 1;
  }

  .business-auth-title {
    font-family: var(--font-editorial);
    font-size: var(--text-2xl);
    font-weight: 300;
    color: var(--text-1);
  }

  .business-auth-desc {
    font-size: var(--text-sm);
    color: var(--text-2);
    max-width: 320px;
    line-height: var(--leading-normal);
  }

  .business-auth-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-6);
    background: var(--teal);
    color: #fff;
    border: none;
    border-radius: var(--r-md);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    cursor: pointer;
    transition: opacity var(--transition-base);
    font-family: var(--font-ui);
  }

  .business-auth-btn:hover { opacity: 0.88; }

  /* ── Liste projets ── */
  .business-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  /* ── Empty state ── */
  .business-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-16) var(--space-6);
    text-align: center;
  }

  .business-empty-icon {
    font-size: 2rem;
    line-height: 1;
    opacity: 0.5;
  }

  .business-empty-text {
    font-size: var(--text-sm);
    color: var(--text-2);
    max-width: 280px;
    line-height: var(--leading-normal);
  }

  /* ── Skeleton ── */
  .business-skeleton {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .business-skeleton-card {
    height: 96px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    animation: shimmer 1.4s ease infinite;
  }

  @keyframes shimmer {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 0.3; }
  }
`

export default function Business(): JSX.Element {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuthStore()
  const { projects, loading, loadProjects, pendingCount, replayQueue } = useBusinessStore()

  const isOnline = navigator.onLine

  const handleReplay = useCallback(async (): Promise<void> => {
    await replayQueue()
  }, [replayQueue])

  useEffect(() => {
    if (user) loadProjects()
  }, [user, loadProjects])

  // Replay automatique à la reconnexion
  useEffect(() => {
    const onOnline = (): void => { void handleReplay() }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [handleReplay])

  return (
    <>
      <style>{STYLE}</style>
      <div className="business">

        {/* ── Header ── */}
        <div className="business-header">
          <div>
            <div className="business-eyebrow">Espace Business</div>
            <h1 className="business-title">Projets collaboratifs</h1>
          </div>
          {user && (
            <button
              type="button"
              className="business-new-btn"
              onClick={() => navigate('/business/new')}
              disabled={!isOnline}
              title={!isOnline ? 'Connexion requise pour créer un projet' : undefined}
            >
              <Plus size={15} />
              Nouveau
            </button>
          )}
        </div>

        {/* ── Bannière offline ── */}
        {!isOnline && user && (
          <div className="business-offline-banner">
            <WifiOff size={13} />
            Mode hors ligne — les modifications sont enregistrées localement et synchronisées à la reconnexion.
          </div>
        )}

        {/* ── Bannière sync en attente ── */}
        {isOnline && user && pendingCount > 0 && (
          <div className="business-sync-banner">
            <Wifi size={13} />
            {pendingCount} modification{pendingCount > 1 ? 's' : ''} en attente de synchronisation.
            <button
              type="button"
              className="business-sync-btn"
              onClick={() => { void handleReplay() }}
              disabled={loading}
            >
              <RefreshCw size={11} />
              Synchroniser
            </button>
          </div>
        )}

        {/* ── Auth gate ── */}
        {!authLoading && !user && (
          <div className="business-auth-gate">
            <div className="business-auth-icon">🏢</div>
            <h2 className="business-auth-title">Connectez-vous pour accéder</h2>
            <p className="business-auth-desc">
              L'espace business est collaboratif et synchronisé dans le cloud. Un compte est requis.
            </p>
            <button
              type="button"
              className="business-auth-btn"
              onClick={() => navigate('/profile')}
            >
              <Wifi size={15} />
              Connecter mon compte
            </button>
          </div>
        )}

        {/* ── Skeleton (chargement initial) ── */}
        {authLoading || (user && loading && projects.length === 0) ? (
          <div className="business-skeleton">
            {[0, 1, 2].map((i) => (
              <div key={i} className="business-skeleton-card" />
            ))}
          </div>
        ) : null}

        {/* ── Liste projets ── */}
        {user && !loading && projects.length > 0 && (
          <div className="business-list">
            {projects.map((project) => (
              <BusinessProjectCard
                key={project.id}
                project={project}
                onClick={() => navigate(`/business/${project.id}/wizard`)}
              />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {user && !loading && projects.length === 0 && (
          <div className="business-empty">
            <div className="business-empty-icon">🏗️</div>
            <p className="business-empty-text">
              Aucun projet business pour l'instant. Créez votre premier projet pour démarrer les 7 étapes entrepreneur.
            </p>
            {isOnline && (
              <button
                type="button"
                className="business-new-btn"
                onClick={() => navigate('/business/new')}
              >
                <Plus size={15} />
                Créer un projet
              </button>
            )}
          </div>
        )}

      </div>
    </>
  )
}
