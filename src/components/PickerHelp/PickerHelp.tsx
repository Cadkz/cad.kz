'use client'

import { MessageCircle } from 'lucide-react'
import { useT } from '@/components/LangProvider/LangProvider'
import { openAssistant } from '@/lib/openAssistant'
import { Button } from '../Button/Button'
import { Mascot } from '../Mascot/Mascot'
import { usePickerContext } from '../PickerProvider/PickerProvider'
import styles from './PickerHelp.module.css'

/** С какого числа вариантов подбор считается запутанным (без переключателей редакции и срока). */
const MANY_ITEMS = 4

/**
 * «Запутались в комплектациях?» под подбором комплекта — только там, где выбор правда
 * непростой: есть переключатели (редакция, срок) или вариантов много. Кадди запутался в нитках
 * и предлагает спросить его. Консультант выключен — та же кнопка открывает заявку на консультацию.
 */
export function PickerHelp() {
  const t = useT()
  const { view, openRequest } = usePickerContext()
  const items = view.steps.reduce((sum, step) => sum + step.items.length, 0)
  if (!view.switches.length && items < MANY_ITEMS) return null
  const ask = () => {
    if (!openAssistant()) openRequest('consult', t('Запутались в комплектациях'))
  }
  return (
    <div className={styles.help}>
      <div className={styles.text}>
        <p className={styles.title}>{t('Запутались в комплектациях?')}</p>
        <p className={styles.lead}>
          {t('Расскажите, что проектируете, — Кадди поможет распутать.')}
        </p>
        <Button variant="outline" size="sm" onClick={ask}>
          <MessageCircle size={16} strokeWidth={1.75} aria-hidden="true" />
          {t('Спросить Кадди')}
        </Button>
      </div>
      <Mascot pose="tangled" size="xs" className={styles.kaddi} />
    </div>
  )
}
