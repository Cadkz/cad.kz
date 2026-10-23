'use client'

import { useEffect, useState } from 'react'
import type { CatalogItem, CatalogLine, Facet } from '@/lib/catalog'
import { emptyFilter } from '@/lib/catalogFilter'
import { catalogHref } from '@/lib/navigationHrefs'
import type { Picture } from '@/lib/pictures'
import type { PopularCardData } from '@/lib/popular'
import { ButtonLink } from '../Button/Button'
import { CatalogFilter } from '../CatalogFilter/CatalogFilter'
import styles from './HomeCatalog.module.css'

type Data = {
  items: CatalogItem[]
  facets: Facet[]
  lines: CatalogLine[]
  vendorLogos: Record<string, Picture>
  popular: PopularCardData[]
}
type State = Data | 'loading' | 'error'

/** Тот же порог, что у секции «только для компьютера» (Section desktopOnly). */
const DESKTOP = '(min-width: 960px)'

/** Ждём, пока страница загрузится и браузер освободится: каталог не мешает первому экрану. */
function whenIdle(run: () => void) {
  // В Safari requestIdleCallback нет — тогда сразу после загрузки.
  const start = () =>
    typeof window.requestIdleCallback === 'function'
      ? window.requestIdleCallback(run)
      : setTimeout(run, 1)
  if (document.readyState === 'complete') start()
  else window.addEventListener('load', start, { once: true })
}

/**
 * Каталог с фильтром на главной (аудит 21.10.2026, пакет 7 «Скорость»). Весь каталог в страницу
 * не кладётся: на телефоне блок скрыт и ничего не грузит, на компьютере каталог догружается из
 * /api/catalog сразу после загрузки страницы. До этого — место той же высоты, блоки ниже не прыгают.
 */
export function HomeCatalog() {
  const [state, setState] = useState<State>('loading')

  useEffect(() => {
    const media = window.matchMedia(DESKTOP)
    let started = false
    const load = () => {
      if (started || !media.matches) return
      started = true
      whenIdle(() => {
        fetch('/api/catalog')
          .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
          .then((data: Data) => setState(data))
          .catch(() => setState('error'))
      })
    }
    load()
    // Окно расширили до компьютера — догружаем тогда.
    media.addEventListener('change', load)
    return () => media.removeEventListener('change', load)
  }, [])

  if (state === 'loading') {
    return (
      <div key="loading" className={styles.reserve} role="status">
        <p className={styles.note}>Загружаем каталог…</p>
      </div>
    )
  }
  if (state === 'error') {
    return (
      <div className={styles.error}>
        <p className={styles.note}>Каталог не загрузился. Он открывается и отдельной страницей.</p>
        <ButtonLink href={catalogHref()} variant="outline">
          Открыть каталог
        </ButtonLink>
      </div>
    )
  }
  // Каталог целиком (панель с фильтром) проступает из размытия: если догрузился, пока его
  // видно, — сразу; если ниже экрана — когда до него докрутили (data-reveal, RevealObserver).
  // Карточки внутри появляются следом своим порядком. Разные key у заглушки и каталога —
  // чтобы это был новый блок в странице (иначе React переиспользует div заглушки, и наблюдатель
  // появления его не замечает).
  return (
    <div key="ready" className={styles.appear} data-reveal="">
      <CatalogFilter
        items={state.items}
        facets={state.facets}
        lines={state.lines}
        vendorLogos={state.vendorLogos}
        initial={emptyFilter}
        popular={state.popular}
      />
    </div>
  )
}
