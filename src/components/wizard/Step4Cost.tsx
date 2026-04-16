// DestinyPlanner — Étape 4 : Compter le coût
// Coût financier, temps, énergie, relations — et décision de payer

import type { Step4Data } from '../../types'

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

  .cost-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }

  @media (max-width: 480px) {
    .cost-grid {
      grid-template-columns: 1fr;
    }
  }

  .cost-cell {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .cost-cell-label {
    font-size: var(--text-xs);
    font-weight: var(--weight-bold);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .toggle-row {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    cursor: pointer;
    transition: all var(--transition-base);
    text-align: left;
    width: 100%;
  }

  .toggle-row:hover {
    border-color: var(--border-2);
  }

  .toggle-row--active {
    border-color: var(--green);
    background: rgba(90, 158, 111, 0.08);
  }

  .toggle-checkbox {
    width: 18px;
    height: 18px;
    accent-color: var(--green);
    flex-shrink: 0;
    margin-top: 1px;
    cursor: pointer;
  }

  .toggle-text {
    font-size: var(--text-sm);
    color: var(--text-2);
    line-height: var(--leading-snug);
  }

  .toggle-row--active .toggle-text {
    color: var(--text-1);
  }

  .toggle-text strong {
    font-weight: var(--weight-semibold);
    display: block;
    margin-bottom: 2px;
  }
`

const COST_CELLS = [
  {
    key: 'financial_cost' as const,
    label: '💰 Financier',
    color: 'var(--green)',
    placeholder: 'Budget estimé, investissements nécessaires…',
    required: true,
  },
  {
    key: 'time_cost' as const,
    label: '⏱ Temps',
    color: 'var(--blue)',
    placeholder: 'Heures par semaine, durée totale…',
    required: false,
  },
  {
    key: 'energy_cost' as const,
    label: '⚡ Énergie',
    color: 'var(--amber)',
    placeholder: 'Effort mental, physique, émotionnel…',
    required: false,
  },
  {
    key: 'relationship_impact' as const,
    label: '👥 Relations',
    color: 'var(--purple)',
    placeholder: 'Impact sur famille, amis, collègues…',
    required: false,
  },
]

interface Step4Props {
  data: Partial<Step4Data>
  onChange: (patch: Partial<Step4Data>) => void
}

export function Step4Cost({ data, onChange }: Step4Props): JSX.Element {
  const readyToPay = data.ready_to_pay

  return (
    <>
      <style>{STYLE}</style>
      <div className="step-form">
        <div className="cost-grid">
          {COST_CELLS.map((cell) => (
            <div key={cell.key} className="cost-cell">
              <span className="cost-cell-label" style={{ color: cell.color }}>
                {cell.label}
                {cell.required && (
                  <span style={{ color: 'var(--coral)', marginLeft: 4, fontSize: '10px', fontWeight: 600 }}>
                    requis
                  </span>
                )}
              </span>
              <textarea
                className="step-field-input step-field-textarea"
                value={data[cell.key] ?? ''}
                onChange={(e) => onChange({ [cell.key]: e.target.value })}
                placeholder={cell.placeholder}
                aria-label={cell.label}
                rows={3}
                autoFocus={cell.key === 'financial_cost'}
              />
            </div>
          ))}
        </div>

        <div className="step-field">
          <label className="step-field-label" htmlFor="s4-sacrifices">
            Sacrifices concrets
          </label>
          <p className="step-field-hint">
            Qu'allez-vous devoir mettre de côté, reporter ou abandonner pour avancer sur ce projet ?
          </p>
          <textarea
            id="s4-sacrifices"
            className="step-field-input step-field-textarea"
            value={data.sacrifices ?? ''}
            onChange={(e) => onChange({ sacrifices: e.target.value })}
            placeholder="Je devrai renoncer à… Je devrai réduire…"
            rows={3}
          />
        </div>

        <div className="step-field">
          <span className="step-field-label">
            Décision <span className="step-field-required" aria-hidden="true">*</span>
          </span>
          <p className="step-field-hint">
            Après avoir tout pesé, êtes-vous prêt(e) à payer ce coût ? Cette décision peut être "non" — c'est une réponse valide.
          </p>
          <button
            type="button"
            className={`toggle-row ${readyToPay === true ? 'toggle-row--active' : ''}`}
            onClick={() => onChange({ ready_to_pay: readyToPay === true ? undefined : true })}
            aria-pressed={readyToPay === true}
          >
            <input
              type="checkbox"
              className="toggle-checkbox"
              checked={readyToPay === true}
              readOnly
              tabIndex={-1}
              aria-hidden="true"
            />
            <span className="toggle-text">
              <strong>Je suis prêt(e) à payer ce coût</strong>
              J'ai bien évalué ce que ce projet me demandera, et j'accepte d'en payer le prix.
            </span>
          </button>
        </div>
      </div>
    </>
  )
}
