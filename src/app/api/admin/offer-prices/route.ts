import { adminRequest, reply } from '@/lib/adminApi'
import { applyEdits, previewEdits } from '@/lib/offerPrices'
import type { Reply } from '@/lib/priceListRun'

/**
 * «Цены таблицей» в админке: администратор и маркетолог. Шаги: пересчёт правок в тенге
 * (ничего не пишет) и запись. См. src/lib/offerPrices.ts.
 */
export const maxDuration = 60

/** До 3000 правок по ~120 знаков. */
const MAX_BODY = 500_000

function send(result: Reply) {
  if (!result.ok) return reply({ error: result.error }, result.status)
  return reply(result)
}

export async function POST(request: Request) {
  const checked = await adminRequest(request, MAX_BODY, ['admin', 'editor'])
  if ('error' in checked) return checked.error
  const { payload, data, user } = checked
  try {
    switch (data.action) {
      case 'preview':
        return send(await previewEdits(payload, data))
      case 'apply':
        return send(await applyEdits(payload, data, user))
      default:
        return reply({ error: 'Неизвестный шаг' }, 400)
    }
  } catch (error) {
    console.error('Цены таблицей: ошибка шага', data.action, error)
    return reply({ error: 'Не получилось из-за ошибки на сервере. Повторите.' }, 500)
  }
}
