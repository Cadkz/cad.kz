import { Mascot } from '../Mascot/Mascot'
import styles from './AssistantHeader.module.css'

type Props = {
  /** Крупная голова — в приветствии; иконка — в шапке окна чата. */
  size?: 'icon' | 'avatar'
  /** id заголовка для aria-labelledby окна чата. */
  titleId?: string
}

/**
 * Шапка окна ИИ-консультанта (AssistantPanel): голова Юки, имя и подпись.
 */
export function AssistantHeader({ size = 'icon', titleId }: Props) {
  return (
    <div className={styles.header}>
      <Mascot pose="head" size={size} eager />
      <div className={styles.text}>
        <p id={titleId} className={styles.name}>
          Юки
        </p>
        <p className={styles.caption}>ИИ-консультант CAD.kz</p>
      </div>
    </div>
  )
}
