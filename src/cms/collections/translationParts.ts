import type { CollectionConfig } from 'payload'
import { isEditor } from '../access'

/**
 * Части длинных текстов в переводе (07.11.2026, src/domain/siteTexts.mjs). Длинная статья
 * переводится кусками по несколько тысяч знаков — за разные запросы автоперевода или из разных
 * строк таблицы. Пока переведены не все куски, они лежат здесь, а на сайте остаётся русский
 * текст; когда готовы все — текст собирается, записывается в публикацию или страницу, а куски
 * удаляются. Служебная коллекция, в меню админки её нет.
 */
export const translationParts: CollectionConfig = {
  slug: 'translation-parts',
  labels: { singular: 'Часть перевода', plural: 'Части переводов' },
  admin: { hidden: true, useAsTitle: 'key' },
  access: { read: isEditor, create: isEditor, update: isEditor, delete: isEditor },
  fields: [
    {
      name: 'key',
      label: 'Поле (publications:12:body)',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'lang',
      label: 'Язык',
      type: 'select',
      required: true,
      options: [
        { label: 'Қазақша', value: 'kk' },
        { label: 'English', value: 'en' },
      ],
    },
    { name: 'part', label: 'Номер части', type: 'number', required: true },
    { name: 'source', label: 'Отпечаток русского текста части', type: 'text', required: true },
    { name: 'text', label: 'Перевод части', type: 'textarea', required: true },
  ],
}
