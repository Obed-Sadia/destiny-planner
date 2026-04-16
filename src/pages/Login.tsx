// DestinyPlanner — Page de connexion unifiée
// Requise pour l'espace personnel et business (session Supabase)

import { useState } from 'react'
import { Github } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'

const STYLE = `
  .login {
    min-height: 100dvh;
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-6);
    position: relative;
    overflow: hidden;
  }

  .login::before {
    content: '';
    position: absolute;
    top: -30%;
    right: -20%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(196,154,60,0.06) 0%, transparent 70%);
    pointer-events: none;
  }

  .login-card {
    width: 100%;
    max-width: 380px;
    animation: fadeIn 400ms ease both;
  }

  .login-eyebrow {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: var(--space-3);
  }

  .login-title {
    font-family: var(--font-editorial);
    font-size: var(--text-3xl);
    font-weight: 600;
    color: var(--text-1);
    line-height: 1.2;
    margin-bottom: var(--space-2);
  }

  .login-desc {
    font-size: var(--text-sm);
    color: var(--text-2);
    line-height: var(--leading-relaxed);
    margin-bottom: var(--space-8);
  }

  .login-divider {
    width: 40px;
    height: 2px;
    background: var(--gold);
    margin-bottom: var(--space-8);
    opacity: 0.6;
  }

  .login-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .login-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-3) var(--space-5);
    border-radius: var(--r-md);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    cursor: pointer;
    transition: opacity var(--transition-base);
    border: none;
  }

  .login-btn:hover:not(:disabled) { opacity: 0.88; }
  .login-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .login-btn-google {
    background: #fff;
    color: #1a1a1a;
  }

  .login-btn-github {
    background: var(--surface-2);
    color: var(--text-1);
    border: 1px solid var(--border);
  }

  .login-footer {
    margin-top: var(--space-6);
    font-size: var(--text-xs);
    color: var(--text-3);
    line-height: var(--leading-relaxed);
    text-align: center;
  }

  .login-error {
    margin-bottom: var(--space-4);
    padding: var(--space-3) var(--space-4);
    background: color-mix(in srgb, var(--destructive) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--destructive) 25%, transparent);
    border-radius: var(--r-md);
    font-size: var(--text-sm);
    color: var(--destructive);
  }
`

function GoogleIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export default function Login(): JSX.Element {
  const { signInWithGoogle, signInWithGitHub } = useAuthStore()
  const [loading, setLoading] = useState<'google' | 'github' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGoogle = async (): Promise<void> => {
    try {
      setLoading('google')
      setError(null)
      await signInWithGoogle('/')
    } catch {
      setError('Connexion Google échouée. Réessaie.')
      setLoading(null)
    }
  }

  const handleGitHub = async (): Promise<void> => {
    try {
      setLoading('github')
      setError(null)
      await signInWithGitHub('/')
    } catch {
      setError('Connexion GitHub échouée. Réessaie.')
      setLoading(null)
    }
  }

  const busy = loading !== null

  return (
    <>
      <style>{STYLE}</style>
      <div className="login">
        <div className="login-card">
          <div className="login-eyebrow">DestinyPlanner</div>
          <h1 className="login-title">Bâtis ton destin,<br />partout.</h1>
          <p className="login-desc">
            Connecte-toi pour synchroniser tes projets, habitudes et journal sur tous tes appareils.
          </p>
          <div className="login-divider" />

          {error && <div className="login-error">{error}</div>}

          <div className="login-buttons">
            <button
              type="button"
              className="login-btn login-btn-google"
              onClick={() => { void handleGoogle() }}
              disabled={busy}
            >
              <GoogleIcon />
              {loading === 'google' ? 'Redirection…' : 'Continuer avec Google'}
            </button>

            <button
              type="button"
              className="login-btn login-btn-github"
              onClick={() => { void handleGitHub() }}
              disabled={busy}
            >
              <Github size={16} />
              {loading === 'github' ? 'Redirection…' : 'Continuer avec GitHub'}
            </button>
          </div>

          <p className="login-footer">
            Tes données personnelles restent privées et accessibles uniquement depuis ton compte.
          </p>
        </div>
      </div>
    </>
  )
}
