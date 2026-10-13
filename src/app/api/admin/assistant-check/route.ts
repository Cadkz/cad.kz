import { adminRequest, reply } from '@/lib/adminApi'
import { checkQuestion } from '@/lib/assistant/check'

/**
 * Страница «Проверка Кадди» в админке: один вопрос за запрос, ответ с обращениями к инструментам
 * и флагами. Администратор и маркетолог. Разговор не сохраняется.
 */
export const maxDuration = 60

export async function POST(request: Request) {
  const checked = await adminRequest(request, 4000, ['admin', 'editor'])
  if ('error' in checked) return checked.error
  const result = await checkQuestion(checked.payload, checked.data.question)
  if (!result.ok) return reply({ error: result.error }, result.status)
  return reply(result)
}
