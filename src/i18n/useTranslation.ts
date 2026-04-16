// DestinyPlanner — Hook i18n (Session 32)
// Retourne t(key) selon la langue dans AppPreferences

import { useAppStore } from '../stores/useAppStore'
import { fr, type Translations } from './fr'
import { en } from './en'

// Génère les chemins dot-notation valides depuis l'interface Translations
type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? Prefix extends '' ? K : `${Prefix}.${K}`
    : T[K] extends object
      ? Leaves<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>
      : never
}[keyof T & string]

export type TranslationKey = Leaves<Translations>

function resolve(dict: Translations, key: string): string {
  const parts = key.split('.')
  let current: unknown = dict
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return key
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : key
}

export function useTranslation(): { t: (key: TranslationKey) => string; lang: 'fr' | 'en' } {
  const lang = useAppStore((s) => s.preferences?.language ?? 'fr') as 'fr' | 'en'
  const dict = lang === 'en' ? en : fr

  const t = (key: TranslationKey): string => resolve(dict, key)

  return { t, lang }
}
