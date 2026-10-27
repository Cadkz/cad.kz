/** Строка выбора для заявки и сообщения: товар или комплектация и подробности. */
export type MessageLine = { label: string; detail: string | null }

/**
 * Готовый текст для WhatsApp: зачем пишут, страница и выбранное (комплектации, срок, редакция,
 * количество). Один текст у кнопки в окне заявки и у ссылки под кнопками карточки покупки.
 */
export function requestMessage(
  heading: string,
  page: string,
  lines: MessageLine[],
  choices: { title: string; value: string }[],
  quantity: number,
) {
  const list = lines.map((l) => `— ${l.label}${l.detail ? ` (${l.detail})` : ''}`).join('\n')
  const picked = choices
    .filter((c) => c.value)
    .map((c) => `\n${c.title}: ${c.value}`)
    .join('')
  const count = quantity > 1 ? `\nКоличество: ${quantity}` : ''
  return `Здравствуйте! ${heading}: ${page}${list ? `\n${list}` : ''}${picked}${count}`
}
