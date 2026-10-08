import { buildConfig, type CollectionConfig, type Field, type Access } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { ru } from '@payloadcms/translations/languages/ru'

const admin: Access = ({ req }) => req.user?.role === 'admin'
const editor: Access = ({ req }) => Boolean(req.user && ['admin', 'editor'].includes(req.user.role))
const published: Access = ({ req }) => req.user ? true : { status: { equals: 'published' } }
const text = (name: string, label: string, required = false): Field => ({ name, label, type: 'text', required })
const relation = (name: string, label: string, relationTo: string, hasMany = false): Field => hasMany
  ? { name, label, type: 'relationship', relationTo, hasMany: true }
  : { name, label, type: 'relationship', relationTo, hasMany: false }
const legacy: Field[] = [ { name: 'legacyKey', label: 'Уникальный ключ импорта', type: 'text', unique: true, index: true }, text('legacyUrl', 'Прежний адрес') ]
const status: Field = { name: 'status', label: 'Публикация', type: 'select', defaultValue: 'draft', required: true, options: [{ label: 'Черновик', value: 'draft' }, { label: 'Опубликовано', value: 'published' }] }
function content(slug: string, singular: string, plural: string, fields: Field[]): CollectionConfig {
  return { slug, labels: { singular, plural }, admin: { useAsTitle: 'title' }, access: { read: published, create: editor, update: editor, delete: admin }, fields: [text('title', 'Название', true), status, ...legacy, ...fields] }
}
const collections: CollectionConfig[] = [
  { slug: 'users', labels: { singular: 'Пользователь', plural: 'Пользователи' }, auth: true, access: { read: admin, create: admin, update: admin, delete: admin }, fields: [{ name: 'role', label: 'Роль', type: 'select', defaultValue: 'editor', required: true, options: ['admin', 'editor'], access: { create: ({ req }) => req.user?.role === 'admin', update: ({ req }) => req.user?.role === 'admin' } }] },
  content('manufacturers', 'Производитель', 'Производители', [text('website', 'Сайт')]),
  content('sections', 'Раздел', 'Разделы', [text('slug', 'Адрес', true), relation('parent', 'Родительский раздел', 'sections'), { name: 'isDirection', label: 'Направление', type: 'checkbox' }]),
  content('products', 'Товар', 'Товары', [ { name: 'slug', label: 'Адрес', type: 'text', unique: true, required: true }, { name: 'kind', label: 'Тип', type: 'select', options: ['software', 'hardware', 'course', 'service'], required: true }, { name: 'description', label: 'Описание', type: 'textarea' }, relation('manufacturer', 'Производитель', 'manufacturers'), relation('sections', 'Разделы', 'sections', true), { name: 'tasks', label: 'Задачи', type: 'array', fields: [text('title', 'Задача', true)] }, relation('requiresProducts', 'Требуется базовое ПО', 'products', true), relation('recommended', 'Рекомендации', 'products', true), relation('gallery', 'Галерея', 'media', true), { name: 'properties', label: 'Характеристики', type: 'array', fields: [text('name', 'Название', true), text('value', 'Значение', true)] } ]),
  content('offers', 'Предложение', 'Предложения', [relation('product', 'Товар', 'products'), text('configuration', 'Комплектация', true), text('license', 'Условия лицензии', true), text('amount', 'Цена в исходной валюте', true), { name: 'currency', label: 'Валюта', type: 'select', required: true, options: ['KZT', 'USD', 'EUR', 'RUB'] }, { name: 'includesVat', label: 'Исходный НДС включён', type: 'checkbox' }, text('sourceVat', 'Исходная ставка НДС, %', true)]),
  content('publications', 'Публикация', 'Публикации', [ { name: 'slug', type: 'text', unique: true, required: true }, { name: 'kind', label: 'Тип', type: 'select', options: ['article', 'news', 'promotion'], required: true }, { name: 'body', label: 'Текст', type: 'textarea' }, relation('cover', 'Обложка', 'media'), { name: 'publishedAt', type: 'date', label: 'Дата публикации' } ]),
  { slug: 'media', labels: { singular: 'Изображение', plural: 'Медиа' }, upload: { staticDir: 'media', mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] }, access: { read: () => true, create: editor, update: editor, delete: admin }, fields: [text('alt', 'Описание изображения', true), ...legacy] },
  { slug: 'exchange-rates', labels: { singular: 'Курс', plural: 'История курсов' }, access: { read: admin, create: admin, update: admin, delete: admin }, fields: [{ name: 'currency', type: 'select', options: ['USD', 'EUR', 'RUB'], required: true }, text('kztPerUnit', 'KZT за единицу', true), { name: 'effectiveAt', label: 'Действует с', type: 'date', required: true }] },
  ...(['orders', 'conversations', 'crm-deliveries', 'import-runs'] as const).map((slug): CollectionConfig => ({ slug, access: { read: admin, create: () => false, update: () => false, delete: () => false }, fields: [{ name: 'idempotencyKey', type: 'text', unique: true, required: true }, { name: 'snapshot', type: 'json', required: true }, { name: 'state', type: 'text', required: true }] })),
  { slug: 'redirects', access: { read: admin, create: admin, update: admin, delete: admin }, fields: [{ name: 'from', type: 'text', unique: true, required: true }, text('to', 'Новый адрес', true), ...legacy] },
]
export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL || '' }, push: process.env.NODE_ENV !== 'production' }),
  admin: { user: 'users' }, i18n: { supportedLanguages: { ru }, fallbackLanguage: 'ru' }, collections,
  globals: [{ slug: 'pricing-settings', label: 'Настройки цены', access: { read: admin, update: admin }, fields: [{ name: 'vat', label: 'НДС, %', type: 'text', defaultValue: '16', required: true }] }],
})
