import type { CollectionConfig } from 'payload'
import { contentCollection, relationField, slugField, textField } from '../fields'

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
  ],
})

export const products = contentCollection({
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
    relationField('sections', 'Разделы', 'sections', true),
    { name: 'tasks', label: 'Задачи', type: 'array', fields: [textField('title', 'Задача', true)] },
    relationField('requiresProducts', 'Требуется базовое ПО', 'products', true),
    relationField('recommended', 'Рекомендации', 'products', true),
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
