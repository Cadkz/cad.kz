import type { CollectionConfig } from 'payload'
import { everyone, isAdmin, isEditor } from '../access'
import { contentCollection, legacyFields, relationField, slugField, textField } from '../fields'

export const publications = contentCollection({
  slug: 'publications',
  singular: 'Публикация',
  plural: 'Новости, статьи, акции',
  fields: [
    slugField(),
    {
      name: 'kind',
      label: 'Тип',
      type: 'select',
      required: true,
      options: [
        { label: 'Статья', value: 'article' },
        { label: 'Новость', value: 'news' },
        { label: 'Акция', value: 'promotion' },
      ],
    },
    { name: 'body', label: 'Текст', type: 'textarea' },
    relationField('cover', 'Обложка', 'media'),
    { name: 'publishedAt', label: 'Дата публикации', type: 'date' },
  ],
})

export const media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Изображение', plural: 'Медиа' },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'],
  },
  access: { read: everyone, create: isEditor, update: isEditor, delete: isAdmin },
  fields: [textField('alt', 'Описание изображения', true), ...legacyFields],
}
