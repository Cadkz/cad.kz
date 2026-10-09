import type { CollectionBeforeChangeHook, PayloadRequest } from 'payload'
import type { Product } from '../../../payload-types'
import { allSections } from '../../domain/sectionRules.mjs'
import { relId, relIds } from '../../lib/rel'
import { loadRules, RULES_CONTEXT, rulesResult } from '../../lib/sectionRules'

type Data = Partial<Product>
type Operation = 'create' | 'update'

const sameIds = (a: number[], b: number[]) =>
  a.length === b.length && a.every((value, index) => value === b[index])

/** Значение поля после сохранения: новое, если пришло, иначе прежнее. */
const pickFrom =
  (next: Data, before: Data) =>
  <K extends keyof Product>(key: K): Data[K] =>
    key in next ? next[key] : before[key]

/** Разделы поменяли руками: при создании — указали сами, при правке — значения отличаются. */
function sectionsTouched(next: Data, before: Data, operation: Operation) {
  const pick = pickFrom(next, before)
  const main = relId(pick('mainSection'))
  const extra = relIds(pick('extraSections'))
  if (operation === 'create') return main != null || extra.length > 0
  const mainChanged = 'mainSection' in next && main !== relId(before.mainSection)
  const extraChanged = 'extraSections' in next && !sameIds(extra, relIds(before.extraSections))
  return mainChanged || extraChanged
}

/** Поменялось то, от чего зависит правило: название, тип или производитель. */
function identityChanged(next: Data, before: Data) {
  const plain = (['title', 'kind'] as const).some((key) => key in next && next[key] !== before[key])
  const vendor = 'manufacturer' in next && relId(next.manufacturer) !== relId(before.manufacturer)
  return plain || vendor
}

/** Разделы по правилам в данные товара; новый снятый с продажи товар — сразу черновик. */
async function fillFromRules(next: Data, before: Data, operation: Operation, req: PayloadRequest) {
  const pick = pickFrom(next, before)
  const title = pick('title')
  const kind = pick('kind')
  if (!title || !kind) return
  const rules = await loadRules(req.payload, req)
  const result = rulesResult(rules, { title, kind, manufacturer: pick('manufacturer') })
  if (!result) return
  next.mainSection = result.main
  next.extraSections = result.extra
  if (operation === 'create' && result.retire) next.status = 'draft'
}

/**
 * Разделы товара перед сохранением.
 * 1. Ручная правка основного или дополнительных разделов снимает галочку «Подбирать по правилам».
 * 2. С галочкой разделы берутся из «Правил разделов»: у нового товара (импорт, ручное создание
 *    без разделов), при возврате галочки и при смене названия, производителя или типа.
 * 3. Служебное поле sections = основной + дополнительные: по нему работают каталог и фильтр.
 */
export const productSections: CollectionBeforeChangeHook<Product> = async ({
  data,
  originalDoc,
  operation,
  req,
  context,
}) => {
  const next: Data = data
  const before: Data = operation === 'update' ? (originalDoc ?? {}) : {}
  const pick = pickFrom(next, before)

  if (!context[RULES_CONTEXT]) {
    const reEnabled =
      operation === 'update' && next.autoSections === true && before.autoSections === false
    let auto = pick('autoSections') !== false
    if (auto && !reEnabled && sectionsTouched(next, before, operation)) {
      next.autoSections = false
      auto = false
    }
    if (auto && (operation === 'create' || reEnabled || identityChanged(next, before)))
      await fillFromRules(next, before, operation, req)
  }

  if ('mainSection' in next || 'extraSections' in next)
    next.sections = allSections(relId(pick('mainSection')), relIds(pick('extraSections')))
  return next
}
