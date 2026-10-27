import { ArrowDown, ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import model from '../../../public/images/home/bim-model.webp'
import styles from './DesktopHero.module.css'

export function DesktopHero({ contact }: { contact: string | null }) {
  return (
    <section className={styles.hero} aria-labelledby="studio-title">
      <div className={styles.topline}>
        <span>CAD.kz / Технологии для проектирования</span>
        <span>Казахстан · Работаем с вашей задачей</span>
      </div>
      <div className={styles.composition}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>
            <span /> ИНСТРУМЕНТЫ БОЛЬШИХ ИДЕЙ
          </p>
          <h1 id="studio-title" className={styles.title}>
            Вы задумали.
            <br />
            Мы поможем
            <br />
            <em>спроектировать.</em>
          </h1>
          <p className={styles.lead}>
            Программы, оборудование и экспертиза для тех, кто создаёт здания, конструкции и
            производство.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/catalog">
              Найти своё решение <ArrowUpRight size={20} strokeWidth={1.75} />
            </Link>
            {contact && (
              <a className={styles.secondary} href={contact}>
                Обсудить задачу <ArrowUpRight size={16} strokeWidth={1.75} />
              </a>
            )}
          </div>
        </div>
        <div className={styles.scene}>
          <div className={styles.coordinates}>
            <span>МОДЕЛЬ / 01</span>
            <span>ОТ ЗАМЫСЛА К РЕАЛИЗАЦИИ</span>
          </div>
          <Image
            className={styles.model}
            src={model}
            alt="Архитектурная модель здания"
            sizes="(min-width: 960px) 50vw, 1px"
          />
          <div className={styles.scan} aria-hidden="true" />
          <div className={styles.caption}>
            <span className={styles.cross}>+</span>
            <span>
              У каждой идеи
              <br />
              <strong>есть точное решение.</strong>
            </span>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <a href="#studio-directions">
          Начните со своей задачи <ArrowDown size={16} strokeWidth={1.75} />
        </a>
        <span>Подобрать. Настроить. Научить. Внедрить.</span>
      </div>
    </section>
  )
}
