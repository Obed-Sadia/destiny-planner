// DestinyPlanner — Wizard des 7 étapes
// Orchestrateur : progress, auto-save 300ms, navigation, génération jalons step 5

import { useEffect, useRef, useState, Fragment } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check, Lock, ArrowLeft } from 'lucide-react'
import { useProjectStore } from '@/stores/useProjectStore'
import { useMilestoneStore } from '@/stores/useMilestoneStore'
import { useDomainStore } from '@/stores/useDomainStore'
import { VerseCard } from '@/components/shared/VerseCard'
import { QuoteCard } from '@/components/shared/QuoteCard'
import { Step1Vision } from '@/components/wizard/Step1Vision'
import { Step2Stop } from '@/components/wizard/Step2Stop'
import { Step3SWOT } from '@/components/wizard/Step3SWOT'
import { Step4Cost } from '@/components/wizard/Step4Cost'
import { Step5Calculate } from '@/components/wizard/Step5Calculate'
import { Step6Verify } from '@/components/wizard/Step6Verify'
import { Step7Commit } from '@/components/wizard/Step7Commit'
import { VERSES } from '@/constants/verses'
import { QUOTES } from '@/constants/quotes'
import type {
  StepData,
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data,
  Step5Data,
  Step6Data,
  Step7Data,
} from '@/types'

// ─── Helpers ──────────────────────────────────────────────────

function getVerseForStep(stepNum: number) {
  return (
    VERSES.find((v) => v.step_affinity === stepNum) ??
    VERSES.find((v) => v.step_affinity === null) ??
    VERSES[0]
  )
}

function getQuoteForStep(stepNum: number) {
  return (
    QUOTES.find((q) => q.step_affinity.includes(stepNum)) ??
    QUOTES.find((q) => q.step_affinity.length === 0) ??
    QUOTES[0]
  )
}

// ─── Configuration des étapes ─────────────────────────────────

const STEP_CONFIG = [
  {
    num: 1,
    name: 'Vision',
    desc: "Définissez clairement votre projet et l'image de son accomplissement.",
    color: 'var(--step-1)',
  },
  {
    num: 2,
    name: "S'arrêter",
    desc: 'Examinez votre motivation : conviction profonde ou simple impulsion ?',
    color: 'var(--step-2)',
  },
  {
    num: 3,
    name: 'Estimer',
    desc: 'Analysez honnêtement vos forces, faiblesses, opportunités et menaces.',
    color: 'var(--step-3)',
  },
  {
    num: 4,
    name: 'Compter le coût',
    desc: 'Identifiez tous les sacrifices que ce projet exigera de vous.',
    color: 'var(--step-4)',
  },
  {
    num: 5,
    name: 'Calculer',
    desc: 'Planifiez le budget, la durée et les jalons datés de votre projet.',
    color: 'var(--step-5)',
  },
  {
    num: 6,
    name: 'Vérifier',
    desc: 'Confrontez vos ressources disponibles à vos besoins réels.',
    color: 'var(--step-6)',
  },
  {
    num: 7,
    name: "S'engager",
    desc: 'Définissez vos critères de succès et prenez un engagement solennel.',
    color: 'var(--step-7)',
  },
]

// ─── Vérification de complétion par étape ─────────────────────

function checkCanComplete(stepNum: number, data: Partial<StepData>): boolean {
  switch (stepNum) {
    case 1: {
      const d = data as Partial<Step1Data>
      return Boolean(d.title?.trim())
    }
    case 2: {
      const d = data as Partial<Step2Data>
      return Boolean(d.reflection?.trim())
    }
    case 3: {
      const d = data as Partial<Step3Data>
      return Boolean(d.strengths?.trim() && d.weaknesses?.trim())
    }
    case 4: {
      const d = data as Partial<Step4Data>
      return Boolean(d.financial_cost?.trim()) && d.ready_to_pay !== undefined
    }
    case 5: {
      const d = data as Partial<Step5Data>
      return Boolean(d.milestones_draft?.length && d.milestones_draft[0].title.trim())
    }
    case 6: {
      const d = data as Partial<Step6Data>
      return Boolean(d.decision)
    }
    case 7: {
      const d = data as Partial<Step7Data>
      return Boolean(d.commitment_statement?.trim() && d.start_date)
    }
    default:
      return false
  }
}

// ─── CSS ──────────────────────────────────────────────────────

const STYLE = `
  .wizard {
    max-width: 640px;
    padding-bottom: var(--space-16);
    animation: fadeIn 250ms ease both;
  }

  .wizard-topbar {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-6);
  }

  .wizard-back-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-sm);
    color: var(--text-2);
    text-decoration: none;
    padding: var(--space-1) 0;
    transition: color var(--transition-base);
  }

  .wizard-back-link:hover {
    color: var(--text-1);
  }

  .wizard-project-domain {
    font-size: var(--text-xs);
    color: var(--text-3);
    margin-left: auto;
  }

  /* ── Progress track ─────────────────────── */

  .wizard-progress {
    margin-bottom: var(--space-6);
  }

  .wizard-progress-track {
    display: flex;
    align-items: center;
    margin-bottom: var(--space-4);
  }

  .wizard-progress-dot-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
  }

  .wizard-progress-dot {
    width: 30px;
    height: 30px;
    border-radius: var(--r-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-xs);
    font-weight: var(--weight-bold);
    border: 2px solid transparent;
    transition: all var(--transition-slow);
    cursor: pointer;
    position: relative;
    background: var(--surface-2);
    color: var(--text-3);
  }

  .wizard-progress-dot--done {
    color: #fff;
    border-color: transparent;
  }

  .wizard-progress-dot--active {
    background: transparent;
    box-shadow: 0 0 0 3px var(--bg), 0 0 0 5px currentColor;
  }

  .wizard-progress-dot--locked {
    cursor: default;
    opacity: 0.5;
  }

  .wizard-progress-dot--current-viewing {
    transform: scale(1.1);
  }

  .wizard-progress-line {
    flex: 1;
    height: 1.5px;
    background: var(--border);
    transition: background var(--transition-slow);
  }

  .wizard-progress-line--filled {
    background: rgba(196, 154, 60, 0.35);
  }

  /* ── Step header ────────────────────────── */

  .wizard-step-header {
    margin-bottom: var(--space-6);
  }

  .wizard-step-eyebrow {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: var(--space-2);
    transition: color var(--transition-slow);
  }

  .wizard-step-name {
    font-family: var(--font-editorial);
    font-size: var(--text-3xl);
    font-weight: 600;
    color: var(--text-1);
    line-height: 1.15;
    margin-bottom: var(--space-2);
  }

  .wizard-step-desc {
    font-size: var(--text-sm);
    color: var(--text-2);
    line-height: var(--leading-snug);
  }

  /* ── Completed badge ────────────────────── */

  .wizard-done-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--r-full);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    background: rgba(90, 158, 111, 0.12);
    color: var(--green);
    border: 1px solid rgba(90, 158, 111, 0.25);
    margin-bottom: var(--space-5);
  }

  /* ── Footer navigation ──────────────────── */

  .wizard-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: var(--space-6);
    margin-top: var(--space-8);
    border-top: 1px solid var(--border);
  }

  .wizard-footer-right {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .wizard-btn-back {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-2);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--r-md);
    transition: color var(--transition-base);
    background: transparent;
    border: none;
    cursor: pointer;
  }

  .wizard-btn-back:hover:not(:disabled) {
    color: var(--text-1);
  }

  .wizard-btn-back:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .wizard-btn-next {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-2);
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--border-2);
    border-radius: var(--r-md);
    background: transparent;
    cursor: pointer;
    transition: all var(--transition-base);
  }

  .wizard-btn-next:hover {
    color: var(--text-1);
    border-color: var(--gold);
  }

  .wizard-btn-validate {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-6);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    border-radius: var(--r-md);
    color: #fff;
    border: none;
    cursor: pointer;
    transition: opacity var(--transition-base), transform var(--transition-fast);
  }

  .wizard-btn-validate:hover:not(:disabled) {
    opacity: 0.88;
    transform: translateY(-1px);
  }

  .wizard-btn-validate:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    transform: none;
  }

  /* ── Loading ────────────────────────────── */

  .wizard-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 240px;
    color: var(--text-2);
    font-size: var(--text-sm);
    font-family: var(--font-ui);
  }

  /* ── New project creation ───────────────── */

  .wizard-create {
    max-width: 560px;
    animation: fadeIn 250ms ease both;
  }

  .wizard-create-eyebrow {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: var(--space-3);
  }

  .wizard-create-title {
    font-family: var(--font-editorial);
    font-size: var(--text-3xl);
    font-weight: 600;
    color: var(--text-1);
    line-height: 1.15;
    margin-bottom: var(--space-8);
  }

  .wizard-create-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-bottom: var(--space-6);
  }

  .wizard-create-label {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
  }

  .wizard-create-input {
    font-family: var(--font-editorial);
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--text-1);
    background: var(--surface-2);
    border: 1px solid var(--border-2);
    border-radius: var(--r-md);
    padding: var(--space-3) var(--space-4);
    outline: none;
    width: 100%;
    box-sizing: border-box;
    transition: border-color var(--transition-base);
    caret-color: var(--gold);
  }

  .wizard-create-input:focus {
    border-color: var(--gold);
  }

  .wizard-create-input::placeholder {
    color: var(--text-3);
    font-style: italic;
    font-weight: 400;
  }

  .wizard-domain-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--space-3);
  }

  .wizard-domain-option {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: var(--space-3) var(--space-4);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
    cursor: pointer;
    transition: all var(--transition-base);
    text-align: left;
  }

  .wizard-domain-option:hover {
    border-color: var(--border-2);
    background: var(--surface-2);
  }

  .wizard-domain-option--selected {
    border-color: var(--gold);
    background: var(--gold-pale);
  }

  .wizard-domain-option-icon {
    font-size: 1.375rem;
    line-height: 1;
  }

  .wizard-domain-option-name {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text-1);
    line-height: 1.3;
  }

  .wizard-create-btn {
    margin-top: var(--space-8);
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-8);
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    background: var(--gold);
    color: var(--bg);
    border: none;
    border-radius: var(--r-md);
    cursor: pointer;
    transition: background var(--transition-base), opacity var(--transition-base);
  }

  .wizard-create-btn:hover:not(:disabled) {
    background: var(--gold-soft);
  }

  .wizard-create-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

// ─── Composant principal ───────────────────────────────────────

export default function ProjectWizard(): JSX.Element {
  const params = useParams<{ id: string }>()
  const projectId = params.id
  const navigate = useNavigate()

  const {
    projects,
    steps: allSteps,
    load: loadProjects,
    loadStepsForProject,
    saveStepData,
    completeStep,
    addProject,
  } = useProjectStore()

  const { addMilestone } = useMilestoneStore()
  const { domains, load: loadDomains } = useDomainStore()

  // Wizard state
  const [viewingStep, setViewingStep] = useState(1)
  const [localData, setLocalData] = useState<Partial<Record<number, Partial<StepData>>>>({})
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // New project creation state
  const [newTitle, setNewTitle] = useState('')
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const project = projectId ? projects.find((p) => p.id === projectId) : undefined
  const projectSteps = projectId ? allSteps.filter((s) => s.project_id === projectId) : []
  const domain = domains.find((d) => d.id === project?.domain_id)

  // ── Chargement initial ──────────────────

  useEffect(() => {
    loadProjects()
    loadDomains()
  }, [loadProjects, loadDomains])

  useEffect(() => {
    if (projectId) {
      loadStepsForProject(projectId)
    }
  }, [projectId, loadStepsForProject])

  useEffect(() => {
    if (project) {
      setViewingStep(project.current_step)
    }
  }, [project?.current_step])

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  // ── Données fusionnées ──────────────────

  function getMergedData(stepNum: number): Partial<StepData> {
    const step = projectSteps.find((s) => s.step_number === stepNum)
    return { ...(step?.data ?? {}), ...(localData[stepNum] ?? {}) } as Partial<StepData>
  }

  // ── Auto-save avec debounce 300ms ───────

  function handleDataChange(stepNum: number, patch: Partial<StepData>): void {
    setLocalData((prev) => ({
      ...prev,
      [stepNum]: { ...(prev[stepNum] ?? {}), ...patch },
    }))

    if (saveTimer.current) clearTimeout(saveTimer.current)

    const stepRecord = projectSteps.find((s) => s.step_number === stepNum)
    if (!stepRecord) return

    saveTimer.current = setTimeout(async () => {
      try {
        await saveStepData(stepRecord.id, patch)
      } catch (error) {
        console.error('wizard auto-save', error)
      }
    }, 300)
  }

  // ── Valider l'étape courante ────────────

  async function handleComplete(): Promise<void> {
    if (!projectId || !currentStepRecord) return

    // Flush debounce
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }

    // Flush local data
    const pending = localData[viewingStep]
    if (pending && Object.keys(pending).length > 0) {
      try {
        await saveStepData(currentStepRecord.id, pending)
      } catch (error) {
        console.error('wizard flush save', error)
      }
    }

    // Générer les jalons depuis step 5
    if (viewingStep === 5) {
      const data5 = getMergedData(5) as Partial<Step5Data>
      const drafts = data5.milestones_draft ?? []
      for (let i = 0; i < drafts.length; i++) {
        const draft = drafts[i]
        if (!draft.title.trim()) continue
        try {
          await addMilestone({
            project_id: projectId,
            title: draft.title.trim(),
            description: '',
            due_date: draft.due_date || null,
            status: 'planned',
            sort_order: i,
          })
        } catch (error) {
          console.error('wizard milestone create', error)
        }
      }
    }

    try {
      await completeStep(currentStepRecord.id, projectId, viewingStep)
    } catch (error) {
      console.error('wizard completeStep', error)
      return
    }

    if (viewingStep === 7) {
      navigate(`/projects/${projectId}`)
    }
    // viewingStep sera mis à jour par useEffect sur project.current_step
  }

  // ── Création d'un nouveau projet ────────

  async function handleCreateProject(): Promise<void> {
    if (!newTitle.trim() || !selectedDomainId || creating) return
    setCreating(true)
    try {
      const project = await addProject(selectedDomainId, newTitle.trim())
      navigate(`/projects/${project.id}/wizard`, { replace: true })
    } catch (error) {
      console.error('wizard createProject', error)
      setCreating(false)
    }
  }

  // ── Calculs dérivés ─────────────────────

  const currentStepRecord = projectSteps.find((s) => s.step_number === viewingStep)
  const stepIsActive = currentStepRecord?.status === 'active'
  const stepIsCompleted = currentStepRecord?.status === 'completed'
  const canGoBack = viewingStep > 1
  const canGoForward = stepIsCompleted && viewingStep < (project?.current_step ?? 1)
  const stepConfig = STEP_CONFIG[viewingStep - 1]
  const canComplete = stepIsActive && checkCanComplete(viewingStep, getMergedData(viewingStep))

  // ── Rendu de l'étape active ─────────────

  function renderStep(): JSX.Element {
    const stepNum = viewingStep
    const data = getMergedData(stepNum)
    const onChange = (patch: Partial<StepData>): void => handleDataChange(stepNum, patch)

    switch (stepNum) {
      case 1:
        return (
          <Step1Vision
            data={data as unknown as Partial<Step1Data>}
            onChange={onChange as (p: Partial<Step1Data>) => void}
          />
        )
      case 2:
        return (
          <Step2Stop
            data={data as unknown as Partial<Step2Data>}
            onChange={onChange as (p: Partial<Step2Data>) => void}
          />
        )
      case 3:
        return (
          <Step3SWOT
            data={data as unknown as Partial<Step3Data>}
            onChange={onChange as (p: Partial<Step3Data>) => void}
          />
        )
      case 4:
        return (
          <Step4Cost
            data={data as unknown as Partial<Step4Data>}
            onChange={onChange as (p: Partial<Step4Data>) => void}
          />
        )
      case 5:
        return (
          <Step5Calculate
            data={data as unknown as Partial<Step5Data>}
            onChange={onChange as (p: Partial<Step5Data>) => void}
          />
        )
      case 6:
        return (
          <Step6Verify
            data={data as unknown as Partial<Step6Data>}
            onChange={onChange as (p: Partial<Step6Data>) => void}
          />
        )
      case 7:
        return (
          <Step7Commit
            data={data as unknown as Partial<Step7Data>}
            onChange={onChange as (p: Partial<Step7Data>) => void}
          />
        )
      default:
        return <></>
    }
  }

  // ── Rendu : création d'un nouveau projet ─

  if (!projectId) {
    return (
      <>
        <style>{STYLE}</style>
        <div className="wizard-create">
          <Link to="/projects" className="wizard-back-link" style={{ marginBottom: 'var(--space-6)', display: 'inline-flex' }}>
            <ArrowLeft size={15} />
            Mes projets
          </Link>

          <div className="wizard-create-eyebrow">Nouveau projet</div>
          <h1 className="wizard-create-title">Bâtissons ensemble</h1>

          <div className="wizard-create-field">
            <label className="wizard-create-label" htmlFor="new-title">
              Nom du projet
            </label>
            <input
              id="new-title"
              type="text"
              className="wizard-create-input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTitle.trim() && selectedDomainId) {
                  handleCreateProject()
                }
              }}
              placeholder="Ex : Lancer ma formation en ligne"
              maxLength={100}
              autoFocus
            />
          </div>

          <div className="wizard-create-field">
            <span className="wizard-create-label">Dans quel domaine ?</span>
            <div className="wizard-domain-grid" style={{ marginTop: 'var(--space-2)' }}>
              {domains.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`wizard-domain-option ${selectedDomainId === d.id ? 'wizard-domain-option--selected' : ''}`}
                  onClick={() => setSelectedDomainId(d.id)}
                >
                  <span className="wizard-domain-option-icon" aria-hidden="true">{d.icon}</span>
                  <span className="wizard-domain-option-name">{d.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="wizard-create-btn"
            disabled={!newTitle.trim() || !selectedDomainId || creating}
            onClick={handleCreateProject}
          >
            Commencer les 7 étapes
            <ChevronRight size={16} />
          </button>
        </div>
      </>
    )
  }

  // ── Rendu : chargement ──────────────────

  if (!project || projectSteps.length === 0) {
    return (
      <>
        <style>{STYLE}</style>
        <div className="wizard-loading">
          <span>Chargement…</span>
        </div>
      </>
    )
  }

  // ── Rendu : wizard principal ────────────

  return (
    <>
      <style>{STYLE}</style>
      <div className="wizard">

        {/* Topbar */}
        <div className="wizard-topbar">
          <Link to="/projects" className="wizard-back-link">
            <ArrowLeft size={15} />
            Mes projets
          </Link>
          {domain && (
            <span className="wizard-project-domain">
              {domain.icon} {domain.name}
            </span>
          )}
        </div>

        {/* Progress track */}
        <div className="wizard-progress">
          <div className="wizard-progress-track">
            {STEP_CONFIG.map((cfg, index) => {
              const step = projectSteps.find((s) => s.step_number === cfg.num)
              const isCompleted = step?.status === 'completed'
              const isActive = step?.status === 'active'
              const isLocked = step?.status === 'locked'
              const isCurrent = cfg.num === viewingStep
              const prevStep = index > 0 ? projectSteps.find((s) => s.step_number === cfg.num - 1) : null
              const lineIsFilled = Boolean(prevStep?.status === 'completed')

              const dotStyle: React.CSSProperties = isCompleted
                ? { background: cfg.color, borderColor: cfg.color }
                : isActive
                  ? { borderColor: cfg.color, color: cfg.color }
                  : {}

              const dotClass = [
                'wizard-progress-dot',
                isCompleted ? 'wizard-progress-dot--done' : '',
                isActive ? 'wizard-progress-dot--active' : '',
                isLocked ? 'wizard-progress-dot--locked' : '',
                isCurrent ? 'wizard-progress-dot--current-viewing' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <Fragment key={cfg.num}>
                  {index > 0 && (
                    <div
                      className={`wizard-progress-line ${lineIsFilled ? 'wizard-progress-line--filled' : ''}`}
                    />
                  )}
                  <div className="wizard-progress-dot-wrap">
                    <button
                      type="button"
                      className={dotClass}
                      style={dotStyle}
                      onClick={() => !isLocked && setViewingStep(cfg.num)}
                      disabled={isLocked}
                      aria-label={`Étape ${cfg.num} : ${cfg.name}`}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      {isCompleted ? (
                        <Check size={12} strokeWidth={3} color="#fff" />
                      ) : isLocked ? (
                        <Lock size={10} />
                      ) : (
                        cfg.num
                      )}
                    </button>
                  </div>
                </Fragment>
              )
            })}
          </div>
        </div>

        {/* Step header */}
        <div className="wizard-step-header">
          <div className="wizard-step-eyebrow" style={{ color: stepConfig.color }}>
            Étape {viewingStep} · 7 &mdash; {project.title}
          </div>
          <h1 className="wizard-step-name">{stepConfig.name}</h1>
          <p className="wizard-step-desc">{stepConfig.desc}</p>
        </div>

        {/* Completed badge */}
        {stepIsCompleted && (
          <div className="wizard-done-badge">
            <Check size={12} strokeWidth={3} />
            Étape complétée — vous pouvez revoir ou modifier vos réponses
          </div>
        )}

        {/* Verse + Quote + Form */}
        <VerseCard
          verse={getVerseForStep(viewingStep)}
          accentColor={stepConfig.color}
        />
        <QuoteCard quote={getQuoteForStep(viewingStep)} />

        {renderStep()}

        {/* Footer navigation */}
        <div className="wizard-footer">
          <button
            type="button"
            className="wizard-btn-back"
            onClick={() => setViewingStep((v) => v - 1)}
            disabled={!canGoBack}
          >
            <ChevronLeft size={16} />
            Retour
          </button>

          <div className="wizard-footer-right">
            {canGoForward && (
              <button
                type="button"
                className="wizard-btn-next"
                onClick={() => setViewingStep((v) => v + 1)}
              >
                Suivant
                <ChevronRight size={16} />
              </button>
            )}

            {stepIsActive && (
              <button
                type="button"
                className="wizard-btn-validate"
                style={{ background: stepConfig.color }}
                disabled={!canComplete}
                onClick={handleComplete}
              >
                {viewingStep === 7 ? "S'engager" : 'Valider'}
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

      </div>
    </>
  )
}
