// DestinyPlanner — Étape 2 : S'arrêter
// Réflexion avant d'agir : conviction profonde ou simple impulsion ?

import type { Step2Data } from '../../types'

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
    min-height: 100px;
    line-height: var(--leading-normal);
    font-family: var(--font-ui);
  }

  .conviction-options {
    display: flex;
    gap: var(--space-3);
    margin-top: var(--space-1);
  }

  .conviction-option {
    flex: 1;
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    cursor: pointer;
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    text-align: center;
    transition: all var(--transition-base);
    background: transparent;
    color: var(--text-2);
  }

  .conviction-option:hover {
    border-color: var(--border-2);
    color: var(--text-1);
  }

  .conviction-option--conviction {
    border-color: var(--step-2);
    background: var(--step-2-bg);
    color: var(--step-2);
  }

  .conviction-option--impulse {
    border-color: var(--amber);
    background: var(--step-4-bg);
    color: var(--amber);
  }
`

interface Step2Props {
  data: Partial<Step2Data>
  onChange: (patch: Partial<Step2Data>) => void
}

export function Step2Stop({ data, onChange }: Step2Props): JSX.Element {
  const selected = data.conviction_or_impulse

  return (
    <>
      <style>{STYLE}</style>
      <div className="step-form">
        <div className="step-field">
          <label className="step-field-label" htmlFor="s2-reflection">
            Ma réflexion <span className="step-field-required" aria-hidden="true">*</span>
          </label>
          <p className="step-field-hint">
            Prenez le temps de vous asseoir. D'où vient ce projet ? Pourquoi maintenant ?
          </p>
          <textarea
            id="s2-reflection"
            className="step-field-input step-field-textarea"
            value={data.reflection ?? ''}
            onChange={(e) => onChange({ reflection: e.target.value })}
            placeholder="Ce projet me tient à cœur parce que…"
            rows={5}
            autoFocus
          />
        </div>

        <div className="step-field">
          <span className="step-field-label">Ce projet vient de…</span>
          <p className="step-field-hint">
            Soyez honnête. Une conviction mûrie et une impulsion enthousiaste sont deux points de départ différents.
          </p>
          <div className="conviction-options">
            <button
              type="button"
              className={`conviction-option ${selected === 'conviction' ? 'conviction-option--conviction' : ''}`}
              onClick={() => onChange({ conviction_or_impulse: 'conviction' })}
            >
              Une conviction profonde
            </button>
            <button
              type="button"
              className={`conviction-option ${selected === 'impulse' ? 'conviction-option--impulse' : ''}`}
              onClick={() => onChange({ conviction_or_impulse: 'impulse' })}
            >
              Une impulsion du moment
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
