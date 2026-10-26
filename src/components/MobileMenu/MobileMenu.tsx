'use client'

import { Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { POPULAR_LABEL } from '@/domain/catalogNavigation.mjs'
import type { MenuTab } from '@/lib/navigation'
import type { PopularCardData } from '@/lib/popular'
import { aboutColumns, sectionLinks } from '@/lib/siteNav'
import { Drawer } from '../Drawer/Drawer'
import { HeaderAction } from '../HeaderAction/HeaderAction'
import { WhatsappIcon } from '../icons/icons'
import { MenuPopular } from '../MenuPopular/MenuPopular'
import { MobileMenuGroup } from '../MobileMenuGroup/MobileMenuGroup'
import { MobileVendors } from '../MobileVendors/MobileVendors'
import styles from './MobileMenu.module.css'

type Props = {
  menu: MenuTab[]
  popular: PopularCardData[]
  contacts: ReactNode
  whatsappHref: string | null
}

/** Те же группы и порядок, что в каталоге и мегаменю. */
const PRODUCT_GROUPS = ['software', 'hardware', 'service']

/**
 * Меню для экранов уже 960 px: кнопка слева от логотипа, панель выезжает слева.
 * Сверху «Популярные решения» (раскрыты сразу), затем «Программное обеспечение» и «Оборудование»
 * (товары сразу, направление и производитель — фильтры),
 * ниже разделы сайта, «О компании», контакты и WhatsApp.
 */
export function MobileMenu({ menu, popular, contacts, whatsappHref }: Props) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const pathname = usePathname()
  // biome-ignore lint/correctness/useExhaustiveDependencies: панель закрывается при переходе на другую страницу
  useEffect(() => setOpen(false), [pathname])

  const groups = menu.filter((tab) => PRODUCT_GROUPS.includes(tab.key))

  return (
    <>
      <HeaderAction
        hideFrom="md"
        icon={<Menu size={24} strokeWidth={1.75} aria-hidden="true" />}
        ariaLabel="Открыть меню"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      />
      <Drawer open={open} onClose={close} title="Меню" side="left">
        <nav aria-label="Меню сайта" className={styles.nav}>
          {popular.length > 0 && (
            <MobileMenuGroup title={POPULAR_LABEL} name="mobile-menu" open>
              <MenuPopular cards={popular} onNavigate={close} compact />
            </MobileMenuGroup>
          )}
          {groups.map((tab) => (
            <MobileMenuGroup key={tab.key} title={tab.label} name="mobile-menu">
              <MobileVendors tab={tab} onNavigate={close} />
              <Link href={tab.allHref} className={styles.all} onClick={close}>
                Смотреть все
              </Link>
            </MobileMenuGroup>
          ))}
          {sectionLinks.map((item) => (
            <Link key={item.href} href={item.href} className={styles.topLink} onClick={close}>
              {item.title}
            </Link>
          ))}
          <MobileMenuGroup title="О компании" name="mobile-menu">
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
          </MobileMenuGroup>
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
