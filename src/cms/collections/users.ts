import type { CollectionConfig } from 'payload'
import { adminOrSelf, isAdmin } from '../access'
import { logUserChange } from '../hooks/activity'

export const users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Пользователь', plural: 'Пользователи' },
  auth: true,
  admin: { useAsTitle: 'email' },
  access: { read: adminOrSelf, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: { afterChange: [logUserChange] },
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
      ],
      access: {
        create: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
  ],
}
