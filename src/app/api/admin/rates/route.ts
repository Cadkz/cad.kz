import { adminRequest, reply } from '@/lib/adminApi'
import type { Reply } from '@/lib/priceListRun'
import { applyRates, previewRates } from '@/lib/ratesRun'

/**
 * «Курсы валют» в админке: администратор и маркетолог. Шаги: сводка (ничего не пишет) и запись.
 * См. src/lib/ratesRun.ts.
 */
const MAX_BODY = 10_000

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
        return send(await previewRates(payload, data))
      case 'apply':
        return send(await applyRates(payload, data, user))
      default:
        return reply({ error: 'Неизвестный шаг' }, 400)
    }
  } catch (error) {
    console.error('Курсы валют: ошибка шага', data.action, error)
    return reply({ error: 'Не получилось из-за ошибки на сервере. Повторите.' }, 500)
  }
}
