import { normalizeSpecValue } from './specs.mjs'

// Главные факты для сцены первого экрана оборудования (замечание владельца 23.10.2026): не первые
// попавшиеся характеристики, а то, по чему выбирают в этой категории. Берём из фильтров
// исследования (src/domain/equipmentResearch.json) — там значения уже приведены к одному виду,
// а скорость — из характеристик (значения приводятся к русскому виду, как в таблице). Нет данных — факт пропускаем, добираем общими.

/** @typedef {{ name: string, value: string, icon?: 'color' | 'mono' }} Fact */
/** @typedef {{ group: string | null, name: string, value: string }} Spec */
/** @typedef {Record<string, string[]>} Filters */

/** Подпись у фото читается одной-двумя строками: длиннее — не показываем. */
export const FACT_MAX_LENGTH = 32
const LIMIT = 3
/** У плоттеров пять фактов, как у Canon (владелец 30.10.2026). */
const LIMITS = { plotters: 5 }

/** @param {Filters} filters @param {string} key */
function filter(filters, key) {
  const values = filters[key] ?? []
  return values.length ? values.join(', ') : null
}

/** @param {Spec[]} specs @param {RegExp} pattern */
function specValue(specs, pattern) {
  return specs.find((spec) => pattern.test(spec.value))?.value ?? null
}

/** После «до»: «до 3,3 листа», «до 1 листа», «до 10 листов». */
function sheets(/** @type {string} */ number) {
  if (/[,.]/.test(number)) return 'листа'
  const n = Number(number)
  return n % 10 === 1 && n % 100 !== 11 ? 'листа' : 'листов'
}

/**
 * Плоттер: скорость как у Canon — «до 10 листов A1 в минуту»; у colorWAVE — D-формат в час.
 * @param {Spec[]} specs
 */
function printSpeed(specs) {
  const spec = specs.find((item) => /лист\/(мин|час)/.test(item.value))
  if (!spec) return null
  const number = /(\d+(?:[,.]\d+)?)/.exec(spec.value)?.[1]
  if (!number) return spec.value
  const per = /час/.test(spec.value) ? 'в час' : 'в минуту'
  const format = /\bA0\b/.test(spec.name) ? ' A0' : /\bA1\b/.test(spec.name) ? ' A1' : ''
  return `до ${number} ${sheets(number)}${format} ${per}`
}

/**
 * Ширина рулона: «914 мм (36″)». В характеристиках ширина бывает склеена («36 дюйм / 914 мм»)
 * или есть только в фильтре («36" (A0)») — тогда миллиметры считаем из дюймов.
 * @param {Spec[]} specs @param {Filters} filters
 */
function rollWidth(specs, filters) {
  const text = specs
    .filter((item) => /^максимальная ширина/i.test(item.name))
    .map((item) => item.value)
    .join(' / ')
  const mm = /(\d{3,4})\s*мм/.exec(text)?.[1]
  const inches =
    /(\d{2})\s*(дюйм|")/.exec(text)?.[1] ?? /(\d{2})"/.exec(filter(filters, 'width') ?? '')?.[1]
  const millimetres = mm ?? (inches ? String(Math.round(Number(inches) * 25.4)) : null)
  if (!millimetres) return filter(filters, 'width')
  return inches ? `${millimetres} мм (${inches}″)` : `${millimetres} мм`
}

/**
 * Максимальное разрешение печати — не сканера (у МФУ в характеристиках оба).
 * @param {Spec[]} specs
 */
function printResolution(specs) {
  const spec = specs.find(
    (item) => /^разрешение( печати)?$/i.test(item.name) && !/скан/i.test(item.group ?? ''),
  )
  if (!spec) return null
  const value = spec.value.replace(/\s*[xх×]\s*/gi, ' × ')
  return /dpi/i.test(value) ? `до ${value}` : `до ${value} dpi`
}

/** Рулоны: «2» → «2 рулона», «до 6» → «до 6 рулонов», «1+1 опция» → «1, второй — опция». */
function rolls(/** @type {string | null} */ value) {
  if (!value) return null
  if (/^1\s*\+\s*1/.test(value)) return '1 рулон, второй — опция'
  const last = /(\d+)\D*$/.exec(value)?.[1]
  if (!last) return value
  const n = Number(last)
  // После «до» и «или» — «рулонов»: «до 4 рулонов», «4 или 6 рулонов».
  const word = /^до|или/.test(value) || n > 4 ? 'рулонов' : n === 1 ? 'рулон' : 'рулона'
  return `${value} ${word}`
}

/** Цветность словами и значком: цветная или чёрно-белая печать. */
function colorFact(/** @type {string | null} */ value) {
  if (!value) return null
  const color = /цветн/i.test(value)
  return {
    name: 'Цветность',
    value: color ? 'Цветная' : 'Чёрно-белая',
    icon: color ? 'color' : 'mono',
  }
}

/**
 * Размер объектов 3D-сканера одним диапазоном: «M (20–50 см)», «L (50–200 см)» → «20 см – 2 м».
 * Классы — из фильтра исследования (src/domain/equipmentResearch.json).
 */
const SIZE_CLASSES = { XS: [0, 5], S: [5, 20], M: [20, 50], L: [50, 200], XL: [200, null] }

/** @param {number} cm */
const length = (cm) => (cm >= 100 ? `${String(cm / 100).replace('.', ',')} м` : `${cm} см`)

/** @param {Filters} filters */
export function objectSize(filters) {
  const classes = (filters.object_size ?? []).map(
    (value) => /^(X{0,2}[SML]|XXL)\b/.exec(value)?.[1],
  )
  const rooms = classes.includes('XXL')
  const ranges = classes.flatMap((key) =>
    key && key in SIZE_CLASSES
      ? [SIZE_CLASSES[/** @type {keyof typeof SIZE_CLASSES} */ (key)]]
      : [],
  )
  if (!ranges.length) return rooms ? 'Помещения и здания' : null
  const low = Math.min(...ranges.map(([from]) => from ?? 0))
  const highs = ranges.map(([, to]) => to)
  const open = highs.includes(null)
  const high = Math.max(...highs.map((to) => to ?? 0))
  if (rooms) return `от ${length(low)}, помещения и здания`
  if (open) return `от ${length(low)} и крупнее`
  if (low === 0) return `до ${length(high)}`
  // «20–50 см», но «20 см – 2 м»: одна единица — один раз.
  if (high < 100) return `${low}–${high} см`
  return `${length(low)} – ${length(high)}`
}

/** Сканер: протяжный — дюймы или метры в секунду/минуту, планшетный — время кадра. */
function scanSpeed(specs) {
  return (
    specValue(specs, /(дюйм|мм|м)\/(с|мин)/) ??
    specs.find(
      (spec) => /время|кадр|скорость/i.test(spec.name) && /\d\s*с(?![а-яё])/i.test(spec.value),
    )?.value ??
    null
  )
}

/** @type {Record<string, (filters: Filters, specs: Spec[]) => (Fact | null)[]>} */
const BY_CATEGORY = {
  // Как у Canon на странице модели (замечание владельца 30.10.2026): скорость, цветность значком,
  // ширина рулона, максимальное разрешение, сколько рулонов.
  plotters: (filters, specs) => [
    fact('Скорость печати', printSpeed(specs)),
    colorFact(filter(filters, 'color')),
    fact('Ширина рулона', rollWidth(specs, filters)),
    fact('Разрешение', printResolution(specs)),
    fact('Подача', rolls(filter(filters, 'rolls'))),
  ],
  'wide-scanners': (filters, specs) => [
    fact('Ширина сканирования', filter(filters, 'width')),
    fact('Скорость', scanSpeed(specs)),
    fact(
      'Конструкция',
      [filter(filters, 'form'), filter(filters, 'sensor')].filter(Boolean).join(', '),
    ),
    fact('Разрешение', filter(filters, 'resolution')),
  ],
  // Третьим — для каких по размеру предметов (владелец 30.10.2026), технология — если размера нет.
  '3d-scanners': (filters) => [
    fact('Точность', withUpTo(filter(filters, 'accuracy'))),
    fact('Подключение', wireless(filter(filters, 'wireless'))),
    fact('Размер предметов', objectSize(filters)),
    fact('Технология', filter(filters, 'technology')),
  ],
  consumables: (filters) => [
    fact('Для моделей', filter(filters, 'compatible')),
    fact('Цвет', filter(filters, 'color')),
    fact('Тип', filter(filters, 'type')),
  ],
}

/** @param {string} name @param {string | null | undefined} value @returns {Fact | null} */
function fact(name, value) {
  return value ? { name, value: normalizeSpecValue(value) } : null
}

/** @param {string | null} value */
function withUpTo(value) {
  return value && !/^(до\s|±)/i.test(value) ? `до ${value}` : value
}

/** @param {string | null} value */
function wireless(value) {
  if (value === 'Да') return 'Беспроводной'
  if (value === 'Нет') return 'Проводной'
  return null
}

/**
 * До трёх главных фактов: сначала правила категории, потом — первые короткие характеристики.
 * @param {{ category: string, filters: Filters } | null} research
 * @param {Spec[]} specs очищенные характеристики (cleanSpecs)
 * @returns {Fact[]}
 */
export function keyFacts(research, specs) {
  const rule = research ? BY_CATEGORY[research.category] : undefined
  const preferred = rule ? rule(research?.filters ?? {}, specs) : []
  // Производитель и название уже над заголовком — в фактах не повторяем (владелец 26.10.2026).
  const general = specs
    .filter((spec) => !/^(производитель|разработчик|программа|бренд|модель)$/i.test(spec.name))
    .map((spec) => ({ name: spec.name, value: spec.value }))
  const limit = LIMITS[/** @type {keyof typeof LIMITS} */ (research?.category ?? '')] ?? LIMIT
  /** @type {Fact[]} */
  const result = []
  for (const item of [...preferred, ...(rule ? [] : general)]) {
    if (!item || item.value.length > FACT_MAX_LENGTH) continue
    if (result.some((entry) => entry.name === item.name)) continue
    result.push(item)
    if (result.length === limit) break
  }
  return result
}

const SYSTEMS = ['Windows', 'macOS', 'Linux', 'Android', 'iOS', 'Браузер']

/** Длинное описание ОС сокращаем до названий систем: «Windows 10/11 64-bit, …» → «Windows». */
function shortSystem(/** @type {string} */ value) {
  if (value.length <= FACT_MAX_LENGTH) return value
  const found = SYSTEMS.filter((name) => new RegExp(name, 'i').test(value))
  return found.length ? found.join(', ') : null
}

/** Тип лицензии простыми словами: навсегда или подписка (по характеристике и комплектациям). */
export function licenseType(/** @type {(string | null | undefined)[]} */ values) {
  const text = values.filter(Boolean).join(' ').toLowerCase()
  const subscription = /подпис|год|мес|аренд/.test(text)
  const perpetual = /бессроч|навсегда|постоян|perpetual/.test(text)
  if (subscription && perpetual) return 'Подписка или бессрочная'
  if (perpetual) return 'Бессрочная'
  if (subscription) return 'Подписка'
  return null
}

/**
 * Три факта программы (решение владельца 26.10.2026): операционная система, язык интерфейса,
 * тип лицензии — запустится ли на компьютере, на каком языке, навсегда или подписка.
 * «Разработчик» не показываем — он уже над названием.
 * @param {Spec[]} specs
 * @param {(string | null | undefined)[]} licenses условия лицензий комплектаций товара
 * @returns {Fact[]}
 */
export function softwareFacts(specs, licenses) {
  const spec = (/** @type {RegExp} */ pattern) => specs.find((item) => pattern.test(item.name))
  const system = spec(/^(ОС|операционн)/i)
  const language = spec(/язык/i)
  const license = licenseType([spec(/лиценз/i)?.value, ...licenses])
  return [
    fact('Операционная система', system ? shortSystem(system.value) : null),
    fact('Язык интерфейса', language?.value),
    fact('Тип лицензии', license),
  ].filter(
    /** @returns {item is Fact} */ (item) => item != null && item.value.length <= FACT_MAX_LENGTH,
  )
}
