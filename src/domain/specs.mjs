// Характеристики товара для показа (замечание владельца 23.10.2026): исследование оборудования
// записало их как «Группа — Название», а второй проход добавил английские дубли с единицами
// mm, m, kg и ошибочной группой («Точность — Масса», «Точность — Вес: up to 18 million points/s»).
// Здесь — чистка при показе: в базе ничего не меняется, правки в админке сохраняются.

/** @typedef {{ name: string, value: string }} Property */
/** @typedef {{ group: string | null, name: string, value: string }} Spec */

const SEPARATOR = ' — '

/** «Точность — Точность 3D» → группа «Точность», название «Точность 3D». */
export function splitSpecName(name) {
  const at = name.indexOf(SEPARATOR)
  if (at < 0) return { group: null, name: name.trim() }
  return { group: name.slice(0, at).trim() || null, name: name.slice(at + SEPARATOR.length).trim() }
}

const UNITS = [
  [/\bmillion points\/s\b/gi, 'млн точек/с'],
  [/\bpoints\/s\b/gi, 'точек/с'],
  [/\bmm\/s\b/gi, 'мм/с'],
  [/\bm\/min\b/gi, 'м/мин'],
  [/(\d)\s*s\b/g, '$1 с'],
  [/^<\s*/, 'менее '],
  [/\bmm\b/gi, 'мм'],
  [/\bcm\b/gi, 'см'],
  [/\bkg\b/gi, 'кг'],
  [/\bm\b/g, 'м'],
  [/(\d)\s*C\b/g, '$1 °C'],
  [/(\d+)-bit color\b/gi, '$1 бит цвет'],
  [/(\d+)-bit grayscale\b/gi, '$1 бит оттенки серого'],
  [/(\d+)-bit RGB\b/gi, '$1 бит RGB'],
]

/** Английские единицы и слова — по-русски, десятичная точка — запятая, «x» между числами — «×». */
export function normalizeSpecValue(value) {
  let text = String(value ?? '').trim()
  text = text.replace(/^up to\s+/i, 'до ')
  text = text.replace(/(\d)\s+to\s+(\d)/gi, '$1 – $2')
  for (const [pattern, replacement] of UNITS) text = text.replace(pattern, replacement)
  text = text.replace(/(\d)\.(\d)/g, '$1,$2')
  text = text.replace(/(\d)\s*[xх]\s*(\d)/gi, '$1 × $2')
  text = text.replace(/(\d)-(\d)/g, '$1–$2')
  return text.replace(/\s{2,}/g, ' ')
}

/** Ошибки второго прохода исследования: что на самом деле значит строка. */
function fixMeaning(spec) {
  const name = spec.name.toLowerCase()
  if (name === 'вес' && /точек\/с/.test(spec.value))
    return { ...spec, group: 'Сканирование', name: 'Скорость захвата' }
  if (name === 'масса' || name === 'вес') return { ...spec, group: 'Конструкция' }
  if (name === 'поле зрения') return { ...spec, group: 'Сканирование' }
  return spec
}

/** Значение без «до» и пробелов — чтобы «до 0,1 мм» и «0,1 мм» считались одним. */
function sameValue(a, b) {
  const plain = (text) =>
    text
      .toLowerCase()
      .replace(/^до\s+/, '')
      .replace(/\s+/g, '')
  return plain(a) === plain(b)
}

/** «Точность 3D» и «Точность 3D-точки» — одно и то же, если и значения совпали. */
function related(a, b) {
  const x = a.toLowerCase()
  const y = b.toLowerCase()
  return x === y || x.startsWith(`${y}-`) || y.startsWith(`${x}-`)
}

/**
 * Характеристики для показа: группа и название отдельно, значения по-русски, повторы убраны.
 * То же название с тем же значением — повтор. То же название в той же группе с другим
 * значением — те же данные в других единицах («36 дюйм / 914 мм»). То же название в другой
 * группе — английский дубль второго прохода, оставляем первое (русское).
 * @param {Property[]} properties
 * @returns {Spec[]}
 */
export function cleanSpecs(properties) {
  /** @type {Spec[]} */
  const result = []
  for (const property of properties) {
    const value = normalizeSpecValue(property.value)
    if (!value) continue
    const spec = fixMeaning({ ...splitSpecName(property.name), value })
    if (!spec.name) continue
    const twin = result.find((item) => related(item.name, spec.name))
    if (twin && sameValue(twin.value, spec.value)) continue
    const namesake = result.find((item) => item.name.toLowerCase() === spec.name.toLowerCase())
    if (namesake && namesake.group === spec.group) {
      namesake.value = `${namesake.value} / ${spec.value}`
      continue
    }
    if (namesake) continue
    result.push(spec)
  }
  return result
}

/**
 * Характеристики по группам в порядке первого появления; без группы — в начале.
 * @param {Spec[]} specs
 * @returns {{ group: string | null, items: Spec[] }[]}
 */
export function groupSpecs(specs) {
  /** @type {Map<string | null, Spec[]>} */
  const groups = new Map()
  for (const spec of specs) {
    const list = groups.get(spec.group) ?? []
    list.push(spec)
    groups.set(spec.group, list)
  }
  const ordered = [...groups.entries()].map(([group, items]) => ({ group, items }))
  return ordered.sort((a, b) => Number(a.group !== null) - Number(b.group !== null))
}
