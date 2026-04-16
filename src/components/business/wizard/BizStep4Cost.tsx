// Étape 4 business — Compter le coût
// Prompt CDC §5.2 : « Combien va te coûter ce projet en argent, en temps et en énergie ? Es-tu prêt à payer ce prix ? »

import type { Step4Data } from '../../../types'

interface Props {
  data: Partial<Step4Data>
  onChange: (patch: Partial<Step4Data>) => void
}

export function BizStep4Cost({ data, onChange }: Props): JSX.Element {
  return (
    <div className="step-form">
      <div className="step-field">
        <label className="step-field-label" htmlFor="bs4-financial">
          Coût financier <span className="step-field-required" aria-hidden="true">*</span>
        </label>
        <p className="step-field-hint">
          Investissement initial, coûts récurrents, runway nécessaire avant rentabilité.
        </p>
        <textarea
          id="bs4-financial"
          className="step-field-input step-field-textarea"
          value={data.financial_cost ?? ''}
          onChange={(e) => onChange({ financial_cost: e.target.value })}
          placeholder="Développement : X €, Marketing : Y €/mois, Runway estimé : Z mois…"
          rows={3}
        />
      </div>

      <div className="step-field">
        <label className="step-field-label" htmlFor="bs4-time">
          Coût en temps
        </label>
        <p className="step-field-hint">Heures par semaine, durée avant lancement, sacrifices de temps personnel ou professionnel.</p>
        <textarea
          id="bs4-time"
          className="step-field-input step-field-textarea"
          value={data.time_cost ?? ''}
          onChange={(e) => onChange({ time_cost: e.target.value })}
          placeholder="X heures/semaine pendant Y mois. Je sacrifierai…"
          rows={2}
        />
      </div>

      <div className="step-field">
        <label className="step-field-label" htmlFor="bs4-energy">
          Coût en énergie
        </label>
        <p className="step-field-hint">Charge mentale, stress anticipé, impact sur ta santé et concentration.</p>
        <textarea
          id="bs4-energy"
          className="step-field-input step-field-textarea"
          value={data.energy_cost ?? ''}
          onChange={(e) => onChange({ energy_cost: e.target.value })}
          placeholder="Ce projet exigera…"
          rows={2}
        />
      </div>

      <div className="step-field">
        <label className="step-field-label" htmlFor="bs4-relations">
          Impact sur les relations
        </label>
        <p className="step-field-hint">Famille, associés, employés, clients actuels — qui sera impacté ?</p>
        <textarea
          id="bs4-relations"
          className="step-field-input step-field-textarea"
          value={data.relationship_impact ?? ''}
          onChange={(e) => onChange({ relationship_impact: e.target.value })}
          placeholder="Mon associé devra… Ma famille devra comprendre…"
          rows={2}
        />
      </div>

      <div className="step-field">
        <label className="step-field-label" htmlFor="bs4-sacrifices">
          Sacrifices acceptés
        </label>
        <p className="step-field-hint">Qu'es-tu prêt à abandonner ou à mettre en pause pour ce projet ?</p>
        <textarea
          id="bs4-sacrifices"
          className="step-field-input step-field-textarea"
          value={data.sacrifices ?? ''}
          onChange={(e) => onChange({ sacrifices: e.target.value })}
          placeholder="Je suis prêt à abandonner… pour que ce projet réussisse."
          rows={2}
        />
      </div>

      <div className="step-field">
        <label className="step-field-label">
          Es-tu prêt à payer ce prix ? <span className="step-field-required" aria-hidden="true">*</span>
        </label>
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
          {(['Oui, pleinement', 'Oui, avec réserves', 'Non, pas encore'] as const).map((label, i) => {
            const val = i === 0 ? true : i === 1 ? undefined : false
            const isSelected =
              i === 0 ? data.ready_to_pay === true
              : i === 1 ? data.ready_to_pay === undefined && data.financial_cost
              : data.ready_to_pay === false
            return (
              <button
                key={label}
                type="button"
                onClick={() => onChange({ ready_to_pay: val as boolean | undefined })}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--r-md)',
                  border: `1px solid ${isSelected ? 'var(--teal)' : 'var(--border)'}`,
                  background: isSelected ? 'color-mix(in srgb, var(--teal) 12%, transparent)' : 'var(--surface-2)',
                  color: isSelected ? 'var(--teal)' : 'var(--text-2)',
                  fontSize: 'var(--text-sm)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
