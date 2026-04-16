// DestinyPlanner — Fil de commentaires contextuel (v2.1)
// Par étape (target_type='step') ou par jalon (target_type='milestone').
// Mentions @mot : highlight visuel uniquement (asynchrone, pas d'autocomplete).

import { useEffect, useState, useCallback } from 'react'
import { Pencil, Trash2, Send, Check, X } from 'lucide-react'
import { useCommentsStore } from '@/stores/useCommentsStore'
import { useMembersStore } from '@/stores/useMembersStore'
import { MentionInput } from './MentionInput'
import type { ResolvedMention } from './MentionInput'
import type { BusinessComment, BusinessCommentTargetType } from '@/lib/supabase.types'

// ─── Helpers ─────────────────────────────────────────────────

const AVATAR_PALETTE = [
  '#2DA58A', '#C49A3C', '#5B9BD4', '#7B6FD4',
  '#D4854A', '#5A9E6F', '#E07070',
]

function avatarColor(userId: string): string {
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

function formatDate(iso: string): string {
  const d = new Date(iso)
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000)
  if (diffMin < 1)  return "À l'instant"
  if (diffMin < 60) return `Il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24)   return `Il y a ${diffH}h`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function isEdited(c: BusinessComment): boolean {
  return c.updated_at !== c.created_at
}

function MentionBody({ body }: { body: string }): JSX.Element {
  const parts = body.split(/(@\w+)/g)
  return (
    <>
      {parts.map((part, i) =>
        /^@\w+$/.test(part)
          ? <span key={i} className="cmt-mention">{part}</span>
          : <span key={i}>{part}</span>,
      )}
    </>
  )
}

// ─── Styles ──────────────────────────────────────────────────

const STYLE = `
  .cmt-root {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding-top: var(--space-6);
    border-top: 1px solid var(--border);
    margin-top: var(--space-6);
  }

  .cmt-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .cmt-title {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-2);
  }

  .cmt-count {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--teal);
    background: color-mix(in srgb, var(--teal) 12%, transparent);
    border-radius: var(--r-full);
    padding: 1px 7px;
    line-height: 1.6;
  }

  /* ── Liste ── */
  .cmt-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .cmt-item {
    display: flex;
    gap: var(--space-3);
    align-items: flex-start;
  }

  .cmt-avatar {
    width: 28px;
    height: 28px;
    border-radius: var(--r-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: var(--weight-bold);
    color: #fff;
    flex-shrink: 0;
    letter-spacing: -0.02em;
    margin-top: 1px;
  }

  .cmt-bubble {
    flex: 1;
    min-width: 0;
  }

  .cmt-meta {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    margin-bottom: 3px;
    flex-wrap: wrap;
  }

  .cmt-author {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
  }

  .cmt-date {
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  .cmt-edited-label {
    font-size: var(--text-xs);
    color: var(--text-3);
    font-style: italic;
  }

  .cmt-body {
    font-size: var(--text-sm);
    color: var(--text-1);
    line-height: var(--leading-normal);
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
  }

  .cmt-mention {
    color: var(--teal);
    font-weight: var(--weight-semibold);
  }

  .cmt-actions {
    display: flex;
    gap: var(--space-1);
    margin-top: var(--space-1);
  }

  .cmt-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: var(--text-xs);
    color: var(--text-3);
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: var(--r-sm);
    transition: color var(--transition-base), background var(--transition-base);
    font-family: var(--font-ui);
  }

  .cmt-action-btn:hover {
    color: var(--text-1);
    background: var(--surface-2);
  }

  .cmt-action-btn--delete:hover {
    color: var(--coral);
    background: color-mix(in srgb, var(--coral) 10%, transparent);
  }

  .cmt-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Mode édition inline ── */
  .cmt-edit-area {
    width: 100%;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-1);
    background: var(--surface-2);
    border: 1px solid var(--teal);
    border-radius: var(--r-md);
    padding: var(--space-2) var(--space-3);
    outline: none;
    resize: vertical;
    min-height: 56px;
    line-height: var(--leading-normal);
    caret-color: var(--teal);
    box-sizing: border-box;
  }

  .cmt-edit-footer {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-1);
  }

  .cmt-edit-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    padding: 4px 10px;
    border-radius: var(--r-sm);
    border: none;
    cursor: pointer;
    font-family: var(--font-ui);
    transition: opacity var(--transition-base);
  }

  .cmt-edit-btn:hover { opacity: 0.84; }

  .cmt-edit-btn--save {
    background: var(--teal);
    color: #fff;
  }

  .cmt-edit-btn--cancel {
    background: transparent;
    border: 1px solid var(--border-2);
    color: var(--text-2);
  }

  /* ── Compose ── */
  .cmt-compose {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .cmt-compose-row {
    display: flex;
    gap: var(--space-2);
    align-items: flex-start;
  }

  .cmt-compose-textarea {
    flex: 1;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-1);
    background: var(--surface-2);
    border: 1px solid var(--border-2);
    border-radius: var(--r-md);
    padding: var(--space-2) var(--space-3);
    outline: none;
    resize: none;
    min-height: 56px;
    line-height: var(--leading-normal);
    caret-color: var(--teal);
    transition: border-color var(--transition-base);
    box-sizing: border-box;
  }

  .cmt-compose-textarea:focus { border-color: var(--teal); }
  .cmt-compose-textarea::placeholder { color: var(--text-3); font-style: italic; }

  .cmt-compose-send {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: var(--r-md);
    background: var(--teal);
    color: #fff;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    margin-top: 2px;
    transition: opacity var(--transition-base), transform var(--transition-fast);
  }

  .cmt-compose-send:hover:not(:disabled) { opacity: 0.84; transform: translateY(-1px); }
  .cmt-compose-send:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }

  .cmt-compose-hint {
    font-size: var(--text-xs);
    color: var(--text-3);
    text-align: right;
  }

  /* ── États ── */
  .cmt-empty {
    font-size: var(--text-sm);
    color: var(--text-3);
    font-style: italic;
  }

  .cmt-loading {
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  .cmt-error {
    font-size: var(--text-xs);
    color: var(--coral);
  }
`

// ─── Composant ───────────────────────────────────────────────

interface Props {
  projectId: string
  targetType: BusinessCommentTargetType
  targetId: string
  currentUserId: string
}

export function CommentThread({ projectId, targetType, targetId, currentUserId }: Props): JSX.Element {
  const { comments: allComments, authors, loading, error, loadComments, addComment, editComment, deleteComment } =
    useCommentsStore()
  const { members } = useMembersStore()

  const comments = allComments.filter(
    (c) => c.target_type === targetType && c.target_id === targetId,
  )

  const [draft, setDraft]               = useState('')
  const [draftMentions, setDraftMentions] = useState<ResolvedMention[]>([])
  const [sending, setSending]           = useState(false)
  const [editingId, setEditingId]       = useState<string | null>(null)
  const [editDraft, setEditDraft]       = useState('')
  const [deleting, setDeleting]         = useState<string | null>(null)

  useEffect(() => {
    loadComments(projectId, targetType, targetId)
  }, [projectId, targetType, targetId, loadComments])

  const handleSend = useCallback(async (): Promise<void> => {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    try {
      const mentionedUserIds = draftMentions.map((m) => m.userId)
      await addComment(projectId, targetType, targetId, body, mentionedUserIds)
      setDraft('')
      setDraftMentions([])
    } finally {
      setSending(false)
    }
  }, [draft, draftMentions, sending, addComment, projectId, targetType, targetId])

  function startEdit(commentId: string, body: string): void {
    setEditingId(commentId)
    setEditDraft(body)
  }

  function cancelEdit(): void {
    setEditingId(null)
    setEditDraft('')
  }

  async function handleSaveEdit(): Promise<void> {
    if (!editingId || !editDraft.trim()) return
    try {
      await editComment(editingId, editDraft.trim())
      cancelEdit()
    } catch { /* silencieux — erreur affichée via store */ }
  }

  async function handleDelete(commentId: string): Promise<void> {
    setDeleting(commentId)
    try {
      await deleteComment(commentId)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className="cmt-root">

        {/* En-tête */}
        <div className="cmt-header">
          <span className="cmt-title">Commentaires</span>
          {comments.length > 0 && (
            <span className="cmt-count">{comments.length}</span>
          )}
        </div>

        {error && <span className="cmt-error">{error}</span>}

        {/* Liste */}
        {loading && comments.length === 0 ? (
          <div className="cmt-loading">Chargement…</div>
        ) : comments.length === 0 ? (
          <div className="cmt-empty">Aucun commentaire pour cette étape.</div>
        ) : (
          <div className="cmt-list">
            {comments.map((c) => {
              const name   = authors[c.author_id]?.display_name ?? 'Inconnu'
              const isOwn  = c.author_id === currentUserId

              return (
                <div key={c.id} className="cmt-item">
                  <div
                    className="cmt-avatar"
                    style={{ background: avatarColor(c.author_id) }}
                    aria-hidden="true"
                  >
                    {initials(name)}
                  </div>

                  <div className="cmt-bubble">
                    <div className="cmt-meta">
                      <span className="cmt-author">{name}</span>
                      <span className="cmt-date">{formatDate(c.created_at)}</span>
                      {isEdited(c) && <span className="cmt-edited-label">(modifié)</span>}
                    </div>

                    {editingId === c.id ? (
                      <>
                        <textarea
                          className="cmt-edit-area"
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); handleSaveEdit() }
                            if (e.key === 'Escape') cancelEdit()
                          }}
                          autoFocus
                        />
                        <div className="cmt-edit-footer">
                          <button
                            type="button"
                            className="cmt-edit-btn cmt-edit-btn--save"
                            onClick={handleSaveEdit}
                            disabled={!editDraft.trim()}
                          >
                            <Check size={11} />
                            Enregistrer
                          </button>
                          <button
                            type="button"
                            className="cmt-edit-btn cmt-edit-btn--cancel"
                            onClick={cancelEdit}
                          >
                            <X size={11} />
                            Annuler
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="cmt-body">
                          <MentionBody body={c.body} />
                        </p>
                        {isOwn && (
                          <div className="cmt-actions">
                            <button
                              type="button"
                              className="cmt-action-btn"
                              onClick={() => startEdit(c.id, c.body)}
                            >
                              <Pencil size={11} />
                              Modifier
                            </button>
                            <button
                              type="button"
                              className="cmt-action-btn cmt-action-btn--delete"
                              onClick={() => handleDelete(c.id)}
                              disabled={deleting === c.id}
                            >
                              <Trash2 size={11} />
                              {deleting === c.id ? '…' : 'Supprimer'}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Saisie */}
        <div className="cmt-compose">
          <div className="cmt-compose-row">
            <MentionInput
              value={draft}
              onChange={(text, mentions) => { setDraft(text); setDraftMentions(mentions) }}
              onSubmit={handleSend}
              members={members.filter((m) => m.user_id !== currentUserId)}
              disabled={sending}
            />
            <button
              type="button"
              className="cmt-compose-send"
              disabled={!draft.trim() || sending}
              onClick={handleSend}
              aria-label="Envoyer le commentaire"
            >
              <Send size={14} />
            </button>
          </div>
          <span className="cmt-compose-hint">Ctrl+Entrée pour envoyer</span>
        </div>

      </div>
    </>
  )
}
