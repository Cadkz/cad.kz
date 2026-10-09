import { catalogHref } from './navigationHrefs'

/**
 * Постоянная структура меню сайта (разделы, а не контент).
 * Тексты страниц «О компании» — в «Страницах», переносятся со старого сайта (админка →
 * «Перенос со старого сайта»).
 */
export const newsLinks = [
  { title: 'Новости', href: '/news' },
  { title: 'Статьи', href: '/articles' },
  { title: 'Акции', href: '/news?kind=promotion' },
]

export const aboutColumns = [
  {
    title: 'Покупателям',
    links: [
      { title: 'Как купить', href: '/about/howto' },
      { title: 'Доставка', href: '/about/delivery' },
      { title: 'Гарантии', href: '/about/guaranty' },
    ],
  },
  {
    title: 'О компании',
    links: [
      { title: 'О компании', href: '/about' },
      { title: 'Реквизиты', href: '/about/requisites' },
      { title: 'Контакты', href: '/contacts' },
    ],
  },
]

export const plainLinks = [
  { title: 'Акции', href: '/news?kind=promotion' },
  { title: 'Обучение', href: catalogHref({ group: 'service' }) },
]

export const footerColumns = [
  {
    title: 'О магазине',
    links: [
      { title: 'Новости', href: '/news' },
      { title: 'Акции', href: '/news?kind=promotion' },
      { title: 'Как купить', href: '/about/howto' },
      { title: 'О компании', href: '/about' },
      { title: 'Контакты', href: '/contacts' },
    ],
  },
  {
    title: 'Каталог',
    links: [
      { title: 'Программное обеспечение', href: catalogHref({ group: 'software' }) },
      { title: 'Оборудование', href: catalogHref({ group: 'hardware' }) },
      { title: 'Услуги и обучение', href: catalogHref({ group: 'service' }) },
    ],
  },
]
