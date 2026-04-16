// DestinyPlanner — Store membres business (v2.0)
// Gestion des membres d'un projet : rôles, invitations, acceptation de token.

import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { BusinessMember, BusinessInviteToken, Profile } from '../lib/supabase.types'

export interface MemberWithProfile extends BusinessMember {
  profile: Pick<Profile, 'display_name' | 'avatar_url'> | null
}

interface MembersState {
  members: MemberWithProfile[]
  tokens: BusinessInviteToken[]
  loading: boolean
  error: string | null

  // Chargement
  loadMembers: (projectId: string) => Promise<void>
  loadTokens: (projectId: string) => Promise<void>

  // Gestion membres (owner uniquement)
  changeRole: (memberId: string, role: 'editor' | 'viewer') => Promise<void>
  removeMember: (memberId: string, projectId: string) => Promise<void>

  // Invitations (owner uniquement)
  createInviteToken: (projectId: string, role: 'editor' | 'viewer') => Promise<BusinessInviteToken>
  revokeToken: (tokenId: string) => Promise<void>

  // Acceptation (tout utilisateur authentifié)
  acceptInvite: (token: string) => Promise<{ projectId: string; role: string }>

  reset: () => void
}

export const useMembersStore = create<MembersState>((set) => ({
  members: [],
  tokens: [],
  loading: false,
  error: null,

  // ── Chargement ──────────────────────────────────────────────

  loadMembers: async (projectId: string) => {
    set({ loading: true, error: null })
    try {
      const { data: memberRows, error: e1 } = await supabase
        .from('business_members')
        .select('*')
        .eq('project_id', projectId)
        .order('joined_at', { ascending: true })

      if (e1) throw e1

      const userIds = memberRows.map((m) => m.user_id)

      const { data: profileRows, error: e2 } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds)

      if (e2) throw e2

      const profileMap: Record<string, Pick<Profile, 'display_name' | 'avatar_url'>> =
        Object.fromEntries(
          profileRows.map((p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }]),
        )

      const members: MemberWithProfile[] = memberRows.map((m) => ({
        ...m,
        profile: profileMap[m.user_id] ?? null,
      }))

      set({ members, loading: false })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement'
      set({ error: msg, loading: false })
    }
  },

  loadTokens: async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('business_invite_tokens')
        .select('*')
        .eq('project_id', projectId)
        .is('used_by', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ tokens: data })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur tokens'
      set({ error: msg })
    }
  },

  // ── Gestion membres ─────────────────────────────────────────

  changeRole: async (memberId: string, role: 'editor' | 'viewer') => {
    const { error } = await supabase
      .from('business_members')
      .update({ role })
      .eq('id', memberId)

    if (error) throw error

    set((state) => ({
      members: state.members.map((m) => (m.id === memberId ? { ...m, role } : m)),
    }))
  },

  removeMember: async (memberId: string, projectId: string) => {
    const { error } = await supabase
      .from('business_members')
      .delete()
      .eq('id', memberId)
      .eq('project_id', projectId)

    if (error) throw error

    set((state) => ({
      members: state.members.filter((m) => m.id !== memberId),
    }))
  },

  // ── Invitations ─────────────────────────────────────────────

  createInviteToken: async (projectId: string, role: 'editor' | 'viewer') => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const { data, error } = await supabase
      .from('business_invite_tokens')
      .insert({ project_id: projectId, created_by: user.id, role })
      .select()
      .single()

    if (error) throw error

    set((state) => ({ tokens: [data, ...state.tokens] }))
    return data
  },

  revokeToken: async (tokenId: string) => {
    const { error } = await supabase
      .from('business_invite_tokens')
      .delete()
      .eq('id', tokenId)

    if (error) throw error

    set((state) => ({ tokens: state.tokens.filter((t) => t.id !== tokenId) }))
  },

  // ── Acceptation ─────────────────────────────────────────────

  acceptInvite: async (token: string) => {
    const { data, error } = await supabase.rpc('accept_project_invite', { p_token: token })

    if (error) {
      // Propager le code d'erreur brut pour que la page puisse le gérer
      throw new Error(error.message)
    }

    const result = data as { project_id: string; role: string }
    return { projectId: result.project_id, role: result.role }
  },

  reset: () => set({ members: [], tokens: [], loading: false, error: null }),
}))
