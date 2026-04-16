// DestinyPlanner — Validation des blocs horaires
// Règles : durée min 15 min, pas de chevauchement, start < end, dans la fenêtre configurée

import type { TimeBlock } from '../types'

interface ValidationResult {
  valid: boolean
  error?: string
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function validateTimeBlock(
  newBlock: Omit<TimeBlock, 'id' | 'created_at' | 'updated_at'>,
  existingBlocks: TimeBlock[],
  dayStartHour: number = 5,
  dayEndHour: number = 23,
): ValidationResult {
  const start = timeToMinutes(newBlock.start_time)
  const end = timeToMinutes(newBlock.end_time)
  const dayStart = dayStartHour * 60
  const dayEnd = dayEndHour * 60

  if (start >= end) {
    return { valid: false, error: "L'heure de début doit être avant l'heure de fin" }
  }

  if (end - start < 15) {
    return { valid: false, error: 'La durée minimum est de 15 minutes' }
  }

  if (start < dayStart || end > dayEnd) {
    return {
      valid: false,
      error: `Les blocs doivent être dans la fenêtre ${dayStartHour}h–${dayEndHour}h`,
    }
  }

  const sameDayBlocks = existingBlocks.filter((b) => b.date === newBlock.date)

  for (const block of sameDayBlocks) {
    const bStart = timeToMinutes(block.start_time)
    const bEnd = timeToMinutes(block.end_time)
    if (start < bEnd && end > bStart) {
      return { valid: false, error: `Chevauchement avec le bloc "${block.title}"` }
    }
  }

  return { valid: true }
}

export function blockDurationMinutes(block: Pick<TimeBlock, 'start_time' | 'end_time'>): number {
  return timeToMinutes(block.end_time) - timeToMinutes(block.start_time)
}
