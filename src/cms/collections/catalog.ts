import type { CollectionConfig, Field } from 'payload'
import { contentCollection, relationField, seoField, slugField, textField } from '../fields'
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

const levelOptions = [
  { label: 'Флагман — самым первым', value: 'flagship' },
  { label: 'Топ продаж — выше остальных', value: 'top' },
  { label: 'Обычный', value: 'normal' },
  { label: 'В конце списка', value: 'low' },
]

/**
 * Приоритет показа в меню, каталоге и подборках (src/domain/priority.mjs). У товара пусто —
 * берётся уровень производителя.
 */
function priorityField(forProduct: boolean): Field {
  return {
    name: 'priority',
    label: 'Приоритет показа',
    type: 'select',
    ...(forProduct ? {} : { defaultValue: 'normal' }),
    options: levelOptions,
    admin: {
      position: 'sidebar',
      description: forProduct
        ? 'Пусто — как у производителя. Флагман — главный товар линейки (AutoCAD, SCAD Office, ' +
          'GEO5): первым в меню и каталоге. Топ продаж — сразу после флагманов.'
        : 'Уровень для всех товаров производителя, если у товара свой не выбран. ' +
          'Топы продаж показываются первыми в меню, каталоге и подборках.',
    },
  }
}

export const manufacturers = contentCollection({
  slug: 'manufacturers',
  singular: 'Производитель',
  plural: 'Производители',
  fields: [
    priorityField(false),
    textField('website', 'Сайт'),
    {
      name: 'image',
      label: 'Картинка для товаров без своей',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Логотип или коробка программы. Показывается в каталоге и на странице товара, ' +
          'если у товара пустая галерея.',
      },
    },
  ],
})

/**
 * Линейка производителя: путь в меню и каталоге «раздел → производитель → линейка → товары».
 * Например, у SCAD Soft — «Программный комплекс», «Сателлиты», «Справочники».
 */
export const productLines: CollectionConfig = {
  ...contentCollection({
    slug: 'product-lines',
    singular: 'Линейка',
    plural: 'Линейки производителей',
    fields: [
      {
        name: 'manufacturer',
        label: 'Производитель',
        type: 'relationship',
        relationTo: 'manufacturers',
        required: true,
        index: true,
      },
      {
        name: 'order',
        label: 'Порядок',
        type: 'number',
        defaultValue: 100,
        admin: { description: 'Меньше — выше в меню и каталоге.' },
      },
      {
        name: 'summary',
        label: 'Коротко для карточки',
        type: 'textarea',
        admin: { description: 'Одна строка под названием линейки. Можно не заполнять.' },
      },
    ],
  }),
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'manufacturer', 'order', 'status'],
    description:
      'Группы товаров внутри производителя. Товар попадает в линейку полем «Линейка» в карточке ' +
      'товара. Линейка без опубликованных товаров на сайте не показывается.',
  },
}

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
      name: 'pinnedManufacturers',
      label: 'Первыми в разделе: производители по порядку',
      type: 'relationship',
      relationTo: 'manufacturers',
      hasMany: true,
      admin: {
        description:
          'Например, в «Геотехнике»: Fine Software (GEO5), ЛИРА-FEM, SCAD. Порядок можно менять ' +
          'перетаскиванием. Работает внутри одного уровня приоритета: топ продаж всё равно выше ' +
          'обычного товара.',
      },
    },
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
    priorityField(true),
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
      type: 'row',
      fields: [
        {
          name: 'line',
          label: 'Линейка',
          type: 'relationship',
          relationTo: 'product-lines',
          // Только линейки производителя этого товара.
          filterOptions: ({ data }) =>
            data?.manufacturer ? { manufacturer: { equals: data.manufacturer } } : true,
          admin: {
            width: '60%',
            description: 'Например, у SCAD Soft: «Программный комплекс», «Сателлиты».',
          },
        },
        {
          name: 'lineOrder',
          label: 'Порядок в линейке',
          type: 'number',
          admin: {
            width: '40%',
            description: 'Меньше — выше. Основа линейки (SCAD Office) — 1, пакеты — 2, модули — 3.',
          },
        },
      ],
    },
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
    seoField,
  ],
})

export const products: CollectionConfig = {
  ...productCollection,
  admin: {
    ...productCollection.admin,
    defaultColumns: ['title', 'manufacturer', 'line', 'mainSection', 'priority', 'status'],
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
    {
      name: 'priceNames',
      label: 'Названия в прайсах производителя',
      type: 'text',
      hasMany: true,
      admin: {
        description:
          'Заполняется само при загрузке прайса: по этим названиям строка прайса в следующий раз ' +
          'сразу найдёт это предложение. Неверное название можно удалить.',
      },
    },
  ],
})
