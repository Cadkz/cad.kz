import type { CollectionConfig } from 'payload'
import { adminOrSelf, isAdmin } from '../access'

export const users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Пользователь', plural: 'Пользователи' },
  auth: true,
  admin: { useAsTitle: 'email', group: 'Система' },
  access: { read: adminOrSelf, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    {
      name: 'role',
      label: 'Роль',
      type: 'select',
      defaultValue: 'editor',
      required: true,
      options: [
        { label: 'Администратор', value: 'admin' },
        { label: 'Редактор (маркетолог)', value: 'editor' },
        { label: 'Менеджер по продажам (только заказы, чтение)', value: 'manager' },
      ],
      access: {
        create: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
  ],
}
