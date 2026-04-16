// DestinyPlanner — Badge de grade utilisateur

import { Compass, LayoutGrid, Hammer, Crown } from 'lucide-react'
import type { UserGrade } from '../../types'

interface GradeConfig {
  label: string
  icon: React.ReactNode
  color: string
  bg: string
}

const GRADE_CONFIG: Record<UserGrade, GradeConfig> = {
  discoverer: {
    label: 'Découvreur',
    icon: <Compass size={13} />,
    color: 'var(--text-2)',
    bg:    'var(--surface-2)',
  },
  planner: {
    label: 'Planificateur',
    icon: <LayoutGrid size={13} />,
    color: 'var(--blue)',
    bg:    'rgba(91,155,212,0.12)',
  },
  builder_diligent: {
    label: 'Bâtisseur Diligent',
    icon: <Hammer size={13} />,
    color: 'var(--teal)',
    bg:    'rgba(45,165,138,0.12)',
  },
  master_builder: {
    label: 'Maître Bâtisseur',
    icon: <Crown size={13} />,
    color: 'var(--gold)',
    bg:    'var(--gold-pale)',
  },
}

const STYLE = `
  .grade-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: var(--r-full);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    line-height: 1;
  }

  .grade-badge--lg {
    padding: 6px 14px;
    font-size: var(--text-sm);
    gap: 6px;
  }
`

interface GradeBadgeProps {
  grade: UserGrade
  size?: 'sm' | 'lg'
}

export function GradeBadge({ grade, size = 'sm' }: GradeBadgeProps): JSX.Element {
  const cfg = GRADE_CONFIG[grade]
  return (
    <>
      <style>{STYLE}</style>
      <span
        className={`grade-badge${size === 'lg' ? ' grade-badge--lg' : ''}`}
        style={{ color: cfg.color, background: cfg.bg }}
      >
        {cfg.icon}
        {cfg.label}
      </span>
    </>
  )
}
