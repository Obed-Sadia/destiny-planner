// DestinyPlanner — Carte citation
// Affichée en haut de chaque étape du wizard

import type { Quote } from '../../types'

const STYLE = `
  .quote-card {
    margin-bottom: var(--space-6);
  }

  .quote-card-text {
    font-family: var(--font-editorial);
    font-size: var(--text-lg);
    font-style: italic;
    color: var(--text-2);
    line-height: var(--leading-snug);
    margin-bottom: var(--space-2);
  }

  .quote-card-author {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
`

interface QuoteCardProps {
  quote: Quote
}

export function QuoteCard({ quote }: QuoteCardProps): JSX.Element {
  return (
    <>
      <style>{STYLE}</style>
      <div className="quote-card">
        <p className="quote-card-text">« {quote.text} »</p>
        <span className="quote-card-author">— {quote.author}</span>
      </div>
    </>
  )
}
