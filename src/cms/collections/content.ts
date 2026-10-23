import type { CollectionConfig, Field } from 'payload'
import { altFromFilename } from '../../domain/mediaAlt.mjs'
import { UPLOAD_MIME_TYPES } from '../../domain/mediaTypes.mjs'
import { everyone, isAdmin, isEditor } from '../access'
import {
  contentCollection,
  legacyFields,
  seoField,
  slugField,
  statusField,
  textField,
} from '../fields'
import { publicationDefaults } from '../hooks/publicationDefaults'

const KINDS = ['article', 'news', 'promotion'] as const

/** Тип новой публикации из адреса: /admin/collections/publications/create?kind=promotion. */
function kindFromQuery(value: unknown): (typeof KINDS)[number] {
  return KINDS.find((kind) => kind === value) ?? 'news'
}

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

/** Служебные поля переноса: свёрнуты во вкладке «SEO», обычно менять не нужно. */
const legacyCollapsed: Field = {
  type: 'collapsible',
  label: 'Служебное: перенос со старого сайта',
  admin: {
    initCollapsed: true,
    description: 'Заполняется при переносе со старого сайта. Обычно менять не нужно.',
  },
  fields: legacyFields,
}

/** Поле «Текст» публикаций и страниц: визуальный редактор, таблица — кнопкой, картинки — перетаскиванием. */
function bodyField(description: string): Field {
  return {
    name: 'body',
    label: 'Текст',
    type: 'textarea',
    // Payload по умолчанию режет текст на 40 000 знаков, а длинные статьи старого сайта больше.
    maxLength: BODY_MAX_LENGTH,
    admin: { components: { Field: BODY_EDITOR }, description },
  }
}

/** «Показывать на сайте», как у товаров: значения в базе прежние (черновик / опубликовано). */
function activityField(what: string): Field {
  return {
    ...statusField,
    label: 'Активность',
    options: [
      // Порядок значений как в statusField: от него зависит тип в базе.
      { label: `Нет — ${what} скрыта (черновик)`, value: 'draft' },
      { label: 'Да — показывать на сайте', value: 'published' },
    ],
    admin: { position: 'sidebar' },
  }
}

const publicationCollection = contentCollection({
  slug: 'publications',
  singular: 'Публикация',
  plural: 'Новости, статьи, акции',
  fields: [],
})

/**
 * Публикация по вкладкам, как карточка товара (принцип владельца: всё понятно без инструкции):
 * «Анонс» (коротко и обложка), «Текст», «SEO». Справа — активность, тип, тема, даты, адрес.
 * Вкладки без имени: данные в базе лежат как раньше, миграция не нужна.
 */
export const publications: CollectionConfig = {
  ...publicationCollection,
  fields: [
    textField('title', 'Название', true),
    activityField('публикация'),
    {
      name: 'kind',
      label: 'Тип',
      type: 'select',
      required: true,
      // «+ Акция» и «+ Статья» на главной админки открывают новую публикацию с ?kind=…
      defaultValue: ({ req }) => kindFromQuery(req.query?.kind),
      options: [
        { label: 'Статья', value: 'article' },
        { label: 'Новость', value: 'news' },
        { label: 'Акция', value: 'promotion' },
      ],
      admin: { position: 'sidebar' },
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
          '(активность при этом «Да»).',
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
      ...slugField(),
      admin: {
        position: 'sidebar',
        components: { Field: '/components/SlugField/SlugField#SlugField' },
      },
    },
    // Прежняя тема текстом: перенесена в «Тему», оставлена только для истории.
    { name: 'topic', label: 'Тематика (старое поле)', type: 'text', admin: { hidden: true } },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Анонс',
          fields: [
            {
              name: 'excerpt',
              label: 'Анонс для карточки',
              type: 'textarea',
              admin: {
                description:
                  'Одно-два предложения: видны в карточке в списке новостей и на главной.',
              },
            },
            {
              name: 'cover',
              label: 'Обложка',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  'Перетащите картинку с компьютера прямо сюда или выберите из загруженных. ' +
                  'Лучше 16 : 9 (например 1920 × 1080), без мелкого текста. Нет — в карточке ' +
                  'будет обложка темы.',
              },
            },
          ],
        },
        {
          label: 'Текст',
          fields: [
            bodyField(
              'Таблица — кнопкой на панели редактора, картинку можно перетащить в текст или ' +
                'вставить из буфера.',
            ),
          ],
        },
        { label: 'SEO', fields: [seoField, legacyCollapsed] },
      ],
    },
  ],
  admin: {
    ...publicationCollection.admin,
    defaultColumns: ['title', 'kind', 'theme', 'publishedAt', 'status'],
  },
  enableQueryPresets: true,
  hooks: { beforeValidate: [publicationDefaults] },
}

const pageCollection = contentCollection({
  slug: 'pages',
  singular: 'Страница',
  plural: 'Страницы',
  fields: [],
})

/**
 * Простые текстовые страницы: «О компании» и т. п. Адрес страницы задаёт код.
 * Вкладки «Текст» и «SEO», справа — активность и код страницы.
 */
export const pages: CollectionConfig = {
  ...pageCollection,
  fields: [
    textField('title', 'Название', true),
    activityField('страница'),
    {
      ...slugField('Код страницы'),
      admin: {
        position: 'sidebar',
        description: 'По нему сайт находит страницу. Менять не нужно — страница пропадёт.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Текст',
          fields: [
            {
              name: 'lead',
              label: 'Вводный абзац',
              type: 'textarea',
              admin: { description: 'Крупный абзац под заголовком. Можно не заполнять.' },
            },
            bodyField(
              'Таблица — кнопкой на панели редактора, картинку можно перетащить в текст или ' +
                'вставить из буфера.',
            ),
          ],
        },
        { label: 'SEO', fields: [seoField, legacyCollapsed] },
      ],
    },
  ],
}

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
  // Картинки перетаскивают пачкой: описание можно не вписывать, оно берётся из имени файла.
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        if (typeof data.alt !== 'string' || !data.alt.trim())
          data.alt = altFromFilename(data.filename ?? req.file?.name)
        return data
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      label: 'Описание изображения',
      type: 'text',
      // В базе пустым не бывает (заполняет хук выше), но вписывать при загрузке не обязательно.
      required: true,
      validate: () => true as const,
      admin: { description: 'Можно не заполнять: возьмём из имени файла.' },
    },
    ...legacyFields,
  ],
}
