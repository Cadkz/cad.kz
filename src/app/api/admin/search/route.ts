import { searchQuery } from '@/domain/adminSearch.mjs'
import { adminRequest, reply } from '@/lib/adminApi'
import { searchAdmin } from '@/lib/adminSearch'

/** Поиск в меню админки: разделы админки и записи. Администратор и маркетолог. */
export async function POST(request: Request) {
  const checked = await adminRequest(request, 1_000, ['admin', 'editor'])
  if ('error' in checked) return checked.error
  const query = searchQuery(checked.data.query)
  if (!query) return reply({ groups: [] })
  try {
    return reply({ groups: await searchAdmin(checked.payload, checked.user, query) })
  } catch (error) {
    console.error('Поиск в админке не сработал', error)
    return reply({ error: 'Поиск не сработал. Повторите.' }, 500)
  }
}
