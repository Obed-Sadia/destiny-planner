// DestinyPlanner — Onboarding (3 écrans)
// Écran 1 : "La tour" — introduction
// Écran 2 : Prénom
// Écran 3 : Niveau d'engagement

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { db } from '@/db/schema'
import type { UserProfile } from '@/types'

const STYLE = `
  .onboarding {
    min-height: 100dvh;
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-6);
    position: relative;
    overflow: hidden;
  }

  .onboarding::before {
    content: '';
    position: absolute;
    top: -30%;
    right: -20%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(196,154,60,0.06) 0%, transparent 70%);
    pointer-events: none;
  }

  .onboarding-card {
    width: 100%;
    max-width: 420px;
    animation: fadeIn 400ms ease both;
  }

  .onboarding-step-dots {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-8);
  }

  .onboarding-dot {
    width: 24px;
    height: 3px;
    border-radius: var(--r-full);
    background: var(--border-2);
    transition: background var(--transition-slow), width var(--transition-slow);
  }

  .onboarding-dot.active {
    background: var(--gold);
    width: 40px;
  }

  .onboarding-label {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: var(--space-4);
  }

  .onboarding-title {
    font-family: var(--font-editorial);
    font-size: var(--text-3xl);
    font-weight: 600;
    color: var(--text-1);
    line-height: 1.2;
    margin-bottom: var(--space-4);
  }

  .onboarding-verse {
    border-left: 2px solid var(--gold);
    padding: var(--space-3) var(--space-4);
    margin: var(--space-6) 0;
    background: var(--gold-pale);
    border-radius: 0 var(--r-sm) var(--r-sm) 0;
  }

  .onboarding-verse-text {
    font-family: var(--font-editorial);
    font-size: var(--text-md);
    color: var(--gold-soft);
    font-style: italic;
    line-height: var(--leading-snug);
  }

  .onboarding-verse-ref {
    font-size: var(--text-xs);
    color: var(--text-3);
    margin-top: var(--space-2);
    letter-spacing: 0.05em;
  }

  .onboarding-desc {
    font-size: var(--text-base);
    color: var(--text-2);
    line-height: var(--leading-normal);
    margin-bottom: var(--space-8);
  }

  .onboarding-input-wrap {
    margin: var(--space-6) 0 var(--space-8);
  }

  .onboarding-input-label {
    display: block;
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: var(--space-3);
  }

  .onboarding-input {
    width: 100%;
    font-family: var(--font-editorial);
    font-size: var(--text-2xl);
    font-weight: 400;
    color: var(--text-1);
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--border-2);
    padding: var(--space-2) 0;
    outline: none;
    transition: border-color var(--transition-base);
  }

  .onboarding-input::placeholder {
    color: var(--text-3);
  }

  .onboarding-input:focus {
    border-bottom-color: var(--gold);
  }

  .onboarding-levels {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin: var(--space-6) 0 var(--space-8);
  }

  .onboarding-level-card {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-5);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    cursor: pointer;
    transition: border-color var(--transition-base), background var(--transition-base);
    text-align: left;
    width: 100%;
  }

  .onboarding-level-card:hover {
    border-color: var(--border-2);
    background: var(--surface-2);
  }

  .onboarding-level-card.selected {
    border-color: var(--gold);
    background: var(--gold-pale);
  }

  .onboarding-level-emoji {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .onboarding-level-body {
    flex: 1;
    min-width: 0;
  }

  .onboarding-level-name {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
    line-height: 1.3;
  }

  .onboarding-level-desc {
    font-size: var(--text-sm);
    color: var(--text-2);
    margin-top: 2px;
  }

  .onboarding-level-check {
    width: 20px;
    height: 20px;
    border-radius: var(--r-full);
    border: 1.5px solid var(--border-2);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: border-color var(--transition-base), background var(--transition-base);
  }

  .onboarding-level-card.selected .onboarding-level-check {
    background: var(--gold);
    border-color: var(--gold);
    color: var(--bg);
  }

  .onboarding-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-4) var(--space-6);
    background: var(--gold);
    color: var(--bg);
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    border-radius: var(--r-md);
    cursor: pointer;
    border: none;
    transition: background var(--transition-base), opacity var(--transition-base);
    letter-spacing: 0.02em;
  }

  .onboarding-btn:hover:not(:disabled) {
    background: var(--gold-soft);
  }

  .onboarding-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const LEVELS = [
  {
    value: 1,
    emoji: '🌱',
    name: 'Niveau Découverte',
    desc: 'Je découvre à mon rythme, sans pression.',
  },
  {
    value: 2,
    emoji: '📐',
    name: 'Niveau Planificateur',
    desc: 'Je structure mes projets avec méthode.',
  },
  {
    value: 3,
    emoji: '🏗️',
    name: 'Bâtisseur Diligent',
    desc: "Je m'engage pleinement, chaque jour.",
  },
] as const

export default function Onboarding(): JSX.Element {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [firstName, setFirstName] = useState('')
  const [level, setLevel] = useState<1 | 2 | 3>(1)
  const [saving, setSaving] = useState(false)

  async function handleComplete(): Promise<void> {
    if (saving) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const existing = await db.user_profile.get('singleton')
      const profile: UserProfile = {
        id: 'singleton',
        first_name: firstName.trim(),
        avatar_emoji: null,
        avatar_color: null,
        bio: null,
        grade: 'discoverer',
        engagement_level: level,
        streak: 0,
        streak_best: 0,
        last_active_date: null,
        consecutive_inactive_days: 0,
        last_abandoned_project_date: null,
        total_projects_completed: 0,
        total_actions_done: 0,
        total_journal_entries: 0,
        total_time_blocks_done: 0,
        score_average_30d: null,
        onboarding_done: true,
        created_at: existing?.created_at ?? now,
        updated_at: now,
      }
      await db.user_profile.put(profile)
      navigate('/goal', { replace: true })
    } catch (err) {
      console.error('Onboarding.handleComplete', err)
      setSaving(false)
    }
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className="onboarding">
        <div className="onboarding-card">
          {/* Indicateur d'étape */}
          <div className="onboarding-step-dots">
            {([1, 2, 3] as const).map((s) => (
              <div key={s} className={`onboarding-dot${step === s ? ' active' : ''}`} />
            ))}
          </div>

          {/* Étape 1 — La tour */}
          {step === 1 && (
            <>
              <div className="onboarding-label">Avant de bâtir</div>
              <h1 className="onboarding-title">Calculez le coût.<br />Bâtissez avec intention.</h1>

              <div className="onboarding-verse">
                <p className="onboarding-verse-text">
                  "Lequel de vous, s'il veut bâtir une tour, ne s'assied pas d'abord pour calculer la dépense ?"
                </p>
                <p className="onboarding-verse-ref">— Luc 14:28</p>
              </div>

              <p className="onboarding-desc">
                DestinyPlanner vous guide à travers les 7 étapes de Myles Munroe pour transformer vos rêves en projets concrets — avec méthode, foi et persévérance.
              </p>

              <button className="onboarding-btn" onClick={() => setStep(2)}>
                Commencer <ArrowRight size={16} aria-hidden="true" />
              </button>
            </>
          )}

          {/* Étape 2 — Prénom */}
          {step === 2 && (
            <>
              <div className="onboarding-label">Votre identité</div>
              <h1 className="onboarding-title">Comment vous appelez-vous ?</h1>

              <div className="onboarding-input-wrap">
                <label className="onboarding-input-label" htmlFor="firstName">
                  Prénom
                </label>
                <input
                  id="firstName"
                  className="onboarding-input"
                  type="text"
                  placeholder="Votre prénom…"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && firstName.trim()) setStep(3)
                  }}
                  autoFocus
                  autoComplete="given-name"
                  maxLength={40}
                />
              </div>

              <button
                className="onboarding-btn"
                disabled={!firstName.trim()}
                onClick={() => setStep(3)}
              >
                Continuer <ArrowRight size={16} aria-hidden="true" />
              </button>
            </>
          )}

          {/* Étape 3 — Niveau d'engagement */}
          {step === 3 && (
            <>
              <div className="onboarding-label">Votre engagement</div>
              <h1 className="onboarding-title">
                Quel bâtisseur êtes-vous{firstName ? `, ${firstName}` : ''} ?
              </h1>

              <div className="onboarding-levels">
                {LEVELS.map(({ value, emoji, name, desc }) => (
                  <button
                    key={value}
                    className={`onboarding-level-card${level === value ? ' selected' : ''}`}
                    onClick={() => setLevel(value)}
                  >
                    <span className="onboarding-level-emoji" aria-hidden="true">{emoji}</span>
                    <div className="onboarding-level-body">
                      <div className="onboarding-level-name">{name}</div>
                      <div className="onboarding-level-desc">{desc}</div>
                    </div>
                    <div className="onboarding-level-check" aria-hidden="true">
                      {level === value && <Check size={12} strokeWidth={3} />}
                    </div>
                  </button>
                ))}
              </div>

              <button
                className="onboarding-btn"
                disabled={saving}
                onClick={handleComplete}
              >
                {saving ? 'Enregistrement…' : "S'engager"}
                {!saving && <ArrowRight size={16} aria-hidden="true" />}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
