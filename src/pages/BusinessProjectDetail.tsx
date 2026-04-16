// DestinyPlanner — Détail d'un projet business (S36)
// Vue récapitulative + bouton "Publier comme modèle" (owner uniquement).

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Globe, Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { useBusinessStore } from '@/stores/useBusinessStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCommunityTemplatesStore } from '@/stores/useCommunityTemplatesStore'
import type { BusinessProject, BusinessProjectStep } from '@/lib/supabase.types'

// ─── Styles ──────────────────────────────────────────────────

const STYLE = `
  .bpd-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    animation: bpdFadeIn 200ms ease both;
  }

  @keyframes bpdFadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .bpd-back {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-3);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: color var(--transition-fast);
  }

  .bpd-back:hover { color: var(--text-1); }

  .bpd-hero {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .bpd-title-wrap {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .bpd-title {
    font-family: var(--font-editorial);
    font-size: var(--text-2xl);
    font-weight: 300;
    color: var(--text-1);
    line-height: var(--leading-tight);
  }

  .bpd-desc {
    font-size: var(--text-sm);
    color: var(--text-2);
  }

  .bpd-actions {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
    flex-shrink: 0;
  }

  .bpd-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: 8px 16px;
    border-radius: var(--r-md);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: opacity var(--transition-fast), border-color var(--transition-fast);
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text-2);
  }

  .bpd-btn:hover { border-color: var(--teal); color: var(--text-1); }
  .bpd-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .bpd-btn--primary {
    background: color-mix(in srgb, var(--teal) 15%, transparent);
    border-color: var(--teal);
    color: var(--teal);
  }

  .bpd-btn--primary:hover { opacity: 0.85; }

  /* ── Progression ── */
  .bpd-progress-section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .bpd-progress-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .bpd-progress-label {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
  }

  .bpd-progress-pct {
    font-size: var(--text-sm);
    color: var(--teal);
    font-weight: var(--weight-semibold);
  }

  .bpd-progress-bar-track {
    height: 6px;
    background: var(--surface-2);
    border-radius: var(--r-full);
    overflow: hidden;
  }

  .bpd-progress-bar-fill {
    height: 100%;
    background: var(--teal);
    border-radius: var(--r-full);
    transition: width 500ms ease;
  }

  /* ── Étapes ── */
  .bpd-steps {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .bpd-steps-title {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-2);
  }

  .bpd-step-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
  }

  .bpd-step-icon {
    flex-shrink: 0;
    color: var(--text-3);
  }

  .bpd-step-icon.completed { color: var(--teal); }
  .bpd-step-icon.active    { color: var(--gold); }

  .bpd-step-info {
    flex: 1;
    min-width: 0;
  }

  .bpd-step-name {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text-2);
  }

  .bpd-step-name.completed { color: var(--text-1); }

  .bpd-step-status {
    font-size: var(--text-xs);
    color: var(--text-3);
    margin-top: 2px;
  }

  /* ── Publish feedback ── */
  .bpd-publish-success {
    font-size: var(--text-xs);
    color: var(--teal);
    text-align: right;
  }

  /* ── Loading / error ── */
  .bpd-center {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-10);
    color: var(--text-3);
    font-size: var(--text-sm);
  }
`

const STEP_NAMES: Record<number, string> = {
  1: 'Vision du projet',
  2: 'Conviction ou impulsion ?',
  3: 'Forces & faiblesses',
  4: 'Coûts & sacrifices',
  5: 'Calcul & jalons',
  6: 'Vérification des ressources',
  7: 'S\'engager',
}

function stepIcon(status: string): JSX.Element {
  if (status === 'completed') return <CheckCircle2 size={16} className="bpd-step-icon completed" />
  if (status === 'active')    return <Clock size={16} className="bpd-step-icon active" />
  return <AlertCircle size={16} className="bpd-step-icon" />
}

// ─── Page ─────────────────────────────────────────────────────

export default function BusinessProjectDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { projects, steps: allSteps, loadProjects } = useBusinessStore()
  const { user } = useAuthStore()
  const { publishTemplate } = useCommunityTemplatesStore()

  const [publishing, setPublishing]     = useState(false)
  const [published, setPublished]       = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  useEffect(() => {
    if (projects.length === 0) loadProjects()
  }, [])

  const project: BusinessProject | undefined = projects.find((p) => p.id === id)
  const steps: BusinessProjectStep[] = allSteps
    .filter((s) => s.project_id === id)
    .sort((a, b) => a.step_number - b.step_number)

  const isOwner = project?.owner_id === user?.id

  async function handlePublish(): Promise<void> {
    if (!id || publishing) return
    setPublishing(true)
    setPublishError(null)
    try {
      await publishTemplate(id)
      setPublished(true)
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Erreur lors de la publication')
    } finally {
      setPublishing(false)
    }
  }

  if (!project) {
    return (
      <>
        <style>{STYLE}</style>
        <div className="bpd-center">
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          Chargement…
        </div>
      </>
    )
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className="bpd-page">

        <button className="bpd-back" onClick={() => navigate('/business')}>
          <ArrowLeft size={14} />
          Retour aux projets
        </button>

        <div className="bpd-hero">
          <div className="bpd-title-wrap">
            <h1 className="bpd-title">{project.title}</h1>
            {project.description && (
              <p className="bpd-desc">{project.description}</p>
            )}
          </div>

          <div className="bpd-actions">
            <button
              type="button"
              className="bpd-btn"
              onClick={() => navigate(`/business/${id}/wizard`)}
            >
              <Pencil size={14} />
              Continuer
            </button>

            {isOwner && project.status === 'active' && (
              <button
                type="button"
                className="bpd-btn bpd-btn--primary"
                disabled={publishing || published}
                onClick={handlePublish}
              >
                {publishing
                  ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Globe size={14} />
                }
                {published ? 'Publié ✓' : 'Publier comme modèle'}
              </button>
            )}
          </div>
        </div>

        {publishError && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--red, #e05252)' }}>{publishError}</p>
        )}
        {published && (
          <p className="bpd-publish-success">Modèle publié dans la galerie communautaire.</p>
        )}

        {/* Progression */}
        <div className="bpd-progress-section">
          <div className="bpd-progress-header">
            <span className="bpd-progress-label">Progression</span>
            <span className="bpd-progress-pct">{project.progress}%</span>
          </div>
          <div className="bpd-progress-bar-track">
            <div
              className="bpd-progress-bar-fill"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Étapes */}
        {steps.length > 0 && (
          <div className="bpd-steps">
            <p className="bpd-steps-title">Les 7 étapes</p>
            {steps.map((s) => (
              <div key={s.id} className="bpd-step-item">
                {stepIcon(s.status)}
                <div className="bpd-step-info">
                  <div className={`bpd-step-name${s.status === 'completed' ? ' completed' : ''}`}>
                    {s.step_number}. {STEP_NAMES[s.step_number]}
                  </div>
                  <div className="bpd-step-status">
                    {s.status === 'completed' && 'Complétée'}
                    {s.status === 'active'    && 'En cours'}
                    {s.status === 'locked'    && 'Verrouillée'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  )
}
