// DestinyPlanner — Étape 6 : Vérifier
// Ressources disponibles vs besoins — décision go / no-go / négocier

import type { Step6Data, StepDecision } from '../../types'

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

  .resources-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }

  @media (max-width: 480px) {
    .resources-row {
      grid-template-columns: 1fr;
    }
  }

  .decision-options {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .decision-option {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    cursor: pointer;
    transition: all var(--transition-base);
    background: transparent;
    width: 100%;
    text-align: left;
  }

  .decision-option:hover {
    border-color: var(--border-2);
    background: var(--surface);
  }

  .decision-option-dot {
    width: 18px;
    height: 18px;
    border-radius: var(--r-full);
    border: 2px solid var(--border-2);
    flex-shrink: 0;
    margin-top: 2px;
    position: relative;
    transition: all var(--transition-base);
  }

  .decision-option--go {
    border-color: var(--green);
    background: rgba(90, 158, 111, 0.06);
  }
  .decision-option--go .decision-option-dot {
    border-color: var(--green);
  }
  .decision-option--go .decision-option-dot::after {
    content: '';
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 8px; height: 8px;
    border-radius: var(--r-full);
    background: var(--green);
  }

  .decision-option--no-go {
    border-color: var(--coral);
    background: rgba(224, 112, 112, 0.06);
  }
  .decision-option--no-go .decision-option-dot {
    border-color: var(--coral);
  }
  .decision-option--no-go .decision-option-dot::after {
    content: '';
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 8px; height: 8px;
    border-radius: var(--r-full);
    background: var(--coral);
  }

  .decision-option--negotiate {
    border-color: var(--amber);
    background: rgba(212, 133, 74, 0.06);
  }
  .decision-option--negotiate .decision-option-dot {
    border-color: var(--amber);
  }
  .decision-option--negotiate .decision-option-dot::after {
    content: '';
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 8px; height: 8px;
    border-radius: var(--r-full);
    background: var(--amber);
  }

  .decision-option-body {
    flex: 1;
  }

  .decision-option-title {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
    margin-bottom: 2px;
  }

  .decision-option-desc {
    font-size: var(--text-xs);
    color: var(--text-2);
    line-height: var(--leading-snug);
  }
`

const DECISION_OPTIONS: Array<{
  value: StepDecision
  label: string
  desc: string
  cls: string
}> = [
  {
    value: 'go',
    label: '✅ Go — Je lance',
    desc: "J'ai les ressources nécessaires ou un plan concret pour les obtenir. Je me lance.",
    cls: 'go',
  },
  {
    value: 'no-go',
    label: "🛑 No-go — Ce n'est pas le bon moment",
    desc: "Les ressources manquantes sont trop importantes. Je reporte ce projet pour le moment.",
    cls: 'no-go',
  },
  {
    value: 'negotiate',
    label: '🤝 Négocier — Je trouve une alternative',
    desc: "Il me manque certaines ressources mais j'ai un plan pour les acquérir ou les contourner.",
    cls: 'negotiate',
  },
]

interface Step6Props {
  data: Partial<Step6Data>
  onChange: (patch: Partial<Step6Data>) => void
}

export function Step6Verify({ data, onChange }: Step6Props): JSX.Element {
  return (
    <>
      <style>{STYLE}</style>
      <div className="step-form">
        <div className="resources-row">
          <div className="step-field">
            <label className="step-field-label" htmlFor="s6-available">
              Ressources disponibles
            </label>
            <textarea
              id="s6-available"
              className="step-field-input step-field-textarea"
              value={data.resources_available ?? ''}
              onChange={(e) => onChange({ resources_available: e.target.value })}
              placeholder="Ce que j'ai déjà : compétences, outils, budget, réseau…"
              rows={4}
              autoFocus
            />
          </div>

          <div className="step-field">
            <label className="step-field-label" htmlFor="s6-missing">
              Ressources manquantes
            </label>
            <textarea
              id="s6-missing"
              className="step-field-input step-field-textarea"
              value={data.resources_missing ?? ''}
              onChange={(e) => onChange({ resources_missing: e.target.value })}
              placeholder="Ce qu'il me faut encore : formation, financement, temps…"
              rows={4}
            />
          </div>
        </div>

        <div className="step-field">
          <span className="step-field-label">
            Ma décision <span className="step-field-required" aria-hidden="true">*</span>
          </span>
          <p className="step-field-hint">
            Confrontez vos ressources disponibles à vos besoins. Quelle est votre décision honnête ?
          </p>
          <div className="decision-options">
            {DECISION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`decision-option ${data.decision === opt.value ? `decision-option--${opt.cls}` : ''}`}
                onClick={() => onChange({ decision: opt.value })}
                aria-pressed={data.decision === opt.value}
              >
                <div className="decision-option-dot" />
                <div className="decision-option-body">
                  <div className="decision-option-title">{opt.label}</div>
                  <div className="decision-option-desc">{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {data.decision === 'negotiate' && (
          <div className="step-field">
            <label className="step-field-label" htmlFor="s6-negotiate">
              Plan de négociation
            </label>
            <p className="step-field-hint">
              Comment comptez-vous acquérir ou contourner les ressources manquantes ?
            </p>
            <textarea
              id="s6-negotiate"
              className="step-field-input step-field-textarea"
              value={data.negotiation_plan ?? ''}
              onChange={(e) => onChange({ negotiation_plan: e.target.value })}
              placeholder="Je vais obtenir X en faisant Y, dans un délai de Z…"
              rows={3}
            />
          </div>
        )}
      </div>
    </>
  )
}
