// DestinyPlanner — Barre de progression réutilisable

const STYLE = `
  .progress-bar-track {
    background: var(--surface-2);
    border-radius: var(--r-full);
    overflow: hidden;
    width: 100%;
    flex-shrink: 0;
  }

  .progress-bar-track--sm  { height: 4px; }
  .progress-bar-track--md  { height: 6px; }
  .progress-bar-track--lg  { height: 8px; }

  .progress-bar-fill {
    height: 100%;
    border-radius: var(--r-full);
    transition: width 400ms ease;
  }
`

interface ProgressBarProps {
  value: number        // 0–100
  color?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ProgressBar({
  value,
  color = 'var(--gold)',
  size = 'md',
}: ProgressBarProps): JSX.Element {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <>
      <style>{STYLE}</style>
      <div
        className={`progress-bar-track progress-bar-track--${size}`}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="progress-bar-fill"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
    </>
  )
}
