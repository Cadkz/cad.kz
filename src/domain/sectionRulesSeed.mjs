/**
 * Первое наполнение «Правил разделов» в админке: утверждённые владельцем группы
 * из directionRules.mjs (09.10.2026), переведённые в простые слова. Дальше правила
 * живут только в админке, этот файл нужен лишь для первого запуска и тестов.
 */
import { DIRECTION_RULES, RETIRED } from './directionRules.mjs'

/**
 * Регулярное выражение правила → слова для админки: «|» → запятая, «.*» и «.{0,3}» → «+».
 * Поддерживает только те конструкции, что есть в directionRules.mjs.
 * @param {RegExp} pattern
 */
export function regexWords(pattern) {
  let source = pattern.source
    .replace(/\\b/g, '')
    .replace(/v\.\?ray/g, 'vray|v-ray|v ray')
    .replace(/\.\{0,3\}|\.\*/g, '+')
  const group = /^(.*?)\(([^()]+)\)(.*)$/.exec(source)
  if (group) {
    const [, before, inner, after] = group
    source = inner
      .split('|')
      .map((alt) => `${before}${alt}${after}`)
      .join('|')
  }
  if (/[\\()[\]{}.?*^$]/.test(source)) throw new Error(`Не переводится в слова: ${pattern}`)
  return source
    .split('|')
    .map((item) => item.trim())
    .join(', ')
}

/** @typedef {import('./sectionRules.mjs').SectionRule & { key: string, title: string }} SeedRule */

/** @returns {SeedRule[]} */
export function seedRules() {
  /** @type {SeedRule[]} */
  const rules = []
  let order = 0
  const next = () => {
    order += 10
    return order
  }
  for (const item of RETIRED)
    rules.push({
      key: `retired:${item.label}`,
      title: `Снят с продажи: ${item.label}`,
      order: next(),
      vendor: item.vendor,
      kind: null,
      words: regexWords(item.title),
      main: null,
      extra: [],
      retire: true,
    })
  for (const group of DIRECTION_RULES) {
    const base = { vendor: group.vendor ?? null, kind: group.kind ?? null, retire: false }
    for (const exception of group.exceptions ?? [])
      rules.push({
        ...base,
        key: `${group.key}:${exception.label}`,
        title: `${group.label} — ${exception.label}`,
        order: next(),
        words: regexWords(exception.title),
        main: exception.sections[0] ?? null,
        extra: exception.sections.slice(1),
      })
    rules.push({
      ...base,
      key: group.key,
      title: group.label,
      order: next(),
      words: group.title ? regexWords(group.title) : '',
      main: group.sections[0] ?? null,
      extra: group.sections.slice(1),
    })
  }
  return rules
}

/** Значки новых разделов (ключи из sectionIcons в src/cms/collections/catalog.ts). */
export const NEW_SECTION_ICONS = {
  'wide-scanners': 'scan',
  consumables: 'printer',
  workstations: 'monitor',
  consulting: 'wrench',
}

const SOFTWARE_DIRECTIONS = [
  'arch',
  'structural',
  'geotech',
  'infra',
  'mep',
  'pipes',
  'machine',
  'viz',
  'estimate',
]

/**
 * Первое наполнение «С этим покупают: предлагать товары из разделов» (раздел → разделы).
 * К программам — курсы и внедрение (курсы только своего направления, это проверяет подборка),
 * к визуализации и BIM — рабочие станции, к плоттерам — расходники и сканеры.
 * @type {Record<string, string[]>}
 */
export const CROSS_DEFAULTS = {
  ...Object.fromEntries(SOFTWARE_DIRECTIONS.map((slug) => [slug, ['training', 'consulting']])),
  arch: ['training', 'consulting', 'workstations'],
  viz: ['training', 'workstations'],
  machine: ['training', 'consulting', 'workstations'],
  scanners: ['workstations', 'training'],
  plotters: ['consumables', 'wide-scanners'],
  'wide-scanners': ['plotters'],
  workstations: ['viz'],
  training: ['consulting'],
  consulting: ['training'],
}
