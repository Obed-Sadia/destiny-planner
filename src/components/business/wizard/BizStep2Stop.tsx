// Étape 2 business — S'arrêter
// Prompt CDC §5.2 : « Avant de foncer, assieds-toi. Est-ce une conviction profonde ou une impulsion ? »

import type { Step2Data } from '../../../types'

interface Props {
  data: Partial<Step2Data>
  onChange: (patch: Partial<Step2Data>) => void
}

export function BizStep2Stop({ data, onChange }: Props): JSX.Element {
  return (
    <div className="step-form">
      <div className="step-field">
        <label className="step-field-label" htmlFor="bs2-reflection">
          Réflexion honnête <span className="step-field-required" aria-hidden="true">*</span>
        </label>
        <p className="step-field-hint">
          Avant de foncer, assieds-toi. Pourquoi veux-tu vraiment lancer ce projet ? Écris sans filtre.
        </p>
        <textarea
          id="bs2-reflection"
          className="step-field-input step-field-textarea"
          value={data.reflection ?? ''}
          onChange={(e) => onChange({ reflection: e.target.value })}
          placeholder="Je veux lancer ce projet parce que…"
          rows={5}
        />
      </div>

      <div className="step-field">
        <label className="step-field-label" htmlFor="bs2-conviction">
          Conviction ou impulsion ?
        </label>
        <p className="step-field-hint">
          Est-ce une conviction profonde portée depuis longtemps, ou une idée née d'une opportunité récente ?
        </p>
        <textarea
          id="bs2-conviction"
          className="step-field-input step-field-textarea"
          value={data.conviction_or_impulse ?? ''}
          onChange={(e) => onChange({ conviction_or_impulse: e.target.value })}
          placeholder="C'est une conviction car… / C'est une impulsion car…"
          rows={3}
        />
      </div>
    </div>
  )
}
