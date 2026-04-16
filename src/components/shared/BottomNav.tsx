// DestinyPlanner — BottomNav mobile (5 onglets)

import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Sun, Layers, BookOpen, UserCircle } from 'lucide-react'

const STYLE = `
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: var(--bottom-nav-h);
    background: var(--sidebar);
    border-top: 1px solid var(--border);
    display: flex;
    align-items: stretch;
    z-index: 100;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .bottom-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    text-decoration: none;
    color: var(--text-3);
    font-size: 10px;
    font-weight: var(--weight-medium);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: color var(--transition-base);
    position: relative;
  }

  .bottom-nav-item:hover {
    color: var(--text-2);
  }

  .bottom-nav-item.active {
    color: var(--gold);
  }

  .bottom-nav-item.active::after {
    content: '';
    position: absolute;
    top: 0;
    left: 20%;
    right: 20%;
    height: 2px;
    background: var(--gold);
    border-radius: 0 0 2px 2px;
  }

  .bottom-nav-item svg {
    width: 20px;
    height: 20px;
  }
`

const TABS = [
  { to: '/dashboard', label: 'Accueil',    Icon: LayoutDashboard },
  { to: '/today',     label: "Auj.",        Icon: Sun },
  { to: '/projects',  label: 'Projets',     Icon: Layers },
  { to: '/journal',   label: 'Journal',     Icon: BookOpen },
  { to: '/profile',   label: 'Profil',      Icon: UserCircle },
] as const

export function BottomNav(): JSX.Element {
  return (
    <>
      <style>{STYLE}</style>
      <nav className="bottom-nav" aria-label="Navigation mobile">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
          >
            <Icon aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
