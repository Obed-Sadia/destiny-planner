// DestinyPlanner — Page acceptation invitation
// Route publique /invite/:token — hors Layout
// Auth si nécessaire (OAuth → redirectTo = cette page), puis acceptation automatique

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useMembersStore } from '@/stores/useMembersStore'

// ─── Styles ──────────────────────────────────────────────────

const STYLE = `
  .ia-root {
    min-height: 100dvh;
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-6);
  }

  .ia-card {
    background: var(--surface);
    border: 1px solid var(--border-2);
    border-radius: var(--r-xl, 16px);
    padding: var(--space-8) var(--space-8);
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-5);
    text-align: center;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
    animation: ia-up 300ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes ia-up {
    from { transform: translateY(16px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  /* Icône centrale */
  .ia-icon {
    width: 56px;
    height: 56px;
    border-radius: var(--r-full);
    background: color-mix(in srgb, var(--teal) 12%, transparent);
    border: 1.5px solid color-mix(in srgb, var(--teal) 30%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    line-height: 1;
  }

  .ia-icon--success {
    background: color-mix(in srgb, var(--green) 12%, transparent);
    border-color: color-mix(in srgb, var(--green) 30%, transparent);
  }

  .ia-icon--error {
    background: color-mix(in srgb, var(--coral) 12%, transparent);
    border-color: color-mix(in srgb, var(--coral) 25%, transparent);
  }

  /* Texte */
  .ia-eyebrow {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--teal);
  }

  .ia-title {
    font-family: var(--font-editorial);
    font-size: var(--text-2xl);
    font-weight: 600;
    color: var(--text-1);
    line-height: 1.2;
  }

  .ia-body {
    font-size: var(--text-sm);
    color: var(--text-2);
    line-height: var(--leading-normal);
    max-width: 300px;
  }

  /* Boutons OAuth */
  .ia-oauth-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    width: 100%;
  }

  .ia-oauth-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-3) var(--space-4);
    border-radius: var(--r-md);
    border: 1px solid var(--border-2);
    background: var(--surface-2);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
    cursor: pointer;
    transition: border-color var(--transition-base), background var(--transition-base);
  }

  .ia-oauth-btn:hover:not(:disabled) {
    border-color: var(--teal);
    background: var(--surface);
  }

  .ia-oauth-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .ia-oauth-icon {
    font-size: 1.1rem;
    line-height: 1;
  }

  /* Bouton primaire */
  .ia-primary-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-7);
    background: var(--teal);
    color: #fff;
    border: none;
    border-radius: var(--r-md);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    cursor: pointer;
    text-decoration: none;
    transition: opacity var(--transition-base);
  }

  .ia-primary-btn:hover { opacity: 0.88; }

  /* Spinner */
  .ia-spinner {
    width: 28px;
    height: 28px;
    border: 2.5px solid var(--border);
    border-top-color: var(--teal);
    border-radius: var(--r-full);
    animation: ia-spin 700ms linear infinite;
  }

  @keyframes ia-spin {
    to { transform: rotate(360deg); }
  }

  /* Séparateur */
  .ia-divider {
    width: 100%;
    height: 1px;
    background: var(--border);
  }

  .ia-small {
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  .ia-small a {
    color: var(--text-2);
    text-decoration: none;
  }

  .ia-small a:hover { color: var(--text-1); }
`

// ─── États de la page ────────────────────────────────────────

type PageState =
  | 'loading'        // vérification auth initiale
  | 'auth-required'  // pas connecté — afficher OAuth
  | 'accepting'      // authentifié — appel RPC en cours
  | 'success'        // invitation acceptée
  | 'already-member' // déjà membre du projet
  | 'invalid'        // token invalide ou expiré
  | 'error'          // erreur générique

// ─── Composant ───────────────────────────────────────────────

export default function InviteAccept(): JSX.Element {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuthStore()
  const { acceptInvite } = useMembersStore()

  const [state, setState] = useState<PageState>('loading')
  const [acceptedProjectId, setAcceptedProjectId] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  // Quand l'auth est résolue ET qu'on a un token → tenter l'acceptation
  useEffect(() => {
    if (authLoading) return
    if (!token) { setState('invalid'); return }

    if (!user) {
      setState('auth-required')
      return
    }

    // Utilisateur connecté → accepter l'invitation
    setState('accepting')

    acceptInvite(token)
      .then(({ projectId }) => {
        setAcceptedProjectId(projectId)
        setState('success')
      })
      .catch((err: Error) => {
        const msg = err.message ?? ''
        if (msg.includes('INVALID_OR_EXPIRED_TOKEN')) setState('invalid')
        else if (msg.includes('ALREADY_MEMBER')) {
          // Extraire le project_id du message (format "ALREADY_MEMBER:uuid")
          const parts = msg.split(':')
          if (parts[1]) setAcceptedProjectId(parts[1])
          setState('already-member')
        } else setState('error')
      })
  }, [authLoading, user, token, acceptInvite])

  // Connexion OAuth — redirectTo = page courante pour revenir après login
  async function handleOAuth(provider: 'google' | 'github'): Promise<void> {
    setSigningIn(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.href },
      })
      if (error) throw error
    } catch {
      setSigningIn(false)
    }
  }

  // ── Rendus selon l'état ──────────────────────────────────────

  function renderContent(): JSX.Element {
    switch (state) {

      case 'loading':
      case 'accepting':
        return (
          <>
            <div className="ia-icon">🏢</div>
            <div>
              <div className="ia-eyebrow">Invitation</div>
              <h1 className="ia-title">
                {state === 'loading' ? 'Chargement…' : 'Rejoindre le projet…'}
              </h1>
            </div>
            <div className="ia-spinner" aria-label="Chargement en cours" />
          </>
        )

      case 'auth-required':
        return (
          <>
            <div className="ia-icon">🏢</div>
            <div>
              <div className="ia-eyebrow">Invitation</div>
              <h1 className="ia-title">Rejoignez le projet</h1>
            </div>
            <p className="ia-body">
              Connectez-vous pour accepter cette invitation et accéder à l'espace collaboratif.
            </p>
            <div className="ia-oauth-group">
              <button
                type="button"
                className="ia-oauth-btn"
                disabled={signingIn}
                onClick={() => handleOAuth('google')}
              >
                <span className="ia-oauth-icon">🔵</span>
                Continuer avec Google
              </button>
              <button
                type="button"
                className="ia-oauth-btn"
                disabled={signingIn}
                onClick={() => handleOAuth('github')}
              >
                <span className="ia-oauth-icon">⬛</span>
                Continuer avec GitHub
              </button>
            </div>
            <div className="ia-divider" />
            <span className="ia-small">
              En vous connectant, vous acceptez de rejoindre ce projet collaboratif.
            </span>
          </>
        )

      case 'success':
        return (
          <>
            <div className="ia-icon ia-icon--success">✅</div>
            <div>
              <div className="ia-eyebrow">Bienvenue !</div>
              <h1 className="ia-title">Vous faites partie du projet</h1>
            </div>
            <p className="ia-body">
              Votre accès est activé. Rendez-vous dans l'espace Business pour démarrer.
            </p>
            <Link
              to={acceptedProjectId ? `/business/${acceptedProjectId}/wizard` : '/business'}
              className="ia-primary-btn"
            >
              Ouvrir le projet
            </Link>
          </>
        )

      case 'already-member':
        return (
          <>
            <div className="ia-icon ia-icon--success">👥</div>
            <div>
              <div className="ia-eyebrow">Déjà membre</div>
              <h1 className="ia-title">Vous êtes déjà dans ce projet</h1>
            </div>
            <p className="ia-body">
              Vous avez déjà accès à ce projet. Retrouvez-le dans votre espace Business.
            </p>
            <Link
              to={acceptedProjectId ? `/business/${acceptedProjectId}/wizard` : '/business'}
              className="ia-primary-btn"
            >
              Accéder au projet
            </Link>
          </>
        )

      case 'invalid':
        return (
          <>
            <div className="ia-icon ia-icon--error">⛔</div>
            <div>
              <div className="ia-eyebrow" style={{ color: 'var(--coral)' }}>Lien invalide</div>
              <h1 className="ia-title">Invitation expirée ou déjà utilisée</h1>
            </div>
            <p className="ia-body">
              Ce lien d'invitation n'est plus valide. Demandez un nouveau lien au propriétaire du projet.
            </p>
            <button
              type="button"
              className="ia-primary-btn"
              onClick={() => navigate('/')}
            >
              Retour à l'accueil
            </button>
          </>
        )

      case 'error':
        return (
          <>
            <div className="ia-icon ia-icon--error">⚠️</div>
            <div>
              <div className="ia-eyebrow" style={{ color: 'var(--amber)' }}>Erreur</div>
              <h1 className="ia-title">Une erreur est survenue</h1>
            </div>
            <p className="ia-body">
              Impossible de traiter votre invitation pour l'instant. Veuillez réessayer.
            </p>
            <button
              type="button"
              className="ia-primary-btn"
              onClick={() => {
                setState('accepting')
                if (token) {
                  acceptInvite(token)
                    .then(({ projectId }) => { setAcceptedProjectId(projectId); setState('success') })
                    .catch((err: Error) => {
                      const msg = err.message ?? ''
                      if (msg.includes('INVALID_OR_EXPIRED_TOKEN')) setState('invalid')
                      else if (msg.includes('ALREADY_MEMBER')) {
                        const parts = msg.split(':')
                        if (parts[1]) setAcceptedProjectId(parts[1])
                        setState('already-member')
                      } else setState('error')
                    })
                }
              }}
            >
              Réessayer
            </button>
          </>
        )
    }
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className="ia-root">
        <div className="ia-card">
          {renderContent()}
        </div>
      </div>
    </>
  )
}
