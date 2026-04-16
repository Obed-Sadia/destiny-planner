// DestinyPlanner — Client Supabase (espace business v2.0)
// Dépendance requise : npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables manquantes : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont requises pour l\'espace business.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
