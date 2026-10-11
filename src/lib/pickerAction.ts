import type { PickerMeta } from '@/components/PickerProvider/PickerProvider'
import { type ActionSet, scenarioActions } from '@/domain/buyScenario.mjs'

/**
 * Кнопки страницы товара — по сценарию покупки (src/domain/buyScenario.mjs): одни и те же
 * в итоге справа и в строке внизу на телефоне. `cart` — у товара есть цена и в выборе нет
 * варианта «по запросу» (usePickerCart).
 */
export function pickerActions(meta: PickerMeta, cart: boolean): ActionSet {
  return scenarioActions({
    scenario: meta.scenario ?? 'standard',
    cart,
    kind: meta.kind,
    demo: meta.demo,
    renewLabel: meta.renewLabel,
    picks: meta.picks,
    about: meta.about,
    family: Boolean(meta.familySlug),
  })
}
