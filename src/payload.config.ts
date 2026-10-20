import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { ru } from '@payloadcms/translations/languages/ru'
import { buildConfig } from 'payload'
import { menuCollections, menuGlobals } from './cms/menu'
import { queryPresets } from './cms/queryPresets'

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
    // Даты в списках и версиях — привычно: 15.10.2026 13:18.
    dateFormat: 'dd.MM.yyyy HH:mm',
    // Пути к компонентам админки (/components/…) отсчитываются от src. Карта лежит одним файлом .ts.
    importMap: {
      baseDir: dirname,
      importMapFile: path.resolve(dirname, 'app/(payload)/admin/importMap.ts'),
    },
    components: {
      // Меню: группы и порядок — src/cms/menu.ts, свои страницы — группа «Инструменты».
      afterNavLinks: ['/components/AdminNavTools/AdminNavTools#AdminNavTools'],
      // Главная админки — очередь работы, ниже все разделы по группам меню.
      beforeDashboard: ['/components/AdminHome/AdminHome#AdminHome'],
      views: {
        bitrixImport: {
          Component: '/components/BitrixImportView/BitrixImportView#BitrixImportView',
          path: '/import-bitrix',
          meta: { title: 'Импорт из Битрикса' },
        },
        priceList: {
          Component: '/components/PriceListView/PriceListView#PriceListView',
          path: '/price-list',
          meta: { title: 'Загрузить прайс' },
        },
        prices: {
          Component: '/components/PricesView/PricesView#PricesView',
          path: '/prices',
          meta: { title: 'Цены таблицей' },
        },
        rates: {
          Component: '/components/RatesView/RatesView#RatesView',
          path: '/rates',
          meta: { title: 'Курсы валют' },
        },
        quality: {
          Component: '/components/QualityView/QualityView#QualityView',
          path: '/quality',
          meta: { title: 'Контроль качества' },
        },
        kaddiData: {
          Component: '/components/KaddiDataView/KaddiDataView#KaddiDataView',
          path: '/kaddi-data',
          meta: { title: 'Прайс и база Кадди' },
        },
        assistantCheck: {
          Component: '/components/AssistantCheckView/AssistantCheckView#AssistantCheckView',
          path: '/assistant-check',
          meta: { title: 'Проверка Кадди' },
        },
        bitrix24: {
          Component: '/components/Bitrix24View/Bitrix24View#Bitrix24View',
          path: '/bitrix24',
          meta: { title: 'Битрикс24' },
        },
        legacyContent: {
          Component: '/components/LegacyContentView/LegacyContentView#LegacyContentView',
          path: '/legacy-content',
          meta: { title: 'Перенос со старого сайта' },
        },
      },
    },
  },
  i18n: { supportedLanguages: { ru }, fallbackLanguage: 'ru' },
  collections: menuCollections,
  // Готовые виды списков (товары, предложения, публикации): src/cms/queryPresets.ts.
  queryPresets,
  globals: menuGlobals,
  plugins: [
    vercelBlobStorage({
      enabled: useBlob,
      collections: { media: true },
      // Файл из админки браузер грузит сразу в Blob: через сервер Vercel не пропускает больше 4,5 МБ.
      // Ключ на загрузку выдаётся только тому, кто вошёл и может добавлять в «Медиа».
      clientUploads: true,
      token: process.env.BLOB_READ_WRITE_TOKEN ?? '',
    }),
  ],
})
