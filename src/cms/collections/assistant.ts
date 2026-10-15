import type { CollectionConfig } from 'payload'
import { isEditor, nobody } from '../access'

/**
 * Прайс для Кадди (лист product_price_list файла «Прайс CAD.kz»). Целиком одним снимком: файл
 * заменяется полностью, по строкам его не правят — правят в 1С и загружают заново на странице
 * «Прайс и база Кадди». Пишет только сервер; действующий — последний со state = active.
 * В меню админки не показывается: состояние видно на странице загрузки.
 */
export const priceTables: CollectionConfig = {
  slug: 'price-tables',
  labels: { singular: 'Прайс для Кадди', plural: 'Прайсы для Кадди' },
  admin: { hidden: true },
  access: { read: isEditor, create: nobody, update: nobody, delete: nobody },
  fields: [
    { name: 'state', type: 'text', required: true, index: true },
    /** Файл, дата прайса, НДС, кто загрузил, сколько строк — без самих строк. */
    { name: 'summary', type: 'json', required: true },
    /** { version: 1, rows: PriceRow[] } — src/domain/priceTable.mjs. */
    { name: 'snapshot', type: 'json', required: true },
  ],
}

/**
 * База знаний Кадди (лист FAQ): факты о продуктах и порядке работы. Загружается из того же файла
 * и правится здесь по одной записи. Кадди получает все включённые записи вместе с правилами.
 */
export const assistantKnowledge: CollectionConfig = {
  slug: 'assistant-knowledge',
  labels: { singular: 'Запись базы знаний Кадди', plural: 'База знаний Кадди' },
  admin: {
    useAsTitle: 'text',
    defaultColumns: ['text', 'product', 'active'],
    description:
      'Факты для Кадди: о продуктах, оплате, графике работы. Цены и сроки поставки отсюда Кадди ' +
      'клиенту не называет — они только из прайса. Загрузить всё из Excel — «Прайс и база Кадди».',
  },
  access: { read: isEditor, create: isEditor, update: isEditor, delete: isEditor },
  defaultSort: 'position',
  fields: [
    {
      name: 'text',
      label: 'Факт или ответ',
      type: 'textarea',
      required: true,
      maxLength: 2000,
    },
    {
      name: 'product',
      label: 'Продукт',
      type: 'text',
      defaultValue: 'Все',
      admin: { description: 'AutoCAD, АВС, GEO5… «Все» — общее правило.' },
    },
    {
      name: 'active',
      label: 'Кадди использует',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'position',
      label: 'Порядок',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
  ],
}
