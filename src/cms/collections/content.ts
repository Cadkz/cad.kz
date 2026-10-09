import type { CollectionConfig } from 'payload'
import { MEDIA_MIME_TYPES } from '../../domain/mediaTypes.mjs'
import { everyone, isAdmin, isEditor } from '../access'
import {
  contentCollection,
  legacyFields,
  relationField,
  seoField,
  slugField,
  textField,
} from '../fields'

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
    { name: 'excerpt', label: 'Анонс для карточки', type: 'textarea' },
    textField('topic', 'Тематика'),
    {
      name: 'body',
      label: 'Текст',
      type: 'textarea',
      admin: {
        description:
          'Пустая строка — новый абзац, «## » — подзаголовок, «- » — пункт списка, «> » — выноска, ' +
          '[текст](адрес) — ссылка, ![описание](адрес картинки) — картинка отдельной строкой.',
      },
    },
    relationField('cover', 'Обложка', 'media'),
    { name: 'publishedAt', label: 'Дата публикации', type: 'date' },
    seoField,
  ],
})

/** Простые текстовые страницы: «О компании» и т. п. Адрес страницы задаёт код. */
export const pages = contentCollection({
  slug: 'pages',
  singular: 'Страница',
  plural: 'Страницы',
  fields: [
    slugField('Код страницы'),
    { name: 'lead', label: 'Вводный абзац', type: 'textarea' },
    {
      name: 'body',
      label: 'Текст',
      type: 'textarea',
      admin: {
        description:
          'Пустая строка — новый абзац, «## » — подзаголовок, «- » — пункт списка, «> » — выноска, ' +
          '[текст](адрес) — ссылка, ![описание](адрес картинки) — картинка отдельной строкой.',
      },
    },
    seoField,
  ],
})

export const media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Изображение', plural: 'Медиа' },
  upload: {
    staticDir: 'media',
    mimeTypes: MEDIA_MIME_TYPES,
  },
  access: { read: everyone, create: isEditor, update: isEditor, delete: isAdmin },
  fields: [textField('alt', 'Описание изображения', true), ...legacyFields],
}
