import type { Payload } from 'payload'
import { CONNECTOR_ID, lineMessages, readSendResult } from '@/domain/openLine.mjs'
import { findConversation, updateConversation } from '../assistant/conversation'
import { lineReady, loadOpenLine, openLineClient, rememberLineError, updateOpenLine } from './store'

/** Открытая линия подключена: разговоры с Кадди идут в Битрикс24. */
export async function openLineOn(payload: Payload) {
  try {
    return lineReady((await loadOpenLine(payload))?.state)
  } catch (error) {
    // Нет таблицы или база недоступна — чат работает и без линии.
    console.error('Открытая линия: состояние не прочиталось', error)
    return false
  }
}

/**
 * Отправляет в открытую линию ещё не отправленные сообщения разговора: вопрос клиента и ответ
 * Кадди. Вызывается после ответа клиенту (after), поэтому не задерживает чат. Не дошло — останется
 * неотправленным и уйдёт со следующим сообщением; ошибка видна на странице «Битрикс24».
 */
export async function mirrorToLine(
  payload: Payload,
  key: string,
  page: { siteUrl: string; pageUrl?: string },
) {
  try {
    const stored = await loadOpenLine(payload)
    const state = stored?.state
    if (!lineReady(state)) return
    const conversation = await findConversation(payload, key)
    if (!conversation) return
    const { snapshot } = conversation
    const messages = lineMessages({
      chatId: key,
      messages: snapshot.messages,
      from: snapshot.line?.sent ?? 0,
      siteUrl: page.siteUrl,
      pageUrl: page.pageUrl,
      name: snapshot.handoff?.name,
    })
    const sent = snapshot.messages.length
    if (messages.length) {
      const client = openLineClient(payload, state)
      const result = readSendResult(
        await client.call('imconnector.send.messages', {
          CONNECTOR: CONNECTOR_ID,
          LINE: state.line.id,
          MESSAGES: messages,
        }),
      )
      if (!result.ok) throw new Error(`Битрикс24 не принял сообщения: ${result.error}`)
      await updateConversation(payload, key, (latest) => {
        const line = latest.snapshot.line
        return {
          ...latest.snapshot,
          line: {
            ...line,
            sent: Math.max(line?.sent ?? 0, sent),
            ...(result.chatId ? { chatId: result.chatId } : {}),
          },
        }
      })
      await updateOpenLine(payload, (current) =>
        current ? { ...current, lastSentAt: new Date().toISOString(), lastError: undefined } : null,
      )
    } else if ((snapshot.line?.sent ?? 0) < sent)
      // Новых реплик для линии нет (только ответы менеджера) — просто отмечаем, что всё учтено.
      await updateConversation(payload, key, (latest) => ({
        ...latest.snapshot,
        line: { ...latest.snapshot.line, sent: Math.max(latest.snapshot.line?.sent ?? 0, sent) },
      }))
  } catch (error) {
    await rememberLineError(payload, error)
  }
}
