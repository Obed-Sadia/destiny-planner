// DestinyPlanner — Arbre de la Destinée (SVG interactif)
// Nœud central (but de vie) + 6 satellites (domaines) avec couleurs de santé
// Clic → info dans zone dédiée, pas de popup flottant

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DomainWithHealth, DomainHealthStatus } from '../../types'

// Couleurs identitaires des domaines par sort_order (0–5 : or, vert, ambre, teal, violet, bleu)
const DOMAIN_COLORS = ['#C49A3C', '#5A9E6F', '#D4854A', '#2DA58A', '#7B6FD4', '#5B9BD4']

function getDomainColor(sortOrder: number): string {
  return DOMAIN_COLORS[sortOrder % DOMAIN_COLORS.length]
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function getHealthNodeFill(status: DomainHealthStatus, color: string): string {
  switch (status) {
    case 'healthy':   return hexToRgba(color, 0.13)
    case 'dry':       return 'rgba(224,123,57,0.15)'
    case 'overloaded': return 'rgba(224,112,112,0.15)'
    case 'dormant':   return 'rgba(74,72,69,0.2)'
  }
}

function getHealthNodeStroke(status: DomainHealthStatus, color: string): string {
  switch (status) {
    case 'healthy':   return color
    case 'dry':       return '#E07B39'
    case 'overloaded': return '#E07070'
    case 'dormant':   return '#4A4845'
  }
}

function getHealthLineColor(status: DomainHealthStatus): string {
  switch (status) {
    case 'healthy':   return 'rgba(255,255,255,0.12)'
    case 'dry':       return 'rgba(224,123,57,0.3)'
    case 'overloaded': return 'rgba(224,112,112,0.4)'
    case 'dormant':   return 'rgba(74,72,69,0.3)'
  }
}

function getHealthLabel(status: DomainHealthStatus): string {
  switch (status) {
    case 'healthy':   return 'Sain'
    case 'dry':       return 'Desséché'
    case 'overloaded': return 'Surchargé'
    case 'dormant':   return 'Endormi'
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

const STYLE = `
  .destiny-tree-wrap {
    position: relative;
    width: 100%;
  }

  .destiny-tree-svg {
    width: 100%;
    height: 320px;
    display: block;
    cursor: default;
  }

  .destiny-tree-node {
    cursor: pointer;
    transition: opacity 120ms ease;
  }
  .destiny-tree-node:hover circle {
    filter: brightness(1.15);
  }

  .destiny-tree-info {
    min-height: 56px;
    padding: var(--space-3) var(--space-4);
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .destiny-tree-info-empty {
    color: var(--text-3);
    font-size: var(--text-xs);
    font-family: var(--font-ui);
  }

  .destiny-tree-info-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .destiny-tree-info-body {
    flex: 1;
    min-width: 0;
  }

  .destiny-tree-info-name {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
    margin-bottom: 2px;
  }

  .destiny-tree-info-meta {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-2);
  }

  .destiny-tree-cta {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--amber);
    background: rgba(212,133,74,0.1);
    border: 1px solid rgba(212,133,74,0.25);
    border-radius: var(--r-sm);
    padding: 4px 10px;
    cursor: pointer;
    transition: background var(--transition-fast);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .destiny-tree-cta:hover {
    background: rgba(212,133,74,0.18);
  }
`

// Layout SVG
const VIEW_W = 600
const VIEW_H = 320
const CX = 300
const CY = 158
const ORBIT = 120
const toRad = (deg: number): number => (deg * Math.PI) / 180

// 6 angles répartis en hexagone, départ en haut
const ANGLES_DEG = [-90, -30, 30, 90, 150, 210]

interface NodePosition {
  x: number
  y: number
  angle: number
}

function getNodePositions(): NodePosition[] {
  return ANGLES_DEG.map((deg) => ({
    x: CX + ORBIT * Math.cos(toRad(deg)),
    y: CY + ORBIT * Math.sin(toRad(deg)),
    angle: deg,
  }))
}

interface DestinyTreeProps {
  domainsWithHealth: DomainWithHealth[]
  goalMission: string | null
}

export function DestinyTree({ domainsWithHealth, goalMission }: DestinyTreeProps): JSX.Element {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const sorted = [...domainsWithHealth].sort((a, b) => a.sort_order - b.sort_order).slice(0, 6)
  const positions = getNodePositions()

  const selected = sorted.find((d) => d.id === selectedId) ?? null
  const selectedColor = selected ? getDomainColor(selected.sort_order) : '#C49A3C'

  const missionLabel = goalMission
    ? truncate(goalMission, 28)
    : 'Définir mon but'

  return (
    <>
      <style>{STYLE}</style>
      <div className="destiny-tree-wrap">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="destiny-tree-svg"
          aria-label="Arbre de la Destinée"
          role="img"
        >
          {/* Lignes de connexion */}
          {sorted.map((domain, i) => {
            const pos = positions[i]
            if (!pos) return null
            const lineColor = getHealthLineColor(domain.health_status)
            const lineWidth = domain.health_status === 'overloaded' ? 1.5 : 1
            return (
              <line
                key={`line-${domain.id}`}
                x1={CX}
                y1={CY}
                x2={pos.x}
                y2={pos.y}
                stroke={lineColor}
                strokeWidth={lineWidth}
                strokeDasharray="4 4"
              />
            )
          })}

          {/* Nœud central — But de vie */}
          <circle
            cx={CX}
            cy={CY}
            r={22}
            fill="rgba(196,154,60,0.12)"
            stroke="rgba(196,154,60,0.4)"
            strokeWidth={1.5}
          />
          <text
            x={CX}
            y={CY - 6}
            textAnchor="middle"
            fill="#C49A3C"
            fontSize={10}
            fontWeight={700}
            fontFamily="Inter, sans-serif"
          >
            Destinée
          </text>
          <text
            x={CX}
            y={CY + 7}
            textAnchor="middle"
            fill="rgba(196,154,60,0.7)"
            fontSize={8}
            fontFamily="Inter, sans-serif"
          >
            {missionLabel}
          </text>

          {/* Nœuds domaines */}
          {sorted.map((domain, i) => {
            const pos = positions[i]
            if (!pos) return null
            const color = getDomainColor(domain.sort_order)
            const nodeR = Math.min(22 + domain.active_projects_count * 4, 34)
            const fill = getHealthNodeFill(domain.health_status, color)
            const stroke = getHealthNodeStroke(domain.health_status, color)
            const strokeW = domain.health_status === 'dormant' ? 1 : 1.5
            const isSelected = domain.id === selectedId
            const name = truncate(domain.name, 12)
            const healthLabel = getHealthLabel(domain.health_status)

            return (
              <g
                key={domain.id}
                className="destiny-tree-node"
                onClick={() => setSelectedId(isSelected ? null : domain.id)}
                role="button"
                aria-label={`${domain.name} — ${healthLabel}`}
                style={{ outline: 'none' }}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeR}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isSelected ? 2 : strokeW}
                  style={{
                    filter: isSelected ? `drop-shadow(0 0 6px ${stroke}60)` : undefined,
                    transition: 'stroke-width 150ms ease',
                  }}
                />
                {/* Emoji */}
                <text
                  x={pos.x}
                  y={pos.y + 5}
                  textAnchor="middle"
                  fontSize={14}
                >
                  {domain.icon}
                </text>
                {/* Nom */}
                <text
                  x={pos.x}
                  y={pos.y + nodeR + 13}
                  textAnchor="middle"
                  fill={color}
                  fontSize={10}
                  fontWeight={700}
                  fontFamily="Inter, sans-serif"
                >
                  {name}
                </text>
                {/* État */}
                <text
                  x={pos.x}
                  y={pos.y + nodeR + 24}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.4)"
                  fontSize={9}
                  fontFamily="Inter, sans-serif"
                >
                  {healthLabel}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Zone info — se met à jour au clic */}
        <div className="destiny-tree-info">
          {!selected && (
            <span className="destiny-tree-info-empty">
              Cliquez sur un domaine pour voir son état
            </span>
          )}
          {selected && (
            <>
              <div
                className="destiny-tree-info-dot"
                style={{ background: selectedColor }}
              />
              <div className="destiny-tree-info-body">
                <div className="destiny-tree-info-name">
                  {selected.icon} {selected.name}
                </div>
                <div className="destiny-tree-info-meta">
                  {getHealthLabel(selected.health_status)}
                  {' · '}
                  {selected.active_projects_count === 0
                    ? 'Aucun projet actif'
                    : `${selected.active_projects_count} projet${selected.active_projects_count > 1 ? 's' : ''} actif${selected.active_projects_count > 1 ? 's' : ''}`}
                  {selected.goal_statement
                    ? ` · ${truncate(selected.goal_statement, 40)}`
                    : ''}
                </div>
              </div>
              {selected.health_status === 'dry' && (
                <button
                  className="destiny-tree-cta"
                  onClick={() => navigate('/projects/new')}
                  type="button"
                >
                  + Créer un projet
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
