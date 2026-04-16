// Étape 3 business — Estimer (SWOT)
// Prompt CDC §5.2 : « Quelles sont tes forces face à la concurrence ? Quelles menaces pourraient faire échouer ce projet ? »

import type { Step3Data } from '../../../types'

interface Props {
  data: Partial<Step3Data>
  onChange: (patch: Partial<Step3Data>) => void
}

export function BizStep3SWOT({ data, onChange }: Props): JSX.Element {
  return (
    <div className="step-form">
      <div className="step-field">
        <label className="step-field-label" htmlFor="bs3-strengths">
          Forces <span className="step-field-required" aria-hidden="true">*</span>
        </label>
        <p className="step-field-hint">Quelles sont tes forces face à la concurrence ? Compétences, réseau, timing, ressources ?</p>
        <textarea
          id="bs3-strengths"
          className="step-field-input step-field-textarea"
          value={data.strengths ?? ''}
          onChange={(e) => onChange({ strengths: e.target.value })}
          placeholder="Mon expertise en… Mon réseau de… Mon avantage concurrentiel est…"
          rows={3}
        />
      </div>

      <div className="step-field">
        <label className="step-field-label" htmlFor="bs3-weaknesses">
          Faiblesses <span className="step-field-required" aria-hidden="true">*</span>
        </label>
        <p className="step-field-hint">Sois honnête. Quelles lacunes pourraient freiner ce projet ?</p>
        <textarea
          id="bs3-weaknesses"
          className="step-field-input step-field-textarea"
          value={data.weaknesses ?? ''}
          onChange={(e) => onChange({ weaknesses: e.target.value })}
          placeholder="Je manque de… Je n'ai pas encore…"
          rows={3}
        />
      </div>

      <div className="step-field">
        <label className="step-field-label" htmlFor="bs3-opportunities">
          Opportunités
        </label>
        <p className="step-field-hint">Quelles tendances, besoins du marché ou contextes jouent en ta faveur ?</p>
        <textarea
          id="bs3-opportunities"
          className="step-field-input step-field-textarea"
          value={data.opportunities ?? ''}
          onChange={(e) => onChange({ opportunities: e.target.value })}
          placeholder="Le marché est en croissance de… Les clients cherchent…"
          rows={3}
        />
      </div>

      <div className="step-field">
        <label className="step-field-label" htmlFor="bs3-threats">
          Menaces
        </label>
        <p className="step-field-hint">Quelles menaces pourraient faire échouer ce projet ? Concurrence, réglementation, technologie ?</p>
        <textarea
          id="bs3-threats"
          className="step-field-input step-field-textarea"
          value={data.threats ?? ''}
          onChange={(e) => onChange({ threats: e.target.value })}
          placeholder="Les principaux risques sont… Un concurrent pourrait…"
          rows={3}
        />
      </div>
    </div>
  )
}
