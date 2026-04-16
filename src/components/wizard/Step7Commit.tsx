// DestinyPlanner — Étape 7 : S'engager
// Critères de succès, KPIs, engagement solennel écrit et date de départ

import type { Step7Data } from '../../types'

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

  .kpi-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .kpi-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .kpi-badge {
    font-size: var(--text-xs);
    font-weight: var(--weight-bold);
    color: var(--step-7);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    width: 42px;
    flex-shrink: 0;
    text-align: right;
  }

  .commitment-section {
    background: var(--step-7-bg);
    border: 1px solid rgba(196, 154, 60, 0.25);
    border-radius: var(--r-lg);
    padding: var(--space-4) var(--space-5);
  }

  .commitment-eyebrow {
    font-size: var(--text-xs);
    font-weight: var(--weight-bold);
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: var(--space-3);
  }

  .commitment-textarea {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    font-family: var(--font-editorial);
    font-size: var(--text-base);
    color: var(--text-1);
    line-height: var(--leading-normal);
    caret-color: var(--gold);
    box-sizing: border-box;
  }

  .commitment-textarea::placeholder {
    color: var(--text-3);
    font-style: italic;
  }

  .start-row {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .start-date-input {
    color-scheme: dark;
    max-width: 200px;
  }
`

interface Step7Props {
  data: Partial<Step7Data>
  onChange: (patch: Partial<Step7Data>) => void
}

export function Step7Commit({ data, onChange }: Step7Props): JSX.Element {
  return (
    <>
      <style>{STYLE}</style>
      <div className="step-form">
        <div className="step-field">
          <label className="step-field-label" htmlFor="s7-criteria">
            Critères de succès
          </label>
          <p className="step-field-hint">
            Comment saurez-vous que ce projet est un succès ? Soyez précis et mesurable.
          </p>
          <textarea
            id="s7-criteria"
            className="step-field-input step-field-textarea"
            value={data.success_criteria ?? ''}
            onChange={(e) => onChange({ success_criteria: e.target.value })}
            placeholder="Ce projet sera un succès quand…"
            rows={3}
            autoFocus
          />
        </div>

        <div className="step-field">
          <span className="step-field-label">KPIs — Indicateurs clés</span>
          <p className="step-field-hint">
            3 métriques concrètes pour suivre votre progression (chiffres, dates, % d'avancement…).
          </p>
          <div className="kpi-group">
            {(['kpi_1', 'kpi_2', 'kpi_3'] as const).map((key, i) => (
              <div key={key} className="kpi-row">
                <span className="kpi-badge">KPI {i + 1}</span>
                <input
                  type="text"
                  className="step-field-input"
                  value={data[key] ?? ''}
                  onChange={(e) => onChange({ [key]: e.target.value })}
                  placeholder={`Ex : ${['Atteindre 100 clients', 'Publier 12 contenus', 'Générer 5 000 € de CA'][i]}…`}
                  aria-label={`KPI ${i + 1}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="step-field">
          <span className="step-field-label">
            Engagement écrit <span className="step-field-required" aria-hidden="true">*</span>
          </span>
          <p className="step-field-hint">
            Écrivez votre engagement en première personne. Ces mots ont du poids — prenez le temps.
          </p>
          <div className="commitment-section">
            <div className="commitment-eyebrow">Ma déclaration d'engagement</div>
            <textarea
              className="commitment-textarea"
              value={data.commitment_statement ?? ''}
              onChange={(e) => onChange({ commitment_statement: e.target.value })}
              placeholder="Moi, [prénom], je m'engage à… Je vais… Je ferai le nécessaire pour…"
              rows={5}
              aria-label="Déclaration d'engagement"
            />
          </div>
        </div>

        <div className="step-field">
          <label className="step-field-label" htmlFor="s7-start">
            Date de démarrage <span className="step-field-required" aria-hidden="true">*</span>
          </label>
          <p className="step-field-hint">
            Quand commencez-vous concrètement ?
          </p>
          <div className="start-row">
            <input
              id="s7-start"
              type="date"
              className="step-field-input start-date-input"
              value={data.start_date ?? ''}
              onChange={(e) => onChange({ start_date: e.target.value })}
              aria-label="Date de démarrage"
            />
          </div>
        </div>
      </div>
    </>
  )
}
