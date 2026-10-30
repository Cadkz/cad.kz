// @ts-check
import { listHref } from './adminLinks.mjs'

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

/** Событие окна: кнопка-лупа в шапке просит открыть поиск в меню. */
export const OPEN_ADMIN_SEARCH = 'cad:open-admin-search'

/**
 * Клавиша поиска (пожелание владельца 30.10.2026): «/», как на GitHub и YouTube, — когда курсор
 * не в поле ввода; запасная Ctrl+K (Cmd+K) — кроме текста описаний, где это ссылка.
 * Клавиши узнаём и по месту на клавиатуре (code): в русской раскладке та же кнопка даёт «л»
 * вместо «k» и «.» вместо «/», и без этого Ctrl+K уходил браузеру — в поиск Google.
 * @param {{ key: string, code?: string, ctrlKey: boolean, metaKey: boolean, altKey: boolean,
 *   shiftKey?: boolean }} event
 * @param {{ typing: boolean, richText: boolean }} place — курсор в поле ввода; в тексте описания
 * @returns {boolean}
 */
export function isSearchHotkey(event, place) {
  const modifier = event.ctrlKey || event.metaKey
  const slash = event.key === '/' || (event.code === 'Slash' && !event.shiftKey)
  if (slash && !modifier && !event.altKey) return !place.typing
  const k = event.key.toLowerCase() === 'k' || event.code === 'KeyK'
  if (modifier && k && !event.altKey) return !place.richText
  return false
}

/**
 * Свои страницы и частые списки. words — как их могут искать другими словами.
 * @type {{ label: string, href: string, words: string, adminOnly?: boolean }[]}
 */
export const ADMIN_PAGES = [
  {
    label: 'Каталог',
    href: '/admin/catalog',
    words: 'деревом товары разделы производители сорт активность',
  },
  { label: 'Цены', href: '/admin/prices', words: 'таблицей предложения стоимость тенге' },
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
    adminOnly: true,
  },
  {
    label: 'Главная сайта',
    href: '/admin/globals/home-page',
    words: 'баннер первый экран вопросы faq',
  },
  {
    label: 'Контакты и подвал',
    href: '/admin/globals/site-settings',
    words: 'телефон почта адрес соцсети подвал шапка',
  },
  {
    label: 'Новости, статьи, акции',
    href: '/admin/collections/publications',
    words: 'публикации блог',
  },
  {
    label: 'Страницы сайта',
    href: '/admin/collections/pages',
    words: 'о компании доставка оплата гарантия',
  },
  {
    label: 'Картинки и файлы',
    href: '/admin/collections/media',
    words: 'фото изображения медиа загрузка',
  },
  {
    label: 'Заказы',
    href: '/admin/collections/orders',
    words: 'корзина покупки оформление',
    adminOnly: true,
  },
  {
    label: 'Заявки',
    href: '/admin/collections/site-requests',
    words: 'запрос цены продление формы лиды',
    adminOnly: true,
  },
  {
    label: 'НДС и настройки цены',
    href: '/admin/globals/pricing-settings',
    words: 'ндс налог цены настройки',
  },
  {
    label: 'Разделы каталога',
    href: '/admin/collections/sections',
    words: 'категории структура каталога',
  },
  { label: 'Производители', href: '/admin/collections/manufacturers', words: 'вендоры бренды' },
  {
    label: 'Линейки производителей',
    href: '/admin/collections/product-lines',
    words: 'папки серии',
  },
  { label: 'Товары списком', href: '/admin/collections/products', words: 'все товары таблица' },
  {
    label: 'Журнал действий',
    href: '/admin/collections/activity-log',
    words: 'история кто изменил удаления',
  },
  {
    label: 'Перенос со старого сайта',
    href: '/admin/legacy-content',
    words: 'старый cad.kz тексты публикации миграция',
    adminOnly: true,
  },
  {
    label: 'Запуски импорта',
    href: '/admin/collections/import-runs',
    words: 'отчёты отчет настройки импорт',
    adminOnly: true,
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

/** Товары на сайте (для готовых подборок в командах). */
const PUBLISHED = { status: { equals: 'published' } }

/**
 * Команды словами (исследование ChatGPT, 30.10.2026): «новость» — создать новость, «прайс» —
 * загрузить прайс, «без цены» — список товаров без цены. Показываются группой «Действия» первыми.
 * @type {{ label: string, href: string, words: string, adminOnly?: boolean }[]}
 */
export const ADMIN_ACTIONS = [
  {
    label: '+ Новость',
    href: '/admin/collections/publications/create?kind=news',
    words: 'новость создать добавить написать',
  },
  {
    label: '+ Акция',
    href: '/admin/collections/publications/create?kind=promotion',
    words: 'акция скидка создать добавить',
  },
  {
    label: '+ Статья',
    href: '/admin/collections/publications/create?kind=article',
    words: 'статья создать добавить написать',
  },
  {
    label: '+ Товар',
    href: '/admin/collections/products/create',
    words: 'товар создать добавить новый',
  },
  {
    label: 'Загрузить прайс',
    href: '/admin/price-list',
    words: 'прайс загрузить excel файл цены',
  },
  {
    label: 'Новый курс валюты',
    href: '/admin/rates',
    words: 'курс доллар евро рубль валюта',
  },
  {
    label: 'Товары на сайте без цены',
    href: listHref('products', [PUBLISHED, { qualityGaps: { in: ['price'] } }]),
    words: 'без цены нет цены',
  },
  {
    label: 'Товары на сайте без картинки',
    href: listHref('products', [PUBLISHED, { qualityGaps: { in: ['image'] } }]),
    words: 'без картинки нет картинки фото',
  },
  {
    label: 'Новые заявки',
    href: '/admin/collections/site-requests?sort=-createdAt',
    words: 'заявки новые сегодня лиды',
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
 * Страницы админки (или команды) под запрос: все слова запроса есть в названии или подсказках.
 * @param {string} query
 * @param {boolean} isAdmin
 * @param {{ label: string, href: string, words: string, adminOnly?: boolean }[]} [list]
 */
export function matchPages(query, isAdmin, list = ADMIN_PAGES) {
  const words = norm(query).split(' ').filter(Boolean)
  return list
    .filter((page) => isAdmin || !page.adminOnly)
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
