// Étape 5 business — Calculer
// Prompt CDC §5.2 : « Chiffre tout. Combien pour le MVP ? Quand atteins-tu le point d'équilibre ? »

import type { Step5Data, Step5MilestoneDraft } from '../../../types'

interface Props {
  data: Partial<Step5Data>
  onChange: (patch: Partial<Step5Data>) => void
}

export function BizStep5Calculate({ data, onChange }: Props): JSX.Element {
  const milestones: Step5MilestoneDraft[] = data.milestones_draft ?? [{ title: '', due_date: '' }]

  function updateMilestone(index: number, patch: Partial<Step5MilestoneDraft>): void {
    const updated = milestones.map((m, i) => (i === index ? { ...m, ...patch } : m))
    onChange({ milestones_draft: updated })
  }

  function addMilestone(): void {
    onChange({ milestones_draft: [...milestones, { title: '', due_date: '' }] })
  }

  function removeMilestone(index: number): void {
    if (milestones.length <= 1) return
    onChange({ milestones_draft: milestones.filter((_, i) => i !== index) })
  }

  return (
    <div className="step-form">
      <div className="step-field">
        <label className="step-field-label" htmlFor="bs5-budget">
          Budget détaillé
        </label>
        <p className="step-field-hint">
          Chiffre tout : MVP, marketing, équipe, infrastructure. Quand atteins-tu le point d'équilibre ?
        </p>
        <textarea
          id="bs5-budget"
          className="step-field-input step-field-textarea"
          value={data.budget_detail ?? ''}
          onChange={(e) => onChange({ budget_detail: e.target.value })}
          placeholder="MVP : X € | Marketing : Y €/mois | Break-even prévu au mois Z…"
          rows={4}
        />
      </div>

      <div className="step-field">
        <label className="step-field-label" htmlFor="bs5-duration">
          Durée estimée avant lancement
        </label>
        <textarea
          id="bs5-duration"
          className="step-field-input step-field-textarea"
          value={data.duration_estimate ?? ''}
          onChange={(e) => onChange({ duration_estimate: e.target.value })}
          placeholder="Phase 1 (MVP) : 3 mois | Phase 2 (lancement) : 2 mois…"
          rows={2}
        />
      </div>

      <div className="step-field">
        <label className="step-field-label">
          Jalons clés <span className="step-field-required" aria-hidden="true">*</span>
        </label>
        <p className="step-field-hint">Au moins un jalon daté. Ces jalons seront créés automatiquement dans votre projet.</p>

        {milestones.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'center' }}>
            <input
              className="step-field-input"
              type="text"
              value={m.title}
              onChange={(e) => updateMilestone(i, { title: e.target.value })}
              placeholder={`Jalon ${i + 1} — ex : MVP fonctionnel`}
              style={{ flex: 1 }}
            />
            <input
              className="step-field-input"
              type="date"
              value={m.due_date}
              onChange={(e) => updateMilestone(i, { due_date: e.target.value })}
              style={{ width: 140, flexShrink: 0 }}
            />
            {milestones.length > 1 && (
              <button
                type="button"
                onClick={() => removeMilestone(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-3)',
                  cursor: 'pointer',
                  padding: '0 var(--space-1)',
                  fontSize: 'var(--text-lg)',
                  lineHeight: 1,
                }}
                aria-label="Supprimer ce jalon"
              >
                ×
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addMilestone}
          style={{
            background: 'none',
            border: '1px dashed var(--border-2)',
            borderRadius: 'var(--r-md)',
            color: 'var(--text-3)',
            cursor: 'pointer',
            padding: 'var(--space-2) var(--space-4)',
            fontSize: 'var(--text-sm)',
            width: '100%',
            marginTop: 'var(--space-1)',
            fontFamily: 'var(--font-ui)',
            transition: 'color var(--transition-base), border-color var(--transition-base)',
          }}
        >
          + Ajouter un jalon
        </button>
      </div>
    </div>
  )
}
