import type { Payload } from 'payload'
import {
  correctKnowledgeText,
  KNOWLEDGE_CORRECTIONS_KEY,
  PC_SPECS_KEY,
  restorePcSpecs,
  SCANNER_RENTAL_KEY,
  SCANNER_RENTAL_TEXT,
} from '../domain/kaddiKnowledgeCorrections.mjs'

/** Разовое обновление базы. В одной транзакции сохраняются изменения и прежние тексты в журнале. */
export function setupKaddiKnowledgeCorrections(payload: Payload): Promise<string[] | null> {
  return applyKnowledgeFix(payload, KNOWLEDGE_CORRECTIONS_KEY, correctKnowledgeText, true)
}

/** Возврат характеристик ПК в справку Кадди (06.11.2026), тем же безопасным способом. */
export function setupKaddiPcSpecs(payload: Payload): Promise<string[] | null> {
  return applyKnowledgeFix(payload, PC_SPECS_KEY, restorePcSpecs, false)
}

async function applyKnowledgeFix(
  payload: Payload,
  key: string,
  correct: (product: string, text: string) => string,
  addScannerRental: boolean,
): Promise<string[] | null> {
  const options = { overrideAccess: true, depth: 0 } as const
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: key } },
    limit: 1,
    ...options,
  })
  if (done.docs.length) return null
  const transactionID = await payload.db.beginTransaction()
  if (transactionID == null) throw new Error('Для обновления базы знаний нужна транзакция')
  const opts = { ...options, req: { transactionID } }
  try {
    const { docs } = await payload.find({
      collection: 'assistant-knowledge',
      pagination: false,
      ...opts,
    })
    const changes = docs.flatMap((doc) => {
      const after = correct(doc.product ?? '', doc.text)
      return after === doc.text
        ? []
        : [{ id: doc.id, product: doc.product ?? '', before: doc.text, after }]
    })
    const report: string[] = []
    for (const change of changes) {
      await payload.update({
        collection: 'assistant-knowledge',
        id: change.id,
        data: { text: change.after },
        ...opts,
      })
      const saved = await payload.findByID({
        collection: 'assistant-knowledge',
        id: change.id,
        ...opts,
      })
      if (saved.text !== change.after)
        throw new Error(`Не подтвердилось сохранение записи ${change.id}`)
      report.push(`обновлена запись ${change.id}: ${change.product}`)
    }
    let addedId: number | null = null
    if (addScannerRental && !docs.some((doc) => doc.product === SCANNER_RENTAL_KEY)) {
      const created = await payload.create({
        collection: 'assistant-knowledge',
        data: {
          product: SCANNER_RENTAL_KEY,
          text: SCANNER_RENTAL_TEXT,
          active: true,
          position: 940,
        },
        ...opts,
      })
      addedId = created.id
      report.push(`добавлена запись ${created.id}: ${SCANNER_RENTAL_KEY}`)
    }
    await payload.create({
      collection: 'import-runs',
      data: {
        idempotencyKey: key,
        state: 'done',
        snapshot: { changes, addedId, report },
      },
      ...opts,
    })
    await payload.db.commitTransaction(transactionID)
    return report
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}
