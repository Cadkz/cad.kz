import type { CollectionConfig, CollectionSlug } from 'payload'
import { isAdmin, nobody } from '../access'
import { legacyFields, textField } from '../fields'

/** Служебные журналы. Пишутся только сервером, в админке доступны на чтение администратору. */
function journal(slug: CollectionSlug, plural: string): CollectionConfig {
  return {
    slug,
    labels: { singular: plural, plural },
    access: { read: isAdmin, create: nobody, update: nobody, delete: nobody },
    fields: [
      { name: 'idempotencyKey', type: 'text', unique: true, required: true },
      { name: 'snapshot', type: 'json', required: true },
      { name: 'state', type: 'text', required: true },
    ],
  }
}

export const conversations = journal('conversations', 'Диалоги Кадди')
export const importRuns = journal('import-runs', 'Запуски импорта')

/**
 * Подключения к внешним сервисам: токены приложения Битрикс24 (открытая линия) и его состояние.
 * Токены — секрет, поэтому даже администратор не видит их в админке: состояние без токенов
 * показывает страница «Битрикс24». Пишет только сервер (src/lib/openLine/store.ts).
 */
export const integrations: CollectionConfig = {
  slug: 'integrations',
  labels: { singular: 'Подключение', plural: 'Подключения' },
  admin: { hidden: true },
  access: { read: nobody, create: nobody, update: nobody, delete: nobody },
  fields: [
    { name: 'key', type: 'text', unique: true, required: true },
    { name: 'state', type: 'json', required: true },
  ],
}

export const redirects: CollectionConfig = {
  slug: 'redirects',
  labels: { singular: 'Перенаправление', plural: 'Перенаправления' },
  admin: { useAsTitle: 'from' },
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'from', label: 'Старый адрес', type: 'text', unique: true, required: true },
    textField('to', 'Новый адрес', true),
    ...legacyFields,
  ],
}
