// DestinyPlanner — Paramètres : gestion des habitudes & attitudes
// Règle : somme des poids des habitudes actives = 100

import { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, Check, X, Sliders, Moon, Sun, BookOpen } from 'lucide-react'
import { useHabitStore } from '../stores/useHabitStore'
import { useAppStore } from '../stores/useAppStore'
import { useUserStore } from '../stores/useUserStore'
import { TutorialModal } from '../components/shared/TutorialModal'
import type { Habit, HabitFrequency } from '../types'

const STYLE = `
  .settings {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    animation: fadeIn 200ms ease both;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── En-tête ── */
  .settings-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .settings-title {
    font-family: var(--font-editorial);
    font-size: var(--text-2xl);
    font-weight: 300;
    color: var(--text-1);
    line-height: var(--leading-tight);
  }

  .settings-subtitle {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-2);
  }

  /* ── Section ── */
  .settings-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .settings-section-title {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  /* ── Barre de distribution des poids ── */
  .weight-bar-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .weight-bar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .weight-bar-label {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-2);
  }

  .weight-total {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    padding: 2px 8px;
    border-radius: var(--r-full);
    transition: background var(--transition-base), color var(--transition-base);
  }

  .weight-total--valid {
    background: rgba(90, 158, 111, 0.18);
    color: var(--green);
  }

  .weight-total--invalid {
    background: rgba(224, 112, 112, 0.18);
    color: var(--coral);
  }

  .weight-bar-track {
    height: 8px;
    border-radius: var(--r-full);
    background: var(--surface-2);
    overflow: hidden;
    display: flex;
  }

  .weight-bar-segment {
    height: 100%;
    transition: width var(--transition-slow);
  }

  .weight-distribute-btn {
    align-self: flex-start;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 5px 10px;
    background: transparent;
    border: 1px solid var(--border-2);
    border-radius: var(--r-sm);
    color: var(--text-2);
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: border-color var(--transition-fast), color var(--transition-fast);
  }

  .weight-distribute-btn:hover {
    border-color: var(--gold);
    color: var(--gold-soft);
  }

  /* ── Légende des couleurs ── */
  .weight-legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-3);
  }

  .weight-legend-item {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-2);
  }

  .weight-legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* ── Liste des habitudes ── */
  .habit-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  /* ── Ligne habitude (lecture) ── */
  .habit-row {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: var(--space-3) var(--space-4);
    display: flex;
    align-items: center;
    gap: var(--space-3);
    transition: border-color var(--transition-fast);
  }

  .habit-row:hover {
    border-color: var(--border-2);
  }

  .habit-color-strip {
    width: 3px;
    height: 36px;
    border-radius: var(--r-full);
    flex-shrink: 0;
  }

  .habit-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .habit-name {
    font-family: var(--font-ui);
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
    color: var(--text-1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .habit-name--inactive {
    color: var(--text-3);
    text-decoration: line-through;
  }

  .habit-meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .habit-weight-badge {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
    background: var(--surface-2);
    padding: 1px 6px;
    border-radius: var(--r-full);
  }

  .habit-freq-badge {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  .habit-actions {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .habit-toggle {
    width: 34px;
    height: 20px;
    border-radius: var(--r-full);
    border: 1px solid var(--border-2);
    background: var(--surface-2);
    cursor: pointer;
    position: relative;
    transition: background var(--transition-base), border-color var(--transition-base);
    flex-shrink: 0;
  }

  .habit-toggle--active {
    background: rgba(196, 154, 60, 0.3);
    border-color: var(--gold);
  }

  .habit-toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--text-3);
    transition: transform var(--transition-base), background var(--transition-base);
  }

  .habit-toggle--active .habit-toggle-thumb {
    transform: translateX(14px);
    background: var(--gold);
  }

  .habit-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--r-sm);
    border: none;
    background: transparent;
    color: var(--text-3);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .habit-icon-btn:hover {
    background: var(--surface-2);
    color: var(--text-2);
  }

  .habit-icon-btn--danger:hover {
    background: rgba(224, 112, 112, 0.15);
    color: var(--coral);
  }

  /* ── Ligne habitude (édition) ── */
  .habit-row--edit {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
    border-color: var(--gold);
    background: rgba(196, 154, 60, 0.04);
  }

  .habit-edit-grid {
    display: grid;
    grid-template-columns: 1fr 80px auto;
    gap: var(--space-3);
    align-items: center;
  }

  @media (max-width: 500px) {
    .habit-edit-grid {
      grid-template-columns: 1fr 80px;
    }
  }

  .habit-edit-input {
    font-family: var(--font-ui);
    font-size: var(--text-base);
    color: var(--text-1);
    background: var(--surface-2);
    border: 1px solid var(--border-2);
    border-radius: var(--r-sm);
    padding: 6px 10px;
    width: 100%;
    outline: none;
    transition: border-color var(--transition-fast);
  }

  .habit-edit-input:focus {
    border-color: var(--gold);
  }

  .habit-edit-input--number {
    text-align: center;
  }

  .habit-edit-row2 {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .habit-freq-select {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-2);
    background: var(--surface-2);
    border: 1px solid var(--border-2);
    border-radius: var(--r-sm);
    padding: 5px 8px;
    outline: none;
    cursor: pointer;
    transition: border-color var(--transition-fast);
  }

  .habit-freq-select:focus {
    border-color: var(--gold);
  }

  .habit-edit-btns {
    display: flex;
    gap: var(--space-2);
  }

  .btn-save {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px;
    background: var(--gold-pale);
    border: 1px solid rgba(196, 154, 60, 0.3);
    border-radius: var(--r-sm);
    color: var(--gold-soft);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .btn-save:hover {
    background: rgba(196, 154, 60, 0.2);
  }

  .btn-cancel {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px;
    background: transparent;
    border: 1px solid var(--border-2);
    border-radius: var(--r-sm);
    color: var(--text-3);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    cursor: pointer;
    transition: border-color var(--transition-fast), color var(--transition-fast);
  }

  .btn-cancel:hover {
    border-color: var(--border-2);
    color: var(--text-2);
  }

  /* ── Formulaire d'ajout ── */
  .habit-add-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: transparent;
    border: 1px dashed var(--border-2);
    border-radius: var(--r-md);
    color: var(--text-3);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    cursor: pointer;
    transition: border-color var(--transition-fast), color var(--transition-fast);
    width: 100%;
    text-align: left;
  }

  .habit-add-btn:hover {
    border-color: var(--gold);
    color: var(--gold-soft);
  }

  /* ── Alerte poids invalide ── */
  .weight-alert {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: rgba(224, 112, 112, 0.08);
    border: 1px solid rgba(224, 112, 112, 0.2);
    border-radius: var(--r-md);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--coral);
    line-height: var(--leading-normal);
  }

  /* ── Vide ── */
  .habit-empty {
    padding: var(--space-8) var(--space-4);
    text-align: center;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-3);
  }

  /* ── Apparence ── */
  .appearance-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
  }

  .appearance-row-label {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-family: var(--font-ui);
    font-size: var(--text-base);
    color: var(--text-1);
  }

  .appearance-row-sub {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-2);
    margin-top: 2px;
  }

  .tut-replay-btn {
    padding: 6px 14px;
    background: var(--gold-pale);
    border: 1px solid rgba(196, 154, 60, 0.25);
    border-radius: var(--r-md);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--gold-soft);
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: background var(--transition-fast), border-color var(--transition-fast);
  }

  .tut-replay-btn:hover {
    background: rgba(196, 154, 60, 0.18);
    border-color: rgba(196, 154, 60, 0.4);
  }

  .theme-toggle {
    width: 44px;
    height: 24px;
    border-radius: var(--r-full);
    border: 1px solid var(--border-2);
    background: var(--surface-2);
    cursor: pointer;
    position: relative;
    transition: background var(--transition-base), border-color var(--transition-base);
    flex-shrink: 0;
  }

  .theme-toggle--light {
    background: rgba(196, 154, 60, 0.3);
    border-color: var(--gold);
  }

  .theme-toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--text-3);
    transition: transform var(--transition-base), background var(--transition-base);
  }

  .theme-toggle--light .theme-toggle-thumb {
    transform: translateX(20px);
    background: var(--gold);
  }

  /* ── Toggle langue ── */
  .lang-toggle {
    display: flex;
    align-items: center;
    gap: 2px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: 2px;
  }

  .lang-btn {
    padding: 4px 14px;
    border: none;
    border-radius: calc(var(--r-md) - 2px);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
    background: transparent;
    color: var(--text-3);
  }

  .lang-btn--active {
    background: var(--surface);
    color: var(--text-1);
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
`

const HABIT_COLORS = [
  '#7B6FD4',
  '#2DA58A',
  '#D4854A',
  '#5B9BD4',
  '#5A9E6F',
  '#E07070',
  '#C49A3C',
]

const FREQ_LABELS: Record<HabitFrequency, string> = {
  daily: 'Chaque jour',
  weekdays: 'Jours ouvrés',
  custom: 'Personnalisé',
}

interface EditState {
  name: string
  weight: number
  frequency: HabitFrequency
  active: boolean
}

function blankEdit(): EditState {
  return { name: '', weight: 10, frequency: 'daily', active: true }
}

export default function Settings(): JSX.Element {
  const { habits, weightsValid, load, addHabit, updateHabit, deleteHabit } = useHabitStore()
  const { preferences, toggleDarkMode, updatePreferences } = useAppStore()
  const { updateProfile } = useUserStore()
  const [showTutorial, setShowTutorial] = useState<boolean>(false)

  async function handleReplayTutorial(): Promise<void> {
    try {
      await updateProfile({ tutorial_done: false })
    } catch (_) {
      // Non-critique
    }
    setShowTutorial(true)
  }

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>(blankEdit())
  const [showAddForm, setShowAddForm] = useState<boolean>(false)
  const [addState, setAddState] = useState<EditState>(blankEdit())

  useEffect(() => {
    load().catch(console.error)
  }, [load])

  const activeHabits = habits.filter((h) => h.active)
  const totalWeight = activeHabits.reduce((acc, h) => acc + h.weight, 0)

  function startEdit(habit: Habit): void {
    setShowAddForm(false)
    setEditingId(habit.id)
    setEditState({
      name: habit.name,
      weight: habit.weight,
      frequency: habit.frequency,
      active: habit.active,
    })
  }

  async function saveEdit(id: string): Promise<void> {
    if (!editState.name.trim()) return
    await updateHabit(id, {
      name: editState.name.trim(),
      weight: editState.weight,
      frequency: editState.frequency,
      active: editState.active,
    })
    setEditingId(null)
  }

  async function saveAdd(): Promise<void> {
    if (!addState.name.trim()) return
    await addHabit({
      name: addState.name.trim(),
      weight: addState.weight,
      frequency: addState.frequency,
      sort_order: habits.length,
    })
    setAddState(blankEdit())
    setShowAddForm(false)
  }

  async function distributeEvenly(): Promise<void> {
    const active = habits.filter((h) => h.active)
    if (active.length === 0) return
    const base = Math.floor(100 / active.length)
    const remainder = 100 - base * active.length
    for (let i = 0; i < active.length; i++) {
      const weight = i === 0 ? base + remainder : base
      await updateHabit(active[i].id, { weight })
    }
  }

  function getColor(index: number): string {
    return HABIT_COLORS[index % HABIT_COLORS.length]
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className="settings">

        {/* En-tête */}
        <div className="settings-header">
          <h1 className="settings-title">Habitudes &amp; attitudes</h1>
          <p className="settings-subtitle">
            Définissez les habitudes qui composent votre score quotidien. La somme des poids doit toujours être égale à 100.
          </p>
        </div>

        {/* Distribution des poids */}
        <div className="settings-section">
          <span className="settings-section-title">Répartition des attitudes</span>

          <div className="weight-bar-wrap">
            <div className="weight-bar-header">
              <span className="weight-bar-label">Distribution des poids actifs</span>
              <span className={`weight-total ${weightsValid ? 'weight-total--valid' : 'weight-total--invalid'}`}>
                {totalWeight} / 100
              </span>
            </div>

            <div className="weight-bar-track">
              {activeHabits.map((h) => (
                <div
                  key={h.id}
                  className="weight-bar-segment"
                  style={{
                    width: `${(h.weight / Math.max(totalWeight, 100)) * 100}%`,
                    background: getColor(habits.indexOf(h)),
                    opacity: 0.8,
                  }}
                />
              ))}
            </div>

            {activeHabits.length > 0 && (
              <div className="weight-legend">
                {activeHabits.map((h) => (
                  <div key={h.id} className="weight-legend-item">
                    <div
                      className="weight-legend-dot"
                      style={{ background: getColor(habits.indexOf(h)) }}
                    />
                    <span>{h.name}</span>
                    <span style={{ color: 'var(--text-3)' }}>({h.weight}%)</span>
                  </div>
                ))}
              </div>
            )}

            <button className="weight-distribute-btn" onClick={distributeEvenly}>
              <Sliders size={12} />
              Distribuer uniformément
            </button>
          </div>

          {!weightsValid && activeHabits.length > 0 && (
            <div className="weight-alert">
              Le total des poids est de {totalWeight} au lieu de 100. Ajustez les poids ou cliquez sur « Distribuer uniformément ».
            </div>
          )}
        </div>

        {/* Liste des habitudes */}
        <div className="settings-section">
          <span className="settings-section-title">Habitudes ({habits.length})</span>

          <div className="habit-list">
            {habits.length === 0 && (
              <div className="habit-empty">
                Aucune habitude définie. Créez votre première habitude ci-dessous.
              </div>
            )}

            {habits.map((habit, idx) => {
              const color = getColor(idx)

              if (editingId === habit.id) {
                return (
                  <div key={habit.id} className="habit-row habit-row--edit">
                    <div className="habit-edit-grid">
                      <input
                        className="habit-edit-input"
                        value={editState.name}
                        onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                        placeholder="Nom de l'habitude"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(habit.id).catch(console.error) }}
                      />
                      <input
                        className="habit-edit-input habit-edit-input--number"
                        type="number"
                        min={1}
                        max={100}
                        value={editState.weight}
                        onChange={(e) => setEditState((s) => ({ ...s, weight: Number(e.target.value) }))}
                      />
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)' }}>pts</span>
                    </div>

                    <div className="habit-edit-row2">
                      <select
                        className="habit-freq-select"
                        value={editState.frequency}
                        onChange={(e) => setEditState((s) => ({ ...s, frequency: e.target.value as HabitFrequency }))}
                      >
                        <option value="daily">Chaque jour</option>
                        <option value="weekdays">Jours ouvrés</option>
                        <option value="custom">Personnalisé</option>
                      </select>

                      <div className="habit-edit-btns">
                        <button className="btn-cancel" onClick={() => setEditingId(null)}>
                          <X size={13} /> Annuler
                        </button>
                        <button className="btn-save" onClick={() => saveEdit(habit.id).catch(console.error)}>
                          <Check size={13} /> Enregistrer
                        </button>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div key={habit.id} className="habit-row">
                  <div className="habit-color-strip" style={{ background: color }} />

                  <div className="habit-info">
                    <span className={`habit-name ${habit.active ? '' : 'habit-name--inactive'}`}>
                      {habit.name}
                    </span>
                    <div className="habit-meta">
                      <span className="habit-weight-badge">{habit.weight} pts</span>
                      <span className="habit-freq-badge">{FREQ_LABELS[habit.frequency]}</span>
                    </div>
                  </div>

                  <div className="habit-actions">
                    {/* Toggle actif/inactif */}
                    <button
                      className={`habit-toggle ${habit.active ? 'habit-toggle--active' : ''}`}
                      onClick={() => updateHabit(habit.id, { active: !habit.active }).catch(console.error)}
                      title={habit.active ? 'Désactiver' : 'Activer'}
                    >
                      <div className="habit-toggle-thumb" />
                    </button>

                    <button
                      className="habit-icon-btn"
                      onClick={() => startEdit(habit)}
                      title="Modifier"
                    >
                      <Pencil size={13} />
                    </button>

                    <button
                      className="habit-icon-btn habit-icon-btn--danger"
                      onClick={() => deleteHabit(habit.id).catch(console.error)}
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Formulaire d'ajout inline */}
            {showAddForm ? (
              <div className="habit-row habit-row--edit">
                <div className="habit-edit-grid">
                  <input
                    className="habit-edit-input"
                    value={addState.name}
                    onChange={(e) => setAddState((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Nom de l'habitude"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') saveAdd().catch(console.error) }}
                  />
                  <input
                    className="habit-edit-input habit-edit-input--number"
                    type="number"
                    min={1}
                    max={100}
                    value={addState.weight}
                    onChange={(e) => setAddState((s) => ({ ...s, weight: Number(e.target.value) }))}
                  />
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)' }}>pts</span>
                </div>

                <div className="habit-edit-row2">
                  <select
                    className="habit-freq-select"
                    value={addState.frequency}
                    onChange={(e) => setAddState((s) => ({ ...s, frequency: e.target.value as HabitFrequency }))}
                  >
                    <option value="daily">Chaque jour</option>
                    <option value="weekdays">Jours ouvrés</option>
                    <option value="custom">Personnalisé</option>
                  </select>

                  <div className="habit-edit-btns">
                    <button className="btn-cancel" onClick={() => { setShowAddForm(false); setAddState(blankEdit()) }}>
                      <X size={13} /> Annuler
                    </button>
                    <button className="btn-save" onClick={() => saveAdd().catch(console.error)}>
                      <Check size={13} /> Ajouter
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                className="habit-add-btn"
                onClick={() => { setEditingId(null); setShowAddForm(true) }}
              >
                <Plus size={14} />
                Ajouter une habitude
              </button>
            )}
          </div>
        </div>

        {/* Apparence */}
        <div className="settings-section">
          <span className="settings-section-title">Apparence</span>

          <div className="appearance-row">
            <div>
              <div className="appearance-row-label">
                {preferences?.dark_mode === false ? <Sun size={15} /> : <Moon size={15} />}
                {preferences?.dark_mode === false ? 'Mode clair' : 'Mode sombre'}
              </div>
              <div className="appearance-row-sub">
                {preferences?.dark_mode === false
                  ? 'Interface claire activée'
                  : 'Interface sombre activée (par défaut)'}
              </div>
            </div>

            <button
              className={`theme-toggle ${preferences?.dark_mode === false ? 'theme-toggle--light' : ''}`}
              onClick={() => toggleDarkMode().catch(console.error)}
              title="Changer de thème"
            >
              <div className="theme-toggle-thumb" />
            </button>
          </div>

          <div className="appearance-row">
            <div>
              <div className="appearance-row-label">Langue</div>
              <div className="appearance-row-sub">
                {preferences?.language === 'en' ? 'Interface in English' : 'Interface en français'}
              </div>
            </div>
            <div className="lang-toggle">
              <button
                type="button"
                className={`lang-btn${preferences?.language !== 'en' ? ' lang-btn--active' : ''}`}
                onClick={() => updatePreferences({ language: 'fr' }).catch(console.error)}
                aria-pressed={preferences?.language !== 'en'}
              >
                FR
              </button>
              <button
                type="button"
                className={`lang-btn${preferences?.language === 'en' ? ' lang-btn--active' : ''}`}
                onClick={() => updatePreferences({ language: 'en' }).catch(console.error)}
                aria-pressed={preferences?.language === 'en'}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        {/* Aide */}
        <div className="settings-section">
          <span className="settings-section-title">Aide</span>

          <div className="appearance-row">
            <div>
              <div className="appearance-row-label">
                <BookOpen size={15} />
                Guide de démarrage
              </div>
              <div className="appearance-row-sub">Revoir l'introduction à toutes les sections</div>
            </div>
            <button
              type="button"
              className="tut-replay-btn"
              onClick={() => { void handleReplayTutorial() }}
            >
              Revoir le tutoriel
            </button>
          </div>
        </div>

      </div>

      {showTutorial && (
        <TutorialModal onClose={() => setShowTutorial(false)} />
      )}
    </>
  )
}
