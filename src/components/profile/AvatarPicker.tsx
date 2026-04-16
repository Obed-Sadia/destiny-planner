// DestinyPlanner — Sélecteur d'avatar (emoji + couleur de fond)
// Grille de 20 emojis prédéfinis + 7 couleurs sémantiques

import { Check } from 'lucide-react'

export const AVATAR_EMOJIS = [
  '🌟', '💎', '🦁', '🔥', '⚡',
  '🌊', '🏔️', '🌙', '☀️', '🌿',
  '🦅', '🎯', '🗝️', '🛡️', '⚔️',
  '🌺', '🕊️', '🧭', '⛵', '🏛️',
]

export const AVATAR_COLORS = [
  { label: 'Or',     hex: '#C49A3C' },
  { label: 'Violet', hex: '#7B6FD4' },
  { label: 'Vert',   hex: '#5A9E6F' },
  { label: 'Teal',   hex: '#2DA58A' },
  { label: 'Bleu',   hex: '#5B9BD4' },
  { label: 'Corail', hex: '#E07070' },
  { label: 'Ambre',  hex: '#D4854A' },
]

export const DEFAULT_EMOJI = '🌟'
export const DEFAULT_COLOR = '#C49A3C'

export function avatarBackground(hex: string): string {
  return `${hex}22` // ~13% opacité — fonctionne directement en CSS background
}

const STYLE = `
  .avatar-picker {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    animation: apFadeIn 150ms ease both;
  }

  @keyframes apFadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .ap-section-label {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-3);
    margin-bottom: var(--space-2);
  }

  .ap-emoji-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--space-2);
  }

  .ap-emoji-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 1;
    border-radius: var(--r-md);
    border: 1.5px solid transparent;
    background: var(--surface-2);
    font-size: 1.25rem;
    cursor: pointer;
    transition: border-color var(--transition-fast), background var(--transition-fast);
    line-height: 1;
  }

  .ap-emoji-btn:hover {
    background: var(--border);
  }

  .ap-emoji-btn--selected {
    border-color: var(--gold);
    background: var(--gold-pale);
  }

  .ap-color-row {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .ap-color-btn {
    width: 28px;
    height: 28px;
    border-radius: var(--r-full);
    border: 2px solid transparent;
    cursor: pointer;
    position: relative;
    transition: transform var(--transition-fast), border-color var(--transition-fast);
    flex-shrink: 0;
  }

  .ap-color-btn:hover {
    transform: scale(1.15);
  }

  .ap-color-btn--selected {
    border-color: var(--text-1);
  }

  .ap-color-check {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    pointer-events: none;
  }
`

interface AvatarPickerProps {
  currentEmoji: string | null
  currentColor: string | null
  onChange: (emoji: string, color: string) => void
}

export function AvatarPicker({ currentEmoji, currentColor, onChange }: AvatarPickerProps): JSX.Element {
  const emoji = currentEmoji ?? DEFAULT_EMOJI
  const color = currentColor ?? DEFAULT_COLOR

  return (
    <>
      <style>{STYLE}</style>
      <div className="avatar-picker">

        <div>
          <div className="ap-section-label">Emoji</div>
          <div className="ap-emoji-grid">
            {AVATAR_EMOJIS.map((e) => (
              <button
                key={e}
                className={`ap-emoji-btn${e === emoji ? ' ap-emoji-btn--selected' : ''}`}
                onClick={() => onChange(e, color)}
                aria-label={e}
                aria-pressed={e === emoji}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="ap-section-label">Couleur de fond</div>
          <div className="ap-color-row">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c.hex}
                className={`ap-color-btn${c.hex === color ? ' ap-color-btn--selected' : ''}`}
                style={{ background: c.hex }}
                onClick={() => onChange(emoji, c.hex)}
                aria-label={c.label}
                aria-pressed={c.hex === color}
                title={c.label}
              >
                {c.hex === color && (
                  <span className="ap-color-check">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}
