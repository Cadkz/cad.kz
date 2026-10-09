import { adminRequest, reply } from '@/lib/adminApi'
import {
  productsPart,
  publicationsPart,
  restoreImagesPart,
  textImagesPart,
} from '@/lib/legacyContentRun'

/**
 * Перенос со старого cad.kz со страницы админки: только администратор. Каждый запрос — одна
 * часть работы (до ~20 секунд), см. src/lib/legacyContentRun.ts.
 */
export const maxDuration = 60

export async function POST(request: Request) {
  const checked = await adminRequest(request, 10_000)
  if ('error' in checked) return checked.error
  const { payload, data } = checked
  try {
    switch (data.action) {
      case 'publications':
        return reply(await publicationsPart(payload, data))
      case 'products':
        return reply(await productsPart(payload, data))
      case 'images':
        return reply(await textImagesPart(payload, data))
      case 'restore-images':
        return reply(await restoreImagesPart(payload, data))
      default:
        return reply({ error: 'Неизвестный шаг переноса' }, 400)
    }
  } catch (error) {
    console.error('Перенос со старого сайта: ошибка шага', data.action, error)
    return reply(
      { error: 'Шаг не выполнен из-за ошибки на сервере. Повторите: перенесённое не пропадёт.' },
      500,
    )
  }
}
