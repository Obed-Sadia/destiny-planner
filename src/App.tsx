// DestinyPlanner — Routing principal
// Lazy loading par page, seeds au démarrage, redirect onboarding si nécessaire

import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/shared/Layout'
import { AssistantWidget } from '@/components/shared/AssistantWidget'
import { db } from '@/db/schema'
import { runSeeds } from '@/db/seeds'
import { useAuthStore } from '@/stores/useAuthStore'

const Login                 = lazy(() => import('@/pages/Login'))
const Onboarding            = lazy(() => import('@/pages/Onboarding'))
const Dashboard             = lazy(() => import('@/pages/Dashboard'))
const Goal                  = lazy(() => import('@/pages/Goal'))
const Domains               = lazy(() => import('@/pages/Domains'))
const ProjectWizard         = lazy(() => import('@/pages/ProjectWizard'))
const ProjectList           = lazy(() => import('@/pages/ProjectList'))
const ProjectDetail         = lazy(() => import('@/pages/ProjectDetail'))
const Settings              = lazy(() => import('@/pages/Settings'))
const Journal               = lazy(() => import('@/pages/Journal'))
const Today                 = lazy(() => import('@/pages/Today'))
const Profile               = lazy(() => import('@/pages/Profile'))
const Business              = lazy(() => import('@/pages/Business'))
const BusinessProjectWizard = lazy(() => import('@/pages/BusinessProjectWizard'))
const BusinessProjectDetail = lazy(() => import('@/pages/BusinessProjectDetail'))
const CommunityTemplates    = lazy(() => import('@/pages/CommunityTemplates'))
const InviteAccept          = lazy(() => import('@/pages/InviteAccept'))
const Analytics             = lazy(() => import('@/pages/Analytics'))

// Redirige selon l'état d'auth puis d'onboarding
function RootRedirect(): JSX.Element {
  const { user, loading: authLoading } = useAuthStore()
  const [target, setTarget] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setTarget('/login')
      return
    }
    db.user_profile.get('singleton')
      .then((profile) => {
        setTarget(profile?.onboarding_done ? '/dashboard' : '/onboarding')
      })
      .catch(() => setTarget('/onboarding'))
  }, [user, authLoading])

  if (!target) return <></>
  return <Navigate to={target} replace />
}

function LoadingFallback(): JSX.Element {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', opacity: 0.6 }} />
    </div>
  )
}

export function App(): JSX.Element {
  useEffect(() => {
    runSeeds().catch(console.error)
    // Initialisation auth globale — persiste pour toute la durée de la session
    const unsubscribe = useAuthStore.getState().initialize()
    return unsubscribe
  }, [])

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Root — redirige selon l'état de l'onboarding */}
          <Route path="/" element={<RootRedirect />} />

          {/* Login — hors Layout */}
          <Route path="/login" element={<Login />} />

          {/* Onboarding — hors Layout */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Invitation — hors Layout, accessible sans compte */}
          <Route path="/invite/:token" element={<InviteAccept />} />

          {/* App principale — avec Sidebar + BottomNav */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/today"     element={<Today />} />
            <Route path="/projects"  element={<ProjectList />} />
            <Route path="/projects/new" element={<ProjectWizard />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/projects/:id/wizard" element={<ProjectWizard />} />
            <Route path="/journal"   element={<Journal />} />
            <Route path="/goal"      element={<Goal />} />
            <Route path="/domains"   element={<Domains />} />
            <Route path="/profile"   element={<Profile />} />
            <Route path="/settings"   element={<Settings />} />
            <Route path="/analytics"  element={<Analytics />} />
            <Route path="/business"  element={<Business />} />
            <Route path="/business/new" element={<BusinessProjectWizard />} />
            <Route path="/business/:id" element={<BusinessProjectDetail />} />
            <Route path="/business/:id/wizard" element={<BusinessProjectWizard />} />
            <Route path="/community-templates" element={<CommunityTemplates />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <AssistantWidget />
    </BrowserRouter>
  )
}
