/** Событие, которым части сайта открывают чат с Юки (кнопки «Спросить Юки» в содержимом). */
export const OPEN_ASSISTANT_EVENT = 'yuki:open'

/**
 * Открыть чат с Юки. false — консультанта на сайте нет (выключен): тогда вызывающий
 * показывает свою замену (заявку менеджеру).
 */
export function openAssistant(): boolean {
  if (document.documentElement.dataset.assistant !== 'on') return false
  window.dispatchEvent(new Event(OPEN_ASSISTANT_EVENT))
  return true
}
