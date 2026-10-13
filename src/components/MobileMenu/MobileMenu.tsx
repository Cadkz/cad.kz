'use client'

import { ChevronDown, Menu as MenuIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode, useCallback, useEffect, useState } from 'react'
import type { Menu } from '@/lib/navigation'
import { aboutColumns, sectionLinks } from '@/lib/siteNav'
import { Drawer } from '../Drawer/Drawer'
import { HeaderAction } from '../HeaderAction/HeaderAction'
import { WhatsappIcon } from '../icons/icons'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './MobileMenu.module.css'

type Props = { menu: Menu; contacts: ReactNode; whatsappHref: string | null }

/** Группы каталога, которые в меню телефона видны сразу. Обучение и внедрение — ссылками ниже. */
const PRODUCT_GROUPS = ['software', 'hardware']

/** Раскрывающаяся строка. Одно имя у соседних — открыта только одна, экран не тонет в списках. */
function Group({ title, name, children }: { title: string; name: string; children: ReactNode }) {
  return (
    <details className={styles.group} name={name}>
      <summary className={styles.summary}>
        {title}
        <ChevronDown size={20} strokeWidth={1.75} className={styles.chevron} aria-hidden="true" />
      </summary>
      <div className={styles.groupBody}>{children}</div>
    </details>
  )
}

/**
 * Меню для экранов уже 960 px: кнопка слева от логотипа, панель выезжает слева.
 * Сверху «Программное обеспечение» (популярные программы, затем разделы по задачам → программы),
 * и «Оборудование», ниже разделы сайта, «О компании», контакты и WhatsApp.
 */
export function MobileMenu({ menu, contacts, whatsappHref }: Props) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const pathname = usePathname()
  // biome-ignore lint/correctness/useExhaustiveDependencies: панель закрывается при переходе на другую страницу
  useEffect(() => setOpen(false), [pathname])

  const groups = menu.tabs.filter((tab) => PRODUCT_GROUPS.includes(tab.key))

  return (
    <>
      <HeaderAction
        hideFrom="md"
        icon={<MenuIcon size={24} strokeWidth={1.75} aria-hidden="true" />}
        ariaLabel="Открыть меню"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      />
      <Drawer open={open} onClose={close} title="Меню" side="left">
        <nav aria-label="Меню сайта" className={styles.nav}>
          {groups.map((tab) => (
            <Group key={tab.key} title={tab.label} name="mobile-menu">
              {tab.key === 'software' && menu.popular.length > 0 && (
                <>
                  <p className={styles.caption}>Популярные программы</p>
                  <div className={styles.popular}>
                    {menu.popular.map((card) => (
                      <Link key={card.key} href={card.href} className={styles.chip} onClick={close}>
                        {card.title}
                      </Link>
                    ))}
                  </div>
                  <p className={styles.caption}>По задачам</p>
                </>
              )}
              {tab.columns.map((column) => (
                <details key={column.title} className={styles.section} name={`menu-${tab.key}`}>
                  <summary className={styles.sectionSummary}>
                    <SectionIcon name={column.icon} size={16} className={styles.sectionIcon} />
                    <span className={styles.sectionTitle}>{column.title}</span>
                  </summary>
                  <div className={styles.sectionBody}>
                    {column.programs.map((program) => (
                      <Link
                        key={program.href}
                        href={program.href}
                        className={styles.program}
                        onClick={close}
                      >
                        {program.title}
                      </Link>
                    ))}
                    <Link href={column.allHref} className={styles.all} onClick={close}>
                      Все программы раздела
                    </Link>
                  </div>
                </details>
              ))}
              <Link href={tab.allHref} className={styles.all} onClick={close}>
                Смотреть все
              </Link>
            </Group>
          ))}
          {sectionLinks.map((item) => (
            <Link key={item.href} href={item.href} className={styles.topLink} onClick={close}>
              {item.title}
            </Link>
          ))}
          <Group title="О компании" name="mobile-menu">
            {aboutColumns.map((column) => (
              <div key={column.title} className={styles.aboutColumn}>
                <p className={styles.caption}>{column.title}</p>
                {column.links.map((item) => (
                  <Link key={item.href} href={item.href} className={styles.link} onClick={close}>
                    {item.title}
                  </Link>
                ))}
              </div>
            ))}
          </Group>
        </nav>
        <div className={styles.contacts}>
          <p className={styles.caption}>Контакты</p>
          {contacts}
        </div>
        {whatsappHref && (
          <a href={whatsappHref} className={styles.cta} target="_blank" rel="noreferrer">
            <WhatsappIcon size={20} />
            Написать в WhatsApp
          </a>
        )}
      </Drawer>
    </>
  )
}
