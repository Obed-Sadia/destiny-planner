// DestinyPlanner — Layout principal
// Desktop : sidebar fixe + contenu scrollable
// Mobile  : contenu + BottomNav fixe

import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

const STYLE = `
  .layout {
    display: flex;
    min-height: 100dvh;
    background: var(--bg);
  }

  .layout-sidebar {
    display: none;
  }

  .layout-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding-bottom: var(--bottom-nav-h);
  }

  .layout-content {
    flex: 1;
    padding: var(--space-6) var(--space-4);
    max-width: var(--content-max);
    width: 100%;
    margin: 0 auto;
    animation: fadeIn 200ms ease both;
  }

  @media (min-width: 768px) {
    .layout-sidebar {
      display: block;
    }

    .layout-main {
      padding-bottom: 0;
    }

    .layout-content {
      padding: var(--space-8) var(--space-8);
    }

    .layout-bottom-nav {
      display: none;
    }
  }
`

export function Layout(): JSX.Element {
  return (
    <>
      <style>{STYLE}</style>
      <div className="layout">
        <div className="layout-sidebar">
          <Sidebar />
        </div>
        <div className="layout-main">
          <main className="layout-content">
            <Outlet />
          </main>
        </div>
        <div className="layout-bottom-nav">
          <BottomNav />
        </div>
      </div>
    </>
  )
}
