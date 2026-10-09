'use client'

import { ChevronLeft, Wrench } from 'lucide-react'
import { itemUnavailable } from '@/domain/picker.mjs'
import { Button } from '../Button/Button'
import { usePickerContext } from '../PickerProvider/PickerProvider'
import { PickerStep } from '../PickerStep/PickerStep'
import { PickerSwitches } from '../PickerSwitches/PickerSwitches'
import styles from './PickerSteps.module.css'

/**
 * Подбор комплекта: переключатели (редакция, срок) сверху, дальше шаги по номерам.
 * Если есть готовые комплекты, они идут первыми, а ручная сборка открывается кнопкой:
 * большинству хватает комплекта, остальные собирают сами. Режим определяется выбором:
 * выбран комплект — видны комплекты, не выбран — шаги ручной сборки.
 * Без подбора и без предложений — короткая подсказка, что цену назовёт менеджер.
 */
export function PickerSteps() {
  const { view, state, chooseBundle, openRequest } = usePickerContext()
  if (!view.steps.length)
    return (
      <p className={styles.empty}>
        Цена и комплектация — по запросу.{' '}
        <button type="button" className={styles.link} onClick={() => openRequest('price')}>
          Запросить цену
        </button>
      </p>
    )

  const bundles = view.steps.find((step) => step.mode === 'bundle')
  const manual = view.steps.filter((step) => step.mode !== 'bundle')
  const numbered = (steps: typeof manual) =>
    steps.map((step, index) => (
      <PickerStep key={step.key} step={step} number={steps.length > 1 ? index + 1 : null} />
    ))

  if (!bundles || !manual.length)
    return (
      <div className={styles.steps}>
        <PickerSwitches />
        {numbered(view.steps)}
      </div>
    )

  if (state.bundle)
    return (
      <div className={styles.steps}>
        <PickerSwitches />
        <PickerStep step={bundles} number={null} titled />
        <div className={styles.manual}>
          <p className={styles.manualText}>Нужен другой состав? Отметьте программы по одной.</p>
          <Button variant="outline" size="sm" onClick={() => chooseBundle(null)}>
            <Wrench size={16} strokeWidth={1.75} aria-hidden="true" />
            Собрать комплект самому
          </Button>
        </div>
      </div>
    )

  const firstBundle =
    bundles.items.find(
      (item) => item.preselect && !itemUnavailable(item, view.switches, state.switches),
    ) ?? bundles.items.find((item) => !itemUnavailable(item, view.switches, state.switches))
  return (
    <div className={styles.steps}>
      {firstBundle && (
        <button type="button" className={styles.back} onClick={() => chooseBundle(firstBundle.key)}>
          <ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />
          Вернуться к готовым комплектам
        </button>
      )}
      <PickerSwitches />
      {numbered(manual)}
    </div>
  )
}
