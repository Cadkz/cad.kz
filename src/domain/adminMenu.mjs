// @ts-check
/**
 * Меню админки по задачам (решение владельца 30.10.2026, по исследованию ChatGPT «Как упростить
 * админку»): одно меню без слоёв «Главное / группы Payload / Ещё». Каждый пункт — один раз.
 * Что делает маркетолог каждый день — сверху; настройки — внизу и свёрнуты. Завершённые переезды
 * (импорт из Битрикса, перенос со старого сайта, запуски импорта) в меню не показываются:
 * страницы остались и находятся поиском (src/domain/adminSearch.mjs).
 *
 * Доступ пункта: коллекция или глобальная настройка — право чтения; своя страница — `staff`
 * (администратор и маркетолог) или `admin` (только администратор).
 */

/**
 * @typedef {{
 *   label: string,
 *   href: string,
 *   icon?: string,
 *   collection?: string,
 *   global?: string,
 *   access?: 'staff' | 'admin',
 * }} MenuLink
 * @typedef {{ label: string, links: MenuLink[], collapsed?: boolean }} MenuGroup
 */

/**
 * Главная админки — первой строкой, без заголовка группы.
 * @type {MenuLink}
 */
export const HOME_LINK = { label: 'Главная', href: '/admin', icon: 'dashboard' }

/** @type {MenuGroup[]} */
export const MENU = [
  {
    label: 'Каталог',
    links: [
      { label: 'Каталог', href: '/admin/catalog', icon: 'catalog', access: 'staff' },
      { label: 'Цены', href: '/admin/prices', icon: 'prices', access: 'staff' },
      { label: 'Контроль качества', href: '/admin/quality', icon: 'quality', access: 'staff' },
    ],
  },
  {
    label: 'Контент',
    links: [
      {
        label: 'Новости, статьи, акции',
        href: '/admin/collections/publications',
        icon: 'news',
        collection: 'publications',
      },
      {
        label: 'Страницы сайта',
        href: '/admin/collections/pages',
        icon: 'pages',
        collection: 'pages',
      },
      {
        label: 'Главная сайта',
        href: '/admin/globals/home-page',
        icon: 'home',
        global: 'home-page',
      },
      {
        label: 'Контакты и подвал',
        href: '/admin/globals/site-settings',
        icon: 'footer',
        global: 'site-settings',
      },
      {
        label: 'Темы новостей',
        href: '/admin/collections/topics',
        icon: 'topics',
        collection: 'topics',
      },
      {
        label: 'Картинки и файлы',
        href: '/admin/collections/media',
        icon: 'media',
        collection: 'media',
      },
    ],
  },
  {
    label: 'Продажи',
    links: [
      {
        label: 'Заявки',
        href: '/admin/collections/site-requests',
        icon: 'requests',
        collection: 'site-requests',
      },
      { label: 'Заказы', href: '/admin/collections/orders', icon: 'orders', collection: 'orders' },
    ],
  },
  {
    label: 'Кадди',
    links: [
      {
        label: 'Диалоги',
        href: '/admin/collections/conversations',
        icon: 'dialogs',
        collection: 'conversations',
      },
      {
        label: 'База знаний',
        href: '/admin/collections/assistant-knowledge',
        icon: 'knowledge',
        collection: 'assistant-knowledge',
      },
      { label: 'Проверка Кадди', href: '/admin/assistant-check', icon: 'check', access: 'staff' },
      { label: 'Прайс и база', href: '/admin/kaddi-data', icon: 'data', access: 'staff' },
    ],
  },
  {
    label: 'Настройки',
    collapsed: true,
    links: [
      { label: 'Разделы каталога', href: '/admin/collections/sections', collection: 'sections' },
      {
        label: 'Производители',
        href: '/admin/collections/manufacturers',
        collection: 'manufacturers',
      },
      {
        label: 'Линейки производителей',
        href: '/admin/collections/product-lines',
        collection: 'product-lines',
      },
      {
        label: 'Правила разделов',
        href: '/admin/collections/section-rules',
        collection: 'section-rules',
      },
      { label: 'Предложения списком', href: '/admin/collections/offers', collection: 'offers' },
      {
        label: 'НДС и настройки цены',
        href: '/admin/globals/pricing-settings',
        global: 'pricing-settings',
      },
      { label: 'Перенаправления', href: '/admin/collections/redirects', collection: 'redirects' },
      {
        label: 'Журнал действий',
        href: '/admin/collections/activity-log',
        collection: 'activity-log',
      },
      { label: 'Битрикс24', href: '/admin/bitrix24', access: 'admin' },
      {
        label: 'Передача в CRM',
        href: '/admin/collections/crm-deliveries',
        collection: 'crm-deliveries',
      },
      { label: 'Пользователи', href: '/admin/collections/users', collection: 'users' },
    ],
  },
]

/**
 * Что нужно для пункта. Коллекции и настройки — по праву чтения, свои страницы — по роли.
 * @typedef {{ role?: string, canRead: (kind: 'collection' | 'global', slug: string) => boolean }} MenuAccess
 * @param {MenuLink} link
 * @param {MenuAccess} access
 */
export function canSee(link, { role, canRead }) {
  if (link.collection) return canRead('collection', link.collection)
  if (link.global) return canRead('global', link.global)
  if (link.access === 'admin') return role === 'admin'
  if (link.access === 'staff') return role === 'admin' || role === 'editor'
  return true
}

/**
 * Меню для человека: только доступные пункты, пустые группы не показываются.
 * @param {MenuAccess} access
 * @param {MenuGroup[]} [menu]
 * @returns {MenuGroup[]}
 */
export function visibleMenu(access, menu = MENU) {
  return menu
    .map((group) => ({ ...group, links: group.links.filter((link) => canSee(link, access)) }))
    .filter((group) => group.links.length > 0)
}

/**
 * Активный пункт: адрес совпадает или открыта запись внутри раздела (`…/publications/12`).
 * Главная — только сама `/admin`.
 * @param {string} href
 * @param {string} pathname
 */
export function isActive(href, pathname) {
  if (href === HOME_LINK.href) return pathname === href || pathname === `${href}/`
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * Вкладки над страницами одного дела (исследование ChatGPT, 30.10.2026): всё про цены — в одном
 * месте, а списки каталога — изнутри «Каталога», а не отдельными пунктами меню.
 * @type {Record<'prices' | 'catalog', { label: string, href: string }[]>}
 */
export const PAGE_TABS = {
  prices: [
    { label: 'Таблица цен', href: '/admin/prices' },
    { label: 'Загрузить прайс', href: '/admin/price-list' },
    { label: 'Курсы валют', href: '/admin/rates' },
    { label: 'НДС и настройки', href: '/admin/globals/pricing-settings' },
  ],
  catalog: [
    { label: 'Каталог деревом', href: '/admin/catalog' },
    { label: 'Все товары списком', href: '/admin/collections/products' },
    { label: 'Разделы', href: '/admin/collections/sections' },
    { label: 'Производители', href: '/admin/collections/manufacturers' },
    { label: 'Линейки', href: '/admin/collections/product-lines' },
    { label: 'Правила разделов', href: '/admin/collections/section-rules' },
  ],
}
