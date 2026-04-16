// DestinyPlanner — Wizard business (7 étapes entrepreneur)
// Prompts CDC §5.2, sync Supabase, auto-save 300ms, accent teal

import { useEffect, useRef, useState, Fragment } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check, Lock, ArrowLeft, Users, LayoutList, AlertTriangle } from 'lucide-react'
import { useBusinessStore } from '@/stores/useBusinessStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { MembersPanel } from '@/components/business/MembersPanel'
import { CommentThread } from '@/components/business/CommentThread'
import { WhoDoesWhat, getMilestoneUrgency } from '@/components/business/WhoDoesWhat'
import { BusinessDetourLog } from '@/components/business/BusinessDetourLog'
import { TemplateSelector } from '@/components/business/TemplateSelector'
import { getTemplate } from '@/constants/businessTemplates'
import { BizStep1Vision } from '@/components/business/wizard/BizStep1Vision'
import { BizStep2Stop } from '@/components/business/wizard/BizStep2Stop'
import { BizStep3SWOT } from '@/components/business/wizard/BizStep3SWOT'
import { BizStep4Cost } from '@/components/business/wizard/BizStep4Cost'
import { BizStep5Calculate } from '@/components/business/wizard/BizStep5Calculate'
import { BizStep6Verify } from '@/components/business/wizard/BizStep6Verify'
import { BizStep7Commit } from '@/components/business/wizard/BizStep7Commit'
import type {
  StepData, Step1Data, Step2Data, Step3Data,
  Step4Data, Step5Data, Step6Data, Step7Data,
} from '@/types'

// ─── Config étapes (prompts entrepreneur) ────────────────────

const STEP_CONFIG = [
  {
    num: 1,
    name: 'Vision claire',
    desc: "Décris ton projet comme si tu l'expliquais à un investisseur en 2 minutes.",
    color: 'var(--step-1)',
  },
  {
    num: 2,
    name: "S'arrêter",
    desc: "Avant de foncer, assieds-toi. Est-ce une conviction profonde ou une impulsion ?",
    color: 'var(--step-2)',
  },
  {
    num: 3,
    name: 'Estimer (SWOT)',
    desc: "Quelles sont tes forces face à la concurrence ? Quelles menaces pourraient faire échouer ce projet ?",
    color: 'var(--step-3)',
  },
  {
    num: 4,
    name: 'Compter le coût',
    desc: "Combien va te coûter ce projet en argent, en temps et en énergie ? Es-tu prêt à payer ce prix ?",
    color: 'var(--step-4)',
  },
  {
    num: 5,
    name: 'Calculer',
    desc: "Chiffre tout. Combien pour le MVP ? Quand atteins-tu le point d'équilibre ?",
    color: 'var(--step-5)',
  },
  {
    num: 6,
    name: 'Vérifier',
    desc: "Avec tes ressources actuelles, peux-tu lancer ? Si non, avec qui peux-tu négocier ?",
    color: 'var(--step-6)',
  },
  {
    num: 7,
    name: "S'engager",
    desc: "Comment sauras-tu que tu as réussi ? Quels sont les 3 indicateurs qui te disent que le projet est terminé ?",
    color: 'var(--step-7)',
  },
]

// ─── Validation minimale par étape ───────────────────────────

function checkCanComplete(stepNum: number, data: Partial<StepData>): boolean {
  switch (stepNum) {
    case 1: return Boolean((data as Partial<Step1Data>).title?.trim())
    case 2: return Boolean((data as Partial<Step2Data>).reflection?.trim())
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
    case 6: return Boolean((data as Partial<Step6Data>).decision)
    case 7: {
      const d = data as Partial<Step7Data>
      return Boolean(d.kpi_1?.trim() && d.commitment_statement?.trim() && d.start_date)
    }
    default: return false
  }
}

// ─── CSS ─────────────────────────────────────────────────────

const STYLE = `
  /* Réutilise les classes .wizard-* du wizard perso + overrides teal */

  .biz-wizard {
    max-width: 640px;
    padding-bottom: var(--space-16);
    animation: fadeIn 250ms ease both;
  }

  .biz-wizard-topbar {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-6);
  }

  .biz-wizard-back-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-sm);
    color: var(--text-2);
    text-decoration: none;
    padding: var(--space-1) 0;
    transition: color var(--transition-base);
  }

  .biz-wizard-back-link:hover { color: var(--text-1); }

  .biz-wizard-badge {
    margin-left: auto;
    font-size: var(--text-xs);
    color: var(--teal);
    background: color-mix(in srgb, var(--teal) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--teal) 25%, transparent);
    border-radius: var(--r-full);
    padding: 2px 10px;
  }

  /* Progress dots — override couleur active */
  .biz-wizard-progress {
    margin-bottom: var(--space-6);
  }

  .biz-wizard-progress-track {
    display: flex;
    align-items: center;
    margin-bottom: var(--space-4);
  }

  .biz-wizard-dot-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
  }

  .biz-wizard-dot {
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
    background: var(--surface-2);
    color: var(--text-3);
  }

  .biz-wizard-dot--done  { color: #fff; border-color: transparent; }
  .biz-wizard-dot--active { background: transparent; box-shadow: 0 0 0 3px var(--bg), 0 0 0 5px currentColor; }
  .biz-wizard-dot--locked { cursor: default; opacity: 0.5; }
  .biz-wizard-dot--current { transform: scale(1.1); }

  .biz-wizard-line {
    flex: 1;
    height: 1.5px;
    background: var(--border);
    transition: background var(--transition-slow);
  }

  .biz-wizard-line--filled {
    background: color-mix(in srgb, var(--teal) 35%, transparent);
  }

  /* Step header */
  .biz-wizard-step-header { margin-bottom: var(--space-6); }

  .biz-wizard-step-eyebrow {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: var(--space-2);
    color: var(--teal);
  }

  .biz-wizard-step-name {
    font-family: var(--font-editorial);
    font-size: var(--text-3xl);
    font-weight: 600;
    color: var(--text-1);
    line-height: 1.15;
    margin-bottom: var(--space-2);
  }

  .biz-wizard-step-desc {
    font-size: var(--text-sm);
    color: var(--text-2);
    line-height: var(--leading-snug);
    font-style: italic;
  }

  .biz-wizard-done-badge {
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

  /* Footer */
  .biz-wizard-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: var(--space-6);
    margin-top: var(--space-8);
    border-top: 1px solid var(--border);
  }

  .biz-wizard-footer-right {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .biz-wizard-btn-back {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-2);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--r-md);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color var(--transition-base);
  }

  .biz-wizard-btn-back:hover:not(:disabled) { color: var(--text-1); }
  .biz-wizard-btn-back:disabled { opacity: 0.3; cursor: default; }

  .biz-wizard-btn-next {
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

  .biz-wizard-btn-next:hover { color: var(--text-1); border-color: var(--teal); }

  .biz-wizard-btn-validate {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-6);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    border-radius: var(--r-md);
    background: var(--teal);
    color: #fff;
    border: none;
    cursor: pointer;
    transition: opacity var(--transition-base), transform var(--transition-fast);
  }

  .biz-wizard-btn-validate:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
  .biz-wizard-btn-validate:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

  /* Création */
  .biz-wizard-create {
    max-width: 560px;
    animation: fadeIn 250ms ease both;
  }

  .biz-wizard-create-eyebrow {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--teal);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: var(--space-3);
  }

  .biz-wizard-create-title {
    font-family: var(--font-editorial);
    font-size: var(--text-3xl);
    font-weight: 600;
    color: var(--text-1);
    line-height: 1.15;
    margin-bottom: var(--space-8);
  }

  .biz-wizard-create-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-bottom: var(--space-6);
  }

  .biz-wizard-create-label {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
  }

  .biz-wizard-create-input {
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
    caret-color: var(--teal);
  }

  .biz-wizard-create-input:focus { border-color: var(--teal); }
  .biz-wizard-create-input::placeholder { color: var(--text-3); font-style: italic; font-weight: 400; }

  .biz-wizard-create-btn {
    margin-top: var(--space-8);
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-8);
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    background: var(--teal);
    color: #fff;
    border: none;
    border-radius: var(--r-md);
    cursor: pointer;
    transition: opacity var(--transition-base);
  }

  .biz-wizard-create-btn:hover:not(:disabled) { opacity: 0.88; }
  .biz-wizard-create-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Step form fields */
  .step-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .step-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .step-field-label {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
  }

  .step-field-required { color: var(--coral); margin-left: 2px; }

  .step-field-hint {
    font-size: var(--text-xs);
    color: var(--text-2);
    line-height: var(--leading-snug);
    margin-top: calc(-1 * var(--space-1));
    font-style: italic;
  }

  .step-field-input {
    font-family: var(--font-ui);
    font-size: var(--text-base);
    color: var(--text-1);
    background: var(--surface-2);
    border: 1px solid var(--border-2);
    border-radius: var(--r-md);
    padding: var(--space-3) var(--space-4);
    outline: none;
    width: 100%;
    box-sizing: border-box;
    transition: border-color var(--transition-base);
    caret-color: var(--teal);
  }

  .step-field-input:focus { border-color: var(--teal); }
  .step-field-input::placeholder { color: var(--text-3); font-style: italic; }

  .step-field-textarea {
    resize: vertical;
    min-height: 80px;
    line-height: var(--leading-normal);
    font-family: var(--font-ui);
  }

  .step-field-input-title {
    font-family: var(--font-editorial);
    font-size: var(--text-xl);
    font-weight: 600;
  }

  .biz-wizard-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 240px;
    color: var(--text-2);
    font-size: var(--text-sm);
  }

  .biz-wizard-members-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: 5px 10px;
    border-radius: var(--r-md);
    border: 1px solid var(--border-2);
    background: transparent;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--text-2);
    cursor: pointer;
    transition: border-color var(--transition-base), color var(--transition-base);
  }

  .biz-wizard-members-btn:hover {
    border-color: var(--teal);
    color: var(--teal);
  }

  .biz-wizard-overdue-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    min-width: 16px;
    height: 16px;
    padding: 0 3px;
    border-radius: var(--r-full);
    background: var(--coral);
    color: #fff;
    font-size: 10px;
    font-weight: var(--weight-bold);
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    pointer-events: none;
  }

  .biz-wizard-offline-banner {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: color-mix(in srgb, var(--amber) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--amber) 25%, transparent);
    border-radius: var(--r-md);
    font-size: var(--text-xs);
    color: var(--amber);
    margin-bottom: var(--space-4);
  }
`

// ─── Composant principal ──────────────────────────────────────

export default function BusinessProjectWizard(): JSX.Element {
  const params = useParams<{ id: string }>()
  const projectId = params.id
  const navigate = useNavigate()

  const { user } = useAuthStore()
  const {
    projects,
    steps: allSteps,
    milestones: allMilestones,
    loadProjects,
    loadStepsForProject,
    loadMilestones,
    saveStepData,
    completeStep,
    createProject,
    addMilestone,
  } = useBusinessStore()

  const [viewingStep, setViewingStep] = useState(1)
  const [localData, setLocalData] = useState<Partial<Record<number, Partial<StepData>>>>({})
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc]   = useState('')
  const [creating, setCreating] = useState(false)
  const [showMembers, setShowMembers]           = useState(false)
  const [showWhoDoesWhat, setShowWhoDoesWhat]   = useState(false)
  const [showDetours, setShowDetours]           = useState(false)

  // Création : étape 'template' → 'details'
  const [createStep, setCreateStep]         = useState<'template' | 'details'>('template')
  const [templateChoice, setTemplateChoice] = useState<string | null>(null)

  const isOnline = navigator.onLine

  const project = projectId ? projects.find((p) => p.id === projectId) : undefined
  const projectSteps = projectId ? allSteps.filter((s) => s.project_id === projectId) : []

  useEffect(() => {
    if (user) loadProjects()
  }, [user, loadProjects])

  useEffect(() => {
    if (projectId) loadStepsForProject(projectId)
  }, [projectId, loadStepsForProject])

  useEffect(() => {
    if (projectId) loadMilestones(projectId)
  }, [projectId, loadMilestones])

  useEffect(() => {
    if (project) setViewingStep(project.current_step)
  }, [project?.current_step])

  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [])

  function getMergedData(stepNum: number): Partial<StepData> {
    const step = projectSteps.find((s) => s.step_number === stepNum)
    return { ...(step?.data as Partial<StepData> ?? {}), ...(localData[stepNum] ?? {}) }
  }

  function handleDataChange(stepNum: number, patch: Partial<StepData>): void {
    setLocalData((prev) => ({ ...prev, [stepNum]: { ...(prev[stepNum] ?? {}), ...patch } }))

    if (saveTimer.current) clearTimeout(saveTimer.current)
    const stepRecord = projectSteps.find((s) => s.step_number === stepNum)
    if (!stepRecord || !isOnline) return

    saveTimer.current = setTimeout(async () => {
      try { await saveStepData(stepRecord.id, patch) }
      catch { /* sera réessayé */ }
    }, 300)
  }

  async function handleComplete(): Promise<void> {
    if (!projectId || !currentStepRecord) return

    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null }

    const pending = localData[viewingStep]
    if (pending && Object.keys(pending).length > 0) {
      try { await saveStepData(currentStepRecord.id, pending) }
      catch { return }
    }

    if (viewingStep === 5) {
      const data5 = getMergedData(5) as Partial<Step5Data>
      const drafts = data5.milestones_draft ?? []
      for (let i = 0; i < drafts.length; i++) {
        const draft = drafts[i]
        if (!draft.title.trim()) continue
        try {
          await addMilestone({ project_id: projectId, title: draft.title.trim(), due_date: draft.due_date || null, sort_order: i })
        } catch { /* non bloquant */ }
      }
    }

    try {
      await completeStep(currentStepRecord.id, projectId, viewingStep)
    } catch { return }

    if (viewingStep === 7) navigate(`/business`)
  }

  async function handleCreateProject(): Promise<void> {
    if (!newTitle.trim() || creating) return
    setCreating(true)
    try {
      const tplId = templateChoice && templateChoice !== 'blank' ? templateChoice : undefined
      const tpl   = tplId ? getTemplate(tplId) : undefined
      const prefilledSteps = tpl
        ? (tpl.steps as Partial<Record<number, Partial<StepData>>>)
        : undefined

      const p = await createProject(newTitle.trim(), newDesc.trim(), tplId, prefilledSteps)
      navigate(`/business/${p.id}/wizard`, { replace: true })
    } catch {
      setCreating(false)
    }
  }

  const projectMilestones = projectId
    ? allMilestones.filter((m) => m.project_id === projectId)
    : []
  const overdueCount = projectMilestones.filter(
    (m) => getMilestoneUrgency(m) === 'overdue',
  ).length

  const currentStepRecord = projectSteps.find((s) => s.step_number === viewingStep)
  const stepIsActive    = currentStepRecord?.status === 'active'
  const stepIsCompleted = currentStepRecord?.status === 'completed'
  const canGoBack    = viewingStep > 1
  const canGoForward = stepIsCompleted && viewingStep < (project?.current_step ?? 1)
  const stepConfig   = STEP_CONFIG[viewingStep - 1]
  const canComplete  = stepIsActive && checkCanComplete(viewingStep, getMergedData(viewingStep))

  function renderStep(): JSX.Element {
    const data = getMergedData(viewingStep)
    const onChange = (patch: Partial<StepData>): void => handleDataChange(viewingStep, patch)

    switch (viewingStep) {
      case 1: return <BizStep1Vision data={data as Partial<Step1Data>} onChange={onChange as (p: Partial<Step1Data>) => void} />
      case 2: return <BizStep2Stop data={data as Partial<Step2Data>} onChange={onChange as (p: Partial<Step2Data>) => void} />
      case 3: return <BizStep3SWOT data={data as Partial<Step3Data>} onChange={onChange as (p: Partial<Step3Data>) => void} />
      case 4: return <BizStep4Cost data={data as Partial<Step4Data>} onChange={onChange as (p: Partial<Step4Data>) => void} />
      case 5: return <BizStep5Calculate data={data as Partial<Step5Data>} onChange={onChange as (p: Partial<Step5Data>) => void} />
      case 6: return <BizStep6Verify data={data as Partial<Step6Data>} onChange={onChange as (p: Partial<Step6Data>) => void} />
      case 7: return <BizStep7Commit data={data as Partial<Step7Data>} onChange={onChange as (p: Partial<Step7Data>) => void} />
      default: return <></>
    }
  }

  // ── Rendu : création ─────────────────────

  if (!projectId) {
    if (!user) {
      navigate('/profile', { replace: true })
      return <></>
    }

    return (
      <>
        <style>{STYLE}</style>

        {/* Sous-étape 1 : sélection du template */}
        {createStep === 'template' && (
          <div className="biz-wizard-create" style={{ maxWidth: 560 }}>
            <Link to="/business" className="biz-wizard-back-link" style={{ marginBottom: 'var(--space-6)', display: 'inline-flex' }}>
              <ArrowLeft size={15} />
              Espace Business
            </Link>
            <TemplateSelector
              selected={templateChoice}
              onSelect={setTemplateChoice}
              onNext={() => setCreateStep('details')}
            />
          </div>
        )}

        {/* Sous-étape 2 : titre + description */}
        {createStep === 'details' && (
          <div className="biz-wizard-create">
            <button
              type="button"
              className="biz-wizard-back-link"
              onClick={() => setCreateStep('template')}
              style={{ marginBottom: 'var(--space-6)', display: 'inline-flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <ArrowLeft size={15} />
              Choisir le template
            </button>

            <div className="biz-wizard-create-eyebrow">Nouveau projet business</div>
            <h1 className="biz-wizard-create-title">Nommez votre projet</h1>

            <div className="biz-wizard-create-field">
              <label className="biz-wizard-create-label" htmlFor="biz-new-title">Nom du projet</label>
              <input
                id="biz-new-title"
                type="text"
                className="biz-wizard-create-input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && newTitle.trim()) handleCreateProject() }}
                placeholder="Ex : Lancer mon SaaS de gestion RH"
                maxLength={100}
                autoFocus
              />
            </div>

            <div className="biz-wizard-create-field">
              <label className="biz-wizard-create-label" htmlFor="biz-new-desc">Description courte (optionnel)</label>
              <textarea
                id="biz-new-desc"
                className="step-field-input step-field-textarea"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Ce projet vise à…"
                rows={2}
                style={{ caretColor: 'var(--teal)' }}
              />
            </div>

            <button
              type="button"
              className="biz-wizard-create-btn"
              disabled={!newTitle.trim() || creating}
              onClick={handleCreateProject}
            >
              {creating ? 'Création…' : 'Commencer les 7 étapes'}
              {!creating && <ChevronRight size={16} />}
            </button>
          </div>
        )}
      </>
    )
  }

  // ── Rendu : chargement ───────────────────

  if (!project || projectSteps.length === 0) {
    return (
      <>
        <style>{STYLE}</style>
        <div className="biz-wizard-loading">Chargement…</div>
      </>
    )
  }

  // ── Rendu : wizard principal ─────────────

  return (
    <>
      <style>{STYLE}</style>
      <div className="biz-wizard">

        {/* Topbar */}
        <div className="biz-wizard-topbar">
          <Link to="/business" className="biz-wizard-back-link">
            <ArrowLeft size={15} />
            Espace Business
          </Link>
          <span className="biz-wizard-badge">Business</span>
          <button
            type="button"
            className="biz-wizard-members-btn"
            onClick={() => setShowMembers(true)}
            aria-label="Voir les membres du projet"
          >
            <Users size={13} />
            Membres
          </button>
          <button
            type="button"
            className="biz-wizard-members-btn"
            onClick={() => setShowWhoDoesWhat(true)}
            aria-label="Vue qui fait quoi"
          >
            <LayoutList size={13} />
            Qui fait quoi
            {overdueCount > 0 && (
              <span className="biz-wizard-overdue-badge">{overdueCount}</span>
            )}
          </button>
          <button
            type="button"
            className="biz-wizard-members-btn"
            onClick={() => setShowDetours(true)}
            aria-label="Voir les détours du projet"
          >
            <AlertTriangle size={13} />
            Détours
          </button>
        </div>

        {!isOnline && (
          <div className="biz-wizard-offline-banner">
            ⚠ Mode hors ligne — les modifications ne seront pas sauvegardées
          </div>
        )}

        {/* Progress track */}
        <div className="biz-wizard-progress">
          <div className="biz-wizard-progress-track">
            {STEP_CONFIG.map((cfg, index) => {
              const step = projectSteps.find((s) => s.step_number === cfg.num)
              const isCompleted = step?.status === 'completed'
              const isActive    = step?.status === 'active'
              const isLocked    = step?.status === 'locked'
              const isCurrent   = cfg.num === viewingStep
              const prevStep    = index > 0 ? projectSteps.find((s) => s.step_number === cfg.num - 1) : null
              const lineIsFilled = Boolean(prevStep?.status === 'completed')

              const dotStyle: React.CSSProperties = isCompleted
                ? { background: cfg.color, borderColor: cfg.color }
                : isActive
                  ? { borderColor: 'var(--teal)', color: 'var(--teal)' }
                  : {}

              const dotClass = [
                'biz-wizard-dot',
                isCompleted ? 'biz-wizard-dot--done' : '',
                isActive    ? 'biz-wizard-dot--active' : '',
                isLocked    ? 'biz-wizard-dot--locked' : '',
                isCurrent   ? 'biz-wizard-dot--current' : '',
              ].filter(Boolean).join(' ')

              return (
                <Fragment key={cfg.num}>
                  {index > 0 && (
                    <div className={`biz-wizard-line ${lineIsFilled ? 'biz-wizard-line--filled' : ''}`} />
                  )}
                  <div className="biz-wizard-dot-wrap">
                    <button
                      type="button"
                      className={dotClass}
                      style={dotStyle}
                      onClick={() => !isLocked && setViewingStep(cfg.num)}
                      disabled={isLocked}
                      aria-label={`Étape ${cfg.num} : ${cfg.name}`}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      {isCompleted ? <Check size={12} strokeWidth={3} color="#fff" />
                        : isLocked ? <Lock size={10} />
                        : cfg.num}
                    </button>
                  </div>
                </Fragment>
              )
            })}
          </div>
        </div>

        {/* Step header */}
        <div className="biz-wizard-step-header">
          <div className="biz-wizard-step-eyebrow">
            Étape {viewingStep} · 7 — {project.title}
          </div>
          <h1 className="biz-wizard-step-name">{stepConfig.name}</h1>
          <p className="biz-wizard-step-desc">« {stepConfig.desc} »</p>
        </div>

        {stepIsCompleted && (
          <div className="biz-wizard-done-badge">
            <Check size={12} strokeWidth={3} />
            Étape complétée — vous pouvez revoir ou modifier vos réponses
          </div>
        )}

        {renderStep()}

        {/* Fil de commentaires — uniquement online, étape connue */}
        {isOnline && projectId && currentStepRecord && user && (
          <CommentThread
            projectId={projectId}
            targetType="step"
            targetId={currentStepRecord.id}
            currentUserId={user.id}
          />
        )}

        {/* Footer */}
        <div className="biz-wizard-footer">
          <button
            type="button"
            className="biz-wizard-btn-back"
            onClick={() => setViewingStep((v) => v - 1)}
            disabled={!canGoBack}
          >
            <ChevronLeft size={16} />
            Retour
          </button>

          <div className="biz-wizard-footer-right">
            {canGoForward && (
              <button
                type="button"
                className="biz-wizard-btn-next"
                onClick={() => setViewingStep((v) => v + 1)}
              >
                Suivant
                <ChevronRight size={16} />
              </button>
            )}

            {stepIsActive && (
              <button
                type="button"
                className="biz-wizard-btn-validate"
                disabled={!canComplete || !isOnline}
                onClick={handleComplete}
              >
                {viewingStep === 7 ? "S'engager" : 'Valider'}
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Panel membres */}
      {showMembers && user && (
        <MembersPanel
          projectId={projectId}
          currentUserId={user.id}
          onClose={() => setShowMembers(false)}
        />
      )}

      {/* Panel qui fait quoi */}
      {showWhoDoesWhat && user && (
        <WhoDoesWhat
          projectId={projectId}
          currentUserId={user.id}
          onClose={() => setShowWhoDoesWhat(false)}
        />
      )}

      {/* Panel détours */}
      {showDetours && user && (
        <BusinessDetourLog
          projectId={projectId}
          currentUserId={user.id}
          onClose={() => setShowDetours(false)}
        />
      )}
    </>
  )
}
