// Étape 6 business — Vérifier
// Prompt CDC §5.2 : « Avec tes ressources actuelles, peux-tu lancer ? Si non, avec qui peux-tu négocier ? »

import type { Step6Data, StepDecision } from '../../../types'

interface Props {
  data: Partial<Step6Data>
  onChange: (patch: Partial<Step6Data>) => void
}

const DECISIONS: { value: StepDecision; label: string; desc: string }[] = [
  { value: 'go',        label: '✅ GO',        desc: "Je lance — j'ai les ressources" },
  { value: 'negotiate', label: '🤝 Négocier',  desc: 'Je lance en trouvant des partenaires ou financements' },
  { value: 'no-go',     label: '⏸ Pas encore', desc: 'Je diffère — il me manque trop de ressources' },
]

export function BizStep6Verify({ data, onChange }: Props): JSX.Element {
  return (
    <div className="step-form">
      <div className="step-field">
        <label className="step-field-label" htmlFor="bs6-available">
          Ressources disponibles
        </label>
        <p className="step-field-hint">Capital, compétences, équipe, outils, réseau que tu possèdes déjà.</p>
        <textarea
          id="bs6-available"
          className="step-field-input step-field-textarea"
          value={data.resources_available ?? ''}
          onChange={(e) => onChange({ resources_available: e.target.value })}
          placeholder="J'ai déjà… X € de capital, une équipe de Y, des outils…"
          rows={3}
        />
      </div>

      <div className="step-field">
        <label className="step-field-label" htmlFor="bs6-missing">
          Ressources manquantes
        </label>
        <p className="step-field-hint">Ce qu'il te manque encore — et comment tu peux l'obtenir.</p>
        <textarea
          id="bs6-missing"
          className="step-field-input step-field-textarea"
          value={data.resources_missing ?? ''}
          onChange={(e) => onChange({ resources_missing: e.target.value })}
          placeholder="Il me manque… Je pourrais l'obtenir en…"
          rows={3}
        />
      </div>

      <div className="step-field">
        <label className="step-field-label" htmlFor="bs6-negotiation">
          Plan de négociation / partenariats
        </label>
        <p className="step-field-hint">Avec qui peux-tu négocier ? Investisseurs, associés, clients pilotes ?</p>
        <textarea
          id="bs6-negotiation"
          className="step-field-input step-field-textarea"
          value={data.negotiation_plan ?? ''}
          onChange={(e) => onChange({ negotiation_plan: e.target.value })}
          placeholder="Je pourrais approcher… pour… En échange de…"
          rows={3}
        />
      </div>

      <div className="step-field">
        <label className="step-field-label">
          Décision <span className="step-field-required" aria-hidden="true">*</span>
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
          {DECISIONS.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ decision: value })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                border: `1px solid ${data.decision === value ? 'var(--teal)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)',
                background: data.decision === value
                  ? 'color-mix(in srgb, var(--teal) 10%, transparent)'
                  : 'var(--surface-2)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all var(--transition-base)',
                fontFamily: 'var(--font-ui)',
              }}
            >
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-1)' }}>
                {label}
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>{desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
