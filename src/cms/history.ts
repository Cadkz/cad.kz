import type {
  CollectionBeforeChangeHook,
  CollectionConfig,
  Field,
  GlobalBeforeChangeHook,
  GlobalConfig,
} from 'payload'
import { logDelete } from './hooks/activity'

/**
 * История изменений с откатом (версии Payload) и запись удалений в «Журнал действий».
 * Версии — только снимки сохранений, без черновиков-версий и автосохранения: на бесплатной
 * базе каждая правка — одна строка в таблице версий. Число — сколько последних версий хранить.
 */
const VERSIONS: Record<string, number> = {
  products: 20,
  offers: 20,
  publications: 15,
  pages: 20,
  sections: 20,
  manufacturers: 20,
  'section-rules': 20,
  'assistant-knowledge': 20,
  'home-page': 30,
  'site-settings': 30,
  'pricing-settings': 30,
}

/** Удаление этих записей человеком попадает в журнал: как запись называется в тексте журнала. */
const DELETES: Record<string, string> = {
  products: 'товар',
  offers: 'предложение',
  publications: 'публикация',
  pages: 'страница',
  sections: 'раздел',
  manufacturers: 'производитель',
  'product-lines': 'линейка',
  'section-rules': 'правило разделов',
  topics: 'тема',
  media: 'файл',
  redirects: 'перенаправление',
  'exchange-rates': 'курс',
  users: 'пользователь',
}

const updatedByField: Field = {
  name: 'updatedBy',
  label: 'Последним правил',
  type: 'relationship',
  relationTo: 'users',
  admin: {
    position: 'sidebar',
    readOnly: true,
    // У новой записи и у правленных только сайтом (импорт) поле пустое — не показываем.
    condition: (data) => Boolean(data?.updatedBy),
    description: 'Все прошлые сохранения и откат к любому из них — вкладка «Версии» вверху.',
  },
}

const setUpdatedBy: CollectionBeforeChangeHook & GlobalBeforeChangeHook = ({ data, req }) => {
  // Пусто — правил сам сайт: импорт, загрузка прайса, автонастройка при сборке.
  if (data) data.updatedBy = req.user?.id ?? null
  return data
}

/** Коллекция с историей и записью удалений, если она в списках выше. */
export function withHistory(collection: CollectionConfig): CollectionConfig {
  const max = VERSIONS[collection.slug]
  const deleted = DELETES[collection.slug]
  const hooks = { ...collection.hooks }
  if (deleted) hooks.afterDelete = [...(hooks.afterDelete ?? []), logDelete(deleted)]
  if (!max) return { ...collection, hooks }
  hooks.beforeChange = [...(hooks.beforeChange ?? []), setUpdatedBy]
  return {
    ...collection,
    hooks,
    versions: { maxPerDoc: max, drafts: false },
    fields: [...collection.fields, updatedByField],
  }
}

/** Глобальные настройки (главная, контакты, НДС) с историей. */
export function globalWithHistory(global: GlobalConfig): GlobalConfig {
  const max = VERSIONS[global.slug]
  if (!max) return global
  return {
    ...global,
    hooks: { ...global.hooks, beforeChange: [...(global.hooks?.beforeChange ?? []), setUpdatedBy] },
    versions: { max, drafts: false },
    fields: [...global.fields, updatedByField],
  }
}
