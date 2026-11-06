import type {
  CollectionConfig,
  CollectionSlug,
  Field,
  SelectField,
  TextareaFieldValidation,
  TextField,
  TextFieldSingleValidation,
} from 'payload'
import { text, textarea } from 'payload/shared'
import { isAdmin, isEditor, publishedOrSignedIn } from './access'

/** Язык, на котором заполняется сайт; остальные — переводы (переключатель языка в админке). */
export const DEFAULT_LOCALE = 'ru'

/** Русская версия (или все языки сразу) — только она обязательна. */
const isDefaultLocale = (locale: string | null | undefined) =>
  !locale || locale === DEFAULT_LOCALE || locale === 'all'

const textInRussian: TextFieldSingleValidation = (value, options) =>
  text(value, { ...options, required: isDefaultLocale(options.req.locale) })

const textareaInRussian: TextareaFieldValidation = (value, options) =>
  textarea(value, { ...options, required: isDefaultLocale(options.req.locale) })

/**
 * Текст с переводом: у поля своя версия на русском, казахском и английском. Обязательно оно только
 * по-русски — пустой перевод на сайте заменяется русским текстом (fallback), и перевод можно
 * сохранять частями. required остаётся (звёздочка в админке, строка в типах: с fallback текст есть
 * всегда), а проверку по языку делает validate. Колонки переводов в базе необязательные — это
 * задано в миграции 20261106_075302_languages (Payload сам сделал бы их NOT NULL).
 */
export function translated(field: Field): Field {
  if (field.type === 'text' && !field.hasMany) {
    const admin = withRussianHint(field.admin)
    if (!field.required) return { ...field, admin, localized: true }
    return { ...field, admin, localized: true, validate: textInRussian }
  }
  if (field.type === 'textarea') {
    const admin = withRussianHint(field.admin)
    if (!field.required) return { ...field, admin, localized: true }
    return { ...field, admin, localized: true, validate: textareaInRussian }
  }
  return field
}

/** Подсказка «По-русски» под пустым полем перевода (казахский, английский). */
const RUSSIAN_HINT = '/components/RussianHint/RussianHint#RussianHint'

/**
 * Подсказка русского текста под полем. У полей со своим редактором (BodyEditor) afterInput
 * не выводится — там подсказку ставит сам редактор.
 */
function withRussianHint<T extends { components?: { afterInput?: unknown[] } }>(
  admin: T | undefined,
): T {
  const components = admin?.components ?? {}
  return {
    ...admin,
    components: { ...components, afterInput: [...(components.afterInput ?? []), RUSSIAN_HINT] },
  } as T
}

/**
 * Переводы во всём наборе полей (главная, контакты): каждый текст получает версии по языкам,
 * кроме полей из skip — ссылок, телефонов, названий производителей. Группы, строки и массивы
 * обходятся вглубь, сами они общие для всех языков (строки FAQ одни, текст в них — свой).
 */
export function translateTexts(fields: Field[], skip: ReadonlySet<string>): Field[] {
  return fields.map((field) => {
    if (field.type === 'text' || field.type === 'textarea')
      return skip.has(field.name) ? field : translated(field)
    if (
      field.type === 'group' ||
      field.type === 'array' ||
      field.type === 'row' ||
      field.type === 'collapsible'
    )
      return { ...field, fields: translateTexts(field.fields, skip) }
    if (field.type === 'tabs')
      return {
        ...field,
        tabs: field.tabs.map((tab) => ({ ...tab, fields: translateTexts(tab.fields, skip) })),
      }
    return field
  })
}

export function textField(name: string, label: string, required = false): Field {
  return { name, label, type: 'text', required }
}

export function relationField(
  name: string,
  label: string,
  relationTo: CollectionSlug,
  hasMany = false,
): Field {
  return hasMany
    ? { name, label, type: 'relationship', relationTo, hasMany: true }
    : { name, label, type: 'relationship', relationTo, hasMany: false }
}

export function slugField(label = 'Адрес'): TextField {
  return { name: 'slug', label, type: 'text', unique: true, required: true, index: true }
}

/**
 * Заголовок и описание для поисковиков. Пусто — подставляются название и анонс.
 * При переносе со старого cad.kz сюда попадают его title и description, чтобы не терять позиции.
 */
export const seoField: Field = {
  name: 'seo',
  label: 'Для поисковиков',
  type: 'group',
  admin: {
    description:
      'Пусто — берутся название и короткое описание. Title до 60 знаков, description до 160.',
  },
  fields: [
    translated(textField('title', 'Заголовок вкладки (title)')),
    translated({ name: 'description', label: 'Описание в поиске (description)', type: 'textarea' }),
  ],
}

/** Поля для повторяемого импорта со старого сайта на 1С-Битрикс. */
export const legacyFields: Field[] = [
  { name: 'legacyKey', label: 'Уникальный ключ импорта', type: 'text', unique: true, index: true },
  textField('legacyUrl', 'Прежний адрес'),
]

export const statusField: SelectField = {
  name: 'status',
  label: 'Публикация',
  type: 'select',
  defaultValue: 'draft',
  required: true,
  options: [
    { label: 'Черновик', value: 'draft' },
    { label: 'Опубликовано', value: 'published' },
  ],
}

type ContentCollection = {
  slug: CollectionSlug
  singular: string
  plural: string
  fields: Field[]
  /** Статус публикации справа, рядом с датами, а не под названием. */
  statusInSidebar?: boolean
  /** Название с переводом на казахский и английский (товары, разделы, публикации, страницы). */
  translatedTitle?: boolean
}

/** Публичная коллекция контента: заголовок, статус публикации, поля импорта. */
export function contentCollection({
  slug,
  singular,
  plural,
  fields,
  statusInSidebar = false,
  translatedTitle = false,
}: ContentCollection): CollectionConfig {
  const status: SelectField = statusInSidebar
    ? { ...statusField, admin: { position: 'sidebar' } }
    : statusField
  return {
    slug,
    labels: { singular, plural },
    admin: { useAsTitle: 'title', defaultColumns: ['title', 'status', 'updatedAt'] },
    access: { read: publishedOrSignedIn, create: isEditor, update: isEditor, delete: isAdmin },
    fields: [
      translatedTitle
        ? translated(textField('title', 'Название', true))
        : textField('title', 'Название', true),
      status,
      ...fields,
      ...legacyFields,
    ],
  }
}
