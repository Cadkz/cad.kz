import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import type { Direction } from '@/lib/catalog'
import type { Home } from '@/lib/home'
import { newsHref } from '@/lib/navigationHrefs'
import { Container } from '../Container/Container'
import { DesktopDirections } from '../DesktopDirections/DesktopDirections'
import { DesktopHero } from '../DesktopHero/DesktopHero'
import { Faq } from '../Faq/Faq'
import styles from './DesktopHome.module.css'

/** Главная для ПК: редакционная композиция, реальные разделы и публикации из Payload. */
export function DesktopHome({
  home,
  directions,
  news,
}: {
  home: Home
  directions: Direction[]
  news: { title: string; slug: string }[]
}) {
  return (
    <div className={styles.root}>
      <Container>
        <DesktopHero contact={home.whatsappHref} />
        <DesktopDirections directions={directions} />
      </Container>
      <section className={styles.bim} aria-labelledby="studio-bim-title">
        <Container>
          <div className={styles.bimGrid}>
            <div className={styles.bimIntro}>
              <p className={styles.label}>02 / ОТ ИНСТРУМЕНТОВ К СИСТЕМЕ</p>
              <h2 id="studio-bim-title">
                BIM начинается
                <br />
                не с лицензии.
                <br />
                <span>С вашей команды.</span>
              </h2>
              <p className={styles.lead}>
                Свяжем программы, процессы и людей. Поможем перейти от отдельных моделей к
                совместной работе над проектом.
              </p>
              <Link href="/bim" className={styles.lightLink}>
                Как мы внедряем BIM <ArrowUpRight size={20} strokeWidth={1.75} />
              </Link>
            </div>
            <ol className={styles.stages}>
              {home.bim.stages.map((stage, i) => (
                <li key={stage.title}>
                  <span className={styles.number}>{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{stage.title}</h3>
                    {stage.text && <p>{stage.text}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>
      <Container>
        {home.process.length > 0 && (
          <section className={styles.process} aria-labelledby="studio-process-title">
            <div className={styles.sectionHead}>
              <p className={styles.label}>03 / РАБОТАЕМ ВМЕСТЕ</p>
              <h2 id="studio-process-title">
                Важна не покупка.
                <br />
                Важно, что получится с её помощью.
              </h2>
            </div>
            <ol className={styles.steps}>
              {home.process.map((step, i) => (
                <li key={step.title}>
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <h3>{step.title}</h3>
                  {step.text && <p>{step.text}</p>}
                </li>
              ))}
            </ol>
          </section>
        )}
        {news.length > 0 && (
          <section className={styles.news} aria-labelledby="studio-news-title">
            <div className={styles.sectionHead}>
              <p className={styles.label}>04 / В ПОЛЕ ЗРЕНИЯ</p>
              <h2 id="studio-news-title">
                Что меняется
                <br />в мире проектирования
              </h2>
              <Link href="/news">
                Все публикации <ArrowUpRight size={20} strokeWidth={1.75} />
              </Link>
            </div>
            <div className={styles.newsList}>
              {news.map((item, i) => (
                <Link href={newsHref(item.slug)} key={item.slug}>
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <h3>{item.title}</h3>
                  <ArrowUpRight size={24} strokeWidth={1.75} />
                </Link>
              ))}
            </div>
          </section>
        )}
        {home.faq.length > 0 && (
          <section className={styles.faq} aria-labelledby="studio-faq-title">
            <div>
              <p className={styles.label}>ЕСТЬ ВОПРОСЫ?</p>
              <h2 id="studio-faq-title">
                Разберёмся
                <br />в деталях.
              </h2>
            </div>
            <Faq items={home.faq} />
          </section>
        )}
        <section className={styles.contact} aria-labelledby="studio-contact-title">
          <p className={styles.label}>СЛЕДУЮЩИЙ ПРОЕКТ — ВАШ</p>
          <h2 id="studio-contact-title">
            Расскажите, что
            <br />
            хотите создать.
          </h2>
          <div>
            <p>Подберём инструменты под ваши задачи, команду и бюджет.</p>
            <Link href={home.whatsappHref ?? '/contacts'}>
              Начать разговор <ArrowUpRight size={24} strokeWidth={1.75} />
            </Link>
          </div>
        </section>
      </Container>
    </div>
  )
}
