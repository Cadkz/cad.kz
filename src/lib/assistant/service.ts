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
  quickAction,
  RENEW_CARD,
  type StoredMessage,
  systemPrompt,
  wantsRenewal,
} from '@/domain/assistant.mjs'
import { workTime } from '@/domain/priceTable.mjs'
import { type ConversationSnapshot, findConversation, saveConversation } from './conversation'
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
      demo: boolean
      handoff?: HandoffPrefill
    }
  | { status: 'limit' | 'busy' | 'failed'; error: string }

const FAILED =
  'Не получилось получить ответ. Попробуйте ещё раз через минуту или передайте вопрос менеджеру.'

/** Обращение модели к инструменту — для страницы проверки ответов в админке. */
export type ToolCall = { name: string; input: unknown; result: unknown }

type Answer = { reply: string; cards: AssistantCard[]; handoff: HandoffDraft | null }

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
  const { text } = await anthropicReply({
    fetchImpl: fetch,
    apiKey,
    model,
    system: systemPrompt({
      now: new Date(),
      knowledge,
      price,
      handoff,
      time: workTime(new Date()),
    }),
    messages: modelHistory(messages),
    tools: ASSISTANT_TOOLS,
    runTool,
    signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
  })
  const reply = cleanReply(text)
  return { reply, cards: mentionedCards(reply, tools.found), handoff: tools.handoff() }
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
    answer = { reply: text, cards, handoff: null }
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

/**
 * Вопрос клиента → ответ Юки. Сообщение клиента сохраняется и тогда, когда модель не ответила:
 * менеджер увидит вопрос в лиде, если клиент передаст разговор.
 */
export async function askAssistant(
  payload: Payload,
  mode: AssistantMode,
  input: { conversationId: string; message: string },
  clientHash: string,
): Promise<AssistantAnswer> {
  const stored = await findConversation(payload, input.conversationId)
  const previous = stored?.snapshot.messages ?? []
  if (countTurns(previous) >= ASSISTANT_LIMITS.turns)
    return {
      status: 'limit',
      error: 'Разговор получился длинным. Передайте его менеджеру — он продолжит с этого места.',
    }
  const now = new Date().toISOString()
  const messages: StoredMessage[] = [...previous, { role: 'user', content: input.message, at: now }]

  let answer: Answer | null = null
  try {
    answer = await answerMessages(payload, mode, messages, {
      handoff: handoffState(stored?.snapshot),
    })
  } catch (error) {
    // В журнал — только вид ошибки и код ответа, без текста запроса и ключа.
    const status = error instanceof ModelError ? error.status : null
    console.error('Консультант не ответил', error instanceof Error ? error.name : 'Error', status)
  }

  if (answer)
    messages.push({
      role: 'assistant',
      content: answer.reply,
      at: new Date().toISOString(),
      ...(answer.cards.length ? { cards: answer.cards } : {}),
    })
  const saved = await saveConversation(payload, input.conversationId, stored, {
    version: 1,
    mode,
    messages,
    clientHash: stored?.snapshot.clientHash || clientHash,
    ...(stored?.snapshot.requestNumber ? { requestNumber: stored.snapshot.requestNumber } : {}),
    // Последние данные передачи менеджеру: форма подтверждения и лид берут их отсюда, а не из браузера.
    ...(answer?.handoff
      ? { handoff: answer.handoff }
      : stored?.snapshot.handoff
        ? { handoff: stored.snapshot.handoff }
        : {}),
  })
  if (!saved)
    return { status: 'busy', error: 'Ответ на прошлый вопрос ещё готовится. Подождите немного.' }
  if (!answer) return { status: 'failed', error: FAILED }
  return {
    status: 'ok',
    reply: answer.reply,
    cards: answer.cards,
    demo: mode === 'demo',
    ...(answer.handoff ? { handoff: handoffPrefill(answer.handoff) } : {}),
  }
}
