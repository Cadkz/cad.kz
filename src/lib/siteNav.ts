import { catalogHref } from './navigationHrefs'

/**
 * Постоянная структура меню сайта (разделы, а не контент).
 * Ссылки «О компании» пока ведут на действующий cad.kz: этих страниц в новом сайте ещё нет.
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
      { title: 'Как купить', href: 'https://cad.kz/about/howto/' },
      { title: 'Доставка', href: 'https://cad.kz/about/delivery/' },
      { title: 'Гарантии', href: 'https://cad.kz/about/guaranty/' },
    ],
  },
  {
    title: 'О компании',
    links: [
      { title: 'Реквизиты', href: 'https://cad.kz/about/essentials.php' },
      { title: 'Производители', href: 'https://cad.kz/about/manufacturer/' },
      { title: 'Наша команда', href: 'https://cad.kz/about/team/' },
      { title: 'Вакансии', href: 'https://cad.kz/about/vacancies/' },
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
      { title: 'Как купить', href: 'https://cad.kz/about/howto/' },
      { title: 'Реквизиты', href: 'https://cad.kz/about/essentials.php' },
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
