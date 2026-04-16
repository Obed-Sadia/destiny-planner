// DestinyPlanner — Page "Domaines de vie"
// 6 domaines par défaut + ajout personnalisé, édition inline goal_statement

import { useState, useEffect, useRef } from 'react'
import { Plus, X, Check } from 'lucide-react'
import { useDomainStore } from '@/stores/useDomainStore'
import type { Domain } from '@/types'

const STYLE = `
  .domains-page {
    max-width: 860px;
    padding-bottom: var(--space-16);
    animation: fadeIn 250ms ease both;
  }

  .domains-header {
    margin-bottom: var(--space-8);
  }

  .domains-eyebrow {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: var(--space-2);
  }

  .domains-title {
    font-family: var(--font-editorial);
    font-size: var(--text-3xl);
    font-weight: 600;
    color: var(--text-1);
    line-height: 1.15;
  }

  .domains-subtitle {
    font-size: var(--text-sm);
    color: var(--text-2);
    margin-top: var(--space-2);
  }

  .domains-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: var(--space-4);
  }

  .domain-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    overflow: hidden;
    transition: border-color var(--transition-base), box-shadow var(--transition-base);
    display: flex;
    flex-direction: column;
  }

  .domain-card:hover {
    border-color: var(--border-2);
    box-shadow: var(--shadow-md);
  }

  .domain-card-accent {
    height: 3px;
    width: 100%;
    flex-shrink: 0;
  }

  .domain-card-body {
    padding: var(--space-4) var(--space-5);
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .domain-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: var(--space-3);
  }

  .domain-card-icon {
    font-size: 1.5rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .domain-card-name {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
    margin-top: var(--space-2);
    line-height: 1.3;
  }

  .domain-card-statement-wrap {
    flex: 1;
    margin-top: var(--space-3);
    padding-top: var(--space-3);
    border-top: 1px solid var(--border);
  }

  .domain-card-statement {
    width: 100%;
    font-size: var(--text-sm);
    color: var(--text-2);
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    line-height: var(--leading-normal);
    min-height: 54px;
    caret-color: var(--gold);
    font-family: var(--font-ui);
    transition: color var(--transition-base);
  }

  .domain-card-statement::placeholder {
    color: var(--text-3);
    font-style: italic;
  }

  .domain-card-statement:focus {
    color: var(--text-1);
  }

  .domain-card-delete {
    opacity: 0;
    color: var(--text-3);
    transition: opacity var(--transition-base), color var(--transition-base);
    cursor: pointer;
    padding: 2px;
  }

  .domain-card:hover .domain-card-delete {
    opacity: 1;
  }

  .domain-card-delete:hover {
    color: var(--coral);
  }

  /* Carte "Ajouter un domaine" */
  .domain-add-card {
    background: transparent;
    border: 1px dashed var(--border-2);
    border-radius: var(--r-lg);
    min-height: 140px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    cursor: pointer;
    transition: border-color var(--transition-base), background var(--transition-base);
    color: var(--text-3);
    padding: var(--space-5);
  }

  .domain-add-card:hover {
    border-color: var(--gold);
    background: var(--gold-pale);
    color: var(--gold);
  }

  .domain-add-card-label {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
  }

  /* Formulaire d'ajout */
  .domain-add-form {
    background: var(--surface);
    border: 1px solid var(--gold);
    border-radius: var(--r-lg);
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .domain-add-form-title {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
  }

  .domain-add-row {
    display: flex;
    gap: var(--space-3);
    align-items: center;
  }

  .domain-add-emoji-input {
    width: 48px;
    height: 48px;
    text-align: center;
    font-size: 1.25rem;
    background: var(--surface-2);
    border: 1px solid var(--border-2);
    border-radius: var(--r-md);
    cursor: text;
    flex-shrink: 0;
  }

  .domain-add-name-input {
    flex: 1;
    font-size: var(--text-base);
    color: var(--text-1);
    background: var(--surface-2);
    border: 1px solid var(--border-2);
    border-radius: var(--r-md);
    padding: var(--space-3) var(--space-4);
    outline: none;
    transition: border-color var(--transition-base);
  }

  .domain-add-name-input:focus {
    border-color: var(--gold);
  }

  .domain-add-name-input::placeholder {
    color: var(--text-3);
  }

  .domain-add-actions {
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
  }

  .domain-add-btn-cancel {
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    color: var(--text-2);
    border-radius: var(--r-md);
    transition: color var(--transition-base);
  }

  .domain-add-btn-cancel:hover {
    color: var(--text-1);
  }

  .domain-add-btn-save {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    background: var(--gold);
    color: var(--bg);
    border-radius: var(--r-md);
    transition: background var(--transition-base);
  }

  .domain-add-btn-save:hover:not(:disabled) {
    background: var(--gold-soft);
  }

  .domain-add-btn-save:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const ACCENT_COLORS = [
  'var(--gold)',
  'var(--green)',
  'var(--amber)',
  'var(--teal)',
  'var(--purple)',
  'var(--blue)',
]

function accentForDomain(sortOrder: number): string {
  return ACCENT_COLORS[sortOrder % ACCENT_COLORS.length]
}

// ── DomainCard ────────────────────────────────────────────────

interface DomainCardProps {
  domain: Domain
  accent: string
  onStatementChange: (id: string, statement: string) => void
  onDelete?: (id: string) => void
}

function DomainCard({ domain, accent, onStatementChange, onDelete }: DomainCardProps): JSX.Element {
  const [statement, setStatement] = useState(domain.goal_statement ?? '')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>): void {
    const val = e.target.value
    setStatement(val)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      onStatementChange(domain.id, val)
    }, 300)
  }

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
  }, [])

  return (
    <div className="domain-card">
      <div className="domain-card-accent" style={{ background: accent }} />
      <div className="domain-card-body">
        <div className="domain-card-top">
          <span className="domain-card-icon" aria-hidden="true">{domain.icon}</span>
          {!domain.is_default && onDelete && (
            <button
              className="domain-card-delete"
              onClick={() => onDelete(domain.id)}
              aria-label={`Supprimer le domaine ${domain.name}`}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="domain-card-name">{domain.name}</div>
        <div className="domain-card-statement-wrap">
          <textarea
            className="domain-card-statement"
            value={statement}
            onChange={handleChange}
            placeholder="Mon but pour ce domaine…"
            rows={2}
            aria-label={`But pour le domaine ${domain.name}`}
          />
        </div>
      </div>
    </div>
  )
}

// ── Page Domains ──────────────────────────────────────────────

export default function Domains(): JSX.Element {
  const { domains, load, updateDomain, addDomain, deleteDomain } = useDomainStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEmoji, setNewEmoji] = useState('✨')
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [load])

  async function handleStatementChange(id: string, goal_statement: string): Promise<void> {
    await updateDomain(id, { goal_statement })
  }

  async function handleAddDomain(): Promise<void> {
    if (!newName.trim() || saving) return
    setSaving(true)
    await addDomain({
      name: newName.trim(),
      icon: newEmoji || '✨',
      goal_statement: '',
      sort_order: domains.length,
    })
    setNewName('')
    setNewEmoji('✨')
    setShowAddForm(false)
    setSaving(false)
  }

  async function handleDelete(id: string): Promise<void> {
    await deleteDomain(id)
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className="domains-page">
        <div className="domains-header">
          <div className="domains-eyebrow">Architecture de vie</div>
          <h1 className="domains-title">Mes domaines</h1>
          <p className="domains-subtitle">
            Les 6 sphères de votre destinée. Chaque projet s'enracine dans l'un d'eux.
          </p>
        </div>

        <div className="domains-grid">
          {domains.map((domain) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              accent={accentForDomain(domain.sort_order)}
              onStatementChange={handleStatementChange}
              onDelete={!domain.is_default ? handleDelete : undefined}
            />
          ))}

          {/* Carte d'ajout */}
          {showAddForm ? (
            <div className="domain-add-form">
              <div className="domain-add-form-title">Nouveau domaine</div>
              <div className="domain-add-row">
                <input
                  className="domain-add-emoji-input"
                  type="text"
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  maxLength={2}
                  aria-label="Emoji du domaine"
                />
                <input
                  className="domain-add-name-input"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddDomain() }}
                  placeholder="Nom du domaine…"
                  maxLength={40}
                  autoFocus
                  aria-label="Nom du domaine"
                />
              </div>
              <div className="domain-add-actions">
                <button
                  className="domain-add-btn-cancel"
                  onClick={() => { setShowAddForm(false); setNewName(''); setNewEmoji('✨') }}
                >
                  Annuler
                </button>
                <button
                  className="domain-add-btn-save"
                  disabled={!newName.trim() || saving}
                  onClick={handleAddDomain}
                >
                  <Check size={13} strokeWidth={2.5} />
                  Ajouter
                </button>
              </div>
            </div>
          ) : (
            <button className="domain-add-card" onClick={() => setShowAddForm(true)}>
              <Plus size={20} aria-hidden="true" />
              <span className="domain-add-card-label">Ajouter un domaine</span>
            </button>
          )}
        </div>
      </div>
    </>
  )
}
