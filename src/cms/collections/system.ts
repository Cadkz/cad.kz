import type { CollectionConfig, CollectionSlug } from 'payload'
import { isAdmin, nobody } from '../access'
import { legacyFields, textField } from '../fields'

/** Служебные журналы. Пишутся только сервером, в админке доступны на чтение администратору. */
function journal(slug: CollectionSlug, plural: string): CollectionConfig {
  return {
    slug,
    labels: { singular: plural, plural },
    admin: { group: 'Система' },
    access: { read: isAdmin, create: nobody, update: nobody, delete: nobody },
    fields: [
      { name: 'idempotencyKey', type: 'text', unique: true, required: true },
      { name: 'snapshot', type: 'json', required: true },
      { name: 'state', type: 'text', required: true },
    ],
  }
}

export const orders = journal('orders', 'Заказы')
export const conversations = journal('conversations', 'Диалоги консультанта')
export const crmDeliveries = journal('crm-deliveries', 'Передача в CRM')
export const importRuns = journal('import-runs', 'Запуски импорта')

export const redirects: CollectionConfig = {
  slug: 'redirects',
  labels: { singular: 'Перенаправление', plural: 'Перенаправления' },
  admin: { group: 'Система', useAsTitle: 'from' },
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'from', label: 'Старый адрес', type: 'text', unique: true, required: true },
    textField('to', 'Новый адрес', true),
    ...legacyFields,
  ],
}
