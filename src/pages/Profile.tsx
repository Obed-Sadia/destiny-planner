// DestinyPlanner — Page Profil utilisateur
// Avatar, grade, stats, niveau d'engagement, compte business (placeholder v2.0)

import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Flame, Trophy, CheckCircle2, BookOpen, Clock, Target,
  Pencil, Github, LogOut, Loader2, Bell, BellOff,
} from 'lucide-react'
import { useUserStore } from '../stores/useUserStore'
import { useAuthStore } from '../stores/useAuthStore'
import { StatCard } from '../components/profile/StatCard'
import { GradeBadge } from '../components/profile/GradeBadge'
import { AvatarPicker, avatarBackground, DEFAULT_EMOJI, DEFAULT_COLOR } from '../components/profile/AvatarPicker'
import {
  isPushSupported,
  getPermissionState,
  subscribePush,
  unsubscribePush,
  hasPushSubscription,
} from '../services/pushSubscription'

const ENGAGEMENT_LABELS: Record<number, string> = {
  1: '🌱 Découverte',
  2: '📐 Planificateur',
  3: '🏗️ Bâtisseur Diligent',
}

const STYLE = `
  .profile {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    animation: prFadeIn 200ms ease both;
  }

  @keyframes prFadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── En-tête identité ── */
  .profile-hero {
    display: flex;
    gap: var(--space-5);
    align-items: flex-start;
  }

  .profile-avatar-wrap {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
  }

  .profile-avatar {
    width: 72px;
    height: 72px;
    border-radius: var(--r-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    cursor: pointer;
    border: 2px solid transparent;
    transition: border-color var(--transition-fast), transform var(--transition-fast);
    position: relative;
  }

  .profile-avatar:hover {
    border-color: var(--gold);
    transform: scale(1.04);
  }

  .profile-avatar-hint {
    font-size: var(--text-xs);
    color: var(--text-3);
    cursor: pointer;
  }

  .profile-identity {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .profile-name-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .profile-name-input {
    font-family: var(--font-editorial);
    font-size: var(--text-2xl);
    font-weight: 300;
    color: var(--text-1);
    background: transparent;
    border: none;
    border-bottom: 1px solid transparent;
    outline: none;
    width: 100%;
    padding: 0 0 2px;
    transition: border-color var(--transition-fast);
    line-height: var(--leading-tight);
  }

  .profile-name-input:focus {
    border-bottom-color: var(--gold);
  }

  .profile-name-input::placeholder {
    color: var(--text-3);
  }

  .profile-edit-icon {
    color: var(--text-3);
    flex-shrink: 0;
  }

  .profile-grade-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .profile-level-tag {
    font-size: var(--text-xs);
    color: var(--text-3);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--r-full);
    padding: 3px 10px;
  }

  .profile-bio-input {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-2);
    background: transparent;
    border: none;
    border-bottom: 1px solid transparent;
    outline: none;
    width: 100%;
    padding: 2px 0;
    transition: border-color var(--transition-fast);
    resize: none;
    line-height: var(--leading-snug);
    overflow: hidden;
  }

  .profile-bio-input:focus {
    border-bottom-color: var(--border-2);
    color: var(--text-1);
  }

  .profile-bio-input::placeholder {
    color: var(--text-3);
    font-style: italic;
  }

  .profile-saved {
    font-size: var(--text-xs);
    color: var(--green);
    opacity: 0;
    transition: opacity var(--transition-slow);
  }

  .profile-saved--visible {
    opacity: 1;
  }

  /* ── Stats ── */
  .profile-section-title {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-2);
    margin-bottom: var(--space-3);
  }

  .profile-stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }

  @media (min-width: 480px) {
    .profile-stats-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (min-width: 768px) {
    .profile-stats-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  /* ── Streak detail ── */
  .profile-streak-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: var(--space-4);
  }

  .profile-streak-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-3);
  }

  .profile-streak-count {
    font-size: var(--text-3xl);
    font-weight: var(--weight-bold);
    color: var(--teal);
    line-height: 1;
  }

  .profile-streak-label {
    font-size: var(--text-sm);
    color: var(--text-2);
  }

  .profile-streak-best {
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  .profile-streak-bar-track {
    height: 6px;
    background: var(--border);
    border-radius: var(--r-full);
    overflow: hidden;
  }

  .profile-streak-bar-fill {
    height: 100%;
    background: var(--teal);
    border-radius: var(--r-full);
    transition: width 600ms ease;
  }

  .profile-streak-bar-hint {
    margin-top: var(--space-2);
    font-size: var(--text-xs);
    color: var(--text-3);
    text-align: right;
  }

  /* ── Business ── */
  .profile-business {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .profile-business-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .profile-business-title {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
  }

  .profile-business-badge {
    font-size: var(--text-xs);
    color: var(--teal);
    background: color-mix(in srgb, var(--teal) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--teal) 30%, transparent);
    border-radius: var(--r-full);
    padding: 2px 8px;
  }

  .profile-business-desc {
    font-size: var(--text-sm);
    color: var(--text-2);
    line-height: var(--leading-normal);
  }

  .profile-business-btns {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .profile-oauth-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: 8px 16px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text-2);
    cursor: pointer;
    transition: border-color var(--transition-fast), color var(--transition-fast);
  }

  .profile-oauth-btn:hover {
    border-color: var(--teal);
    color: var(--text-1);
  }

  .profile-oauth-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ── Business — état connecté ── */
  .profile-biz-connected {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .profile-biz-avatar {
    width: 36px;
    height: 36px;
    border-radius: var(--r-full);
    object-fit: cover;
    flex-shrink: 0;
    background: var(--surface-2);
  }

  .profile-biz-avatar-fallback {
    width: 36px;
    height: 36px;
    border-radius: var(--r-full);
    background: color-mix(in srgb, var(--teal) 20%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--teal);
    flex-shrink: 0;
  }

  .profile-biz-info {
    flex: 1;
    min-width: 0;
  }

  .profile-biz-name {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text-1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .profile-biz-email {
    font-size: var(--text-xs);
    color: var(--text-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .profile-biz-signout {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: 6px 10px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    font-size: var(--text-xs);
    color: var(--text-3);
    cursor: pointer;
    transition: border-color var(--transition-fast), color var(--transition-fast);
    flex-shrink: 0;
  }

  .profile-biz-signout:hover {
    border-color: var(--red, #e05252);
    color: var(--red, #e05252);
  }

  .profile-biz-loading {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-3);
  }

  /* ── Push toggle ── */
  .profile-push-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding-top: var(--space-3);
    border-top: 1px solid var(--border);
  }

  .profile-push-label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-2);
  }

  .profile-push-denied {
    font-size: var(--text-xs);
    color: var(--text-3);
    font-style: italic;
  }

  .profile-push-toggle {
    position: relative;
    width: 36px;
    height: 20px;
    flex-shrink: 0;
  }

  .profile-push-toggle input {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
  }

  .profile-push-slider {
    position: absolute;
    inset: 0;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--r-full);
    cursor: pointer;
    transition: background var(--transition-fast), border-color var(--transition-fast);
  }

  .profile-push-slider::before {
    content: '';
    position: absolute;
    width: 14px;
    height: 14px;
    left: 2px;
    top: 50%;
    transform: translateY(-50%);
    border-radius: var(--r-full);
    background: var(--text-3);
    transition: transform var(--transition-fast), background var(--transition-fast);
  }

  .profile-push-toggle input:checked + .profile-push-slider {
    background: color-mix(in srgb, var(--teal) 20%, transparent);
    border-color: var(--teal);
  }

  .profile-push-toggle input:checked + .profile-push-slider::before {
    transform: translateX(16px) translateY(-50%);
    background: var(--teal);
  }

  .profile-push-toggle input:disabled + .profile-push-slider {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* ── Picker panel ── */
  .profile-picker-wrap {
    margin-top: var(--space-3);
  }
`

// Barre de progression vers le prochain grade
function gradeProgress(streak: number, engagementLevel: number): { pct: number; hint: string } {
  if (streak >= 30) return { pct: 100, hint: 'Grade maximal atteint 🏆' }
  if (streak >= 14) {
    const pct = Math.round(((streak - 14) / 16) * 100)
    return { pct, hint: `${30 - streak} jour${30 - streak > 1 ? 's' : ''} vers Maître Bâtisseur` }
  }
  if (engagementLevel >= 2) {
    const pct = Math.round((streak / 14) * 100)
    return { pct, hint: `${14 - streak} jour${14 - streak > 1 ? 's' : ''} vers Bâtisseur Diligent` }
  }
  return { pct: 0, hint: 'Passez au niveau 2 pour débloquer les grades' }
}

export default function Profile(): JSX.Element {
  const { profile, load, updateProfile, recalculateStats } = useUserStore()
  const { user, loading: authLoading, signInWithGoogle, signInWithGitHub, signOut } = useAuthStore()

  const [firstName, setFirstName] = useState('')
  const [bio, setBio]             = useState('')
  const [saved, setSaved]         = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [authError, setAuthError]   = useState<string | null>(null)

  const [pushEnabled, setPushEnabled]   = useState(false)
  const [pushLoading, setPushLoading]   = useState(false)
  const pushDenied = getPermissionState() === 'denied'

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    load()
    recalculateStats()
  }, [])

  // Vérifier l'état initial de la souscription push quand l'utilisateur est connecté
  useEffect(() => {
    if (!user) { setPushEnabled(false); return }
    hasPushSubscription(user.id).then(setPushEnabled).catch(() => setPushEnabled(false))
  }, [user?.id])

  // Sync état local quand le profil est chargé
  useEffect(() => {
    if (!profile) return
    setFirstName(profile.first_name)
    setBio(profile.bio ?? '')
  }, [profile?.first_name, profile?.bio])

  const autosave = useCallback(
    (patch: Parameters<typeof updateProfile>[0]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        try {
          await updateProfile(patch)
          setSaved(true)
          setTimeout(() => setSaved(false), 1500)
        } catch {
          // Erreur loggée dans le store
        }
      }, 300)
    },
    [updateProfile],
  )

  const handleNameChange = (value: string): void => {
    setFirstName(value)
    autosave({ first_name: value })
  }

  const handleBioChange = (value: string): void => {
    setBio(value.slice(0, 160))
    autosave({ bio: value.slice(0, 160) })
  }

  const handleAvatarChange = (emoji: string, color: string): void => {
    autosave({ avatar_emoji: emoji, avatar_color: color })
    setShowPicker(false)
  }

  const handlePushToggle = async (): Promise<void> => {
    if (!user || pushLoading || pushDenied) return
    setPushLoading(true)
    try {
      if (pushEnabled) {
        await unsubscribePush(user.id)
        setPushEnabled(false)
      } else {
        const ok = await subscribePush(user.id)
        setPushEnabled(ok)
      }
    } finally {
      setPushLoading(false)
    }
  }

  if (!profile) return <></>

  const emoji = profile.avatar_emoji ?? DEFAULT_EMOJI
  const color = profile.avatar_color ?? DEFAULT_COLOR
  const { pct: streakPct, hint: streakHint } = gradeProgress(profile.streak, profile.engagement_level)

  return (
    <>
      <style>{STYLE}</style>
      <div className="profile">

        {/* ── Identité ── */}
        <div className="profile-hero">

          {/* Avatar */}
          <div className="profile-avatar-wrap">
            <div
              className="profile-avatar"
              style={{ background: avatarBackground(color) }}
              onClick={() => setShowPicker((v) => !v)}
              role="button"
              aria-label="Modifier l'avatar"
              title="Modifier l'avatar"
            >
              {emoji}
            </div>
            <span
              className="profile-avatar-hint"
              onClick={() => setShowPicker((v) => !v)}
            >
              Modifier
            </span>
          </div>

          {/* Nom, grade, bio */}
          <div className="profile-identity">
            <div className="profile-name-row">
              <input
                className="profile-name-input"
                type="text"
                placeholder="Votre prénom…"
                value={firstName}
                maxLength={40}
                onChange={(e) => handleNameChange(e.target.value)}
                aria-label="Prénom"
              />
              <Pencil size={14} className="profile-edit-icon" />
              <span className={`profile-saved${saved ? ' profile-saved--visible' : ''}`}>
                Enregistré
              </span>
            </div>

            <div className="profile-grade-row">
              <GradeBadge grade={profile.grade} size="lg" />
              <span className="profile-level-tag">
                {ENGAGEMENT_LABELS[profile.engagement_level] ?? 'Niveau 1'}
              </span>
            </div>

            <textarea
              className="profile-bio-input"
              placeholder="Courte description de vous-même… (160 caractères max)"
              value={bio}
              rows={2}
              maxLength={160}
              onChange={(e) => handleBioChange(e.target.value)}
              aria-label="Bio"
            />
          </div>
        </div>

        {/* Picker avatar (inline) */}
        {showPicker && (
          <div className="profile-picker-wrap">
            <AvatarPicker
              currentEmoji={profile.avatar_emoji}
              currentColor={profile.avatar_color}
              onChange={handleAvatarChange}
            />
          </div>
        )}

        {/* ── Streak ── */}
        <div className="profile-streak-card">
          <div className="profile-streak-row">
            <div>
              <div className="profile-streak-count">{profile.streak}</div>
              <div className="profile-streak-label">jours de streak</div>
            </div>
            <div className="profile-streak-best">
              Meilleur : {profile.streak_best} j
            </div>
          </div>
          <div className="profile-streak-bar-track">
            <div
              className="profile-streak-bar-fill"
              style={{ width: `${Math.min(100, streakPct)}%` }}
            />
          </div>
          <div className="profile-streak-bar-hint">{streakHint}</div>
        </div>

        {/* ── Statistiques ── */}
        <div>
          <div className="profile-section-title">Statistiques</div>
          <div className="profile-stats-grid">
            <StatCard
              icon={<Trophy size={13} />}
              label="Projets terminés"
              value={profile.total_projects_completed}
              color="var(--gold)"
            />
            <StatCard
              icon={<CheckCircle2 size={13} />}
              label="Actions faites"
              value={profile.total_actions_done}
              color="var(--green)"
            />
            <StatCard
              icon={<BookOpen size={13} />}
              label="Entrées journal"
              value={profile.total_journal_entries}
              color="var(--blue)"
            />
            <StatCard
              icon={<Clock size={13} />}
              label="Blocs respectés"
              value={profile.total_time_blocks_done}
              color="var(--teal)"
            />
            <StatCard
              icon={<Target size={13} />}
              label="Score moyen 30j"
              value={
                profile.score_average_30d !== null
                  ? `${Math.round(profile.score_average_30d)} %`
                  : '—'
              }
              color="var(--purple)"
              sub="Habitudes quotidiennes"
            />
            <StatCard
              icon={<Flame size={13} />}
              label="Meilleur streak"
              value={`${profile.streak_best} j`}
              color="var(--amber)"
            />
          </div>
        </div>

        {/* ── Compte business ── */}
        <div className="profile-business">
          <div className="profile-business-header">
            <span className="profile-business-title">Espace Business</span>
            {user && <span className="profile-business-badge">Connecté</span>}
          </div>

          {authLoading ? (
            <div className="profile-biz-loading">
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Vérification…
            </div>
          ) : user ? (
            /* ── État connecté ── */
            <>
            <div className="profile-biz-connected">
              {user.user_metadata?.['avatar_url'] ? (
                <img
                  className="profile-biz-avatar"
                  src={user.user_metadata['avatar_url'] as string}
                  alt="Avatar"
                />
              ) : (
                <div className="profile-biz-avatar-fallback">
                  {(user.email ?? 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="profile-biz-info">
                <div className="profile-biz-name">
                  {(user.user_metadata?.['full_name'] as string | undefined) ?? user.email ?? '—'}
                </div>
                <div className="profile-biz-email">{user.email}</div>
              </div>
              <button
                className="profile-biz-signout"
                onClick={async () => {
                  try { await signOut() } catch { /* session déjà expirée */ }
                }}
                aria-label="Se déconnecter"
              >
                <LogOut size={12} />
                Quitter
              </button>
            </div>

            {isPushSupported() && (
              <div className="profile-push-row">
                <label className="profile-push-label" htmlFor="push-toggle">
                  {pushEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                  Notifications push
                </label>
                {pushDenied ? (
                  <span className="profile-push-denied">Bloquées dans le navigateur</span>
                ) : (
                  <label className="profile-push-toggle">
                    <input
                      id="push-toggle"
                      type="checkbox"
                      checked={pushEnabled}
                      disabled={pushLoading}
                      onChange={handlePushToggle}
                    />
                    <span className="profile-push-slider" />
                  </label>
                )}
              </div>
            )}
            </>
          ) : (
            /* ── État non connecté ── */
            <>
              <p className="profile-business-desc">
                Connectez votre compte pour accéder à l'espace collaboratif, aux projets partagés et à la synchronisation cloud.
              </p>
              {authError && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--red, #e05252)' }}>
                  {authError}
                </p>
              )}
              <div className="profile-business-btns">
                <button
                  className="profile-oauth-btn"
                  onClick={async () => {
                    setAuthError(null)
                    try { await signInWithGoogle() }
                    catch { setAuthError('Connexion Google échouée. Réessayez.') }
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continuer avec Google
                </button>
                <button
                  className="profile-oauth-btn"
                  onClick={async () => {
                    setAuthError(null)
                    try { await signInWithGitHub() }
                    catch { setAuthError('Connexion GitHub échouée. Réessayez.') }
                  }}
                >
                  <Github size={15} />
                  Continuer avec GitHub
                </button>
              </div>
            </>
          )}

          <Link
            to="/business"
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--teal)',
              textDecoration: 'none',
              alignSelf: 'flex-start',
              marginTop: 'var(--space-1)',
            }}
          >
            Accéder à l'espace Business →
          </Link>
        </div>

      </div>
    </>
  )
}
