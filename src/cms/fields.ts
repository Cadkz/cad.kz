import type { CollectionConfig, CollectionSlug, Field, SelectField, TextField } from 'payload'
import { isAdmin, isEditor, publishedOrSignedIn } from './access'

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
    textField('title', 'Заголовок вкладки (title)'),
    { name: 'description', label: 'Описание в поиске (description)', type: 'textarea' },
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
}

/** Публичная коллекция контента: заголовок, статус публикации, поля импорта. */
export function contentCollection({
  slug,
  singular,
  plural,
  fields,
  statusInSidebar = false,
}: ContentCollection): CollectionConfig {
  const status: SelectField = statusInSidebar
    ? { ...statusField, admin: { position: 'sidebar' } }
    : statusField
  return {
    slug,
    labels: { singular, plural },
    admin: { useAsTitle: 'title', defaultColumns: ['title', 'status', 'updatedAt'] },
    access: { read: publishedOrSignedIn, create: isEditor, update: isEditor, delete: isAdmin },
    fields: [textField('title', 'Название', true), status, ...fields, ...legacyFields],
  }
}
