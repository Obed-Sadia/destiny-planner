// DestinyPlanner — Galerie des templates communautaires (S36)

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, ArrowRight, Loader2, BookOpen } from 'lucide-react'
import { useCommunityTemplatesStore } from '@/stores/useCommunityTemplatesStore'
import type { CommunityTemplate, CommunityTemplateType } from '@/lib/supabase.types'

// ─── Constantes ──────────────────────────────────────────────

const FILTERS: { value: CommunityTemplateType | null; label: string; icon: string }[] = [
  { value: null,               label: 'Tous',           icon: '✦' },
  { value: 'product-launch',   label: 'Lancement',      icon: '🚀' },
  { value: 'company-creation', label: 'Création',       icon: '🏢' },
  { value: 'real-estate',      label: 'Immobilier',     icon: '🏠' },
  { value: 'partnership',      label: 'Partenariat',    icon: '🤝' },
  { value: 'fundraising',      label: 'Levée de fonds', icon: '💰' },
  { value: 'client-mission',   label: 'Prestation',     icon: '🎯' },
]

const TYPE_LABELS: Record<CommunityTemplateType, string> = {
  'product-launch':   'Lancement',
  'company-creation': 'Création',
  'real-estate':      'Immobilier',
  'partnership':      'Partenariat',
  'fundraising':      'Levée de fonds',
  'client-mission':   'Prestation',
}

// ─── Styles ──────────────────────────────────────────────────

const STYLE = `
  .ct-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    animation: ctFadeIn 200ms ease both;
  }

  @keyframes ctFadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .ct-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .ct-title {
    font-family: var(--font-editorial);
    font-size: var(--text-2xl);
    font-weight: 300;
    color: var(--text-1);
    line-height: var(--leading-tight);
  }

  .ct-subtitle {
    font-size: var(--text-sm);
    color: var(--text-3);
  }

  /* ── Filtres ── */
  .ct-filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .ct-filter-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: 5px 12px;
    border-radius: var(--r-full);
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text-2);
    font-size: var(--text-sm);
    cursor: pointer;
    transition: border-color var(--transition-fast), color var(--transition-fast),
                background var(--transition-fast);
  }

  .ct-filter-btn:hover {
    border-color: var(--teal);
    color: var(--text-1);
  }

  .ct-filter-btn.active {
    background: color-mix(in srgb, var(--teal) 15%, transparent);
    border-color: var(--teal);
    color: var(--teal);
  }

  /* ── Grille ── */
  .ct-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-4);
  }

  /* ── Carte ── */
  .ct-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    transition: border-color var(--transition-fast);
  }

  .ct-card:hover {
    border-color: var(--teal);
  }

  .ct-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .ct-card-title {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
    line-height: var(--leading-snug);
  }

  .ct-card-badge {
    font-size: var(--text-xs);
    color: var(--teal);
    background: color-mix(in srgb, var(--teal) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--teal) 25%, transparent);
    border-radius: var(--r-full);
    padding: 2px 8px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .ct-card-desc {
    font-size: var(--text-sm);
    color: var(--text-2);
    line-height: var(--leading-normal);
    flex: 1;
  }

  .ct-card-meta {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  .ct-card-steps {
    display: flex;
    gap: 3px;
  }

  .ct-step-dot {
    width: 6px;
    height: 6px;
    border-radius: var(--r-full);
    background: var(--teal);
    opacity: 0.4;
  }

  .ct-step-dot.filled {
    opacity: 1;
  }

  .ct-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding-top: var(--space-3);
    border-top: 1px solid var(--border);
  }

  .ct-uses {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  .ct-use-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: 6px 14px;
    background: var(--teal);
    color: #fff;
    border: none;
    border-radius: var(--r-md);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }

  .ct-use-btn:hover { opacity: 0.88; }
  .ct-use-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── États ── */
  .ct-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-8);
    color: var(--text-3);
    font-size: var(--text-sm);
  }

  .ct-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-10) var(--space-4);
    color: var(--text-3);
    text-align: center;
  }

  .ct-empty-icon {
    font-size: 2.5rem;
    opacity: 0.4;
  }

  .ct-load-more {
    display: flex;
    justify-content: center;
    padding-top: var(--space-2);
  }

  .ct-load-more-btn {
    padding: 8px 24px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    color: var(--text-2);
    font-size: var(--text-sm);
    cursor: pointer;
    transition: border-color var(--transition-fast), color var(--transition-fast);
  }

  .ct-load-more-btn:hover {
    border-color: var(--teal);
    color: var(--text-1);
  }
`

// ─── Sous-composant carte ─────────────────────────────────────

function filledSteps(stepsData: Record<string, unknown>): number {
  return Object.values(stepsData).filter((v) => v && Object.keys(v as object).length > 0).length
}

interface CardProps {
  template: CommunityTemplate
  onUse: (t: CommunityTemplate) => void
  using: boolean
}

function TemplateCard({ template, onUse, using }: CardProps): JSX.Element {
  const filled = filledSteps(template.steps_data)
  return (
    <div className="ct-card">
      <div className="ct-card-header">
        <span className="ct-card-title">{template.title}</span>
        <span className="ct-card-badge">{TYPE_LABELS[template.template_type]}</span>
      </div>

      {template.description && (
        <p className="ct-card-desc">{template.description}</p>
      )}

      <div className="ct-card-meta">
        <span>7 étapes</span>
        <div className="ct-card-steps" aria-label={`${filled} étapes remplies`}>
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} className={`ct-step-dot${i < filled ? ' filled' : ''}`} />
          ))}
        </div>
      </div>

      <div className="ct-card-footer">
        <span className="ct-uses">
          <Users size={11} />
          {template.uses_count} utilisation{template.uses_count !== 1 ? 's' : ''}
        </span>
        <button
          type="button"
          className="ct-use-btn"
          disabled={using}
          onClick={() => onUse(template)}
        >
          {using
            ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
            : <ArrowRight size={13} />
          }
          Utiliser
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export default function CommunityTemplates(): JSX.Element {
  const { templates, loading, hasMore, loadTemplates, loadMore, useTemplate } =
    useCommunityTemplatesStore()
  const navigate = useNavigate()

  const [activeFilter, setActiveFilter] = useState<CommunityTemplateType | null>(null)
  const [usingId, setUsingId] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates(activeFilter, true)
  }, [activeFilter])

  async function handleUse(template: CommunityTemplate): Promise<void> {
    setUsingId(template.id)
    try {
      const projectId = await useTemplate(template)
      navigate(`/business/${projectId}/wizard`)
    } catch {
      // Erreur loggée dans le store
    } finally {
      setUsingId(null)
    }
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className="ct-page">

        <div className="ct-header">
          <h1 className="ct-title">Templates communautaires</h1>
          <p className="ct-subtitle">
            Modèles partagés par la communauté — utilisez-en un pour démarrer votre projet.
          </p>
        </div>

        <div className="ct-filters">
          {FILTERS.map((f) => (
            <button
              key={String(f.value)}
              type="button"
              className={`ct-filter-btn${activeFilter === f.value ? ' active' : ''}`}
              onClick={() => setActiveFilter(f.value)}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        {loading && templates.length === 0 ? (
          <div className="ct-loading">
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Chargement…
          </div>
        ) : templates.length === 0 ? (
          <div className="ct-empty">
            <span className="ct-empty-icon">
              <BookOpen size={40} strokeWidth={1} />
            </span>
            <span>Aucun template dans cette catégorie pour l'instant.</span>
          </div>
        ) : (
          <>
            <div className="ct-grid">
              {templates.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onUse={handleUse}
                  using={usingId === t.id}
                />
              ))}
            </div>

            {hasMore && (
              <div className="ct-load-more">
                <button
                  type="button"
                  className="ct-load-more-btn"
                  disabled={loading}
                  onClick={() => loadMore(activeFilter)}
                >
                  {loading ? 'Chargement…' : 'Voir plus'}
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </>
  )
}
