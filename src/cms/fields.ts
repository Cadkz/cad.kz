import type { CollectionConfig, CollectionSlug, Field } from 'payload'
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

export function slugField(label = 'Адрес'): Field {
  return { name: 'slug', label, type: 'text', unique: true, required: true, index: true }
}

/** Поля для повторяемого импорта со старого сайта на 1С-Битрикс. */
export const legacyFields: Field[] = [
  { name: 'legacyKey', label: 'Уникальный ключ импорта', type: 'text', unique: true, index: true },
  textField('legacyUrl', 'Прежний адрес'),
]

export const statusField: Field = {
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
}

/** Публичная коллекция контента: заголовок, статус публикации, поля импорта. */
export function contentCollection({
  slug,
  singular,
  plural,
  fields,
}: ContentCollection): CollectionConfig {
  return {
    slug,
    labels: { singular, plural },
    admin: { useAsTitle: 'title', defaultColumns: ['title', 'status', 'updatedAt'] },
    access: { read: publishedOrSignedIn, create: isEditor, update: isEditor, delete: isAdmin },
    fields: [textField('title', 'Название', true), statusField, ...fields, ...legacyFields],
  }
}
