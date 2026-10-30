// @ts-check
/**
 * Поиск по админке (просьба владельца 30.10.2026: «там что-то найти очень сложно»). Ищет сразу
 * в страницах админки (по названию и словам-подсказкам) и в записях: товары, разделы,
 * публикации, база Кадди, заказы и заявки. Права те же, что в списках: чего человек не видит
 * в меню, того не найдёт и поиском.
 */

/** Не короче — иначе находится всё подряд. */
export const SEARCH_MIN = 2
/** Записей в одной группе результатов. */
export const SEARCH_LIMIT = 6

/**
 * Свои страницы и частые списки. words — как их могут искать другими словами.
 * @type {{ label: string, href: string, words: string, adminOnly?: boolean }[]}
 */
export const ADMIN_PAGES = [
  {
    label: 'Каталог деревом',
    href: '/admin/catalog',
    words: 'товары разделы производители сорт активность',
  },
  { label: 'Цены таблицей', href: '/admin/prices', words: 'предложения стоимость тенге' },
  { label: 'Загрузить прайс', href: '/admin/price-list', words: 'excel 1с файл цены' },
  { label: 'Курсы валют', href: '/admin/rates', words: 'доллар евро рубль курс' },
  {
    label: 'Контроль качества',
    href: '/admin/quality',
    words: 'неполные карточки ошибки заполненность',
  },
  {
    label: 'Прайс и база Кадди',
    href: '/admin/kaddi-data',
    words: 'кадди ассистент чат прайс-лист autodesk faq',
  },
  {
    label: 'Проверка Кадди',
    href: '/admin/assistant-check',
    words: 'кадди тест вопросы отчёт ассистент чат',
  },
  {
    label: 'База знаний Кадди',
    href: '/admin/collections/assistant-knowledge',
    words: 'кадди факты справка faq',
  },
  {
    label: 'Диалоги Кадди',
    href: '/admin/collections/conversations',
    words: 'кадди переписка чат разговоры консультант',
  },
  {
    label: 'Главная страница сайта',
    href: '/admin/globals/home-page',
    words: 'баннер первый экран вопросы faq',
  },
  {
    label: 'Настройки сайта',
    href: '/admin/globals/site-settings',
    words: 'телефон почта адрес соцсети подвал шапка',
  },
  {
    label: 'Новости, статьи, акции',
    href: '/admin/collections/publications',
    words: 'публикации блог',
  },
  {
    label: 'Страницы',
    href: '/admin/collections/pages',
    words: 'о компании доставка оплата гарантия',
  },
  {
    label: 'Картинки и файлы',
    href: '/admin/collections/media',
    words: 'фото изображения медиа загрузка',
  },
  { label: 'Заказы', href: '/admin/collections/orders', words: 'корзина покупки оформление' },
  {
    label: 'Заявки',
    href: '/admin/collections/site-requests',
    words: 'запрос цены продление формы лиды',
  },
  { label: 'Битрикс24', href: '/admin/bitrix24', words: 'crm лиды вебхук', adminOnly: true },
  {
    label: 'Импорт из Битрикса',
    href: '/admin/import-bitrix',
    words: 'перенос каталог',
    adminOnly: true,
  },
  {
    label: 'Перенаправления',
    href: '/admin/collections/redirects',
    words: 'редиректы 301 старые адреса',
    adminOnly: true,
  },
  {
    label: 'Пользователи',
    href: '/admin/collections/users',
    words: 'доступ роли пароль',
    adminOnly: true,
  },
]

/**
 * Где искать записи: коллекция, подпись группы, поля поиска, поле подписи и пояснения.
 * @type {{ collection: string, label: string, fields: string[], title: string, note?: string }[]}
 */
export const SEARCH_COLLECTIONS = [
  {
    collection: 'products',
    label: 'Товары',
    fields: ['title', 'searchAliases', 'slug'],
    title: 'title',
    note: 'slug',
  },
  { collection: 'sections', label: 'Разделы каталога', fields: ['title', 'slug'], title: 'title' },
  { collection: 'manufacturers', label: 'Производители', fields: ['title'], title: 'title' },
  { collection: 'product-lines', label: 'Линейки', fields: ['title'], title: 'title' },
  {
    collection: 'publications',
    label: 'Новости, статьи, акции',
    fields: ['title', 'slug'],
    title: 'title',
  },
  { collection: 'pages', label: 'Страницы', fields: ['title', 'slug'], title: 'title' },
  { collection: 'topics', label: 'Темы новостей', fields: ['title'], title: 'title' },
  {
    collection: 'assistant-knowledge',
    label: 'База знаний Кадди',
    fields: ['text', 'product'],
    title: 'text',
    note: 'product',
  },
  {
    collection: 'orders',
    label: 'Заказы',
    fields: ['number', 'contactName', 'contactPhone', 'companyName'],
    title: 'number',
    note: 'contactName',
  },
  {
    collection: 'site-requests',
    label: 'Заявки',
    fields: ['number', 'contactName', 'contactPhone', 'productTitle'],
    title: 'number',
    note: 'productTitle',
  },
]

/** Строка поиска: без лишних пробелов, не длиннее 80 знаков. Пустая или короткая — null. */
export function searchQuery(/** @type {unknown} */ value) {
  if (typeof value !== 'string') return null
  const query = value.replace(/\s+/g, ' ').trim().slice(0, 80)
  return query.length >= SEARCH_MIN ? query : null
}

const norm = (/** @type {string} */ text) => text.toLowerCase().replaceAll('ё', 'е')

/**
 * Страницы админки под запрос: все слова запроса есть в названии или подсказках.
 * @param {string} query
 * @param {boolean} isAdmin
 */
export function matchPages(query, isAdmin) {
  const words = norm(query).split(' ').filter(Boolean)
  return ADMIN_PAGES.filter((page) => isAdmin || !page.adminOnly)
    .filter((page) => {
      const hay = norm(`${page.label} ${page.words}`)
      return words.every((word) => hay.includes(word))
    })
    .map(({ label, href }) => ({ label, href }))
}

/** Подпись записи: первая строка, не длиннее 90 знаков. */
export function shortLabel(/** @type {unknown} */ value) {
  if (typeof value !== 'string' && typeof value !== 'number') return ''
  const line = String(value).split('\n')[0].trim()
  return line.length > 90 ? `${line.slice(0, 89)}…` : line
}
