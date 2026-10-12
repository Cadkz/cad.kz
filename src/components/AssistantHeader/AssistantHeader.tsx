import { Mascot } from '../Mascot/Mascot'
import styles from './AssistantHeader.module.css'

type Props = {
  /** Крупная голова — в приветствии; иконка — в шапке окна чата. */
  size?: 'icon' | 'avatar'
  /** id заголовка для aria-labelledby окна чата. */
  titleId?: string
}

/**
 * Заготовка для будущего ИИ-консультанта: голова Кади, имя и подпись.
 * Пока на сайте не выводится — чата нет, кнопок-пустышек не делаем (docs/ARCHITECTURE.md).
 */
export function AssistantHeader({ size = 'icon', titleId }: Props) {
  return (
    <div className={styles.header}>
      <Mascot pose="head" size={size} eager />
      <div className={styles.text}>
        <p id={titleId} className={styles.name}>
          Кади
        </p>
        <p className={styles.caption}>ИИ-помощник CAD.kz</p>
      </div>
    </div>
  )
}
