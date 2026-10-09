import type { KindProfile } from '@/domain/productKind.mjs'
import type { RequestKind } from '@/domain/siteRequest.mjs'
import type { PickerTotal } from './usePicker'

/**
 * Главное действие страницы товара — одно, его видно и в итоге справа, и в строке внизу
 * на телефоне. Цены нет — «Запросить цену», иначе «Получить КП»: менеджер пришлёт предложение
 * сразу, без корзины. Корзина, продление и помощь с выбором — второстепенные действия.
 * У курсов и услуг подпись своя («Записаться на курс», «Запросить консультацию»), заявка та же.
 */
export function mainAction(
  total: PickerTotal,
  profile: KindProfile,
): { kind: RequestKind; label: string } {
  const kind = total.state === 'request' ? 'price' : 'quote'
  if (profile.actionLabel) return { kind, label: profile.actionLabel }
  return kind === 'price' ? { kind, label: 'Запросить цену' } : { kind, label: 'Получить КП' }
}
