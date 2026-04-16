// DestinyPlanner — Textarea avec autocomplete @mention (S35)
// Résout @prénom → user_id Supabase pour les membres du projet uniquement.

import { useEffect, useRef, useState } from 'react'
import type { MemberWithProfile } from '@/stores/useMembersStore'

// ─── Types ───────────────────────────────────────────────────

export interface ResolvedMention {
  displayName: string
  userId: string
}

interface Props {
  value: string
  onChange: (text: string, mentions: ResolvedMention[]) => void
  onSubmit: () => void
  members: MemberWithProfile[]
  placeholder?: string
  disabled?: boolean
}

// ─── Styles ──────────────────────────────────────────────────

const STYLE = `
  .mi-wrap {
    position: relative;
    width: 100%;
  }

  .mi-textarea {
    width: 100%;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    color: var(--text-1);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    line-height: var(--leading-normal);
    padding: var(--space-2) var(--space-3);
    resize: none;
    outline: none;
    transition: border-color var(--transition-fast);
    box-sizing: border-box;
  }

  .mi-textarea:focus {
    border-color: var(--teal);
  }

  .mi-textarea::placeholder {
    color: var(--text-3);
  }

  .mi-textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .mi-dropdown {
    position: absolute;
    bottom: calc(100% + 4px);
    left: 0;
    min-width: 180px;
    max-width: 280px;
    background: var(--surface);
    border: 1px solid var(--border-2);
    border-radius: var(--r-md);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    overflow: hidden;
    z-index: 100;
  }

  .mi-dropdown-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 7px var(--space-3);
    cursor: pointer;
    font-size: var(--text-sm);
    color: var(--text-2);
    transition: background var(--transition-fast);
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
  }

  .mi-dropdown-item:hover,
  .mi-dropdown-item.active {
    background: var(--surface-2);
    color: var(--text-1);
  }

  .mi-dropdown-avatar {
    width: 22px;
    height: 22px;
    border-radius: var(--r-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: var(--weight-semibold);
    color: #fff;
    flex-shrink: 0;
    background: var(--teal);
  }
`

const AVATAR_PALETTE = ['#2DA58A', '#C49A3C', '#5B9BD4', '#7B6FD4', '#D4854A', '#5A9E6F']

function avatarBg(userId: string): string {
  let h = 0
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) | 0
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

function initials(name: string | null | undefined): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0][0].toUpperCase()
}

// Trouve le token @... en cours de frappe à la position du curseur
function findActiveMention(text: string, cursor: number): { start: number; query: string } | null {
  const before = text.slice(0, cursor)
  const match = before.match(/@(\w*)$/)
  if (!match) return null
  return { start: cursor - match[0].length, query: match[1].toLowerCase() }
}

// ─── Composant ───────────────────────────────────────────────

export function MentionInput({
  value,
  onChange,
  onSubmit,
  members,
  placeholder = 'Ajouter un commentaire… Utilisez @prénom pour mentionner',
  disabled = false,
}: Props): JSX.Element {
  const textareaRef  = useRef<HTMLTextAreaElement>(null)
  const [activeMention, setActiveMention] = useState<{ start: number; query: string } | null>(null)
  const [activeIdx, setActiveIdx]         = useState(0)
  // Map displayName → userId pour les mentions résolues dans le texte courant
  const mentionMapRef = useRef<Map<string, string>>(new Map())

  const suggestions = activeMention
    ? members
        .filter((m) => {
          const name = m.profile?.display_name ?? ''
          return name.toLowerCase().includes(activeMention.query)
        })
        .slice(0, 6)
    : []

  useEffect(() => { setActiveIdx(0) }, [activeMention?.query])

  // Recalcule les mentions résolues présentes dans le texte actuel
  function resolveMentions(text: string): ResolvedMention[] {
    const tokens = [...text.matchAll(/@(\w+(?:\s\w+)*)/g)].map((m) => m[1].toLowerCase())
    const result: ResolvedMention[] = []
    for (const [displayName, userId] of mentionMapRef.current) {
      if (tokens.some((t) => t === displayName.toLowerCase())) {
        result.push({ displayName, userId })
      }
    }
    return result
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>): void {
    const text   = e.target.value
    const cursor = e.target.selectionStart ?? text.length
    const found  = findActiveMention(text, cursor)
    setActiveMention(found)
    onChange(text, resolveMentions(text))
  }

  function selectMember(member: MemberWithProfile): void {
    if (!activeMention) return
    const displayName = member.profile?.display_name ?? member.user_id
    const before = value.slice(0, activeMention.start)
    const after  = value.slice(activeMention.start + 1 + activeMention.query.length)
    const inserted = `@${displayName} `
    const newText  = before + inserted + after

    mentionMapRef.current.set(displayName, member.user_id)
    setActiveMention(null)
    onChange(newText, resolveMentions(newText))

    // Repositionner le curseur après la mention insérée
    requestAnimationFrame(() => {
      if (!textareaRef.current) return
      const pos = before.length + inserted.length
      textareaRef.current.setSelectionRange(pos, pos)
      textareaRef.current.focus()
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (activeMention && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => (i + 1) % suggestions.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => (i - 1 + suggestions.length) % suggestions.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        selectMember(suggestions[activeIdx])
        return
      }
      if (e.key === 'Escape') {
        setActiveMention(null)
        return
      }
    }

    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className="mi-wrap">
        {activeMention && suggestions.length > 0 && (
          <div className="mi-dropdown" role="listbox">
            {suggestions.map((m, i) => {
              const name = m.profile?.display_name ?? m.user_id
              return (
                <button
                  key={m.user_id}
                  type="button"
                  role="option"
                  aria-selected={i === activeIdx}
                  className={`mi-dropdown-item${i === activeIdx ? ' active' : ''}`}
                  onMouseDown={(e) => { e.preventDefault(); selectMember(m) }}
                >
                  <span
                    className="mi-dropdown-avatar"
                    style={{ background: avatarBg(m.user_id) }}
                  >
                    {initials(name)}
                  </span>
                  {name}
                </button>
              )
            })}
          </div>
        )}
        <textarea
          ref={textareaRef}
          className="mi-textarea"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={2}
        />
      </div>
    </>
  )
}
