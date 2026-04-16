// DestinyPlanner — Suggestion de montée de niveau d'engagement
// Règle absolue : jamais imposée. Dismiss possible. Jamais de message négatif.
// Affiché quand streak >= 7j ET niveau actuel < 3.

import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { useUserStore } from '../../stores/useUserStore'
import type { UserProfile } from '../../types'

// Clé localStorage pour le dismiss quotidien
const DISMISS_KEY = 'dp_ep_dismissed'

function getSuggestedLevel(profile: UserProfile): 2 | 3 | null {
  if (profile.engagement_level === 1 && profile.streak >= 7) return 2
  if (profile.engagement_level === 2 && profile.streak >= 7) return 3
  return null
}

interface LevelCopy {
  title: string
  desc: string
  effort: string
  cta: string
}

const LEVEL_COPY: Record<2 | 3, LevelCopy> = {
  2: {
    title: 'Vous bâtissez avec constance',
    desc: '7 jours d\'affilée — vous êtes prêt à structurer votre journée. Le niveau Planificateur ajoute le journal du matin, les actions quotidiennes et le score d\'attitudes.',
    effort: '8 min / jour',
    cta: 'Passer au niveau Planificateur',
  },
  3: {
    title: 'Votre discipline est remarquable',
    desc: '7 jours au niveau Planificateur — vous pouvez embrasser l\'engagement total. Le niveau Bâtisseur ajoute le time-blocking des 24h et la revue du soir.',
    effort: '15 min / jour',
    cta: 'Devenir Bâtisseur Diligent',
  },
}

const STYLE = `
  .ep-banner {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--gold-pale);
    border: 1px solid rgba(196, 154, 60, 0.25);
    border-radius: var(--r-lg);
    animation: epSlideIn 300ms ease both;
  }

  @keyframes epSlideIn {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .ep-icon {
    flex-shrink: 0;
    color: var(--gold);
    margin-top: 1px;
  }

  .ep-body {
    flex: 1;
    min-width: 0;
  }

  .ep-title {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--gold-soft);
    line-height: var(--leading-snug);
    margin-bottom: var(--space-1);
  }

  .ep-desc {
    font-size: var(--text-xs);
    color: var(--text-2);
    line-height: var(--leading-normal);
    margin-bottom: var(--space-3);
  }

  .ep-effort {
    display: inline-block;
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--gold);
    background: rgba(196, 154, 60, 0.15);
    padding: 2px 8px;
    border-radius: var(--r-full);
    margin-bottom: var(--space-3);
  }

  .ep-actions {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .ep-btn-later {
    padding: 6px 12px;
    background: none;
    border: 1px solid var(--border-2);
    border-radius: var(--r-sm);
    font-size: var(--text-xs);
    color: var(--text-2);
    cursor: pointer;
    transition: border-color var(--transition-fast), color var(--transition-fast);
  }

  .ep-btn-later:hover {
    border-color: var(--border-2);
    color: var(--text-1);
  }

  .ep-btn-upgrade {
    padding: 6px 14px;
    background: var(--gold);
    border: none;
    border-radius: var(--r-sm);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: #0F0E0D;
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }

  .ep-btn-upgrade:hover:not(:disabled) {
    opacity: 0.88;
  }

  .ep-btn-upgrade:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .ep-close {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    color: var(--text-3);
    border-radius: var(--r-xs);
    transition: color var(--transition-fast);
    margin-top: -2px;
  }

  .ep-close:hover {
    color: var(--text-1);
  }
`

export function EngagementPrompt(): JSX.Element | null {
  const { profile, upgradeEngagementLevel } = useUserStore()
  const [upgrading, setUpgrading] = useState(false)
  const [hidden, setHidden] = useState(false)

  if (!profile || hidden) return null

  // Dismiss quotidien : ne plus afficher si déjà rejeté aujourd'hui
  const today = new Date().toISOString().slice(0, 10)
  if (typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY) === today) return null

  const suggested = getSuggestedLevel(profile)
  if (!suggested) return null

  const copy = LEVEL_COPY[suggested]

  const handleDismiss = (): void => {
    localStorage.setItem(DISMISS_KEY, today)
    setHidden(true)
  }

  const handleUpgrade = async (): Promise<void> => {
    setUpgrading(true)
    try {
      await upgradeEngagementLevel(suggested)
      setHidden(true)
    } finally {
      setUpgrading(false)
    }
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className="ep-banner" role="status" aria-live="polite">
        <span className="ep-icon" aria-hidden="true">
          <Sparkles size={16} />
        </span>

        <div className="ep-body">
          <p className="ep-title">{copy.title}</p>
          <p className="ep-desc">{copy.desc}</p>
          <span className="ep-effort">{copy.effort}</span>

          <div className="ep-actions">
            <button className="ep-btn-later" onClick={handleDismiss}>
              Plus tard
            </button>
            <button
              className="ep-btn-upgrade"
              onClick={() => { void handleUpgrade() }}
              disabled={upgrading}
            >
              {upgrading ? 'En cours…' : copy.cta}
            </button>
          </div>
        </div>

        <button className="ep-close" onClick={handleDismiss} aria-label="Ignorer la suggestion">
          <X size={14} />
        </button>
      </div>
    </>
  )
}
