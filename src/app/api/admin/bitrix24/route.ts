import { adminRequest, reply } from '@/lib/adminApi'
import { type Bitrix24Reply, checkBitrix24, retryDue, sendTestLead } from '@/lib/bitrix24Run'

/** Страница «Битрикс24» в админке, только администратор: проверка связи, тестовый лид, повтор очереди. */
const MAX_BODY = 1000

function send(result: Bitrix24Reply) {
  if (!result.ok) return reply({ error: result.error }, result.status)
  return reply(result)
}

export async function POST(request: Request) {
  const checked = await adminRequest(request, MAX_BODY)
  if ('error' in checked) return checked.error
  const { payload, data } = checked
  try {
    switch (data.action) {
      case 'check':
        return send(await checkBitrix24())
      case 'testLead':
        return send(await sendTestLead())
      case 'retry':
        return send(await retryDue(payload))
      default:
        return reply({ error: 'Неизвестный шаг' }, 400)
    }
  } catch (error) {
    console.error('Битрикс24: ошибка шага', data.action, error)
    return reply({ error: 'Не получилось из-за ошибки на сервере. Повторите.' }, 500)
  }
}
