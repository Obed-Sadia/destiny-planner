// DestinyPlanner — Étape 5 : Calculer
// Budget détaillé, durée estimée, jalons datés (générés comme Milestone à la validation)

import { Plus, X } from 'lucide-react'
import type { Step5Data, Step5MilestoneDraft } from '../../types'

const STYLE = `
  .step-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .step-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .step-field-label {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
  }

  .step-field-required {
    color: var(--coral);
    margin-left: 2px;
  }

  .step-field-hint {
    font-size: var(--text-xs);
    color: var(--text-2);
    line-height: var(--leading-snug);
    margin-top: calc(-1 * var(--space-1));
  }

  .step-field-input {
    font-family: var(--font-ui);
    font-size: var(--text-base);
    color: var(--text-1);
    background: var(--surface-2);
    border: 1px solid var(--border-2);
    border-radius: var(--r-md);
    padding: var(--space-3) var(--space-4);
    outline: none;
    width: 100%;
    box-sizing: border-box;
    transition: border-color var(--transition-base);
    caret-color: var(--gold);
  }

  .step-field-input:focus {
    border-color: var(--gold);
  }

  .step-field-input::placeholder {
    color: var(--text-3);
    font-style: italic;
  }

  .step-field-textarea {
    resize: vertical;
    min-height: 72px;
    line-height: var(--leading-normal);
    font-family: var(--font-ui);
  }

  .milestone-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .milestone-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .milestone-index {
    width: 24px;
    height: 24px;
    border-radius: var(--r-full);
    background: var(--step-5-bg);
    border: 1px solid var(--step-5);
    color: var(--step-5);
    font-size: var(--text-xs);
    font-weight: var(--weight-bold);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .milestone-title-input {
    flex: 2;
    min-width: 0;
  }

  .milestone-date-input {
    flex: 1;
    min-width: 110px;
    color-scheme: dark;
  }

  .milestone-remove-btn {
    color: var(--text-3);
    padding: 4px;
    transition: color var(--transition-base);
    flex-shrink: 0;
    border-radius: var(--r-sm);
  }

  .milestone-remove-btn:hover {
    color: var(--coral);
  }

  .milestone-add-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-2);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--r-md);
    border: 1px dashed var(--border-2);
    width: 100%;
    justify-content: center;
    transition: all var(--transition-base);
    margin-top: var(--space-1);
  }

  .milestone-add-btn:hover {
    border-color: var(--step-5);
    color: var(--step-5);
    background: var(--step-5-bg);
  }

  .calc-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }

  @media (max-width: 480px) {
    .calc-row {
      grid-template-columns: 1fr;
    }
  }
`

interface Step5Props {
  data: Partial<Step5Data>
  onChange: (patch: Partial<Step5Data>) => void
}

export function Step5Calculate({ data, onChange }: Step5Props): JSX.Element {
  const drafts: Step5MilestoneDraft[] = data.milestones_draft ?? []

  function handleAddMilestone(): void {
    onChange({ milestones_draft: [...drafts, { title: '', due_date: '' }] })
  }

  function handleRemoveMilestone(index: number): void {
    onChange({ milestones_draft: drafts.filter((_, i) => i !== index) })
  }

  function handleMilestoneChange(
    index: number,
    field: keyof Step5MilestoneDraft,
    value: string,
  ): void {
    const updated = drafts.map((d, i) =>
      i === index ? { ...d, [field]: value } : d,
    )
    onChange({ milestones_draft: updated })
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className="step-form">
        <div className="calc-row">
          <div className="step-field">
            <label className="step-field-label" htmlFor="s5-budget">
              Budget estimé
            </label>
            <textarea
              id="s5-budget"
              className="step-field-input step-field-textarea"
              value={data.budget_detail ?? ''}
              onChange={(e) => onChange({ budget_detail: e.target.value })}
              placeholder="Détail des coûts : outils, formations, services…"
              rows={3}
              autoFocus
            />
          </div>

          <div className="step-field">
            <label className="step-field-label" htmlFor="s5-duration">
              Durée estimée
            </label>
            <textarea
              id="s5-duration"
              className="step-field-input step-field-textarea"
              value={data.duration_estimate ?? ''}
              onChange={(e) => onChange({ duration_estimate: e.target.value })}
              placeholder="Ex : 6 mois, 1 an et demi…"
              rows={3}
            />
          </div>
        </div>

        <div className="step-field">
          <span className="step-field-label">
            Jalons <span className="step-field-required" aria-hidden="true">*</span>
          </span>
          <p className="step-field-hint">
            Définissez au moins un jalon daté. Ces jalons seront créés automatiquement dans votre projet.
          </p>

          <div className="milestone-list">
            {drafts.map((draft, index) => (
              <div key={index} className="milestone-row">
                <span className="milestone-index" aria-hidden="true">
                  {index + 1}
                </span>
                <input
                  type="text"
                  className="step-field-input milestone-title-input"
                  value={draft.title}
                  onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                  placeholder={`Jalon ${index + 1}…`}
                  aria-label={`Titre du jalon ${index + 1}`}
                />
                <input
                  type="date"
                  className="step-field-input milestone-date-input"
                  value={draft.due_date}
                  onChange={(e) => handleMilestoneChange(index, 'due_date', e.target.value)}
                  aria-label={`Date du jalon ${index + 1}`}
                />
                {drafts.length > 1 && (
                  <button
                    type="button"
                    className="milestone-remove-btn"
                    onClick={() => handleRemoveMilestone(index)}
                    aria-label={`Supprimer le jalon ${index + 1}`}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              className="milestone-add-btn"
              onClick={handleAddMilestone}
            >
              <Plus size={15} />
              Ajouter un jalon
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
