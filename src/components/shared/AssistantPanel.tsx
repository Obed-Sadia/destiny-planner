// DestinyPlanner — Panneau de chat de l'assistant IA

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { X, Send, Trash2, CheckCircle, AlertCircle, Sparkles, Mic, MicOff } from 'lucide-react'
import { useAssistantStore } from '@/stores/useAssistantStore'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import type { AssistantMessage } from '@/types'

const STYLE = `
  .assistant-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 340px;
    background: var(--sidebar);
    border-left: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    z-index: 200;
    box-shadow: var(--shadow-lg);
    transform: translateX(100%);
    transition: transform var(--transition-slow);
  }

  .assistant-panel.open {
    transform: translateX(0);
  }

  @media (max-width: 767px) {
    .assistant-panel {
      width: 100vw;
    }
  }

  .assistant-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .assistant-panel-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-1);
  }

  .assistant-panel-title svg {
    color: var(--gold);
  }

  .assistant-panel-actions {
    display: flex;
    gap: var(--space-1);
  }

  .assistant-icon-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--r-sm);
    color: var(--text-3);
    transition: background var(--transition-fast), color var(--transition-fast);
    cursor: pointer;
    background: none;
    border: none;
  }

  .assistant-icon-btn:hover {
    background: var(--surface-2);
    color: var(--text-1);
  }

  .assistant-messages {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .assistant-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    color: var(--text-3);
    padding: var(--space-8);
    text-align: center;
  }

  .assistant-empty svg {
    color: var(--gold);
    opacity: 0.5;
  }

  .assistant-empty-title {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-2);
  }

  .assistant-empty-hint {
    font-size: var(--text-xs);
    line-height: var(--leading-normal);
  }

  .assistant-bubble {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    max-width: 90%;
  }

  .assistant-bubble.user {
    align-self: flex-end;
    align-items: flex-end;
  }

  .assistant-bubble.assistant {
    align-self: flex-start;
    align-items: flex-start;
  }

  .assistant-bubble-text {
    padding: var(--space-2) var(--space-3);
    border-radius: var(--r-lg);
    font-size: var(--text-sm);
    line-height: var(--leading-normal);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .assistant-bubble.user .assistant-bubble-text {
    background: var(--gold-pale);
    border: 1px solid rgba(196, 154, 60, 0.25);
    color: var(--text-1);
    border-bottom-right-radius: var(--r-xs);
  }

  .assistant-bubble.assistant .assistant-bubble-text {
    background: var(--surface-2);
    color: var(--text-1);
    border-bottom-left-radius: var(--r-xs);
  }

  .assistant-action-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px var(--space-2);
    border-radius: var(--r-full);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
  }

  .assistant-action-badge.success {
    background: rgba(90, 158, 111, 0.15);
    color: #7DC499;
  }

  .assistant-action-badge.error {
    background: rgba(224, 112, 112, 0.15);
    color: #E89090;
  }

  .assistant-loading {
    align-self: flex-start;
    display: flex;
    gap: 5px;
    padding: var(--space-2) var(--space-3);
    background: var(--surface-2);
    border-radius: var(--r-lg);
    border-bottom-left-radius: var(--r-xs);
  }

  .assistant-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--text-3);
    animation: assistantPulse 1.2s ease-in-out infinite;
  }

  .assistant-dot:nth-child(2) { animation-delay: 0.2s; }
  .assistant-dot:nth-child(3) { animation-delay: 0.4s; }

  @keyframes assistantPulse {
    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
    40% { opacity: 1; transform: scale(1); }
  }

  .assistant-input-area {
    border-top: 1px solid var(--border);
    padding: var(--space-3) var(--space-4);
    flex-shrink: 0;
  }

  .assistant-input-row {
    display: flex;
    align-items: flex-end;
    gap: var(--space-2);
    background: var(--surface-2);
    border: 1px solid var(--border-2);
    border-radius: var(--r-lg);
    padding: var(--space-2) var(--space-2) var(--space-2) var(--space-3);
    transition: border-color var(--transition-fast);
  }

  .assistant-input-row:focus-within {
    border-color: var(--gold);
  }

  .assistant-textarea {
    flex: 1;
    resize: none;
    background: none;
    border: none;
    outline: none;
    font-size: var(--text-sm);
    color: var(--text-1);
    line-height: var(--leading-normal);
    max-height: 120px;
    min-height: 20px;
    overflow-y: auto;
    padding: 0;
  }

  .assistant-textarea::placeholder {
    color: var(--text-3);
  }

  .assistant-send-btn {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--r-sm);
    background: var(--gold);
    color: #0F0E0D;
    cursor: pointer;
    border: none;
    flex-shrink: 0;
    transition: opacity var(--transition-fast);
  }

  .assistant-send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .assistant-mic-btn {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--r-sm);
    background: var(--surface-3, var(--surface-2));
    color: var(--text-2);
    cursor: pointer;
    border: none;
    flex-shrink: 0;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .assistant-mic-btn:hover:not(:disabled) {
    background: var(--surface-3, rgba(255,255,255,0.08));
    color: var(--text-1);
  }

  .assistant-mic-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .assistant-mic-btn.recording {
    background: rgba(224, 80, 80, 0.2);
    color: #E05050;
    animation: micPulse 1.2s ease-in-out infinite;
  }

  @keyframes micPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(224, 80, 80, 0); }
    50% { box-shadow: 0 0 0 4px rgba(224, 80, 80, 0.25); }
  }

  .assistant-voice-error {
    font-size: 10px;
    color: #E08080;
    text-align: center;
    margin-top: var(--space-1);
  }

  .assistant-hint {
    font-size: 10px;
    color: var(--text-3);
    text-align: center;
    margin-top: var(--space-2);
  }
`

function ActionBadge({ result }: { result: NonNullable<AssistantMessage['actionResult']> }): JSX.Element {
  return (
    <span className={`assistant-action-badge ${result.success ? 'success' : 'error'}`}>
      {result.success
        ? <CheckCircle size={10} />
        : <AlertCircle size={10} />
      }
      {result.label}
    </span>
  )
}

function Bubble({ msg }: { msg: AssistantMessage }): JSX.Element {
  return (
    <div className={`assistant-bubble ${msg.role}`}>
      <div className="assistant-bubble-text">{msg.content}</div>
      {msg.actionResult && msg.actionResult.type !== 'none' && (
        <ActionBadge result={msg.actionResult} />
      )}
    </div>
  )
}

export function AssistantPanel(): JSX.Element {
  const { messages, isOpen, isLoading, close, clear, sendMessage } = useAssistantStore()
  const [input, setInput] = useState('')
  const [voiceError, setVoiceError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { isSupported, isRecording, start, stop } = useSpeechRecognition({
    lang: 'fr-FR',
    onResult: (transcript) => {
      setVoiceError('')
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
      textareaRef.current?.focus()
    },
    onError: (msg) => setVoiceError(msg),
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  function handleSend(): void {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    void sendMessage(text)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleMicClick(): void {
    setVoiceError('')
    if (isRecording) {
      stop()
    } else {
      start()
    }
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className={`assistant-panel${isOpen ? ' open' : ''}`} role="complementary" aria-label="Assistant IA">
        <div className="assistant-panel-header">
          <div className="assistant-panel-title">
            <Sparkles size={14} />
            <span>Assistant</span>
          </div>
          <div className="assistant-panel-actions">
            {messages.length > 0 && (
              <button className="assistant-icon-btn" onClick={clear} title="Effacer la conversation">
                <Trash2 size={14} />
              </button>
            )}
            <button className="assistant-icon-btn" onClick={close} title="Fermer">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="assistant-messages">
          {messages.length === 0 && !isLoading ? (
            <div className="assistant-empty">
              <Sparkles size={28} />
              <p className="assistant-empty-title">Ton assistant DestinyPlanner</p>
              <p className="assistant-empty-hint">
                Demande un récap de tes projets, ajoute un jalon, crée des blocs horaires ou enregistre un détour.
              </p>
            </div>
          ) : (
            messages.map((msg) => <Bubble key={msg.id} msg={msg} />)
          )}
          {isLoading && (
            <div className="assistant-loading">
              <div className="assistant-dot" />
              <div className="assistant-dot" />
              <div className="assistant-dot" />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="assistant-input-area">
          <div className="assistant-input-row">
            <textarea
              ref={textareaRef}
              className="assistant-textarea"
              placeholder="Pose une question ou donne une instruction…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading}
            />
            <button
              className={`assistant-mic-btn${isRecording ? ' recording' : ''}`}
              onClick={handleMicClick}
              disabled={!isSupported || isLoading}
              title={!isSupported ? 'Non supporté par ce navigateur' : isRecording ? 'Arrêter l\'enregistrement' : 'Dicter un message'}
            >
              {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
            <button
              className="assistant-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              title="Envoyer"
            >
              <Send size={14} />
            </button>
          </div>
          {voiceError && <p className="assistant-voice-error">{voiceError}</p>}
          <p className="assistant-hint">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</p>
        </div>
      </div>
    </>
  )
}
