// DestinyPlanner — Étape 3 : Estimer (SWOT)
// Forces / Faiblesses / Opportunités / Menaces

import type { Step3Data } from '../../types'

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

  .step-field-hint {
    font-size: var(--text-xs);
    color: var(--text-2);
    line-height: var(--leading-snug);
    margin-top: calc(-1 * var(--space-1));
  }

  .swot-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }

  @media (max-width: 480px) {
    .swot-grid {
      grid-template-columns: 1fr;
    }
  }

  .swot-cell {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .swot-cell:focus-within {
    border-color: var(--border-2);
  }

  .swot-cell-header {
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-xs);
    font-weight: var(--weight-bold);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-shrink: 0;
  }

  .swot-cell-input {
    flex: 1;
    width: 100%;
    min-height: 90px;
    padding: var(--space-3);
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    color: var(--text-1);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    line-height: var(--leading-normal);
    caret-color: var(--gold);
    box-sizing: border-box;
  }

  .swot-cell-input::placeholder {
    color: var(--text-3);
    font-style: italic;
  }
`

const SWOT_CELLS = [
  {
    key: 'strengths' as const,
    label: 'Forces',
    emoji: '💪',
    color: 'var(--green)',
    bg: 'var(--step-5-bg)',
    placeholder: 'Compétences, ressources, avantages…',
    required: true,
  },
  {
    key: 'weaknesses' as const,
    label: 'Faiblesses',
    emoji: '⚠️',
    color: 'var(--coral)',
    bg: 'var(--step-6-bg)',
    placeholder: 'Lacunes, limitations, angles morts…',
    required: true,
  },
  {
    key: 'opportunities' as const,
    label: 'Opportunités',
    emoji: '🌱',
    color: 'var(--teal)',
    bg: 'var(--step-3-bg)',
    placeholder: 'Tendances, contexte favorable, alliés…',
    required: false,
  },
  {
    key: 'threats' as const,
    label: 'Menaces',
    emoji: '🛡',
    color: 'var(--amber)',
    bg: 'var(--step-4-bg)',
    placeholder: 'Obstacles, concurrents, risques…',
    required: false,
  },
]

interface Step3Props {
  data: Partial<Step3Data>
  onChange: (patch: Partial<Step3Data>) => void
}

export function Step3SWOT({ data, onChange }: Step3Props): JSX.Element {
  return (
    <>
      <style>{STYLE}</style>
      <div className="step-form">
        <div className="step-field">
          <span className="step-field-label">Analyse SWOT</span>
          <p className="step-field-hint">
            Soyez honnête — Forces et Faiblesses sont requises. Cette étape est l'une des plus importantes.
          </p>
        </div>
        <div className="swot-grid">
          {SWOT_CELLS.map((cell) => (
            <div key={cell.key} className="swot-cell">
              <div
                className="swot-cell-header"
                style={{ background: cell.bg, color: cell.color }}
              >
                <span aria-hidden="true">{cell.emoji}</span>
                {cell.label}
                {cell.required && (
                  <span style={{ color: 'var(--coral)', marginLeft: 'auto', fontSize: '10px' }}>
                    requis
                  </span>
                )}
              </div>
              <textarea
                className="swot-cell-input"
                value={data[cell.key] ?? ''}
                onChange={(e) => onChange({ [cell.key]: e.target.value })}
                placeholder={cell.placeholder}
                aria-label={cell.label}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
