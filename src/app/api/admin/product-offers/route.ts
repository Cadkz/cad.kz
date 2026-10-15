import { adminRequest, reply } from '@/lib/adminApi'
import { loadProductOffers } from '@/lib/productOffers'

/**
 * Комплектации товара для таблицы в карточке товара в админке (администратор и маркетолог).
 * Только чтение: правка — в самой комплектации, она открывается в выдвижной панели.
 */
export async function POST(request: Request) {
  const checked = await adminRequest(request, 1_000, ['admin', 'editor'])
  if ('error' in checked) return checked.error
  const productId = Number(checked.data.product)
  if (!Number.isSafeInteger(productId) || productId <= 0)
    return reply({ error: 'Некорректный товар' }, 400)
  try {
    return reply(await loadProductOffers(checked.payload, productId))
  } catch (error) {
    console.error('Комплектации товара: ошибка загрузки', error)
    return reply({ error: 'Не получилось загрузить комплектации. Обновите страницу.' }, 500)
  }
}
