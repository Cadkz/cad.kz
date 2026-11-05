// @ts-check
/** Отбор справки: предмет вопроса, затем намерение, затем релевантность текста. Без сети. */
const normalize = (/** @type {string} */ text) => text.toLowerCase().replaceAll('ё', 'е')
const STOP = new Set(
  'для что как чем это или при нужен нужна нужно если есть можно какой какая какие прогр взять полны фулл разли отлич пакет лучше подск помог меня вас мне про еще хочу будет будет ли все справ катал вопрос ответ клиент'.split(
    ' ',
  ),
)

/** Латинские названия и номера моделей не обрезаем: TX-3200 и TX-4200 — разные товары. */
function tokens(/** @type {string} */ text) {
  return new Set(
    (normalize(text).match(/[a-zа-я0-9]+/g) ?? [])
      .filter((word) => word.length >= 2)
      .map((word) =>
        /^скан/.test(word) ? 'скан' : /^[а-я]+$/.test(word) ? word.slice(0, 5) : word,
      )
      .filter((word) => !STOP.has(word)),
  )
}

const EXTRA_ALIASES = {
  плоттер: ['плоттер', 'плотер'],
  сканер: ['сканер'],
  'Рабочая станция компьютер': ['компьютер', 'рабочая станция', 'рабочую станцию'],
  plotWAVE: ['plotwave', 'плотвейв', 'plot wave'],
  colorWAVE: ['colorwave', 'колорвейв', 'color wave'],
  imagePROGRAF: ['imageprograf', 'имиджпрограф', 'image prograf'],
  WideTEK: ['widetek', 'вайдтек'],
  Artec: ['artec', 'артек', '3d-сканер', '3д сканер', '3d сканер'],
  Chaos: ['chaos', 'v-ray', 'vray', 'врей', 'вирей'],
  'Model Studio CS': ['model studio', 'модел студио'],
  'ЛИРА-FEM': ['лиры', 'лире', 'лиру', 'лирой'],
  'АСКОН КОМПАС': ['компас', 'аскон'],
}

/** @param {string} query @param {Record<string, string[]>} aliases */
function subjects(query, aliases) {
  const lower = normalize(query)
  const names = new Set()
  for (const [name, words] of [...Object.entries(aliases), ...Object.entries(EXTRA_ALIASES)]) {
    if (
      words.some((word) => {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        return new RegExp(
          `(?<![\\p{L}\\p{N}])${escaped}${word.length <= 3 ? '(?![\\p{L}\\p{N}])' : ''}`,
          'u',
        ).test(lower)
      })
    )
      names.add(name)
  }
  if (documentScanner(lower)) names.add('сканер')
  if (names.has('Artec')) names.delete('сканер')
  return [...names]
}

/** Категория определяется задачей, без привязки к одному производителю. */
function documentScanner(/** @type {string} */ text) {
  return (
    /скан/.test(text) &&
    /чертеж|документ|широкоформат|[aа][0-4](?!\d)/.test(text) &&
    !/3[dд]|трехмер/.test(text)
  )
}

const INTENTS = [
  { query: /ремонт|сломал|сломан|почин/, fact: /ремонт|сервисн|слом|неисправ/ },
  { query: /аренд/, fact: /аренд/ },
  {
    query: /без\s+интернет|офлайн|оффлайн|offline|интернет.*пропал|нет\s+интернета/,
    fact: /интернет|офлайн|оффлайн|offline|закрыт.{0,15}сет/,
  },
]

/** @template {{product: string, text: string}} T
 * @param {T[]} facts @param {string} query @param {Record<string, string[]>} aliases
 * @param {number} [limit]
 */
export function rankKnowledge(facts, query, aliases, limit = 16) {
  const names = subjects(query, aliases)
  const genericNames = new Set([
    'office',
    'studio',
    'cs',
    'fem',
    '3d',
    'max',
    'collection',
    'lt',
    'kz',
  ])
  const scope = names.map(
    (name) => new Set([...tokens(name)].filter((word) => !genericNames.has(word))),
  )
  const asked = tokens(`${query} ${names.join(' ')}`)
  if (!asked.size || limit <= 0) return []
  const intents = INTENTS.filter((intent) => intent.query.test(normalize(query)))
  const seen = new Set()
  const docs = facts
    .filter((fact) => {
      const key = normalize(fact.text).replace(/\s+/g, ' ').trim()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((fact, index) => ({ fact, index, title: tokens(fact.product), body: tokens(fact.text) }))
  const frequencies = new Map()
  for (const doc of docs)
    for (const word of new Set([...doc.title, ...doc.body]))
      frequencies.set(word, (frequencies.get(word) ?? 0) + 1)
  const ranked = docs
    .map((doc) => {
      const text = normalize(`${doc.fact.product} ${doc.fact.text}`)
      if (
        documentScanner(normalize(query)) &&
        (!/скан/.test(text) ||
          /plotwave|colorwave|imageprograf|artec|плоттер/i.test(doc.fact.product))
      )
        return { ...doc, score: 0 }
      if (intents.length && !intents.some((intent) => intent.fact.test(text)))
        return { ...doc, score: 0 }
      // Явно названный продукт/тип сканера не заменяем совпадением слова «интернет» у другого товара.
      if (
        scope.length &&
        !scope.some((words) => [...words].some((word) => doc.title.has(word) || doc.body.has(word)))
      )
        return { ...doc, score: 0 }
      let score = 0
      for (const word of asked) {
        const weight = 1 + Math.log(1 + docs.length / (1 + (frequencies.get(word) ?? 0)))
        if (doc.title.has(word)) score += 3 * weight
        if (doc.body.has(word)) score += weight
      }
      return { ...doc, score }
    })
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
  const threshold = Math.max(1.5, (ranked[0]?.score ?? 0) * 0.2)
  let chars = 0
  return ranked
    .filter((doc) => doc.score >= threshold)
    .slice(0, limit)
    .filter((doc) => {
      const size = doc.fact.product.length + doc.fact.text.length
      if (chars + size > 16000) return false
      chars += size
      return true
    })
    .map((doc) => doc.fact)
}

/** @template {{product: string, text: string}} T
 * @param {T[]} facts
 * @param {{role: string, content: string}[]} messages
 * @param {{title: string, path: string} | null | undefined} page
 * @param {Record<string, string[]>} aliases
 */
export function selectKnowledge(facts, messages, page, aliases) {
  const general = facts.filter((fact) => normalize(fact.product).trim() === 'все')
  const topical = facts.filter((fact) => normalize(fact.product).trim() !== 'все')
  const lastIndex = messages.findLastIndex((message) => message.role === 'user')
  const question = messages[lastIndex]?.content ?? ''
  let context = ''
  // История добавляет только название предмета, не старые вопросы и не догадки из ответа модели.
  if (!subjects(question, aliases).length) {
    const recent = messages.slice(Math.max(0, lastIndex - 6), lastIndex).reverse()
    // Название, которое сообщил клиент, важнее вариантов, перечисленных ассистентом.
    for (const message of [
      ...recent.filter((item) => item.role === 'user'),
      ...recent.filter((item) => item.role === 'assistant'),
    ]) {
      const names = subjects(message.content, aliases)
      if (names.length) {
        const models = message.content.match(/[a-zа-я]*-?\d{2,}[a-zа-я]*/gi) ?? []
        context = [...names, ...models].join(' ')
        break
      }
    }
    if (!context && page) context = subjects(`${page.title} ${page.path}`, aliases).join(' ')
  }
  const query = `${question} ${context}`.trim()
  return { general, topical: rankKnowledge(topical, query, aliases), query }
}
