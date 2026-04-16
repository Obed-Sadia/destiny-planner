// DestinyPlanner — Store auth Supabase
// Gère la session OAuth (espace perso + business).
// Au SIGNED_IN : pull des données personnelles depuis Supabase.

import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { pullFromSupabase, syncPendingWrites } from '../services/personalSyncService'
import { migrateLocalDataIfNeeded } from '../services/personalMigration'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialize: () => () => void
  signInWithGoogle: (redirectTo?: string) => Promise<void>
  signInWithGitHub: (redirectTo?: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  initialize: () => {
    // Restaurer la session persistée (localStorage)
    supabase.auth.getSession()
      .then(({ data }) => {
        set({
          user: data.session?.user ?? null,
          session: data.session ?? null,
          loading: false,
        })
      })
      .catch(() => {
        set({ loading: false })
      })

    // Écouter les changements (connexion, déconnexion, refresh token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        set({
          user: session?.user ?? null,
          session: session ?? null,
          loading: false,
        })
        if (event === 'SIGNED_IN' && session?.user) {
          const userId = session.user.id
          migrateLocalDataIfNeeded(userId)
            .then(() => pullFromSupabase(userId))
            .then(() => syncPendingWrites(userId))
            .catch(() => {})
        }
      },
    )

    return () => subscription.unsubscribe()
  },

  signInWithGoogle: async (redirectTo = '/') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${redirectTo}` },
    })
    if (error) throw error
  },

  signInWithGitHub: async (redirectTo = '/') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}${redirectTo}` },
    })
    if (error) throw error
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    set({ user: null, session: null })
  },
}))
