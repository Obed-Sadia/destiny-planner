// DestinyPlanner — Carte d'un bloc horaire individuel
// Style : fond rgba(couleur, 0.15), border-left 2px rgba(couleur, 0.4), border-radius 6px

import { Trash2 } from 'lucide-react'
import type { TimeBlock, TimeBlockCategory } from '../../types'
import { blockDurationMinutes } from '../../services/timeBlockValidator'

// Couleurs hexadécimales des catégories (correspondent aux tokens CSS)
const CATEGORY_COLORS: Record<TimeBlockCategory, string> = {
  work:     '#7B6FD4', // --purple
  spiritual:'#C49A3C', // --gold
  family:   '#5A9E6F', // --green
  health:   '#2DA58A', // --teal
  rest:     '#5B9BD4', // --blue
  free:     '#4A4845', // --text-3 (neutre)
}

export const CATEGORY_LABELS: Record<TimeBlockCategory, string> = {
  work:     'Travail',
  spiritual:'Spirituel',
  family:   'Famille',
  health:   'Santé',
  rest:     'Repos',
  free:     'Libre',
}

export function getCategoryColor(block: TimeBlock): string {
  if (block.color_override) return block.color_override
  if (block.category) return CATEGORY_COLORS[block.category]
  return '#4A4845'
}

function hexToRgb(hex: string): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!r) return '196, 154, 60'
  return `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}`
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h${m.toString().padStart(2, '0')}`
}

const STYLE = `
  .tbc {
    padding: var(--space-2) var(--space-3);
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    transition: opacity var(--transition-fast);
    position: relative;
    overflow: hidden;
  }

  .tbc--done {
    opacity: 0.5;
  }

  .tbc-checkbox {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border: 1.5px solid;
    border-radius: 50%;
    cursor: pointer;
    background: none;
    padding: 0;
    margin-top: 2px;
    transition: background var(--transition-fast), border-color var(--transition-fast);
  }

  .tbc-body {
    flex: 1;
    min-width: 0;
  }

  .tbc-times {
    font-size: var(--text-xs);
    color: var(--text-3);
    line-height: 1;
    margin-bottom: 2px;
  }

  .tbc-title {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text-1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: var(--leading-snug);
  }

  .tbc--done .tbc-title {
    text-decoration: line-through;
    color: var(--text-3);
  }

  .tbc-meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: 3px;
  }

  .tbc-category {
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  .tbc-duration {
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  .tbc-delete {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    color: var(--text-3);
    border-radius: var(--r-xs);
    opacity: 0;
    transition: opacity var(--transition-fast), color var(--transition-fast), background var(--transition-fast);
  }

  .tbc:hover .tbc-delete {
    opacity: 1;
  }

  .tbc-delete:hover {
    color: var(--coral);
    background: var(--tag-coral-bg);
  }

  @media (max-width: 640px) {
    .tbc-delete { opacity: 1; }
  }
`

interface TimeBlockCardProps {
  block: TimeBlock
  onDelete?: () => void
  onToggle?: () => void
}

export function TimeBlockCard({ block, onDelete, onToggle }: TimeBlockCardProps): JSX.Element {
  const color = getCategoryColor(block)
  const rgb = hexToRgb(color)
  const duration = blockDurationMinutes(block)
  const label = block.category ? CATEGORY_LABELS[block.category] : null

  return (
    <>
      <style>{STYLE}</style>
      <div
        className={`tbc${block.done ? ' tbc--done' : ''}`}
        style={{
          background: `rgba(${rgb}, 0.15)`,
          borderLeft: `2px solid rgba(${rgb}, 0.4)`,
          borderRadius: '6px',
        }}
      >
        {onToggle && (
          <button
            className="tbc-checkbox"
            onClick={onToggle}
            aria-label={block.done ? 'Marquer comme non respecté' : 'Marquer comme respecté'}
            style={{
              borderColor: `rgba(${rgb}, 0.6)`,
              background: block.done ? `rgba(${rgb}, 0.25)` : 'none',
            }}
          />
        )}

        <div className="tbc-body">
          <div className="tbc-times">{block.start_time} – {block.end_time}</div>
          <div className="tbc-title">{block.title}</div>
          <div className="tbc-meta">
            {label && <span className="tbc-category">{label}</span>}
            <span className="tbc-duration">{formatDuration(duration)}</span>
          </div>
        </div>

        {onDelete && (
          <button
            className="tbc-delete"
            onClick={onDelete}
            aria-label="Supprimer le bloc"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </>
  )
}
