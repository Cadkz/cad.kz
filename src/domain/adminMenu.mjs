/**
 * Меню админки «чтобы было понятно без обучения» (замечание владельца 23.10.2026): сверху
 * «Главное» — то, чем пользуются каждый день, крупно и с иконками; дальше обычные группы
 * Payload без пунктов из «Главного»; редкое и техническое — в свёрнутом «Ещё».
 */

/**
 * «Главное»: подпись, адрес, иконка (ключ в компоненте) и что нужно для доступа: коллекция или
 * глобальная настройка (право чтения), либо своя страница (администратор и маркетолог).
 * @type {{ label: string, href: string, icon: string, collection?: string, global?: string }[]}
 */
export const MAIN_LINKS = [
  { label: 'Каталог', href: '/admin/catalog', icon: 'catalog' },
  { label: 'Цены', href: '/admin/prices', icon: 'prices' },
  {
    label: 'Главная страница сайта',
    href: '/admin/globals/home-page',
    icon: 'home',
    global: 'home-page',
  },
  {
    label: 'Новости, статьи, акции',
    href: '/admin/collections/publications',
    icon: 'news',
    collection: 'publications',
  },
  { label: 'Заказы', href: '/admin/collections/orders', icon: 'orders', collection: 'orders' },
  {
    label: 'Заявки',
    href: '/admin/collections/site-requests',
    icon: 'requests',
    collection: 'site-requests',
  },
  {
    label: 'Картинки и файлы',
    href: '/admin/collections/media',
    icon: 'media',
    collection: 'media',
  },
]

/** Редкое и техническое: в свёрнутой группе «Ещё», а не в общих группах. */
export const MORE_COLLECTIONS = [
  'offers',
  'product-lines',
  'section-rules',
  'exchange-rates',
  'crm-deliveries',
  'price-tables',
  'activity-log',
  'redirects',
  'import-runs',
  'integrations',
  'users',
]
export const MORE_GLOBALS = ['pricing-settings']

/**
 * Что показывать в обычных группах Payload: всё видимое, кроме пунктов «Главного» и «Ещё».
 * @template {string} C
 * @template {string} G
 * @param {{ collections: C[], globals: G[] }} visible
 * @returns {{ collections: C[], globals: G[] }}
 */
export function groupEntities(visible) {
  const mainCollections = new Set(MAIN_LINKS.flatMap((link) => link.collection ?? []))
  const mainGlobals = new Set(MAIN_LINKS.flatMap((link) => link.global ?? []))
  return {
    collections: visible.collections.filter(
      (slug) => !mainCollections.has(slug) && !MORE_COLLECTIONS.includes(slug),
    ),
    globals: visible.globals.filter(
      (slug) => !mainGlobals.has(slug) && !MORE_GLOBALS.includes(slug),
    ),
  }
}
