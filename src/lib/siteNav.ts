import { catalogHref } from './navigationHrefs'

/**
 * Постоянная структура меню сайта (разделы, а не контент).
 * Тексты страниц «О компании» — в «Страницах», переносятся со старого сайта (админка →
 * «Перенос со старого сайта»).
 */
/** Вторая строка шапки (от 960 px) и мобильное меню: разделы сайта после каталога и поиска. */
export const sectionLinks = [
  { title: 'Обучение', href: catalogHref({ group: 'service', type: 'training' }) },
  { title: 'Внедрение BIM', href: catalogHref({ group: 'service', type: 'consulting' }) },
  { title: 'Акции', href: '/news?kind=promotion' },
  // Новости и статьи — один раздел: на обеих страницах переключатель (PublicationTabs).
  { title: 'Новости и статьи', href: '/news', also: ['/articles'] },
]

/** «Новости и статьи»: переключатель между типами публикаций, адреса прежние. */
export const publicationTabs = [
  { title: 'Новости', href: '/news' },
  { title: 'Статьи', href: '/articles' },
]

/**
 * «О компании»: две группы. Только существующие страницы (тексты — в «Страницах» админки).
 * Страницы «Государственные закупки» пока нет — пункт появится вместе с текстом.
 */
export const aboutColumns = [
  {
    title: 'Компания',
    links: [
      { title: 'О CAD.kz', href: '/about' },
      { title: 'Контакты', href: '/contacts' },
      { title: 'Реквизиты', href: '/about/requisites' },
    ],
  },
  {
    title: 'Покупателям',
    links: [
      { title: 'Как купить', href: '/about/howto' },
      { title: 'Доставка', href: '/about/delivery' },
      { title: 'Гарантии', href: '/about/guaranty' },
    ],
  },
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

/** Страницы сайта для подсказок поиска: название и слова, по которым её ищут. */
export const searchPages = [
  { title: 'Каталог', href: catalogHref(), words: 'все товары программы оборудование' },
  { title: 'Новости', href: '/news', words: '' },
  { title: 'Статьи', href: '/articles', words: 'обзоры' },
  { title: 'Акции', href: '/news?kind=promotion', words: 'скидки распродажа' },
  { title: 'Как купить', href: '/about/howto', words: 'оплата заказ счёт' },
  { title: 'Доставка', href: '/about/delivery', words: '' },
  { title: 'Гарантии', href: '/about/guaranty', words: 'гарантия возврат' },
  { title: 'О компании', href: '/about', words: '' },
  { title: 'Реквизиты', href: '/about/requisites', words: 'бин иин банк' },
  { title: 'Контакты', href: '/contacts', words: 'телефон адрес офис карта' },
]

/** «Часто ищут» в пустом поле поиска. Каждый запрос что-то находит. */
export const searchHints = [
  'SCAD Office',
  'AutoCAD',
  'GEO5',
  '3D-сканер Artec',
  'ЛИРА-FEM',
  'Курсы Revit',
  'Плоттер',
]

/**
 * Примеры, которые «печатаются» в пустом поле: два круга, потом остаётся первый без движения.
 * Только запросы, которые находят товар: длинные фразы («GEO5 для расчёта оснований») обычный
 * поиск по словам пока не понимает — это работа будущего ИИ-помощника.
 */
export const typingHints = ['SCAD Office', 'GEO5', '3D-сканеры Artec', 'Курсы Revit']
