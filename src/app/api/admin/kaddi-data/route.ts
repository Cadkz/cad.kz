import { validateKnowledge, validatePriceRows } from '@/domain/priceTable.mjs'
import { adminRequest, reply } from '@/lib/adminApi'
import { loadPriceTable, replaceKnowledge, savePriceTable } from '@/lib/assistant/priceTable'
import { priceByCode, searchPrice } from '@/lib/assistant/tools'

/**
 * «Прайс и база Кадди» в админке (администратор и маркетолог): запись прайса и базы знаний из файла,
 * разобранного в браузере, и проверочный поиск по прайсу тем же поиском, что у Кадди.
 */
export const maxDuration = 60

/** ~4 500 строк прайса с полными наименованиями — около 2 МБ. */
const MAX_BODY = 4_000_000

const VAT = ['included', 'excluded', 'unknown'] as const

function short(value: unknown, max: number) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : ''
}

export async function POST(request: Request) {
  const checked = await adminRequest(request, MAX_BODY, ['admin', 'editor'])
  if ('error' in checked) return checked.error
  const { payload, data, user } = checked
  try {
    if (data.action === 'search') {
      const table = await loadPriceTable(payload)
      if (!table) return reply({ error: 'Прайс не загружен' }, 409)
      const found = searchPrice(table, { query: data.query, purchase: data.purchase })
      if ('error' in found) return reply({ error: found.error }, 400)
      return reply({
        total: found.total,
        note: found.note,
        rows: found.rows.map((row) => {
          const info = priceByCode(table, { code: row.code })
          return {
            code: row.code,
            name: row.name,
            purchase: row.purchase,
            term: row.term,
            unit: 'unit' in info ? info.unit : '',
            price: 'price' in info ? info.price : null,
            note: 'note' in info ? info.note : undefined,
            delivery: 'delivery' in info ? info.delivery : '',
          }
        }),
      })
    }
    if (data.action !== 'apply') return reply({ error: 'Неизвестный шаг' }, 400)
    const parts: string[] = []
    if (data.price) {
      const price = data.price as Record<string, unknown>
      const rows = validatePriceRows(price.rows)
      if (typeof rows === 'string') return reply({ error: rows }, 400)
      const vat = VAT.find((v) => v === price.vat) ?? 'unknown'
      const updated = /^\d{4}-\d{2}-\d{2}$/.test(String(price.updated)) ? String(price.updated) : ''
      await savePriceTable(payload, rows, {
        fileName: short(price.fileName, 120) || 'без имени',
        updated,
        vat,
        uploadedBy: String((user as { email?: string }).email ?? user.id),
      })
      parts.push(`прайс — ${rows.length.toLocaleString('ru-RU')} строк`)
    }
    if (data.knowledge) {
      const entries = validateKnowledge(data.knowledge)
      if (typeof entries === 'string') return reply({ error: entries }, 400)
      const saved = await replaceKnowledge(payload, entries)
      parts.push(`база знаний — ${saved} записей`)
    }
    if (!parts.length) return reply({ error: 'Нечего загружать' }, 400)
    return reply({ message: `Готово: ${parts.join(', ')}. Кадди уже отвечает по новым данным.` })
  } catch (error) {
    console.error(
      'Прайс и база Кадди: ошибка',
      data.action,
      error instanceof Error ? error.name : '',
    )
    return reply({ error: 'Не получилось из-за ошибки на сервере. Повторите.' }, 500)
  }
}
