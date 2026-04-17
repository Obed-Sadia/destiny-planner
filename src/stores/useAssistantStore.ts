// DestinyPlanner — Store assistant IA
// Gère les messages, l'état de chargement et le panneau ouvert/fermé

import { create } from 'zustand'
import type { AssistantMessage, AIAction } from '@/types'
import { supabase } from '@/lib/supabase'
import { buildUserContext } from '@/services/aiContextBuilder'
import { executeAIAction } from '@/services/aiActionParser'

interface ChatPayload {
  role: 'user' | 'assistant'
  content: string
}

interface AssistantStore {
  messages: AssistantMessage[]
  isOpen: boolean
  isLoading: boolean
  toggle: () => void
  close: () => void
  clear: () => void
  sendMessage: (text: string) => Promise<void>
}

export const useAssistantStore = create<AssistantStore>((set, get) => ({
  messages: [],
  isOpen: false,
  isLoading: false,

  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  close: () => set({ isOpen: false }),

  clear: () => set({ messages: [] }),

  sendMessage: async (text: string) => {
    const userMsg: AssistantMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }

    set((state) => ({
      messages: [...state.messages, userMsg],
      isLoading: true,
    }))

    try {
      const context = await buildUserContext()

      // Historique sans le message qu'on vient d'ajouter (il est dans `text`)
      const history: ChatPayload[] = get()
        .messages.slice(0, -1)
        .map((m) => ({ role: m.role, content: m.content }))

      const { data, error } = await supabase.functions.invoke<{
        message: string
        action?: AIAction
      }>('ai-chat', {
        body: {
          messages: [...history, { role: 'user', content: text }],
          context,
        },
      })

      if (error) throw error

      const message = data?.message ?? "Je n'ai pas pu générer une réponse."
      const action = data?.action

      let actionResult: AssistantMessage['actionResult'] = undefined
      if (action && action.type !== 'none') {
        actionResult = await executeAIAction(action)
      }

      const assistantMsg: AssistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: message,
        actionResult,
        timestamp: Date.now(),
      }

      set((state) => ({
        messages: [...state.messages, assistantMsg],
        isLoading: false,
      }))
    } catch (err) {
      console.error('useAssistantStore.sendMessage', err)
      const errorMsg: AssistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Désolé, une erreur s'est produite. Vérifie ta connexion et réessaie.",
        timestamp: Date.now(),
      }
      set((state) => ({
        messages: [...state.messages, errorMsg],
        isLoading: false,
      }))
    }
  },
}))
