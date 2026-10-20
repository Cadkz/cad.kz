import type { CollectionConfig, GlobalConfig } from 'payload'
import { activityLog } from './collections/activityLog'
import { assistantKnowledge, priceTables } from './collections/assistant'
import { manufacturers, offers, productLines, products, sections } from './collections/catalog'
import { media, pages, publications, topics } from './collections/content'
import { crmDeliveries, orders, siteRequests } from './collections/orders'
import { exchangeRates, pricingSettings } from './collections/pricing'
import { sectionRules } from './collections/sectionRules'
import { conversations, importRuns, integrations, redirects } from './collections/system'
import { users } from './collections/users'
import { homePage } from './globals/homePage'
import { siteSettings } from './globals/siteSettings'
import { globalWithHistory, withHistory } from './history'

/**
 * Меню админки: группы и порядок пунктов. Payload показывает группы в порядке первого пункта,
 * поэтому порядок здесь — это порядок в меню и на главной админки. Свои страницы (загрузка
 * прайса, проверка Кадди, импорт) — в группе «Инструменты» (`AdminNavTools`). История и журнал
 * удалений подключаются здесь же (src/cms/history.ts).
 */
const MENU: { group: string; collections: CollectionConfig[]; globals: GlobalConfig[] }[] = [
  {
    group: 'Каталог',
    collections: [products, offers, sections, manufacturers, productLines, sectionRules],
    globals: [],
  },
  { group: 'Цены', collections: [exchangeRates], globals: [pricingSettings] },
  {
    group: 'Публикации',
    collections: [publications, topics, pages, media],
    globals: [homePage, siteSettings],
  },
  { group: 'Продажи', collections: [orders, siteRequests, crmDeliveries], globals: [] },
  { group: 'Кадди', collections: [assistantKnowledge, conversations, priceTables], globals: [] },
  {
    group: 'Служебное',
    collections: [activityLog, redirects, importRuns, integrations, users],
    globals: [],
  },
]

export const menuCollections: CollectionConfig[] = MENU.flatMap(({ group, collections }) =>
  collections.map((collection) =>
    withHistory({ ...collection, admin: { ...collection.admin, group } }),
  ),
)

export const menuGlobals: GlobalConfig[] = MENU.flatMap(({ group, globals }) =>
  globals.map((global) => globalWithHistory({ ...global, admin: { ...global.admin, group } })),
)
