// Étape 7 business — S'engager
// Prompt CDC §5.2 : « Comment sauras-tu que tu as réussi ? Quels sont les 3 indicateurs qui te disent que le projet est terminé ? »

import type { Step7Data } from '../../../types'

interface Props {
  data: Partial<Step7Data>
  onChange: (patch: Partial<Step7Data>) => void
}

export function BizStep7Commit({ data, onChange }: Props): JSX.Element {
  return (
    <div className="step-form">
      <div className="step-field">
        <label className="step-field-label" htmlFor="bs7-kpi1">
          Indicateur de succès 1 <span className="step-field-required" aria-hidden="true">*</span>
        </label>
        <p className="step-field-hint">
          Comment sauras-tu que tu as réussi ? Définis 3 indicateurs mesurables et datés.
        </p>
        <input
          id="bs7-kpi1"
          className="step-field-input"
          type="text"
          value={data.kpi_1 ?? ''}
          onChange={(e) => onChange({ kpi_1: e.target.value })}
          placeholder="Ex : 100 clients payants avant le 31/12"
        />
      </div>

      <div className="step-field">
        <label className="step-field-label" htmlFor="bs7-kpi2">
          Indicateur de succès 2
        </label>
        <input
          id="bs7-kpi2"
          className="step-field-input"
          type="text"
          value={data.kpi_2 ?? ''}
          onChange={(e) => onChange({ kpi_2: e.target.value })}
          placeholder="Ex : MRR de 5 000 € atteint"
        />
      </div>

      <div className="step-field">
        <label className="step-field-label" htmlFor="bs7-kpi3">
          Indicateur de succès 3
        </label>
        <input
          id="bs7-kpi3"
          className="step-field-input"
          type="text"
          value={data.kpi_3 ?? ''}
          onChange={(e) => onChange({ kpi_3: e.target.value })}
          placeholder="Ex : NPS ≥ 40 après 6 mois"
        />
      </div>

      <div className="step-field">
        <label className="step-field-label" htmlFor="bs7-criteria">
          Critères de succès globaux
        </label>
        <p className="step-field-hint">Quels sont les critères qui définissent que ce projet est « terminé et réussi » ?</p>
        <textarea
          id="bs7-criteria"
          className="step-field-input step-field-textarea"
          value={data.success_criteria ?? ''}
          onChange={(e) => onChange({ success_criteria: e.target.value })}
          placeholder="Ce projet sera réussi quand…"
          rows={3}
        />
      </div>

      <div className="step-field">
        <label className="step-field-label" htmlFor="bs7-start">
          Date de lancement <span className="step-field-required" aria-hidden="true">*</span>
        </label>
        <input
          id="bs7-start"
          className="step-field-input"
          type="date"
          value={data.start_date ?? ''}
          onChange={(e) => onChange({ start_date: e.target.value })}
        />
      </div>

      <div className="step-field">
        <label className="step-field-label" htmlFor="bs7-commitment">
          Engagement solennel <span className="step-field-required" aria-hidden="true">*</span>
        </label>
        <p className="step-field-hint">
          Écris ton engagement en première personne. Ce texte reste visible dans le projet pour te rappeler pourquoi tu as lancé.
        </p>
        <textarea
          id="bs7-commitment"
          className="step-field-input step-field-textarea"
          value={data.commitment_statement ?? ''}
          onChange={(e) => onChange({ commitment_statement: e.target.value })}
          placeholder="Je m'engage à construire ce projet avec rigueur et persévérance. Je sais que…"
          rows={5}
        />
      </div>
    </div>
  )
}
