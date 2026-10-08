import { postgresAdapter } from '@payloadcms/db-postgres'
import { ru } from '@payloadcms/translations/languages/ru'
import { buildConfig } from 'payload'
import { manufacturers, offers, products, sections } from './cms/collections/catalog'
import { media, publications } from './cms/collections/content'
import { exchangeRates, pricingSettings } from './cms/collections/pricing'
import {
  conversations,
  crmDeliveries,
  importRuns,
  orders,
  redirects,
} from './cms/collections/system'
import { users } from './cms/collections/users'
import { homePage } from './cms/globals/homePage'
import { siteSettings } from './cms/globals/siteSettings'

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    push: process.env.NODE_ENV !== 'production',
  }),
  admin: { user: 'users' },
  i18n: { supportedLanguages: { ru }, fallbackLanguage: 'ru' },
  collections: [
    products,
    offers,
    sections,
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
})
