/** Событие, которым части сайта открывают чат с Кадди (кнопки «Спросить Кадди» в содержимом). */
export const OPEN_ASSISTANT_EVENT = 'kaddi:open'

/** Что передаётся с событием: вопрос, который сразу уходит Кадди (например, запрос из поиска). */
export type OpenAssistantDetail = { message?: string }

/**
 * Открыть чат с Кадди; message — сразу задать этот вопрос. false — консультанта на сайте нет
 * (выключен): тогда вызывающий показывает свою замену (заявку менеджеру).
 */
export function openAssistant(message?: string): boolean {
  if (document.documentElement.dataset.assistant !== 'on') return false
  window.dispatchEvent(
    new CustomEvent<OpenAssistantDetail>(OPEN_ASSISTANT_EVENT, { detail: { message } }),
  )
  return true
}

/** Консультант на сайте работает (кнопки «Спросить Кадди» без него не показываются). */
export function assistantOn() {
  return document.documentElement.dataset.assistant === 'on'
}
