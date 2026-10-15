import type { CollectionConfig } from 'payload'
import { UPLOAD_MIME_TYPES } from '../../domain/mediaTypes.mjs'
import { everyone, isAdmin, isEditor } from '../access'
import { contentCollection, legacyFields, seoField, slugField, textField } from '../fields'
import { publicationDefaults } from '../hooks/publicationDefaults'

/** Длинная статья с таблицами — до ~70 000 знаков; запас на редкие большие тексты. */
const BODY_MAX_LENGTH = 300_000

/** Темы новостей и статей: выбираются в публикации, по ним фильтруется список на сайте. */
export const topics: CollectionConfig = {
  ...contentCollection({
    slug: 'topics',
    singular: 'Тема',
    plural: 'Темы новостей и статей',
    fields: [
      slugField('Адрес (латиницей, для ссылки ?topic=…)'),
      {
        name: 'order',
        label: 'Порядок',
        type: 'number',
        defaultValue: 100,
        admin: { description: 'Меньше — левее в списке тем над новостями.' },
      },
      {
        name: 'covers',
        label: 'Обложки для публикаций без своей',
        type: 'upload',
        relationTo: 'media',
        hasMany: true,
        admin: {
          description:
            'Показываются в карточках новостей и статей этой темы, у которых нет своей обложки. ' +
            'Лучше 2–3 разные картинки без надписей, 16 : 9 (например 1920 × 1080): соседние карточки получат разные.',
        },
      },
    ],
  }),
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'order', 'status'] },
}

/** Поле «Текст» публикаций и страниц: свой редактор (визуальный и HTML), хранится разметкой. */
const BODY_EDITOR = '/components/BodyEditor/BodyEditor#BodyEditor'

export const publications: CollectionConfig = {
  ...contentCollection({
    slug: 'publications',
    singular: 'Публикация',
    plural: 'Новости, статьи, акции',
    statusInSidebar: true,
    fields: [
      {
        ...slugField(),
        admin: { components: { Field: '/components/SlugField/SlugField#SlugField' } },
      },
      {
        name: 'kind',
        label: 'Тип',
        type: 'select',
        required: true,
        defaultValue: 'news',
        options: [
          { label: 'Статья', value: 'article' },
          { label: 'Новость', value: 'news' },
          { label: 'Акция', value: 'promotion' },
        ],
      },
      {
        name: 'publishedAt',
        label: 'Начало показа',
        type: 'date',
        defaultValue: () => new Date().toISOString(),
        admin: {
          position: 'sidebar',
          date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' },
          description:
            'Дата публикации на сайте. Будущая дата — публикация появится сама в это время ' +
            '(статус при этом «Опубликовано»).',
        },
      },
      {
        name: 'hideAfter',
        label: 'Окончание показа',
        type: 'date',
        admin: {
          position: 'sidebar',
          date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' },
          description:
            'Необязательно. После этой даты публикация пропадёт с сайта, в админке останется.',
        },
      },
      {
        name: 'endsAt',
        label: 'Акция действует до',
        type: 'date',
        admin: {
          position: 'sidebar',
          condition: (data) => data?.kind === 'promotion',
          date: { displayFormat: 'dd.MM.yyyy' },
          description:
            'После этой даты акция пропадает с главной и уходит в «Архивные» (на сайте ' +
            'остаётся). Пусто — действует полгода от начала показа.',
        },
      },
      {
        name: 'theme',
        label: 'Тема',
        type: 'relationship',
        relationTo: 'topics',
        index: true,
        admin: {
          position: 'sidebar',
          description: 'Выберите из списка. Новая тема добавляется в «Темы новостей и статей».',
        },
      },
      // Прежняя тема текстом: перенесена в «Тему», оставлена только для истории.
      { name: 'topic', label: 'Тематика (старое поле)', type: 'text', admin: { hidden: true } },
      {
        name: 'excerpt',
        label: 'Анонс для карточки',
        type: 'textarea',
        admin: {
          description: 'Одно-два предложения: видны в карточке в списке новостей и на главной.',
        },
      },
      {
        name: 'cover',
        label: 'Обложка',
        type: 'upload',
        relationTo: 'media',
        admin: {
          description:
            'Картинка 16 : 9, например 1920 × 1080, без мелкого текста. Нет — в карточке ' +
            'будет обложка темы.',
        },
      },
      {
        name: 'body',
        label: 'Текст',
        type: 'textarea',
        // Payload по умолчанию режет текст на 40 000 знаков, а длинные статьи старого сайта больше.
        maxLength: BODY_MAX_LENGTH,
        admin: { components: { Field: BODY_EDITOR } },
      },
      seoField,
    ],
  }),
  hooks: { beforeValidate: [publicationDefaults] },
}

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
      // Payload по умолчанию режет текст на 40 000 знаков, а длинные статьи старого сайта больше.
      maxLength: BODY_MAX_LENGTH,
      admin: {
        components: { Field: BODY_EDITOR },
      },
    },
    seoField,
  ],
})

export const media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Изображение', plural: 'Медиа' },
  // Служебные поля импорта в списке не нужны: в окне выбора картинки — файл и описание.
  admin: { defaultColumns: ['filename', 'alt', 'updatedAt'] },
  upload: {
    staticDir: 'media',
    mimeTypes: UPLOAD_MIME_TYPES,
  },
  access: { read: everyone, create: isEditor, update: isEditor, delete: isAdmin },
  fields: [textField('alt', 'Описание изображения', true), ...legacyFields],
}
