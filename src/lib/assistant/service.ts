import type { Payload } from 'payload'
import { anthropicReply, ModelError } from '@/domain/anthropicChat.mjs'
import {
  ASSISTANT_LIMITS,
  ASSISTANT_TOOLS,
  type AssistantCard,
  cleanReply,
  countTurns,
  demoReply,
  type HandoffDraft,
  type HandoffState,
  handoffDetails,
  mentionedCards,
  modelHistory,
  promptLinks,
  quickAction,
  RENEW_CARD,
  type StoredMessage,
  systemPrompt,
  wantsRenewal,
} from '@/domain/assistant.mjs'
import { workTime } from '@/domain/priceTable.mjs'
import { splitQuickReplies } from '@/domain/quickReplies.mjs'
import {
  type ConversationSnapshot,
  findConversation,
  type StoredConversation,
  saveConversation,
} from './conversation'
import { loadKnowledge, priceSummary } from './priceTable'
import { type AssistantMode, leadsReachManagers, modelSettings } from './provider'
import { createTools, findCards, toCard } from './tools'

/** Сколько ждём модель, прежде чем честно сказать, что ответа нет. */
const MODEL_TIMEOUT_MS = 30_000

import type { HandoffPrefill } from '../useAssistant'

export type AssistantAnswer =
  | {
      status: 'ok'
      reply: string
      cards: AssistantCard[]
      /** Кнопки быстрых ответов под уточняющим вопросом. */
      replies: string[]
      demo: boolean
      handoff?: HandoffPrefill
      /** Разговор идёт в открытую линию Битрикс24: окно чата ждёт ответов менеджера. */
      live: boolean
    }
  /** Менеджер уже в разговоре: Кадди молчит, сообщение ушло менеджеру в открытую линию. */
  | { status: 'forwarded'; live: true }
  | { status: 'limit' | 'busy' | 'failed'; error: string }

/** Сообщение менеджера для окна чата. */
export type ManagerMessage = { content: string; name: string; at: string }

const FAILED =
  'Не получилось получить ответ. Попробуйте ещё раз через минуту или передайте вопрос менеджеру.'

/** Обращение модели к инструменту — для страницы проверки ответов в админке. */
export type ToolCall = { name: string; input: unknown; result: unknown }

type Answer = {
  reply: string
  cards: AssistantCard[]
  replies: string[]
  handoff: HandoffDraft | null
}

/** Что модель знает о передаче менеджеру: по снимку разговора на сервере. */
export function handoffState(snapshot: ConversationSnapshot | null | undefined): HandoffState {
  if (snapshot?.requestNumber)
    return { state: 'sent', number: snapshot.requestNumber, delivered: leadsReachManagers() }
  return snapshot?.handoff ? { state: 'prepared' } : { state: 'none' }
}

/** Данные передачи для кнопки под ответом. */
export function handoffPrefill(draft: HandoffDraft): HandoffPrefill {
  return {
    name: draft.name,
    phone: draft.phone,
    details: handoffDetails(draft),
  }
}

/** Разделы сайта после карточек товаров, без повторов; всего под ответом не больше шести. */
function withPages(cards: AssistantCard[], pages: AssistantCard[]) {
  const extra = pages.filter((page) => !cards.some((card) => card.href === page.href))
  return [...cards, ...extra.slice(0, 2)].slice(0, 6)
}

async function modelAnswer(
  payload: Payload,
  messages: StoredMessage[],
  handoff: HandoffState,
  onTool?: (call: ToolCall) => void,
): Promise<Answer> {
  const tools = createTools(payload)
  const [knowledge, price] = await Promise.all([loadKnowledge(payload), priceSummary(payload)])
  const { apiKey, model } = modelSettings()
  const runTool = async (name: string, input: unknown) => {
    const result = await tools.run(name, input)
    onTool?.({ name, input, result })
    return result
  }
  const system = systemPrompt({
    now: new Date(),
    knowledge,
    price,
    handoff,
    time: workTime(new Date()),
  })
  const { text } = await anthropicReply({
    fetchImpl: fetch,
    apiKey,
    model,
    system,
    messages: modelHistory(messages),
    tools: ASSISTANT_TOOLS,
    runTool,
    signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
  })
  // Строка «Кнопки: …» — варианты ответа кнопками под вопросом, в тексте её нет.
  const quick = splitQuickReplies(text)
  // Ссылки — только cad.kz и адреса из правил и базы знаний; остальное сайт показывает карточками.
  const reply = cleanReply(quick.text, promptLinks(system[0]))
  return {
    reply,
    // Передача менеджеру подготовлена — под ответом кнопка подтверждения, вариантов не нужно.
    replies: tools.handoff() ? [] : quick.replies,
    // Товары и варианты, названные в ответе, затем разделы сайта, которые модель попросила показать.
    cards: withPages(mentionedCards(reply, tools.found, { variants: tools.variants }), tools.pages),
    handoff: tools.handoff(),
  }
}

/**
 * Ответ на последний вопрос разговора без сохранения: модель или демо-режим, плюс форма
 * продления под ответом о продлении. Ошибку модели пробрасывает.
 */
export async function answerMessages(
  payload: Payload,
  mode: AssistantMode,
  messages: StoredMessage[],
  options: { onTool?: (call: ToolCall) => void; handoff?: HandoffState } = {},
): Promise<Answer> {
  const message = messages[messages.length - 1]?.content ?? ''
  let answer: Answer
  if (mode === 'demo') {
    const action = quickAction(message)
    const found = action ? [] : (await findCards(message)).map(toCard)
    const { text, cards } = demoReply(found, {
      first: messages.length <= 1,
      quick: Boolean(action),
      quickText: action?.demo,
    })
    answer = { reply: text, cards, replies: [], handoff: null }
  } else
    answer = await modelAnswer(
      payload,
      messages,
      options.handoff ?? { state: 'none' },
      options.onTool,
    )
  // Про продление — под ответом форма продления (настоящая заявка, менеджер найдёт лицензию).
  if (wantsRenewal(message) && !answer.cards.some((c) => c.href === RENEW_CARD.href))
    answer = { ...answer, cards: [...answer.cards, { ...RENEW_CARD }] }
  return answer
}

type TurnExtra = { mode: AssistantMode; clientHash: string; handoff?: HandoffDraft | null }

/**
 * Сохраняет новые сообщения разговора. Если разговор успели изменить параллельно ответ менеджера
 * из открытой линии или отметка об отправке в линию — дописываем к свежей версии. Новый вопрос
 * клиента параллельно — false: на прошлый вопрос ответ ещё готовится.
 */
async function saveTurn(
  payload: Payload,
  key: string,
  stored: StoredConversation | null,
  added: StoredMessage[],
  extra: TurnExtra,
) {
  const build = (base: StoredConversation | null): ConversationSnapshot => {
    const snapshot = base?.snapshot
    const handoff = extra.handoff ?? snapshot?.handoff
    return {
      version: 1,
      mode: extra.mode,
      messages: [...(snapshot?.messages ?? []), ...added],
      clientHash: snapshot?.clientHash || extra.clientHash,
      ...(snapshot?.requestNumber ? { requestNumber: snapshot.requestNumber } : {}),
      // Последние данные передачи менеджеру: форма подтверждения и лид берут их отсюда, а не из браузера.
      ...(handoff ? { handoff } : {}),
      ...(snapshot?.line ? { line: snapshot.line } : {}),
    }
  }
  if (await saveConversation(payload, key, stored, build(stored))) return true
  const before = stored?.snapshot.messages.length ?? 0
  for (let attempt = 0; attempt < 3; attempt++) {
    const latest = await findConversation(payload, key)
    if (!latest || latest.snapshot.messages.length < before) return false
    if (latest.snapshot.messages.slice(before).some((m) => m.role === 'user')) return false
    if (await saveConversation(payload, key, latest, build(latest))) return true
  }
  return false
}

/**
 * Вопрос клиента → ответ Кадди. Сообщение клиента сохраняется и тогда, когда модель не ответила:
 * менеджер увидит вопрос в лиде, если клиент передаст разговор. live — открытая линия подключена:
 * если менеджер уже написал клиенту из линии, Кадди молчит и сообщение просто сохраняется (в линию
 * его отправит маршрут после ответа).
 */
export async function askAssistant(
  payload: Payload,
  mode: AssistantMode,
  input: { conversationId: string; message: string },
  clientHash: string,
  live = false,
): Promise<AssistantAnswer> {
  const stored = await findConversation(payload, input.conversationId)
  const previous = stored?.snapshot.messages ?? []
  const manager = live && Boolean(stored?.snapshot.line?.manager)
  if (!manager && countTurns(previous) >= ASSISTANT_LIMITS.turns)
    return {
      status: 'limit',
      error: 'Разговор получился длинным. Передайте его менеджеру — он продолжит с этого места.',
    }
  const question: StoredMessage = {
    role: 'user',
    content: input.message,
    at: new Date().toISOString(),
  }
  const busy = {
    status: 'busy',
    error: 'Ответ на прошлый вопрос ещё готовится. Подождите немного.',
  } as const

  if (manager) {
    const saved = await saveTurn(payload, input.conversationId, stored, [question], {
      mode,
      clientHash,
    })
    return saved ? { status: 'forwarded', live: true } : busy
  }

  let answer: Answer | null = null
  try {
    answer = await answerMessages(payload, mode, [...previous, question], {
      handoff: handoffState(stored?.snapshot),
    })
  } catch (error) {
    // В журнал — только вид ошибки и код ответа, без текста запроса и ключа.
    const status = error instanceof ModelError ? error.status : null
    console.error('Консультант не ответил', error instanceof Error ? error.name : 'Error', status)
  }

  const added: StoredMessage[] = [question]
  if (answer)
    added.push({
      role: 'assistant',
      content: answer.reply,
      at: new Date().toISOString(),
      ...(answer.cards.length ? { cards: answer.cards } : {}),
      ...(answer.replies.length ? { replies: answer.replies } : {}),
    })
  const saved = await saveTurn(payload, input.conversationId, stored, added, {
    mode,
    clientHash,
    handoff: answer?.handoff,
  })
  if (!saved) return busy
  if (!answer) return { status: 'failed', error: FAILED }
  return {
    status: 'ok',
    reply: answer.reply,
    cards: answer.cards,
    replies: answer.replies,
    demo: mode === 'demo',
    live,
    ...(answer.handoff ? { handoff: handoffPrefill(answer.handoff) } : {}),
  }
}

/**
 * Ответы менеджера, которых ещё нет в окне чата: known — сколько их окно уже показало. Окно
 * спрашивает раз в несколько секунд, пока разговор идёт в открытую линию.
 */
export function managerMessages(
  stored: StoredConversation | null,
  known: number,
): ManagerMessage[] {
  return (stored?.snapshot.messages ?? [])
    .filter((m) => m.role === 'manager')
    .slice(known)
    .map((m) => ({ content: m.content, name: m.name ?? '', at: m.at }))
}
