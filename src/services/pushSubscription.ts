// DestinyPlanner — Gestion des souscriptions push (VAPID)
// Espace business uniquement — nécessite un user_id Supabase

import { supabase } from '../lib/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}

/**
 * Vérifie si les notifications push sont supportées et actives.
 */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/**
 * Retourne l'état actuel de la permission.
 * 'default' | 'granted' | 'denied'
 */
export function getPermissionState(): NotificationPermission {
  if (!('Notification' in window)) return 'denied'
  return Notification.permission
}

/**
 * Demande la permission push et souscrit si accordée.
 * Ne redemande jamais si déjà refusée.
 * Retourne true si la souscription est active.
 */
export async function subscribePush(userId: string): Promise<boolean> {
  if (!isPushSupported()) return false
  if (!VAPID_PUBLIC_KEY) {
    console.error('VITE_VAPID_PUBLIC_KEY manquante')
    return false
  }

  // Ne pas redemander si refusée
  if (Notification.permission === 'denied') return false

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    const { error } = await supabase
      .from('user_push_subscriptions')
      .upsert(
        {
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: btoa(
            String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh') as ArrayBuffer))
          ),
          auth: btoa(
            String.fromCharCode(...new Uint8Array(subscription.getKey('auth') as ArrayBuffer))
          ),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (error) throw error
    return true
  } catch (err) {
    console.error('Échec souscription push :', err)
    return false
  }
}

/**
 * Désabonne l'utilisateur et supprime l'entrée Supabase.
 */
export async function unsubscribePush(userId: string): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) await subscription.unsubscribe()

    await supabase
      .from('user_push_subscriptions')
      .delete()
      .eq('user_id', userId)
  } catch (err) {
    console.error('Échec désabonnement push :', err)
  }
}

/**
 * Vérifie si une souscription active existe dans Supabase pour cet utilisateur.
 */
export async function hasPushSubscription(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_push_subscriptions')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  return data !== null
}
