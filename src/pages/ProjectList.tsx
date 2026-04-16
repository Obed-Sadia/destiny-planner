// DestinyPlanner — Page liste des projets
// Groupés par statut : actifs → brouillons → en pause → terminés → abandonnés

import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useProjectStore } from '@/stores/useProjectStore'
import { useDomainStore } from '@/stores/useDomainStore'
import { ProjectCard } from '@/components/project/ProjectCard'
import type { Project, ProjectStatus } from '@/types'

const STATUS_ORDER: ProjectStatus[] = ['active', 'draft', 'paused', 'completed', 'abandoned']

const STATUS_SECTION_LABELS: Record<ProjectStatus, string> = {
  active:    'Projets actifs',
  draft:     'Brouillons',
  paused:    'En pause',
  completed: 'Terminés',
  abandoned: 'Abandonnés',
}

const STYLE = `
  .projects-page {
    max-width: 960px;
    padding-bottom: var(--space-16);
    animation: fadeIn 250ms ease both;
  }

  .projects-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    margin-bottom: var(--space-8);
    flex-wrap: wrap;
  }

  .projects-header-left {}

  .projects-eyebrow {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: var(--space-2);
  }

  .projects-title {
    font-family: var(--font-editorial);
    font-size: var(--text-3xl);
    font-weight: 600;
    color: var(--text-1);
    line-height: 1.15;
  }

  .projects-subtitle {
    font-size: var(--text-sm);
    color: var(--text-2);
    margin-top: var(--space-2);
  }

  .projects-new-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-5);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    background: var(--gold);
    color: var(--bg);
    border-radius: var(--r-md);
    text-decoration: none;
    transition: background var(--transition-base), transform var(--transition-fast);
    flex-shrink: 0;
  }

  .projects-new-btn:hover {
    background: var(--gold-soft);
    transform: translateY(-1px);
  }

  /* Stats */
  .projects-stats {
    display: flex;
    gap: var(--space-5);
    margin-bottom: var(--space-8);
    padding: var(--space-4) var(--space-5);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    flex-wrap: wrap;
  }

  .projects-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .projects-stat-value {
    font-family: var(--font-editorial);
    font-size: var(--text-2xl);
    font-weight: 600;
    color: var(--text-1);
    line-height: 1;
  }

  .projects-stat-label {
    font-size: var(--text-xs);
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .projects-stat-divider {
    width: 1px;
    background: var(--border);
    align-self: stretch;
    margin: var(--space-1) 0;
  }

  /* Sections par statut */
  .projects-section {
    margin-bottom: var(--space-8);
  }

  .projects-section-label {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: var(--space-4);
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .projects-section-count {
    font-size: var(--text-xs);
    color: var(--text-3);
    background: var(--surface-2);
    padding: 1px 6px;
    border-radius: var(--r-full);
  }

  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-4);
  }

  /* État vide */
  .projects-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--space-16) var(--space-8);
    gap: var(--space-4);
  }

  .projects-empty-icon {
    font-size: 3rem;
    opacity: 0.4;
    line-height: 1;
  }

  .projects-empty-title {
    font-family: var(--font-editorial);
    font-size: var(--text-xl);
    color: var(--text-2);
  }

  .projects-empty-desc {
    font-size: var(--text-sm);
    color: var(--text-3);
    max-width: 320px;
    line-height: var(--leading-normal);
  }

  .projects-empty-cta {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-6);
    background: var(--gold);
    color: var(--bg);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    border-radius: var(--r-md);
    text-decoration: none;
    margin-top: var(--space-2);
    transition: background var(--transition-base);
  }

  .projects-empty-cta:hover {
    background: var(--gold-soft);
  }
`

function groupByStatus(projects: Project[]): Partial<Record<ProjectStatus, Project[]>> {
  const grouped: Partial<Record<ProjectStatus, Project[]>> = {}
  for (const p of projects) {
    if (!grouped[p.status]) grouped[p.status] = []
    grouped[p.status]!.push(p)
  }
  return grouped
}

export default function ProjectList(): JSX.Element {
  const { projects, load } = useProjectStore()
  const { domains, load: loadDomains } = useDomainStore()

  useEffect(() => {
    load()
    loadDomains()
  }, [load, loadDomains])

  const grouped = groupByStatus(projects)
  const activeCount = grouped.active?.length ?? 0
  const draftCount = grouped.draft?.length ?? 0
  const completedCount = grouped.completed?.length ?? 0

  const hasProjects = projects.length > 0

  return (
    <>
      <style>{STYLE}</style>
      <div className="projects-page">

        {/* Header */}
        <div className="projects-header">
          <div className="projects-header-left">
            <div className="projects-eyebrow">Mes projets</div>
            <h1 className="projects-title">La tour</h1>
            <p className="projects-subtitle">
              Chaque projet est une étape vers votre but de vie.
            </p>
          </div>
          <Link to="/projects/new" className="projects-new-btn">
            <Plus size={15} />
            Nouveau projet
          </Link>
        </div>

        {/* État vide */}
        {!hasProjects && (
          <div className="projects-empty">
            <div className="projects-empty-icon" aria-hidden="true">🏗</div>
            <h2 className="projects-empty-title">Aucun projet pour l'instant</h2>
            <p className="projects-empty-desc">
              Commencez par bâtir votre premier projet en 7 étapes. Calculez le coût, planifiez les jalons, puis engagez-vous.
            </p>
            <Link to="/projects/new" className="projects-empty-cta">
              <Plus size={15} />
              Créer mon premier projet
            </Link>
          </div>
        )}

        {/* Stats */}
        {hasProjects && (
          <div className="projects-stats">
            <div className="projects-stat">
              <span className="projects-stat-value">{projects.length}</span>
              <span className="projects-stat-label">Total</span>
            </div>
            <div className="projects-stat-divider" />
            <div className="projects-stat">
              <span className="projects-stat-value" style={{ color: 'var(--green)' }}>
                {activeCount}
              </span>
              <span className="projects-stat-label">Actifs</span>
            </div>
            <div className="projects-stat-divider" />
            <div className="projects-stat">
              <span className="projects-stat-value" style={{ color: 'var(--amber)' }}>
                {draftCount}
              </span>
              <span className="projects-stat-label">Brouillons</span>
            </div>
            <div className="projects-stat-divider" />
            <div className="projects-stat">
              <span className="projects-stat-value" style={{ color: 'var(--teal)' }}>
                {completedCount}
              </span>
              <span className="projects-stat-label">Terminés</span>
            </div>
          </div>
        )}

        {/* Sections par statut */}
        {hasProjects && STATUS_ORDER.map((status) => {
          const group = grouped[status]
          if (!group?.length) return null
          return (
            <div key={status} className="projects-section">
              <div className="projects-section-label">
                {STATUS_SECTION_LABELS[status]}
                <span className="projects-section-count">{group.length}</span>
              </div>
              <div className="projects-grid">
                {group.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    domain={domains.find((d) => d.id === project.domain_id)}
                  />
                ))}
              </div>
            </div>
          )
        })}

      </div>
    </>
  )
}
