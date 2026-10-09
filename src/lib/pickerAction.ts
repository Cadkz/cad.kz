import type { RequestKind } from '@/domain/siteRequest.mjs'
import type { PickerTotal } from './usePicker'

/**
 * Главное действие страницы товара — одно, его видно и в итоге справа, и в строке внизу
 * на телефоне. Цены нет — «Запросить цену», иначе «Получить КП»: менеджер пришлёт предложение
 * сразу, без корзины. Корзина, продление и помощь с выбором — второстепенные действия.
 */
export function mainAction(total: PickerTotal): { kind: RequestKind; label: string } {
  return total.state === 'request'
    ? { kind: 'price', label: 'Запросить цену' }
    : { kind: 'quote', label: 'Получить КП' }
}
