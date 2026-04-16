// DestinyPlanner — Carte verset spirituel
// Affichée en haut de chaque étape du wizard

import type { Verse } from '../../types'

const STYLE = `
  .verse-card {
    border-left: 2px solid var(--gold);
    padding: var(--space-3) var(--space-5);
    margin-bottom: var(--space-5);
  }

  .verse-card-ref {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: var(--space-2);
  }

  .verse-card-text {
    font-family: var(--font-editorial);
    font-style: italic;
    font-size: var(--text-base);
    color: var(--text-1);
    line-height: var(--leading-normal);
    margin-bottom: var(--space-2);
  }

  .verse-card-prompt {
    font-size: var(--text-sm);
    color: var(--text-2);
    line-height: var(--leading-snug);
  }
`

interface VerseCardProps {
  verse: Verse
  accentColor?: string
}

export function VerseCard({ verse, accentColor = 'var(--gold)' }: VerseCardProps): JSX.Element {
  return (
    <>
      <style>{STYLE}</style>
      <div className="verse-card" style={{ borderLeftColor: accentColor }}>
        <div className="verse-card-ref">{verse.reference}</div>
        <p className="verse-card-text">« {verse.text} »</p>
        <p className="verse-card-prompt">{verse.reflection_prompt}</p>
      </div>
    </>
  )
}
