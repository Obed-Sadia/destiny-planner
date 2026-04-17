// DestinyPlanner — Bouton flottant + panneau assistant IA
// Visible uniquement pour les utilisateurs authentifiés

import { Sparkles } from 'lucide-react'
import { useAssistantStore } from '@/stores/useAssistantStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { AssistantPanel } from './AssistantPanel'

const STYLE = `
  .assistant-fab {
    position: fixed;
    bottom: calc(var(--bottom-nav-h) + var(--space-4));
    right: var(--space-4);
    width: 44px;
    height: 44px;
    border-radius: var(--r-full);
    background: var(--gold);
    color: #0F0E0D;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 150;
    border: none;
    box-shadow: var(--shadow-md);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }

  .assistant-fab:hover {
    transform: scale(1.08);
    box-shadow: var(--shadow-lg);
  }

  .assistant-fab.active {
    background: var(--gold-soft);
  }

  .assistant-overlay {
    position: fixed;
    inset: 0;
    z-index: 199;
    background: rgba(0, 0, 0, 0.4);
    animation: fadeIn 150ms ease both;
  }

  @media (min-width: 768px) {
    .assistant-fab {
      bottom: var(--space-6);
      right: var(--space-6);
    }

    .assistant-overlay {
      display: none;
    }
  }
`

export function AssistantWidget(): JSX.Element | null {
  const { user } = useAuthStore()
  const { isOpen, toggle, close } = useAssistantStore()

  if (!user) return null

  return (
    <>
      <style>{STYLE}</style>
      {isOpen && (
        <div className="assistant-overlay" onClick={close} aria-hidden="true" />
      )}
      <button
        className={`assistant-fab${isOpen ? ' active' : ''}`}
        onClick={toggle}
        title="Ouvrir l'assistant IA"
        aria-label="Assistant IA"
        aria-expanded={isOpen}
      >
        <Sparkles size={20} />
      </button>
      <AssistantPanel />
    </>
  )
}
