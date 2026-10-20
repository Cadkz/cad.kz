import type { Payload } from 'payload'
import { ModelError } from '@/domain/anthropicChat.mjs'
import { validateChat } from '@/domain/assistant.mjs'
import { checkReply, describeCall, parseHistory } from '@/domain/assistantCheck.mjs'
import { assistantMode, modelSettings } from './provider'
import { answerMessages, type ToolCall } from './service'

/** Режим консультанта словами — для страницы проверки. */
export function assistantStatus() {
  const mode = assistantMode()
  if (mode === 'model') return { mode, label: `Модель подключена: ${modelSettings().model}` }
  if (mode === 'demo')
    return { mode, label: 'Демо-режим: модель не подключена, Кадди ищет по каталогу' }
  return { mode: 'off' as const, label: 'Консультант выключен' }
}

export type CheckResult =
  | {
      ok: true
      reply: string
      cards: { title: string; href: string }[]
      replies: string[]
      calls: string[]
      flags: ReturnType<typeof checkReply>
      ms: number
    }
  | { ok: false; error: string; status: number }

/**
 * Один вопрос со страницы «Проверка Кадди»: тот же ответ, что получил бы клиент (правила, инструменты,
 * цены сервера), но разговор не сохраняется и в журнал «Диалоги консультанта» не попадает.
 * history — прошлые шаги разговора («основания → обычные откосы»): Кадди отвечает, помня их.
 */
export async function checkQuestion(
  payload: Payload,
  question: unknown,
  history?: unknown,
): Promise<CheckResult> {
  const mode = assistantMode()
  if (!mode) return { ok: false, error: 'Консультант выключен (MODEL_PROVIDER)', status: 409 }
  const checked = validateChat({ conversationId: crypto.randomUUID(), message: question })
  if (!checked.ok) return { ok: false, error: checked.error, status: 400 }
  const previous = parseHistory(history)
  if (!previous) return { ok: false, error: 'Прошлые шаги разговора не того вида', status: 400 }
  const at = new Date().toISOString()
  const calls: ToolCall[] = []
  const started = Date.now()
  try {
    const answer = await answerMessages(
      payload,
      mode,
      [
        ...previous.flatMap((turn) => [
          { role: 'user' as const, content: turn.question, at },
          { role: 'assistant' as const, content: turn.reply, at },
        ]),
        { role: 'user', content: checked.value.message, at },
      ],
      { onTool: (call) => calls.push(call) },
    )
    return {
      ok: true,
      reply: answer.reply,
      cards: answer.cards.map(({ title, href }) => ({ title, href })),
      replies: answer.replies,
      calls: calls.map(describeCall),
      flags: checkReply(answer.reply, calls),
      ms: Date.now() - started,
    }
  } catch (error) {
    const status = error instanceof ModelError ? error.status : null
    console.error(
      'Проверка Кадди: модель не ответила',
      error instanceof Error ? error.name : 'Error',
      status,
    )
    return {
      ok: false,
      status: 502,
      error:
        status === 401
          ? 'Модель отклонила ключ (401): проверьте MODEL_API_KEY в Vercel'
          : status === 429
            ? 'Модель просит подождать (429): лимит запросов или расходов'
            : `Модель не ответила${status ? ` (код ${status})` : ''}`,
    }
  }
}
