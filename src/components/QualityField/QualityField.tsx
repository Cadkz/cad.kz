'use client'

import { FieldLabel, useFormFields } from '@payloadcms/ui'
import type { NumberFieldClientComponent } from 'payload'
import { QualityMark } from '@/components/QualityMark/QualityMark'
import styles from './QualityField.module.css'

/**
 * «Заполненность» в карточке товара, справа: только для чтения. Считается сама при сохранении
 * товара и его предложений; подробности и все товары разом — «Контроль качества».
 */
export const QualityField: NumberFieldClientComponent = ({ path, field }) => {
  const score = useFormFields(([fields]) => fields[path]?.value)
  const gaps = useFormFields(([fields]) => fields.qualityGaps?.value)
  return (
    <div className={styles.root}>
      <FieldLabel label={field.label} path={path} />
      <QualityMark
        score={typeof score === 'number' ? score : null}
        gaps={Array.isArray(gaps) ? gaps.filter((gap) => typeof gap === 'string') : []}
      />
      <p className={styles.hint}>
        Обновляется при сохранении. Все товары разом —{' '}
        <a href="/admin/quality">«Контроль качества»</a>.
      </p>
    </div>
  )
}

/** «Чего не хватает» в форме не показываем (видно в «Заполненности»), в фильтрах списка — есть. */
export function QualityHidden() {
  return null
}
