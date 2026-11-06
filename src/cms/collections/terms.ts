import type { CollectionConfig } from 'payload'
import { isEditor } from '../access'

/**
 * Словарь переводов характеристик и комплектаций (06.11.2026, src/domain/terms.mjs): русский
 * текст, как он показан на сайте, и его перевод. На /kk и /en подменяется по точному совпадению;
 * нет перевода — русский. Заполняется таблицей на странице «Переводы», править можно и здесь.
 */
export const terms: CollectionConfig = {
  slug: 'terms',
  labels: { singular: 'Строка словаря', plural: 'Словарь переводов' },
  admin: {
    useAsTitle: 'ru',
    defaultColumns: ['ru', 'kk', 'en'],
    description:
      'Характеристики, комплектации, условия лицензий и тексты подбора на казахском и английском. ' +
      'Русский текст — точно как на сайте. Удобнее заполнять таблицей: «Переводы» → «Характеристики и комплектации».',
  },
  access: { read: isEditor, create: isEditor, update: isEditor, delete: isEditor },
  fields: [
    {
      name: 'ru',
      label: 'По-русски (как на сайте)',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    { name: 'kk', label: 'Қазақша', type: 'text' },
    { name: 'en', label: 'English', type: 'text' },
  ],
}
