// DestinyPlanner — Sidebar desktop (200px fixe)

import type React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Sun,
  Layers,
  BookOpen,
  Compass,
  Globe,
  Briefcase,
  UserCircle,
  Settings,
  BarChart2,
} from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'

const STYLE = `
  .sidebar {
    width: var(--sidebar-width);
    height: 100dvh;
    position: sticky;
    top: 0;
    background: var(--sidebar);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    z-index: 100;
    overflow: hidden;
  }

  .sidebar-brand {
    padding: var(--space-5) var(--space-5) var(--space-4);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .sidebar-brand-name {
    font-family: var(--font-editorial);
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--gold);
    letter-spacing: -0.01em;
    line-height: 1.1;
  }

  .sidebar-brand-tagline {
    font-size: var(--text-xs);
    color: var(--text-3);
    margin-top: 3px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .sidebar-nav {
    flex: 1;
    padding: var(--space-3) 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .sidebar-section-label {
    font-size: 10px;
    font-weight: var(--weight-semibold);
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: var(--space-3) var(--space-5) var(--space-1);
    margin-top: var(--space-2);
  }

  .sidebar-link {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: 9px var(--space-5);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text-2);
    text-decoration: none;
    position: relative;
    transition: color var(--transition-base), background var(--transition-base);
  }

  .sidebar-link:hover {
    color: var(--text-1);
    background: rgba(255,255,255,0.03);
  }

  .sidebar-link.active {
    color: var(--gold-soft);
    background: var(--gold-pale);
  }

  .sidebar-link.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 4px;
    bottom: 4px;
    width: 2px;
    background: var(--gold);
    border-radius: 0 2px 2px 0;
  }

  .sidebar-link svg {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
    opacity: 0.8;
  }

  .sidebar-link.active svg {
    opacity: 1;
  }

  .sidebar-footer {
    border-top: 1px solid var(--border);
    padding: var(--space-2) 0;
    flex-shrink: 0;
  }
`

import type { TranslationKey } from '../../i18n/useTranslation'

type NavItem = { to: string; key: TranslationKey; Icon: React.ElementType }

const NAV_MAIN: NavItem[] = [
  { to: '/dashboard', key: 'nav.dashboard', Icon: LayoutDashboard },
  { to: '/today',     key: 'nav.today',     Icon: Sun },
  { to: '/projects',  key: 'nav.projects',  Icon: Layers },
  { to: '/journal',   key: 'nav.journal',   Icon: BookOpen },
]

const NAV_VIE: NavItem[] = [
  { to: '/goal',    key: 'nav.goal',    Icon: Compass },
  { to: '/domains', key: 'nav.domains', Icon: Globe },
]

const NAV_BUSINESS: NavItem[] = [
  { to: '/business', key: 'nav.business', Icon: Briefcase },
]

const NAV_TOOLS: NavItem[] = [
  { to: '/analytics', key: 'nav.analytics', Icon: BarChart2 },
]

const NAV_BOTTOM: NavItem[] = [
  { to: '/profile',  key: 'nav.profile',  Icon: UserCircle },
  { to: '/settings', key: 'nav.settings', Icon: Settings },
]

export function Sidebar(): JSX.Element {
  const { t } = useTranslation()

  return (
    <>
      <style>{STYLE}</style>
      <nav className="sidebar" aria-label="Navigation principale">
        <div className="sidebar-brand">
          <div className="sidebar-brand-name">Destiny</div>
          <div className="sidebar-brand-tagline">Planner</div>
        </div>

        <div className="sidebar-nav">
          {NAV_MAIN.map(({ to, key, Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Icon aria-hidden="true" />
              {t(key)}
            </NavLink>
          ))}

          <div className="sidebar-section-label">{t('nav.life')}</div>

          {NAV_VIE.map(({ to, key, Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Icon aria-hidden="true" />
              {t(key)}
            </NavLink>
          ))}

          <div className="sidebar-section-label">{t('nav.business')}</div>

          {NAV_BUSINESS.map(({ to, key, Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Icon aria-hidden="true" />
              {t(key)}
            </NavLink>
          ))}

          <div className="sidebar-section-label">{t('nav.analytics')}</div>

          {NAV_TOOLS.map(({ to, key, Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Icon aria-hidden="true" />
              {t(key)}
            </NavLink>
          ))}
        </div>

        <div className="sidebar-footer">
          {NAV_BOTTOM.map(({ to, key, Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Icon aria-hidden="true" />
              {t(key)}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}
