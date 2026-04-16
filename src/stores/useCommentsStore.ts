// DestinyPlanner — Store commentaires business (v2.1)
// Fil de commentaires par étape et par jalon. Supabase uniquement (online).

import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { BusinessComment, BusinessCommentTargetType, Profile } from '../lib/supabase.types'

type AuthorInfo = Pick<Profile, 'display_name' | 'avatar_url'>
type AuthorMap = Record<string, AuthorInfo>

interface CommentsState {
  comments: BusinessComment[]
  authors: AuthorMap
  loading: boolean
  error: string | null

  loadComments: (projectId: string, targetType: BusinessCommentTargetType, targetId: string) => Promise<void>
  addComment: (projectId: string, targetType: BusinessCommentTargetType, targetId: string, body: string, mentionedUserIds?: string[]) => Promise<void>
  editComment: (commentId: string, body: string) => Promise<void>
  deleteComment: (commentId: string) => Promise<void>
  reset: () => void
}

async function mergeProfiles(ids: string[], existing: AuthorMap): Promise<AuthorMap> {
  const missing = ids.filter((id) => !existing[id])
  if (missing.length === 0) return existing

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', missing)

  if (error || !data) return existing

  const merged: AuthorMap = { ...existing }
  for (const p of data) {
    merged[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url }
  }
  return merged
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  comments: [],
  authors: {},
  loading: false,
  error: null,

  loadComments: async (projectId, targetType, targetId) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('business_comments')
        .select('*')
        .eq('project_id', projectId)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const uniqueIds = [...new Set(data.map((c) => c.author_id))]
      const authors = await mergeProfiles(uniqueIds, get().authors)

      set((state) => ({
        // Remplace les commentaires pour ce target, conserve les autres
        comments: [
          ...state.comments.filter(
            (c) => !(c.target_type === targetType && c.target_id === targetId),
          ),
          ...data,
        ],
        authors,
        loading: false,
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement'
      set({ error: msg, loading: false })
    }
  },

  addComment: async (projectId, targetType, targetId, body, mentionedUserIds = []) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const { data, error } = await supabase
      .from('business_comments')
      .insert({
        project_id: projectId,
        author_id: user.id,
        target_type: targetType,
        target_id: targetId,
        body,
        mentioned_user_ids: mentionedUserIds.length > 0 ? mentionedUserIds : null,
      })
      .select()
      .single()

    if (error) throw error

    const authors = await mergeProfiles([user.id], get().authors)
    set((state) => ({ comments: [...state.comments, data], authors }))
  },

  editComment: async (commentId, body) => {
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('business_comments')
      .update({ body, updated_at: now })
      .eq('id', commentId)

    if (error) throw error

    set((state) => ({
      comments: state.comments.map((c) =>
        c.id === commentId ? { ...c, body, updated_at: now } : c,
      ),
    }))
  },

  deleteComment: async (commentId) => {
    const { error } = await supabase
      .from('business_comments')
      .delete()
      .eq('id', commentId)

    if (error) throw error

    set((state) => ({
      comments: state.comments.filter((c) => c.id !== commentId),
    }))
  },

  reset: () => set({ comments: [], authors: {}, loading: false, error: null }),
}))
