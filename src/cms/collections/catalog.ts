import type { CollectionConfig } from 'payload'
import { contentCollection, relationField, slugField, textField } from '../fields'

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
    { name: 'description', label: 'Описание', type: 'textarea' },
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
