import type { CollectionConfig, GlobalConfig } from 'payload'
import { activityLog } from './collections/activityLog'
import { assistantKnowledge, priceTables } from './collections/assistant'
import { manufacturers, offers, productLines, products, sections } from './collections/catalog'
import { media, pages, publications, topics } from './collections/content'
import { crmDeliveries, orders, siteRequests } from './collections/orders'
import { exchangeRates, pricingSettings } from './collections/pricing'
import { sectionRules } from './collections/sectionRules'
import {
  conversations,
  importRuns,
  integrations,
  redirects,
  searchQueries,
} from './collections/system'
import { users } from './collections/users'
import { homePage } from './globals/homePage'
import { siteSettings } from './globals/siteSettings'
import { globalWithHistory, withHistory } from './history'
import { withSiteCache, withSiteCacheGlobal } from './hooks/siteCache'

/**
 * Группы коллекций для Payload и подключение истории (src/cms/history.ts). Само меню и главную
 * админки Payload из этих групп не строит: меню по задачам — src/domain/adminMenu.mjs. Группы
 * названы так же, чтобы в местах, где Payload их всё же показывает, не было старых названий.
 */
const MENU: { group: string; collections: CollectionConfig[]; globals: GlobalConfig[] }[] = [
  // Порядок коллекций влияет на схему базы (список коллекций у готовых видов списков):
  // товары, предложения, публикации — как было, иначе понадобится миграция.
  { group: 'Каталог', collections: [products, offers], globals: [] },
  {
    group: 'Контент',
    collections: [publications, pages, topics, media],
    globals: [homePage, siteSettings],
  },
  { group: 'Продажи', collections: [siteRequests, orders], globals: [] },
  { group: 'Кадди', collections: [conversations, assistantKnowledge, priceTables], globals: [] },
  {
    group: 'Настройки',
    collections: [
      sections,
      manufacturers,
      productLines,
      sectionRules,
      exchangeRates,
      redirects,
      activityLog,
      crmDeliveries,
      importRuns,
      integrations,
      users,
      searchQueries,
    ],
    globals: [pricingSettings],
  },
]

export const menuCollections: CollectionConfig[] = MENU.flatMap(({ group, collections }) =>
  collections.map((collection) =>
    withSiteCache(withHistory({ ...collection, admin: { ...collection.admin, group } })),
  ),
)

export const menuGlobals: GlobalConfig[] = MENU.flatMap(({ group, globals }) =>
  globals.map((global) =>
    withSiteCacheGlobal(globalWithHistory({ ...global, admin: { ...global.admin, group } })),
  ),
)
