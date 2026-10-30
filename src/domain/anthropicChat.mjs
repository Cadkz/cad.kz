// @ts-check
// Разговор с моделью Claude (Anthropic Messages API) с инструментами. Сеть передаётся снаружи
// (fetchImpl), поэтому цикл проверяется тестами без интернета. Ключ уходит только в заголовок
// запроса и нигде не печатается.

export const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
export const ANTHROPIC_VERSION = '2023-06-01'
/** Модель по умолчанию: быстрая и недорогая; другую задаёт MODEL_NAME. */
export const ANTHROPIC_DEFAULT_MODEL = 'claude-haiku-5-5'

/** Сколько раз модель может обратиться к инструментам за один ответ. */
const MAX_TOOL_ROUNDS = 6
/** Ответ инструмента в модель — не длиннее этого (защита от огромных списков). */
const MAX_TOOL_RESULT = 6000

export class ModelError extends Error {
  /** @param {string} message @param {number | null} status */
  constructor(message, status = null) {
    super(message)
    this.name = 'ModelError'
    this.status = status
  }
}

/**
 * @typedef {{ name: string, description: string, input_schema: object }} ToolSpec
 * @typedef {{ type: 'text', text: string } | { type: 'tool_use', id: string, name: string, input: unknown }} ContentBlock
 */

/**
 * Ответ модели на историю разговора. Пока модель просит инструменты (stop_reason tool_use),
 * сервер выполняет их и отдаёт результат; на последнем круге инструменты запрещены, чтобы
 * разговор не зациклился.
 * @param {{
 *   fetchImpl: typeof fetch,
 *   apiKey: string,
 *   model: string,
 *   system: string | string[],
 *   messages: { role: 'user' | 'assistant', content: string }[],
 *   tools: ToolSpec[],
 *   runTool: (name: string, input: unknown) => Promise<unknown>,
 *   signal?: AbortSignal,
 *   maxTokens?: number,
 * }} options
 * @returns {Promise<{ text: string, toolCalls: number }>}
 */
export async function anthropicReply(options) {
  const { fetchImpl, apiKey, model, tools, runTool, signal, maxTokens = 1500 } = options
  // Правила частями: первая (постоянная) кешируется у Anthropic — дешевле и быстрее повторные
  // запросы; вторая — состояние разговора, меняется каждый раз.
  const system = Array.isArray(options.system)
    ? options.system.map((text, index) => ({
        type: 'text',
        text,
        ...(index === 0 ? { cache_control: { type: 'ephemeral' } } : {}),
      }))
    : options.system
  /** @type {{ role: 'user' | 'assistant', content: string | object[] }[]} */
  const messages = options.messages.map((m) => ({ role: m.role, content: m.content }))
  let toolCalls = 0
  // Отчёт «Проверки Кадди» 30.10.2026: после инструментов (чаще всего передачи менеджеру) модель
  // иногда заканчивает ход без текста — клиент видел «Модель не ответила». Тогда один раз
  // просим ответить клиенту текстом, уже без инструментов.
  let nudged = false
  // Отчёт «Проверки Кадди» 30.10.2026 (второй прогон): модель часто пишет суть ответа в том же
  // ходе, что и вызов инструмента (передача менеджеру, карточка), а после результата — только
  // «Карточка ниже». Раньше клиент видел лишь последний кусок; теперь текст всех ходов собирается.
  /** @type {string[]} */
  const earlier = []
  // Ещё один круг сверх лимита — для просьбы ответить текстом, если последний ход вышел пустым
  // (раньше это давало «Модель не закончила ответ» на вопросе про GEO5).
  for (let round = 0; round <= MAX_TOOL_ROUNDS + 1; round++) {
    const last = round >= MAX_TOOL_ROUNDS || nudged
    const body = {
      model,
      max_tokens: maxTokens,
      system,
      messages,
      tools,
      ...(last ? { tool_choice: { type: 'none' } } : {}),
    }
    const response = await fetchImpl(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
      signal,
    })
    if (!response.ok)
      throw new ModelError(`Модель ответила ошибкой ${response.status}`, response.status)
    const data = /** @type {{ content?: ContentBlock[], stop_reason?: string }} */ (
      await response.json()
    )
    const content = Array.isArray(data.content) ? data.content : []
    const uses = content.filter(
      /** @returns {block is Extract<ContentBlock, { type: 'tool_use' }>} */
      (block) => block?.type === 'tool_use',
    )
    if (data.stop_reason !== 'tool_use' || !uses.length || last) {
      const own = textOf(content)
      if (!own && !nudged && round <= MAX_TOOL_ROUNDS) {
        nudged = true
        askForText(messages, content)
        continue
      }
      const final = data.stop_reason === 'max_tokens' ? wholeSentences(own) : own
      const text = joinReply(earlier, final)
      if (!text) throw new ModelError('Модель вернула пустой ответ')
      return { text, toolCalls }
    }
    const said = withoutPreamble(textOf(content))
    if (said) earlier.push(said)
    messages.push({ role: 'assistant', content })
    /** @type {object[]} */
    const results = []
    for (const use of uses) {
      toolCalls++
      let result
      try {
        result = await runTool(use.name, use.input)
      } catch {
        result = { error: 'Инструмент недоступен, попробуйте без него' }
      }
      const json = JSON.stringify(result) ?? 'null'
      results.push({
        type: 'tool_result',
        tool_use_id: use.id,
        content: json.length > MAX_TOOL_RESULT ? `${json.slice(0, MAX_TOOL_RESULT)}…` : json,
      })
    }
    messages.push({ role: 'user', content: results })
  }
  throw new ModelError('Модель не закончила ответ')
}

/** Текст блоков хода модели одной строкой. @param {ContentBlock[]} content */
function textOf(content) {
  return content
    .filter((block) => block?.type === 'text')
    .map((block) => /** @type {{ text: string }} */ (block).text)
    .join('\n')
    .trim()
}

/** Служебные фразы перед инструментом («Проверю прайс.», «Ищу.») клиенту не нужны. */
const PREAMBLE =
  /^(сейчас\s+)?(ищу|поищу|проверю|посмотрю|сверю|найду|уточню\s+(в|по)\s+(прайс|каталог)\S*|минуту|секунду|давайте\s+(проверю|посмотрю|найду))(?![а-яё])/i

/**
 * Текст хода с инструментом без служебных предложений.
 * @param {string} text
 */
export function withoutPreamble(text) {
  return text
    .split('\n')
    .map((line) =>
      line
        .split(/(?<=[.!?…])\s+/)
        .filter((sentence) => !PREAMBLE.test(sentence.trim()))
        .join(' ')
        .trim(),
    )
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Сравнение без регистра, пробелов и знаков: повтор того же текста не склеивается. */
function squashText(/** @type {string} */ text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
}

/**
 * Ответ клиенту из текста ходов с инструментами и последнего хода. Кусок, который модель
 * повторила в последнем ходе, второй раз не добавляется.
 * @param {string[]} earlier
 * @param {string} final
 */
export function joinReply(earlier, final) {
  const parts = /** @type {string[]} */ ([])
  for (const piece of [...earlier, final]) {
    const key = squashText(piece)
    if (!key) continue
    const dup = parts.findIndex((part) => squashText(part).includes(key))
    if (dup >= 0) continue
    // Новый кусок целиком содержит прежний — оставляем только новый.
    const covered = parts.findIndex((part) => key.includes(squashText(part)))
    if (covered >= 0) parts.splice(covered, 1)
    parts.push(piece)
  }
  return parts.join('\n\n').trim()
}

const TEXT_NUDGE = 'Ответь клиенту текстом по правилам, инструменты больше не вызывай.'

/**
 * Пустой ход модели: её блоки (если есть) — в историю, затем просьба ответить текстом. Роли в
 * истории чередуются, поэтому просьба дописывается к последнему сообщению клиента, если ход
 * модели пустой.
 * @param {{ role: 'user' | 'assistant', content: string | object[] }[]} messages
 * @param {ContentBlock[]} content
 */
function askForText(messages, content) {
  // tool_use без ответа инструмента API не примет — такие блоки не возвращаем.
  const kept = content.filter((block) => block?.type === 'text')
  if (kept.length) {
    messages.push({ role: 'assistant', content: kept })
    messages.push({ role: 'user', content: TEXT_NUDGE })
    return
  }
  const lastMessage = messages.at(-1)
  if (!lastMessage || lastMessage.role !== 'user') {
    messages.push({ role: 'user', content: TEXT_NUDGE })
    return
  }
  lastMessage.content = Array.isArray(lastMessage.content)
    ? [...lastMessage.content, { type: 'text', text: TEXT_NUDGE }]
    : `${lastMessage.content}\n\n${TEXT_NUDGE}`
}

/**
 * Ответ оборвался на лимите длины (в отчёте 16.10.2026 — «…и подготовлю», «Толық нұсқада
 * архитектурал»): оставляем целые предложения, а не обрывок слова.
 * @param {string} text
 */
export function wholeSentences(text) {
  const end = Math.max(...['.', '!', '?', '…'].map((mark) => text.lastIndexOf(mark)))
  return end > 0 ? text.slice(0, end + 1).trim() : text
}
