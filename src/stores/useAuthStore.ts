// DestinyPlanner — Store auth Supabase (v2.0)
// Gère la session OAuth de l'espace business uniquement.
// L'espace perso est 100% local — aucune dépendance à ce store.

import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

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
      (_event, session) => {
        set({
          user: session?.user ?? null,
          session: session ?? null,
          loading: false,
        })
      },
    )

    return () => subscription.unsubscribe()
  },

  signInWithGoogle: async (redirectTo = '/business') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${redirectTo}` },
    })
    if (error) throw error
  },

  signInWithGitHub: async (redirectTo = '/business') => {
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
