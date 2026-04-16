// DestinyPlanner — Carte de statistique profil

const STYLE = `
  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .stat-card-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-2);
  }

  .stat-card-value {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    line-height: 1;
  }

  .stat-card-sub {
    font-size: var(--text-xs);
    color: var(--text-3);
  }
`

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
  sub?: string
}

export function StatCard({ icon, label, value, color, sub }: StatCardProps): JSX.Element {
  return (
    <>
      <style>{STYLE}</style>
      <div className="stat-card">
        <div className="stat-card-label" style={{ color: 'var(--text-2)' }}>
          <span style={{ color }}>{icon}</span>
          {label}
        </div>
        <div className="stat-card-value" style={{ color }}>
          {value}
        </div>
        {sub && <div className="stat-card-sub">{sub}</div>}
      </div>
    </>
  )
}
