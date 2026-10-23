import { adminRequest, reply } from '@/lib/adminApi'
import { saveTreeEdit } from '@/lib/adminCatalog'

/**
 * «Каталог» в админке: правка «Сорт.» или «Активности» прямо в строке дерева. Администратор и
 * маркетолог. См. src/lib/adminCatalog.ts.
 */
export async function POST(request: Request) {
  const checked = await adminRequest(request, 2_000, ['admin', 'editor'])
  if ('error' in checked) return checked.error
  const { payload, data, user } = checked
  try {
    const result = await saveTreeEdit(payload, data, user)
    if (!result.ok) return reply({ error: result.error }, result.status)
    return reply(result)
  } catch (error) {
    console.error('Каталог в админке: правка не сохранилась', error)
    return reply({ error: 'Не сохранилось из-за ошибки на сервере. Повторите.' }, 500)
  }
}
