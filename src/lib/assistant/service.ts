import type { Payload } from 'payload'
import { anthropicReply, ModelError } from '@/domain/anthropicChat.mjs'
import {
  ASSISTANT_LIMITS,
  ASSISTANT_TOOLS,
  type AssistantCard,
  cleanReply,
  countTurns,
  demoReply,
  mentionedCards,
  modelHistory,
  quickAction,
  RENEW_CARD,
  type StoredMessage,
  systemPrompt,
  wantsRenewal,
} from '@/domain/assistant.mjs'
import { formatDay } from '../format'
import { findConversation, saveConversation } from './conversation'
import { type AssistantMode, modelSettings } from './provider'
import { createTools, findCards, toCard } from './tools'

/** Сколько ждём модель, прежде чем честно сказать, что ответа нет. */
const MODEL_TIMEOUT_MS = 30_000

export type AssistantAnswer =
  | { status: 'ok'; reply: string; cards: AssistantCard[]; demo: boolean }
  | { status: 'limit' | 'busy' | 'failed'; error: string }

const FAILED =
  'Не получилось получить ответ. Попробуйте ещё раз через минуту или передайте вопрос менеджеру.'

async function modelAnswer(payload: Payload, messages: StoredMessage[]) {
  const tools = createTools(payload)
  const { apiKey, model } = modelSettings()
  const { text } = await anthropicReply({
    fetchImpl: fetch,
    apiKey,
    model,
    system: systemPrompt({ today: formatDay(new Date().toISOString()) }),
    messages: modelHistory(messages),
    tools: ASSISTANT_TOOLS,
    runTool: tools.run,
    signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
  })
  const reply = cleanReply(text)
  return { reply, cards: mentionedCards(reply, tools.found) }
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

  let answer: { reply: string; cards: AssistantCard[] } | null = null
  try {
    if (mode === 'demo') {
      const action = quickAction(input.message)
      const found = action ? [] : (await findCards(input.message)).map(toCard)
      const { text, cards } = demoReply(found, {
        first: !previous.length,
        quick: Boolean(action),
        quickText: action?.demo,
      })
      answer = { reply: text, cards }
    } else answer = await modelAnswer(payload, messages)
    // Про продление — под ответом форма продления (настоящая заявка, менеджер найдёт лицензию).
    if (
      answer &&
      wantsRenewal(input.message) &&
      !answer.cards.some((c) => c.href === RENEW_CARD.href)
    )
      answer = { ...answer, cards: [...answer.cards, { ...RENEW_CARD }] }
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
  })
  if (!saved)
    return { status: 'busy', error: 'Ответ на прошлый вопрос ещё готовится. Подождите немного.' }
  if (!answer) return { status: 'failed', error: FAILED }
  return { status: 'ok', reply: answer.reply, cards: answer.cards, demo: mode === 'demo' }
}
