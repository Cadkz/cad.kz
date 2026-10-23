import { normalizeSpecValue } from './specs.mjs'

// Главные факты для сцены первого экрана оборудования (замечание владельца 23.10.2026): не первые
// попавшиеся характеристики, а то, по чему выбирают в этой категории. Берём из фильтров
// исследования (src/domain/equipmentResearch.json) — там значения уже приведены к одному виду,
// а скорость — из характеристик (значения приводятся к русскому виду, как в таблице). Нет данных — факт пропускаем, добираем общими.

/** @typedef {{ name: string, value: string }} Fact */
/** @typedef {{ group: string | null, name: string, value: string }} Spec */
/** @typedef {Record<string, string[]>} Filters */

/** Подпись у фото читается одной-двумя строками: длиннее — не показываем. */
export const FACT_MAX_LENGTH = 32
const LIMIT = 3

/** @param {Filters} filters @param {string} key */
function filter(filters, key) {
  const values = filters[key] ?? []
  return values.length ? values.join(', ') : null
}

/** @param {Spec[]} specs @param {RegExp} pattern */
function specValue(specs, pattern) {
  return specs.find((spec) => pattern.test(spec.value))?.value ?? null
}

/** Плоттер: скорость A1 в листах, у colorWAVE — листы в час. */
function printSpeed(specs) {
  const spec = specs.find((item) => /лист\/(мин|час)/.test(item.value))
  if (!spec) return null
  return /\bA1\b/.test(spec.name) ? `${spec.value}, A1` : spec.value
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
  plotters: (filters, specs) => [
    fact('Ширина печати', filter(filters, 'width')),
    fact('Технология', filter(filters, 'technology')),
    fact('Скорость печати', printSpeed(specs)),
    fact('Цветность', filter(filters, 'color')),
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
  '3d-scanners': (filters) => [
    fact('Точность', withUpTo(filter(filters, 'accuracy'))),
    fact('Подключение', wireless(filter(filters, 'wireless'))),
    fact('Технология', filter(filters, 'technology')),
    fact('Размер объектов', filter(filters, 'object_size')),
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
  const general = specs.map((spec) => ({ name: spec.name, value: spec.value }))
  /** @type {Fact[]} */
  const result = []
  for (const item of [...preferred, ...(rule ? [] : general)]) {
    if (!item || item.value.length > FACT_MAX_LENGTH) continue
    if (result.some((entry) => entry.name === item.name)) continue
    result.push(item)
    if (result.length === LIMIT) break
  }
  return result
}
