// Étape 1 business — Vision claire
// Prompt CDC §5.2 : « Décris ton projet comme si tu l'expliquais à un investisseur en 2 minutes. »

import type { Step1Data } from '../../../types'

interface Props {
  data: Partial<Step1Data>
  onChange: (patch: Partial<Step1Data>) => void
}

export function BizStep1Vision({ data, onChange }: Props): JSX.Element {
  return (
    <div className="step-form">
      <div className="step-field">
        <label className="step-field-label" htmlFor="bs1-title">
          Nom du projet <span className="step-field-required" aria-hidden="true">*</span>
        </label>
        <p className="step-field-hint">
          Décris ton projet comme si tu l'expliquais à un investisseur en 2 minutes. Quelle est la tour que tu veux construire ?
        </p>
        <input
          id="bs1-title"
          className="step-field-input step-field-input-title"
          type="text"
          value={data.title ?? ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Ex : Lancer mon SaaS de gestion RH"
          maxLength={100}
          autoFocus
        />
      </div>

      <div className="step-field">
        <label className="step-field-label" htmlFor="bs1-description">
          Description du projet
        </label>
        <p className="step-field-hint">Quel problème résous-tu ? Pour qui ? Comment ?</p>
        <textarea
          id="bs1-description"
          className="step-field-input step-field-textarea"
          value={data.description ?? ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Ce projet vise à…"
          rows={3}
        />
      </div>

      <div className="step-field">
        <label className="step-field-label" htmlFor="bs1-success">
          Image de réussite
        </label>
        <p className="step-field-hint">
          Dans 18 mois, le projet est lancé et rentable. Que vois-tu ? Quel impact as-tu eu ?
        </p>
        <textarea
          id="bs1-success"
          className="step-field-input step-field-textarea"
          value={data.success_image ?? ''}
          onChange={(e) => onChange({ success_image: e.target.value })}
          placeholder="J'ai X clients, un chiffre d'affaires de…, et je…"
          rows={4}
        />
      </div>
    </div>
  )
}
