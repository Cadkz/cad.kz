'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ASSISTANT_LIMITS, type AssistantCard } from '@/domain/assistant.mjs'

/** Кадди подготовил передачу менеджеру: имя и телефон — в форму, остальное — списком. */
export type HandoffPrefill = {
  name: string
  phone: string
  details: { title: string; value: string }[]
}

export type ChatMessage = {
  /** manager — менеджер ответил из открытой линии Битрикс24. */
  role: 'user' | 'assistant' | 'manager'
  content: string
  /** Имя менеджера. */
  name?: string
  cards?: AssistantCard[]
  /** Кнопки быстрых ответов под уточняющим вопросом: нажатие отправляет текст кнопки. */
  replies?: string[]
  handoff?: HandoffPrefill
  /** Клиент попросил связи: окно само открыло форму передачи менеджеру. */
  form?: boolean
}

type Stored = { id: string; messages: ChatMessage[]; live?: boolean }

/** Как часто спрашивать ответы менеджера: окно открыто и закрыто. */
const POLL_OPEN_MS = 5000
const POLL_CLOSED_MS = 15_000
/** После получаса тишины (ни клиент, ни менеджер не писали) перестаём спрашивать. */
const POLL_IDLE_MS = 30 * 60_000

/** Разговор живёт до закрытия вкладки: переход по страницам и обновление его не теряют. */
const STORAGE_KEY = 'cadkz-assistant'

function readStored(): Stored | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const value: unknown = raw ? JSON.parse(raw) : null
    if (value && typeof value === 'object' && 'id' in value && 'messages' in value) {
      const { id, messages, live } = value as Stored
      if (typeof id === 'string' && Array.isArray(messages))
        return { id, messages, live: live === true }
    }
  } catch {
    // Хранилище недоступно (приватный режим) — разговор просто начнётся заново.
  }
  return null
}

function writeStored(value: Stored) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Не сохранилось — не страшно: разговор есть на сервере и в окне.
  }
}

/** Ответы менеджера с сервера (GET /api/assistant) — сообщениями чата. */
function managerReplies(list: unknown): ChatMessage[] {
  if (!Array.isArray(list)) return []
  return list.flatMap((item) =>
    item && typeof item.content === 'string' && item.content
      ? [
          {
            role: 'manager' as const,
            content: item.content,
            ...(typeof item.name === 'string' && item.name ? { name: item.name } : {}),
          },
        ]
      : [],
  )
}

/** Новые ответы менеджера с сервера; null — нет связи или ошибка, спросим в следующий раз. */
async function fetchManagerReplies(conversationId: string, known: number) {
  try {
    const query = new URLSearchParams({ conversationId, managers: String(known) })
    const response = await fetch(`/api/assistant?${query}`, { cache: 'no-store' })
    if (!response.ok) return null
    const result = await response.json()
    return { fresh: managerReplies(result.messages), live: result.live !== false }
  } catch {
    return null
  }
}

/** Ответ Кадди с сервера — сообщением чата. */
function kaddiMessage(result: Record<string, unknown>): ChatMessage {
  const replies = Array.isArray(result.replies)
    ? result.replies.filter((r): r is string => typeof r === 'string')
    : []
  return {
    role: 'assistant',
    content: String(result.reply),
    cards: Array.isArray(result.cards) ? (result.cards as AssistantCard[]) : [],
    ...(replies.length ? { replies } : {}),
    ...(result.handoff ? { handoff: result.handoff as HandoffPrefill } : {}),
    ...(result.form === true ? { form: true } : {}),
  }
}

const FAILED =
  'Не получилось выполнить действие. Попробуйте ещё раз или передайте вопрос менеджеру.'

/**
 * Что делать с ответом сервера на вопрос: показать ответ Кадди, ничего (менеджер в разговоре —
 * сообщение ушло ему, Кадди не отвечает) или ошибку.
 */
function readAnswer(ok: boolean, result: Record<string, unknown>) {
  const live = ok && result.live === true
  if (ok && result.status === 'forwarded') return { live }
  if (ok && typeof result.reply === 'string') return { live, message: kaddiMessage(result) }
  return { live, error: typeof result.error === 'string' && result.error ? result.error : FAILED }
}

/** Вопрос Кадди (или менеджеру, если он в разговоре) и что показать в ответ. */
async function postQuestion(conversationId: string, message: string) {
  try {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, message }),
    })
    return readAnswer(response.ok, await response.json())
  } catch {
    return { live: false, error: 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.' }
  }
}

/**
 * Состояние чата с Кадди: сообщения, ожидание ответа, ошибка. История — на сервере, здесь копия
 * для показа. Новый вопрос нельзя отправить, пока Кадди отвечает на прошлый.
 * live — разговор идёт в открытую линию Битрикс24: окно раз в несколько секунд спрашивает, не
 * ответил ли менеджер (open — окно чата открыто, тогда чаще). Менеджер в разговоре — Кадди молчит.
 */
export function useAssistant(open = false) {
  const [conversationId, setConversationId] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [waiting, setWaiting] = useState(false)
  const [error, setError] = useState('')
  const [live, setLive] = useState(false)
  const lastQuestion = useRef('')
  const lastActivity = useRef(Date.now())
  const managers = messages.filter((m) => m.role === 'manager').length

  useEffect(() => {
    const stored = readStored()
    setConversationId(stored?.id ?? crypto.randomUUID())
    if (stored) {
      setMessages(stored.messages)
      setLive(stored.live === true)
    }
  }, [])

  useEffect(() => {
    if (conversationId) writeStored({ id: conversationId, messages, live })
  }, [conversationId, messages, live])

  // Ответы менеджера: спрашиваем, пока разговор в линии, вкладка видна и разговор не затих.
  useEffect(() => {
    if (!live || !conversationId) return
    let stopped = false
    const poll = async () => {
      if (document.hidden || Date.now() - lastActivity.current > POLL_IDLE_MS) return
      const result = await fetchManagerReplies(conversationId, managers)
      if (!result || stopped) return
      if (result.fresh.length) {
        lastActivity.current = Date.now()
        setMessages((list) => [...list, ...result.fresh])
      }
      if (!result.live) setLive(false)
    }
    const timer = setInterval(poll, open ? POLL_OPEN_MS : POLL_CLOSED_MS)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [live, conversationId, managers, open])

  const send = useCallback(
    async (text: string, retry = false) => {
      const message = text.trim()
      if (!message || waiting || !conversationId) return
      if (message.length > ASSISTANT_LIMITS.messageChars) {
        setError(`Сообщение длиннее ${ASSISTANT_LIMITS.messageChars} знаков — сократите его`)
        return
      }
      lastQuestion.current = message
      lastActivity.current = Date.now()
      setError('')
      if (!retry) setMessages((list) => [...list, { role: 'user', content: message }])
      setWaiting(true)
      const outcome = await postQuestion(conversationId, message)
      setWaiting(false)
      if (outcome.live) setLive(true)
      const answer = outcome.message
      if (answer) setMessages((list) => [...list, answer])
      if (outcome.error) setError(outcome.error)
    },
    [conversationId, waiting],
  )

  const retry = useCallback(() => send(lastQuestion.current, true), [send])

  /** Новый разговор: прежний остаётся на сервере (и в лиде, если его передали менеджеру). */
  const restart = useCallback(() => {
    setConversationId(crypto.randomUUID())
    setMessages([])
    setError('')
    setLive(false)
  }, [])

  /** Менеджер уже написал в этом разговоре. */
  const manager = managers > 0

  return { conversationId, messages, waiting, error, live, manager, send, retry, restart }
}
