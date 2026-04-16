// DestinyPlanner — Étape 1 : Vision
// Titre du projet, description, image de réussite imaginée

import type { Step1Data } from '../../types'

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
    min-height: 80px;
    line-height: var(--leading-normal);
    font-family: var(--font-ui);
  }

  .step-field-input-title {
    font-family: var(--font-editorial);
    font-size: var(--text-xl);
    font-weight: 600;
  }
`

interface Step1Props {
  data: Partial<Step1Data>
  onChange: (patch: Partial<Step1Data>) => void
}

export function Step1Vision({ data, onChange }: Step1Props): JSX.Element {
  return (
    <>
      <style>{STYLE}</style>
      <div className="step-form">
        <div className="step-field">
          <label className="step-field-label" htmlFor="s1-title">
            Nom du projet <span className="step-field-required" aria-hidden="true">*</span>
          </label>
          <p className="step-field-hint">Un titre clair et inspirant pour votre projet.</p>
          <input
            id="s1-title"
            className="step-field-input step-field-input-title"
            type="text"
            value={data.title ?? ''}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Ex : Lancer ma formation en ligne"
            maxLength={100}
            autoFocus
          />
        </div>

        <div className="step-field">
          <label className="step-field-label" htmlFor="s1-description">
            Description
          </label>
          <p className="step-field-hint">Décrivez le projet en 2–3 phrases. Quel est l'enjeu ?</p>
          <textarea
            id="s1-description"
            className="step-field-input step-field-textarea"
            value={data.description ?? ''}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Ce projet consiste à…"
            rows={3}
          />
        </div>

        <div className="step-field">
          <label className="step-field-label" htmlFor="s1-success">
            Image de réussite
          </label>
          <p className="step-field-hint">
            Dans 12 mois, le projet est accompli. Que voyez-vous ? Comment vous sentez-vous ?
          </p>
          <textarea
            id="s1-success"
            className="step-field-input step-field-textarea"
            value={data.success_image ?? ''}
            onChange={(e) => onChange({ success_image: e.target.value })}
            placeholder="Je vois… Je ressens… Je suis fier(ère) de…"
            rows={4}
          />
        </div>
      </div>
    </>
  )
}
