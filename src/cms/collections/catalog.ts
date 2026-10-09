import type { CollectionConfig } from 'payload'
import { contentCollection, relationField, slugField, textField } from '../fields'
import { productSections } from '../hooks/productSections'

/** Иконки разделов: ключ из этого списка сопоставляется с иконкой lucide в компоненте. */
export const sectionIcons = [
  'building',
  'columns',
  'layers',
  'route',
  'wrench',
  'droplet',
  'cog',
  'image',
  'file',
  'scan',
  'printer',
  'monitor',
  'graduation',
] as const

export const manufacturers = contentCollection({
  slug: 'manufacturers',
  singular: 'Производитель',
  plural: 'Производители',
  fields: [textField('website', 'Сайт')],
})

export const sections = contentCollection({
  slug: 'sections',
  singular: 'Раздел',
  plural: 'Разделы',
  fields: [
    slugField(),
    relationField('parent', 'Родительский раздел', 'sections'),
    { name: 'isDirection', label: 'Направление', type: 'checkbox' },
    {
      name: 'menuGroup',
      label: 'Группа в меню и фильтре',
      type: 'select',
      defaultValue: 'software',
      required: true,
      options: [
        { label: 'Программное обеспечение', value: 'software' },
        { label: 'Оборудование', value: 'hardware' },
        { label: 'Услуги и обучение', value: 'service' },
      ],
    },
    { name: 'summary', label: 'Короткое описание для карточки', type: 'textarea' },
    {
      name: 'icon',
      label: 'Иконка',
      type: 'select',
      defaultValue: 'building',
      options: sectionIcons.map((value) => ({ label: value, value })),
    },
    {
      name: 'tone',
      label: 'Фон карточки',
      type: 'select',
      defaultValue: 'navy',
      options: [
        { label: 'Тёмно-синий', value: 'navy' },
        { label: 'Синий', value: 'blue' },
        { label: 'Графит', value: 'graphite' },
      ],
    },
    { name: 'order', label: 'Порядок вывода', type: 'number', defaultValue: 100 },
    {
      name: 'crossSections',
      label: '«С этим покупают»: предлагать товары из разделов',
      type: 'relationship',
      relationTo: 'sections',
      hasMany: true,
      admin: {
        description:
          'Например, к плоттерам — расходные материалы, к программам — курсы и внедрение. ' +
          'Курсы и программы с направлением предлагаются, только если направление совпадает.',
      },
    },
  ],
})

const productCollection = contentCollection({
  slug: 'products',
  singular: 'Товар',
  plural: 'Товары',
  fields: [
    slugField(),
    {
      name: 'kind',
      label: 'Тип',
      type: 'select',
      required: true,
      options: [
        { label: 'Программное обеспечение', value: 'software' },
        { label: 'Оборудование', value: 'hardware' },
        { label: 'Курс', value: 'course' },
        { label: 'Услуга', value: 'service' },
      ],
    },
    { name: 'summary', label: 'Коротко для карточки (1–2 предложения)', type: 'textarea' },
    {
      name: 'description',
      label: 'Описание',
      type: 'textarea',
      admin: {
        description:
          'Пустая строка — новый абзац, «## » в начале — подзаголовок, «- » — пункт списка.',
      },
    },
    relationField('manufacturer', 'Производитель', 'manufacturers'),
    {
      type: 'collapsible',
      label: 'Разделы каталога',
      fields: [
        {
          name: 'autoSections',
          label: 'Подбирать разделы по правилам',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description:
              'Разделы ставятся сами по «Правилам разделов». Если поменять разделы вручную, галочка ' +
              'снимется, и правила этот товар больше не трогают. Поставьте её снова, чтобы вернуть ' +
              'разделы по правилам.',
          },
        },
        {
          name: 'mainSection',
          label: 'Основной раздел',
          type: 'relationship',
          relationTo: 'sections',
          admin: {
            description:
              'Главное направление или тип товара: от него значок, хлебные крошки и «Похожие».',
          },
        },
        {
          name: 'extraSections',
          label: 'Дополнительные разделы',
          type: 'relationship',
          relationTo: 'sections',
          hasMany: true,
          admin: { description: 'Товар виден и в этих разделах каталога.' },
        },
        {
          // Основной + дополнительные одним списком, заполняется сам (хук productSections).
          name: 'sections',
          type: 'relationship',
          relationTo: 'sections',
          hasMany: true,
          admin: { hidden: true },
        },
      ],
    },
    { name: 'tasks', label: 'Задачи', type: 'array', fields: [textField('title', 'Задача', true)] },
    relationField('requiresProducts', 'Требуется базовое ПО', 'products', true),
    {
      type: 'collapsible',
      label: 'Похожие и «С этим покупают»',
      admin: {
        description:
          'Сайт подбирает товары сам по разделам. Ручные списки показываются первыми, ' +
          'галочки разрешают или запрещают предлагать этот товар в чужих подборках.',
      },
      fields: [
        {
          name: 'suggestSimilar',
          label: 'Сайт может предлагать этот товар в «Похожих»',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'suggestCross',
          label: 'Сайт может предлагать этот товар в «С этим покупают» (и в корзине)',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'similarProducts',
          label: 'Похожие — вручную',
          type: 'relationship',
          relationTo: 'products',
          hasMany: true,
        },
        {
          name: 'recommended',
          label: '«С этим покупают» — вручную',
          type: 'relationship',
          relationTo: 'products',
          hasMany: true,
        },
      ],
    },
    relationField('gallery', 'Галерея', 'media', true),
    {
      name: 'properties',
      label: 'Характеристики',
      type: 'array',
      fields: [textField('name', 'Название', true), textField('value', 'Значение', true)],
    },
    {
      name: 'faq',
      label: 'Частые вопросы',
      type: 'array',
      fields: [
        textField('question', 'Вопрос', true),
        { name: 'answer', label: 'Ответ', type: 'textarea', required: true },
      ],
    },
  ],
})

export const products: CollectionConfig = {
  ...productCollection,
  admin: {
    ...productCollection.admin,
    defaultColumns: ['title', 'manufacturer', 'mainSection', 'status', 'updatedAt'],
  },
  hooks: { beforeChange: [productSections] },
}

export const offers: CollectionConfig = contentCollection({
  slug: 'offers',
  singular: 'Предложение',
  plural: 'Предложения',
  fields: [
    relationField('product', 'Товар', 'products'),
    textField('configuration', 'Комплектация', true),
    textField('license', 'Условия лицензии', true),
    textField('amount', 'Цена в исходной валюте', true),
    {
      name: 'currency',
      label: 'Валюта',
      type: 'select',
      required: true,
      options: ['KZT', 'USD', 'EUR', 'RUB'],
    },
    { name: 'includesVat', label: 'Исходный НДС включён', type: 'checkbox' },
    textField('sourceVat', 'Исходная ставка НДС, %', true),
  ],
})
