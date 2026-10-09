'use client'

import { ChevronDown, Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode, useCallback, useEffect, useState } from 'react'
import type { MenuTab } from '@/lib/navigation'
import { catalogHref } from '@/lib/navigationHrefs'
import { aboutColumns, newsLinks, plainLinks } from '@/lib/siteNav'
import { Drawer } from '../Drawer/Drawer'
import { MobileVendors } from '../MobileVendors/MobileVendors'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './MobileMenu.module.css'

type Props = { menu: MenuTab[]; contacts: ReactNode }

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className={styles.group}>
      <summary className={styles.summary}>
        {title}
        <ChevronDown size={20} strokeWidth={1.75} className={styles.chevron} aria-hidden="true" />
      </summary>
      <div className={styles.groupBody}>{children}</div>
    </details>
  )
}

/** Меню для экранов уже 960 px: полноценная выдвижная панель с теми же разделами, что и в шапке. */
export function MobileMenu({ menu, contacts }: Props) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const pathname = usePathname()
  // biome-ignore lint/correctness/useExhaustiveDependencies: панель закрывается при переходе на другую страницу
  useEffect(() => setOpen(false), [pathname])

  const link = (href: string, title: string) => (
    <Link key={href} href={href} className={styles.link} onClick={close}>
      {title}
    </Link>
  )

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-label="Открыть меню"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu size={24} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <Drawer open={open} onClose={close} title="Меню">
        <nav aria-label="Меню сайта" className={styles.nav}>
          <Group title="Каталог">
            {menu.map((tab) => (
              <div key={tab.key} className={styles.tab}>
                <p className={styles.tabTitle}>{tab.label}</p>
                {tab.columns.map((column) => (
                  <details key={column.title} className={styles.section}>
                    <summary className={styles.sectionSummary}>
                      <SectionIcon name={column.icon} size={16} className={styles.sectionIcon} />
                      <span className={styles.sectionTitle}>{column.title}</span>
                    </summary>
                    <div className={styles.sectionBody}>
                      <MobileVendors column={column} onNavigate={close} />
                      <Link href={column.allHref} className={styles.all} onClick={close}>
                        Смотреть весь раздел
                      </Link>
                    </div>
                  </details>
                ))}
              </div>
            ))}
          </Group>
          <Group title="Новости">{newsLinks.map((item) => link(item.href, item.title))}</Group>
          {plainLinks.map((item) => (
            <Link key={item.href} href={item.href} className={styles.topLink} onClick={close}>
              {item.title}
            </Link>
          ))}
          <Group title="О компании">
            {aboutColumns
              .flatMap((column) => column.links)
              .map((item) => (
                <a key={item.href} href={item.href} className={styles.link}>
                  {item.title}
                </a>
              ))}
          </Group>
        </nav>
        <div className={styles.contacts}>{contacts}</div>
        <Link href={catalogHref()} className={styles.cta} onClick={close}>
          Подобрать решение
        </Link>
      </Drawer>
    </>
  )
}
