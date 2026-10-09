import { adminRequest, reply } from '@/lib/adminApi'
import {
  applyPriceList,
  currentPrices,
  previewPriceList,
  quoteRow,
  type Reply,
} from '@/lib/priceListRun'

/**
 * Загрузка прайса со страницы админки: администратор и маркетолог (редактор). Шаги: проверка
 * (ничего не пишет), пересчёт одной строки, запись, текущие цены для скачивания.
 * См. src/lib/priceListRun.ts.
 */
export const maxDuration = 60

/** 3000 строк с названиями до 300 знаков. */
const MAX_BODY = 1_500_000

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
        return send(await previewPriceList(payload, data))
      case 'quote':
        return send(await quoteRow(payload, data))
      case 'apply':
        return send(await applyPriceList(payload, data, String(user.id)))
      case 'current':
        return send(await currentPrices(payload, data))
      default:
        return reply({ error: 'Неизвестный шаг' }, 400)
    }
  } catch (error) {
    console.error('Загрузка прайса: ошибка шага', data.action, error)
    return reply({ error: 'Не получилось из-за ошибки на сервере. Повторите.' }, 500)
  }
}
