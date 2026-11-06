'use client'

import { ArrowRight, ChevronDown, LayoutGrid, Menu, Search } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useState } from 'react'
import Link from '@/components/LangLink/LangLink'
import { groupAllLabel, POPULAR_LABEL } from '@/domain/catalogNavigation.mjs'
import type { MenuTab } from '@/lib/navigation'
import { catalogHref } from '@/lib/navigationHrefs'
import { openSiteSearch } from '@/lib/openSiteSearch'
import type { PopularCardData } from '@/lib/popular'
import { aboutColumns, sectionLinks } from '@/lib/siteNav'
import { Drawer } from '../Drawer/Drawer'
import { HeaderAction } from '../HeaderAction/HeaderAction'
import { WhatsappIcon } from '../icons/icons'
import { usePagePath, useT } from '../LangProvider/LangProvider'
import { MenuPopular } from '../MenuPopular/MenuPopular'
import { MobileVendors } from '../MobileVendors/MobileVendors'
import { SectionArt } from '../SectionArt/SectionArt'
import styles from './MobileMenu.module.css'

type Props = {
  menu: MenuTab[]
  popular: PopularCardData[]
  contacts: ReactNode
  whatsappHref: string | null
}

/** Группы каталога, которые в меню телефона видны сразу. Обучение и внедрение — ссылками ниже. */
const PRODUCT_GROUPS = ['software', 'hardware']

/** Раскрывающаяся строка. Одно имя у соседних — открыта только одна, экран не тонет в списках. */
function Group({
  title,
  name,
  open,
  children,
}: {
  title: string
  name: string
  open?: boolean
  children: ReactNode
}) {
  return (
    <details className={styles.group} name={name} open={open}>
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
 * Первой строкой — поиск (на телефоне его нет в шапке, решение владельца 06.11.2026),
 * затем «Весь каталог», «Популярные решения» (раскрыты сразу), затем «Программное обеспечение» и «Оборудование»
 * (разделы → производители → товары),
 * ниже разделы сайта, «О компании», язык сайта, контакты и WhatsApp.
 */
export function MobileMenu({ menu, popular, contacts, whatsappHref }: Props) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const pathname = usePagePath()
  // biome-ignore lint/correctness/useExhaustiveDependencies: панель закрывается при переходе на другую страницу
  useEffect(() => setOpen(false), [pathname])

  const groups = menu.filter((tab) => PRODUCT_GROUPS.includes(tab.key))

  return (
    <>
      <HeaderAction
        hideFrom="md"
        icon={<Menu size={24} strokeWidth={1.75} aria-hidden="true" />}
        ariaLabel={t('Открыть меню')}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      />
      <Drawer open={open} onClose={close} title={t('Меню')} side="left">
        {/* Поле-кнопка: открывает поиск на весь экран, меню закрывается. От 640 px поле в шапке. */}
        <button
          type="button"
          className={styles.search}
          onClick={() => {
            close()
            openSiteSearch()
          }}
        >
          <Search size={20} strokeWidth={1.75} aria-hidden="true" />
          {t('Поиск по каталогу')}
        </button>
        <nav aria-label={t('Меню сайта')} className={styles.nav}>
          <Link href={catalogHref()} className={styles.catalog} onClick={close}>
            <LayoutGrid size={20} strokeWidth={1.75} aria-hidden="true" />
            {t('Весь каталог')}
            <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" className={styles.arrow} />
          </Link>
          {popular.length > 0 && (
            <Group title={t(POPULAR_LABEL)} name="mobile-menu" open>
              <MenuPopular cards={popular} onNavigate={close} compact />
            </Group>
          )}
          {groups.map((tab) => (
            <Group key={tab.key} title={t(tab.label)} name="mobile-menu">
              {tab.columns.map((column) => (
                <details key={column.title} className={styles.section} name={`menu-${tab.key}`}>
                  <summary className={styles.sectionSummary}>
                    <SectionArt
                      slug={column.slug}
                      icon={column.icon}
                      size={48}
                      className={styles.sectionIcon}
                    />
                    <span className={styles.sectionTitle}>{t(column.title)}</span>
                  </summary>
                  <div className={styles.sectionBody}>
                    <MobileVendors column={column} onNavigate={close} />
                    <Link href={column.allHref} className={styles.all} onClick={close}>
                      {t('Все товары раздела')}
                    </Link>
                  </div>
                </details>
              ))}
              <Link href={tab.allHref} className={styles.all} onClick={close}>
                {t(groupAllLabel(tab.key))}
              </Link>
            </Group>
          ))}
          {sectionLinks.map((item) => (
            <Link key={item.href} href={item.href} className={styles.topLink} onClick={close}>
              {t(item.title)}
            </Link>
          ))}
          <Group title={t('О компании')} name="mobile-menu">
            {aboutColumns.map((column) => (
              <div key={column.title} className={styles.aboutColumn}>
                <p className={styles.caption}>{t(column.title)}</p>
                {column.links.map((item) => (
                  <Link key={item.href} href={item.href} className={styles.link} onClick={close}>
                    {t(item.title)}
                  </Link>
                ))}
              </div>
            ))}
          </Group>
        </nav>
        <div className={styles.contacts}>
          <p className={styles.caption}>{t('Контакты')}</p>
          {contacts}
        </div>
        {whatsappHref && (
          <a href={whatsappHref} className={styles.cta} target="_blank" rel="noreferrer">
            <WhatsappIcon size={20} />
            {t('Написать в WhatsApp')}
          </a>
        )}
      </Drawer>
    </>
  )
}
