import { PICKS_LIMIT } from '@/domain/vendorPicks.mjs'
import { Col, Grid } from '../Grid/Grid'
import { type PickItem, PickRow } from '../PickRow/PickRow'
import { Reveal } from '../Reveal/Reveal'
import styles from './ProductPicks.module.css'

type Panel = { id: string; title: string; sub: string; items: PickItem[] }

/**
 * Сколько строк в панели: по две и в «С этим покупают», и в «Похожих» на всех страницах
 * (решение владельца 27.10.2026), остальное найдётся в каталоге. Третья — курс с ближайшей
 * группой из расписания УЦ (30.10.2026): тогда limit = 3 у обеих панелей.
 */
const LIMIT = PICKS_LIMIT

/**
 * Подборки под страницей товара: «С этим покупают» и «Похожие» — две панели рядом (от 960 px),
 * в каждой короткий список строк. Одна панель — во всю ширину, её список в две колонки.
 */
export function ProductPicks({ panels, limit = LIMIT }: { panels: Panel[]; limit?: number }) {
  const shown = panels.filter((panel) => panel.items.length > 0)
  if (!shown.length) return null
  const single = shown.length === 1
  return (
    <Reveal className={styles.wrap}>
      <Grid>
        {shown.map((panel) => (
          <Col key={panel.id} span={{ base: 12, md: single ? 12 : 6 }}>
            <section className={styles.panel} aria-labelledby={`${panel.id}-title`}>
              <h2 id={`${panel.id}-title`} className={styles.title}>
                {panel.title}
              </h2>
              <p className={styles.sub}>{panel.sub}</p>
              <ul className={single ? `${styles.list} ${styles.twoCols}` : styles.list}>
                {panel.items.slice(0, limit).map((item) => (
                  <li key={item.href}>
                    <PickRow item={item} />
                  </li>
                ))}
              </ul>
            </section>
          </Col>
        ))}
      </Grid>
    </Reveal>
  )
}
