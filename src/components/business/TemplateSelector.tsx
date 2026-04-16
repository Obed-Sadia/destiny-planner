// DestinyPlanner — Sélecteur de template business
// Affiché avant le formulaire titre lors de la création d'un nouveau projet.
// Trois choix : Sans template, Lancement produit, Création d'entreprise.

import { BUSINESS_TEMPLATES } from '@/constants/businessTemplates'

// ─── Styles ──────────────────────────────────────────────────

const STYLE = `
  .tpl-root {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    animation: fadeIn 220ms ease both;
    max-width: 560px;
  }

  .tpl-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .tpl-eyebrow {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--teal);
  }

  .tpl-title {
    font-family: var(--font-editorial);
    font-size: var(--text-2xl);
    font-weight: 600;
    color: var(--text-1);
    line-height: 1.2;
  }

  .tpl-subtitle {
    font-size: var(--text-sm);
    color: var(--text-2);
    line-height: var(--leading-snug);
    margin-top: var(--space-1);
  }

  /* Grille */
  .tpl-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  /* Carte template */
  .tpl-card {
    display: flex;
    align-items: flex-start;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-5);
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: var(--r-lg);
    cursor: pointer;
    text-align: left;
    width: 100%;
    font-family: var(--font-ui);
    transition: border-color var(--transition-base), background var(--transition-base), transform var(--transition-fast);
  }

  .tpl-card:hover {
    border-color: var(--border-2);
    background: var(--surface-2);
    transform: translateY(-1px);
  }

  .tpl-card--selected {
    border-color: var(--teal) !important;
    background: color-mix(in srgb, var(--teal) 6%, transparent) !important;
  }

  .tpl-card--blank {
    border-style: dashed;
    background: transparent;
  }

  .tpl-card--blank:hover {
    background: var(--surface);
  }

  /* Icône */
  .tpl-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--r-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    line-height: 1;
    flex-shrink: 0;
    background: var(--surface-2);
  }

  .tpl-card--selected .tpl-icon {
    background: color-mix(in srgb, var(--teal) 15%, transparent);
  }

  .tpl-icon--blank {
    color: var(--text-3);
    background: transparent;
    border: 1.5px dashed var(--border-2);
    font-size: 1rem;
  }

  /* Texte */
  .tpl-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .tpl-name {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
    line-height: var(--leading-snug);
  }

  .tpl-tagline {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--teal);
    letter-spacing: 0.04em;
  }

  .tpl-desc {
    font-size: var(--text-xs);
    color: var(--text-2);
    line-height: var(--leading-normal);
    margin-top: 2px;
  }

  /* Indicateur sélectionné */
  .tpl-check {
    width: 18px;
    height: 18px;
    border-radius: var(--r-full);
    border: 1.5px solid var(--border-2);
    flex-shrink: 0;
    margin-top: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--transition-base), border-color var(--transition-base);
  }

  .tpl-check--active {
    background: var(--teal);
    border-color: var(--teal);
  }

  .tpl-check-dot {
    width: 6px;
    height: 6px;
    border-radius: var(--r-full);
    background: #fff;
  }

  /* Bouton continuer */
  .tpl-next-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-8);
    background: var(--teal);
    color: #fff;
    border: none;
    border-radius: var(--r-md);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    cursor: pointer;
    align-self: flex-start;
    transition: opacity var(--transition-base), transform var(--transition-fast);
  }

  .tpl-next-btn:hover { opacity: 0.88; transform: translateY(-1px); }

  /* Note info */
  .tpl-note {
    font-size: var(--text-xs);
    color: var(--text-3);
    line-height: var(--leading-snug);
  }
`

// ─── Composant ───────────────────────────────────────────────

interface Props {
  selected: string | null   // null = aucun, 'blank' = sans template, ou templateId
  onSelect: (id: string) => void
  onNext: () => void
}

export function TemplateSelector({ selected, onSelect, onNext }: Props): JSX.Element {
  return (
    <>
      <style>{STYLE}</style>
      <div className="tpl-root">

        <div className="tpl-header">
          <div className="tpl-eyebrow">Nouveau projet business</div>
          <h1 className="tpl-title">Choisissez un point de départ</h1>
          <p className="tpl-subtitle">
            Les templates pré-remplissent les 7 étapes avec des prompts adaptés à votre contexte.
            Vous pourrez tout modifier.
          </p>
        </div>

        <div className="tpl-grid">

          {/* Sans template */}
          <button
            type="button"
            className={`tpl-card tpl-card--blank ${selected === 'blank' ? 'tpl-card--selected' : ''}`}
            onClick={() => onSelect('blank')}
          >
            <div className="tpl-icon tpl-icon--blank">✦</div>
            <div className="tpl-info">
              <span className="tpl-name">Sans template</span>
              <span className="tpl-desc">Commencez avec des étapes vierges et construisez à votre rythme.</span>
            </div>
            <div className={`tpl-check ${selected === 'blank' ? 'tpl-check--active' : ''}`}>
              {selected === 'blank' && <div className="tpl-check-dot" />}
            </div>
          </button>

          {/* Templates */}
          {BUSINESS_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              className={`tpl-card ${selected === tpl.id ? 'tpl-card--selected' : ''}`}
              onClick={() => onSelect(tpl.id)}
            >
              <div className="tpl-icon">{tpl.icon}</div>
              <div className="tpl-info">
                <span className="tpl-name">{tpl.name}</span>
                <span className="tpl-tagline">{tpl.tagline}</span>
                <span className="tpl-desc">{tpl.description}</span>
              </div>
              <div className={`tpl-check ${selected === tpl.id ? 'tpl-check--active' : ''}`}>
                {selected === tpl.id && <div className="tpl-check-dot" />}
              </div>
            </button>
          ))}

        </div>

        <button
          type="button"
          className="tpl-next-btn"
          disabled={selected === null}
          onClick={onNext}
        >
          Continuer →
        </button>

        <p className="tpl-note">
          Les données pré-remplies sont des suggestions — modifiez-les librement dans chaque étape.
        </p>

      </div>
    </>
  )
}
