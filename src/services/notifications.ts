// DestinyPlanner — Notifications locales
// Alertes : tendance score 5j, deadlines jalons à venir

import { db } from '../db/schema'
import { hasConsecutiveDecline } from './score'
import type { Milestone } from '../types'

const DEADLINE_ALERT_DAYS = 3

// ─── Permission ───────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission !== 'default') return Notification.permission
  return await Notification.requestPermission()
}

function canNotify(): boolean {
  return 'Notification' in window && Notification.permission === 'granted'
}

function sendNotification(title: string, body: string, tag: string): void {
  if (!canNotify()) return
  new Notification(title, { body, tag, icon: '/icons/icon-192.svg' })
}

// ─── Alerte score tendanciel ──────────────────────────────────

export async function checkScoreDeclineAlert(): Promise<boolean> {
  try {
    const entries = await db.journal_entry.toArray()
    const declining = hasConsecutiveDecline(entries, 5)

    if (declining) {
      sendNotification(
        'Tendance à surveiller',
        'Ton score est en baisse depuis 5 jours. Prends soin de toi.',
        'score-decline',
      )
    }
    return declining
  } catch {
    return false
  }
}

// ─── Alerte deadlines jalons ──────────────────────────────────

export async function checkMilestoneDeadlines(): Promise<Milestone[]> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const milestones = await db.milestone
      .filter((m) => m.status !== 'completed' && m.due_date !== null)
      .toArray()

    const approaching = milestones.filter((m) => {
      if (!m.due_date) return false
      const due = new Date(m.due_date)
      due.setHours(0, 0, 0, 0)
      const diffDays = Math.round(
        (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      )
      return diffDays >= 0 && diffDays <= DEADLINE_ALERT_DAYS
    })

    for (const milestone of approaching) {
      if (!milestone.due_date) continue
      const due = new Date(milestone.due_date)
      due.setHours(0, 0, 0, 0)
      const diffDays = Math.round(
        (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      )
      const when =
        diffDays === 0
          ? "aujourd'hui"
          : `dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`

      sendNotification(
        'Jalon à venir',
        `"${milestone.title}" est dû ${when}.`,
        `milestone-${milestone.id}`,
      )
    }

    return approaching
  } catch {
    return []
  }
}

// ─── Point d'entrée — appeler dans main.tsx ───────────────────

export async function initNotifications(): Promise<void> {
  try {
    const prefs = await db.app_preferences.get('singleton')
    if (!prefs?.notifications_enabled) return

    await requestNotificationPermission()
    await checkScoreDeclineAlert()
    await checkMilestoneDeadlines()
  } catch {
    // Ne bloque pas l'app
  }
}
