import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { ru } from '@payloadcms/translations/languages/ru'
import { buildConfig } from 'payload'
import { manufacturers, offers, products, sections } from './cms/collections/catalog'
import { media, publications } from './cms/collections/content'
import { crmDeliveries, orders } from './cms/collections/orders'
import { exchangeRates, pricingSettings } from './cms/collections/pricing'
import { sectionRules } from './cms/collections/sectionRules'
import { conversations, importRuns, redirects } from './cms/collections/system'
import { users } from './cms/collections/users'
import { homePage } from './cms/globals/homePage'
import { siteSettings } from './cms/globals/siteSettings'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// Схема БД. Локально Payload сам подгоняет таблицы (push). На хостинге таблицы меняют только
// миграции из src/migrations: NODE_ENV=production или DB_SCHEMA_MODE=migrate отключают push.
const pushSchema = process.env.NODE_ENV !== 'production' && process.env.DB_SCHEMA_MODE !== 'migrate'

// Картинки CMS: MEDIA_STORAGE=blob — облако Vercel Blob (нужен BLOB_READ_WRITE_TOKEN),
// иначе (по умолчанию) — локальная папка media.
const useBlob = process.env.MEDIA_STORAGE === 'blob'
if (useBlob && !process.env.BLOB_READ_WRITE_TOKEN)
  console.warn(
    'MEDIA_STORAGE=blob, но BLOB_READ_WRITE_TOKEN не задан: загрузка картинок не сработает',
  )

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    // На хостинге каждая копия сайта держит мало подключений, иначе бесплатная база быстро упрётся в лимит.
    pool: { connectionString: process.env.DATABASE_URL || '', max: process.env.VERCEL ? 3 : 10 },
    push: pushSchema,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  admin: {
    user: 'users',
    // Пути к компонентам админки (/components/…) отсчитываются от src. Карта лежит одним файлом .ts.
    importMap: {
      baseDir: dirname,
      importMapFile: path.resolve(dirname, 'app/(payload)/admin/importMap.ts'),
    },
    components: {
      afterNavLinks: ['/components/ImportNavLink/ImportNavLink#ImportNavLink'],
      beforeDashboard: ['/components/ImportDashboardLink/ImportDashboardLink#ImportDashboardLink'],
      views: {
        bitrixImport: {
          Component: '/components/BitrixImportView/BitrixImportView#BitrixImportView',
          path: '/import-bitrix',
          meta: { title: 'Импорт из Битрикса' },
        },
      },
    },
  },
  i18n: { supportedLanguages: { ru }, fallbackLanguage: 'ru' },
  collections: [
    products,
    offers,
    sections,
    sectionRules,
    manufacturers,
    publications,
    media,
    exchangeRates,
    users,
    orders,
    conversations,
    crmDeliveries,
    importRuns,
    redirects,
  ],
  globals: [pricingSettings, siteSettings, homePage],
  plugins: [
    vercelBlobStorage({
      enabled: useBlob,
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN ?? '',
    }),
  ],
})
