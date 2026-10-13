/**
 * Реквизиты компании со старого сайта → таблица «подпись — значение» (замечание владельца
 * 13.10.2026: сплошной текст не читается). Текст пришёл строками вразнобой: «БИН 0805…» без
 * двоеточия, «Местонахождение: …», «Банковские реквизиты:» отдельной строкой, «в АО «Банк…»»
 * продолжением строки ИИК. Узнаём подписи по списку; строки до первой подписи — вступление.
 */

/** Подписи реквизитов в порядке документа. Значение — после подписи, двоеточие не обязательно. */
const LABELS = [
  'БИН',
  'ИИН',
  'КБЕ',
  'Местонахождение',
  'Юридический адрес',
  'Фактический адрес',
  'Адрес',
  'Свидетельство о постановке на регистрационный учёт по НДС',
  'Свидетельство о постановке на регистрационный учет по НДС',
  'Дата первичной регистрации',
  'Дата последней перерегистрации',
  'Директор',
  'ИИК',
  'IBAN',
  'БИК',
  'Банк',
  'Телефон',
  'Электронная почта',
  'E-mail',
]

/** Строки-заголовки групп: «Банковские реквизиты:». Пустое «Реквизиты:» — без группы. */
const GROUPS = /^(банковские реквизиты|реквизиты банка)\s*:?$/iu
const SKIP = /^реквизиты\s*:?$/iu

const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const LABEL = new RegExp(`^(${LABELS.map(escapeRe).join('|')})(?=[\\s:.,]|$)[\\s:]*`, 'iu')

/**
 * @param {string} body текст страницы «Реквизиты» из админки
 * @returns {{ intro: string, fields: { label: string, value: string }[] } | null}
 *   null — подписей меньше трёх, это не реквизиты: выводим как обычный текст
 */
export function parseRequisites(body) {
  const lines = String(body ?? '')
    .split('\n')
    .map((line) =>
      line
        .replace(/^#+\s*/, '')
        .replace(/\*\*/g, '')
        .trim(),
    )
    .filter(Boolean)
  const intro = []
  /** @type {{ label: string, value: string }[]} */
  const fields = []
  for (const line of lines) {
    if (SKIP.test(line)) continue
    if (GROUPS.test(line)) {
      fields.push({ label: line.replace(/:$/, '').trim(), value: '' })
      continue
    }
    const match = LABEL.exec(line)
    if (match) {
      const label = (match[1] ?? '').replace('учет', 'учёт')
      fields.push({ label, value: tidy(line.slice(match[0].length)) })
      continue
    }
    const last = fields.at(-1)
    // «в АО «Банк ЦентрКредит»» после ИИК — банк счёта отдельной строкой.
    if (last && /^в\s+(ао|тоо|ао\s)/iu.test(line)) {
      fields.push({ label: 'Банк', value: tidy(line.replace(/^в\s+/iu, '')) })
      continue
    }
    if (last?.value) last.value = `${last.value} ${tidy(line)}`
    else if (last) last.value = tidy(line)
    else intro.push(line)
  }
  if (fields.filter((field) => field.value).length < 3) return null
  return { intro: tidy(intro.join(' ')), fields }
}

/** Хвостовые запятые и кавычки-лапки → ёлочки. */
function tidy(text) {
  return text
    .trim()
    .replace(/[,;]+$/u, '')
    .replace(/"([^"]+)"/gu, '«$1»')
}
