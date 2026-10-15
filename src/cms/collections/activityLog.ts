import type { CollectionConfig } from 'payload'
import { ACTIVITY_ACTIONS } from '../../domain/activity.mjs'
import { isEditor, nobody } from '../access'

/**
 * Журнал важных действий: курсы и НДС, загрузка прайса, импорт, перенос, передача в CRM,
 * удаления, пользователи. Пишет только сервер (src/lib/activity.ts), править и удалять нельзя:
 * журнал нужен, чтобы через месяц понять, кто и когда поменял цены.
 */
export const activityLog: CollectionConfig = {
  slug: 'activity-log',
  labels: { singular: 'Запись журнала', plural: 'Журнал действий' },
  admin: {
    useAsTitle: 'summary',
    defaultColumns: ['createdAt', 'action', 'summary', 'user'],
    description:
      'Кто и когда менял курсы, НДС и цены, загружал прайсы, запускал импорт, удалял записи. ' +
      'Что именно поменялось в товаре или публикации — во вкладке «Версии» самой записи.',
  },
  defaultSort: '-createdAt',
  access: { read: isEditor, create: nobody, update: nobody, delete: nobody },
  fields: [
    {
      name: 'action',
      label: 'Действие',
      type: 'select',
      required: true,
      index: true,
      options: ACTIVITY_ACTIONS.map(({ value, label }) => ({ value, label })),
    },
    { name: 'summary', label: 'Что произошло', type: 'text', required: true },
    {
      name: 'user',
      label: 'Кто',
      type: 'relationship',
      relationTo: 'users',
      admin: { description: 'Пусто — сайт сам (очередь CRM, автонастройка).' },
    },
    {
      name: 'link',
      label: 'Где посмотреть',
      type: 'text',
      admin: { description: 'Адрес в админке: запись или страница, к которой относится действие.' },
    },
    { name: 'details', label: 'Подробности', type: 'json' },
  ],
}
