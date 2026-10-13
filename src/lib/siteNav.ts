import { catalogHref } from './navigationHrefs'

/**
 * Постоянная структура меню сайта (разделы, а не контент).
 * Тексты страниц «О компании» — в «Страницах», переносятся со старого сайта (админка →
 * «Перенос со старого сайта»).
 */
/** Вторая строка шапки (от 960 px) и мобильное меню: разделы сайта после каталога и поиска. */
export const sectionLinks = [
  // По CRM продления не видны по названию сделки — отдельный вход первым (решение 12.10.2026).
  { title: 'Продление лицензий', href: '/renew' },
  { title: 'Обучение', href: catalogHref({ group: 'service', type: 'training' }) },
  // Отдельная страница с подробным описанием (решение владельца 13.10.2026), а не каталог услуг.
  { title: 'Внедрение BIM', href: '/bim' },
  { title: 'Акции', href: '/news?kind=promotion' },
  // Новости и статьи — один раздел: на обеих страницах переключатель (PublicationTabs).
  { title: 'Новости и статьи', href: '/news', also: ['/articles'] },
]

/**
 * Плитки после направлений на главной: оборудование и услуги — тоже входы в каталог.
 * С ними 10 направлений по CRM заполняют сетку без пустого места (12 плиток: 4 ряда по 3).
 */
export const directionExtras = [
  {
    slug: 'hardware',
    href: catalogHref({ group: 'hardware' }),
    title: 'Оборудование',
    summary: '3D-сканеры Artec, плоттеры и сканеры чертежей, рабочие станции.',
    icon: 'scan',
    tone: 'graphite' as const,
  },
  {
    slug: 'service',
    href: catalogHref({ group: 'service' }),
    title: 'Обучение и внедрение',
    summary: 'Курсы учебного центра, внедрение BIM и консалтинг.',
    icon: 'graduation',
    tone: 'blue' as const,
  },
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
  {
    title: 'Продление лицензий',
    href: '/renew',
    words: 'продлить продление обновить обновление подписка лицензия',
  },
  { title: 'Новости', href: '/news', words: '' },
  { title: 'Статьи', href: '/articles', words: 'обзоры' },
  { title: 'Акции', href: '/news?kind=promotion', words: 'скидки распродажа' },
  { title: 'Внедрение BIM', href: '/bim', words: 'бим внедрение консалтинг navisworks tdms' },
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
