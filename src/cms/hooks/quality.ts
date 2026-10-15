import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
} from 'payload'
import type { Offer, Product } from '../../../payload-types'
import { qualityForSave, refreshQuality } from '../../lib/productQuality'
import { relId } from '../../lib/rel'

/**
 * Заполненность товара перед сохранением: считается по новым значениям полей. Ошибка расчёта
 * не мешает сохранить товар — отметка обновится при открытии «Контроля качества».
 */
export const productQuality: CollectionBeforeChangeHook<Product> = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  const before: Partial<Product> = operation === 'update' ? (originalDoc ?? {}) : {}
  const merged = { ...before, ...data }
  try {
    const fields = await qualityForSave(
      req.payload,
      merged,
      operation === 'update' ? (originalDoc?.id ?? null) : null,
      req,
    )
    return { ...data, ...fields }
  } catch (error) {
    req.payload.logger.error({ err: error, msg: 'Заполненность товара не посчитана' })
    return data
  }
}

/** Товары, которых касается правка предложения: прежний и новый (предложение перенесли). */
function touched(doc: Partial<Offer>, previous: Partial<Offer> | undefined) {
  const ids = [relId(doc.product), relId(previous?.product)]
  return [...new Set(ids.filter((id): id is number => id != null))]
}

async function refresh(ids: number[], req: Parameters<CollectionAfterDeleteHook>[0]['req']) {
  try {
    await refreshQuality(req.payload, ids, req)
  } catch (error) {
    req.payload.logger.error({ err: error, msg: 'Заполненность товара не пересчитана' })
  }
}

/** Предложение сохранили: у товара могли появиться или пропасть предложения и цена. */
export const offerQualityChange: CollectionAfterChangeHook<Offer> = async ({
  doc,
  previousDoc,
  req,
}) => {
  await refresh(touched(doc, previousDoc), req)
  return doc
}

/** Предложение удалили. */
export const offerQualityDelete: CollectionAfterDeleteHook<Offer> = async ({ doc, req }) => {
  await refresh(touched(doc, undefined), req)
  return doc
}
