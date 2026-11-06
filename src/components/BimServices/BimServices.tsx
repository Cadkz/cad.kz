import { getT } from '@/i18n/server'
import type { BimService } from '@/lib/bimPage'
import { Reveal } from '../Reveal/Reveal'
import styles from './BimServices.module.css'

/**
 * Задачи на странице BIM: номер, название, когда нужно, что сделаем и результат. Всё открыто
 * сразу (в макете владельца карточки переворачивались): текст читается и на телефоне, и
 * поисковиками, без скриптов. Карточки проявляются при прокрутке, как в каталоге (Reveal).
 */
export async function BimServices({ items }: { items: BimService[] }) {
  const t = await getT()
  return (
    <ol className={styles.grid}>
      {items.map((item, index) => (
        <Reveal as="li" key={item.title} step={index % 2} className={styles.card}>
          <div className={styles.head}>
            <span className={styles.number} aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className={styles.title}>{item.title}</h3>
          </div>
          {item.problem && <p className={styles.problem}>{item.problem}</p>}
          {item.work.length > 0 && (
            <div className={styles.work}>
              <p className={styles.label}>{t('Что мы сделаем')}</p>
              {item.work.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}
          {item.result && (
            <p className={styles.result}>
              <strong className={styles.label}>{t('Результат')}</strong>
              {item.result}
            </p>
          )}
        </Reveal>
      ))}
    </ol>
  )
}
