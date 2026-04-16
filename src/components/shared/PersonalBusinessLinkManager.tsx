// DestinyPlanner — Gestionnaire de liens perso-business (Session 30)
// Permet de lier un domaine de vie à un projet business local
// Les liens ne sont jamais synchronisés vers Supabase

import { useState } from 'react'
import { Link2, Trash2, Plus } from 'lucide-react'
import { usePersonalBusinessLinkStore } from '../../stores/usePersonalBusinessLinkStore'
import { useDomainStore } from '../../stores/useDomainStore'
import type { BusinessProjectCache } from '../../db/schema'
import type { PersonalBusinessLink } from '../../types'

const STYLE = `
  .pbl-manager {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    overflow: hidden;
  }

  .pbl-header {
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .pbl-header-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-2);
  }

  .pbl-add-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: none;
    border: 1px solid var(--border-2);
    border-radius: var(--r-sm);
    color: var(--text-2);
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    cursor: pointer;
    transition: border-color var(--transition-fast), color var(--transition-fast);
  }
  .pbl-add-btn:hover {
    border-color: var(--teal);
    color: var(--teal);
  }

  .pbl-empty {
    padding: var(--space-4);
    text-align: center;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-3);
  }

  .pbl-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .pbl-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border);
  }
  .pbl-item:last-child {
    border-bottom: none;
  }

  .pbl-item-icon {
    flex-shrink: 0;
    color: var(--teal);
    opacity: 0.7;
  }

  .pbl-item-info {
    flex: 1;
    min-width: 0;
  }

  .pbl-item-title {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text-1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pbl-item-meta {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-3);
    margin-top: 2px;
  }

  .pbl-status-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 6px;
    border-radius: var(--r-sm);
    font-family: var(--font-ui);
    font-size: 10px;
    font-weight: var(--weight-medium);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    flex-shrink: 0;
  }

  .pbl-delete-btn {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: var(--text-3);
    border-radius: var(--r-sm);
    transition: color var(--transition-fast), background var(--transition-fast);
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  .pbl-delete-btn:hover {
    color: var(--coral);
    background: rgba(255,100,100,0.08);
  }

  /* Formulaire d'ajout */
  .pbl-form {
    padding: var(--space-4);
    border-top: 1px solid var(--border);
    background: var(--surface-2);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .pbl-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }

  @media (max-width: 640px) {
    .pbl-form-row {
      grid-template-columns: 1fr;
    }
  }

  .pbl-label {
    display: block;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--text-2);
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .pbl-select {
    width: 100%;
    padding: 7px 10px;
    background: var(--surface);
    border: 1px solid var(--border-2);
    border-radius: var(--r-md);
    color: var(--text-1);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    appearance: none;
    cursor: pointer;
  }
  .pbl-select:focus {
    outline: none;
    border-color: var(--teal);
  }

  .pbl-form-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-2);
  }

  .pbl-btn-cancel {
    padding: 6px 14px;
    background: none;
    border: 1px solid var(--border-2);
    border-radius: var(--r-md);
    color: var(--text-2);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    cursor: pointer;
  }

  .pbl-btn-save {
    padding: 6px 14px;
    background: rgba(45,165,138,0.15);
    border: 1px solid rgba(45,165,138,0.3);
    border-radius: var(--r-md);
    color: var(--teal);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: background var(--transition-fast);
  }
  .pbl-btn-save:hover:not(:disabled) {
    background: rgba(45,165,138,0.25);
  }
  .pbl-btn-save:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .pbl-no-business {
    padding: var(--space-4);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-3);
    text-align: center;
  }
`

const STATUS_STYLES: Record<PersonalBusinessLink['business_project_status'], { bg: string; color: string; label: string }> = {
  active:    { bg: 'rgba(90,158,111,0.15)',  color: 'var(--green)',  label: 'Actif'    },
  paused:    { bg: 'rgba(196,154,60,0.15)',  color: 'var(--gold)',   label: 'En pause' },
  completed: { bg: 'rgba(45,165,138,0.15)',  color: 'var(--teal)',   label: 'Terminé'  },
  abandoned: { bg: 'rgba(180,100,100,0.15)', color: 'var(--coral)',  label: 'Abandonné'},
}

interface Props {
  businessProjects: BusinessProjectCache[]
  goalId: string
}

export function PersonalBusinessLinkManager({ businessProjects, goalId }: Props): JSX.Element {
  const { links, addLink, removeLink } = usePersonalBusinessLinkStore()
  const { domains } = useDomainStore()

  const [showForm, setShowForm] = useState(false)
  const [selectedDomainId, setSelectedDomainId] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')

  const canSave = selectedDomainId !== '' && selectedProjectId !== ''

  // Projets business non encore liés
  const linkedProjectIds = new Set(links.map((l) => l.business_project_id))
  const availableProjects = businessProjects.filter((p) => !linkedProjectIds.has(p.id))

  const handleSave = async (): Promise<void> => {
    if (!canSave) return
    const project = businessProjects.find((p) => p.id === selectedProjectId)
    if (!project) return

    const status = (project.status as PersonalBusinessLink['business_project_status']) ?? 'active'

    await addLink({
      goal_id: goalId,
      domain_id: selectedDomainId,
      business_project_id: project.id,
      business_project_title: project.title,
      business_project_status: status,
    })
    setSelectedDomainId('')
    setSelectedProjectId('')
    setShowForm(false)
  }

  const domainName = (id: string): string =>
    domains.find((d) => d.id === id)?.name ?? id

  return (
    <>
      <style>{STYLE}</style>
      <div className="pbl-manager">
        <div className="pbl-header">
          <span className="pbl-header-title">
            <Link2 size={12} />
            Liens perso — business
          </span>
          {businessProjects.length > 0 && availableProjects.length > 0 && !showForm && (
            <button
              type="button"
              className="pbl-add-btn"
              onClick={() => setShowForm(true)}
            >
              <Plus size={12} />
              Lier
            </button>
          )}
        </div>

        {businessProjects.length === 0 ? (
          <div className="pbl-no-business">
            Aucun projet business — connectez-vous pour en créer.
          </div>
        ) : (
          <>
            {links.length === 0 && !showForm ? (
              <div className="pbl-empty">
                Aucun lien. Associez un projet business à un domaine de vie.
              </div>
            ) : (
              <ul className="pbl-list">
                {links.map((link) => {
                  const s = STATUS_STYLES[link.business_project_status]
                  return (
                    <li key={link.id} className="pbl-item">
                      <Link2 size={14} className="pbl-item-icon" />
                      <div className="pbl-item-info">
                        <div className="pbl-item-title">{link.business_project_title}</div>
                        <div className="pbl-item-meta">
                          → {domainName(link.domain_id)}
                        </div>
                      </div>
                      <span
                        className="pbl-status-badge"
                        style={{ background: s.bg, color: s.color }}
                      >
                        {s.label}
                      </span>
                      <button
                        type="button"
                        className="pbl-delete-btn"
                        onClick={() => { void removeLink(link.id) }}
                        aria-label="Supprimer le lien"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            {showForm && (
              <div className="pbl-form">
                <div className="pbl-form-row">
                  <div>
                    <label className="pbl-label" htmlFor="pbl-domain">Domaine de vie</label>
                    <select
                      id="pbl-domain"
                      className="pbl-select"
                      value={selectedDomainId}
                      onChange={(e) => setSelectedDomainId(e.target.value)}
                    >
                      <option value="">Choisir un domaine…</option>
                      {domains.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="pbl-label" htmlFor="pbl-project">Projet business</label>
                    <select
                      id="pbl-project"
                      className="pbl-select"
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                    >
                      <option value="">Choisir un projet…</option>
                      {availableProjects.map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="pbl-form-actions">
                  <button
                    type="button"
                    className="pbl-btn-cancel"
                    onClick={() => { setShowForm(false); setSelectedDomainId(''); setSelectedProjectId('') }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="pbl-btn-save"
                    disabled={!canSave}
                    onClick={() => { void handleSave() }}
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
