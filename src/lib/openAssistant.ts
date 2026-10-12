/** Событие, которым части сайта открывают чат с Кади (кнопки «Спросить Кади» в содержимом). */
export const OPEN_ASSISTANT_EVENT = 'kadi:open'

/**
 * Открыть чат с Кади. false — консультанта на сайте нет (выключен): тогда вызывающий
 * показывает свою замену (заявку менеджеру).
 */
export function openAssistant(): boolean {
  if (document.documentElement.dataset.assistant !== 'on') return false
  window.dispatchEvent(new Event(OPEN_ASSISTANT_EVENT))
  return true
}
