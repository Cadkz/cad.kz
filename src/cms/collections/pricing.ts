import type { CollectionConfig, GlobalConfig } from 'payload'
import { isAdmin, isEditor } from '../access'
import { textField } from '../fields'

/**
 * История курсов. Маркетолог добавляет новую запись с датой — старые не правятся,
 * чтобы у каждой рассчитанной цены оставался проверяемый курс.
 */
export const exchangeRates: CollectionConfig = {
  slug: 'exchange-rates',
  labels: { singular: 'Курс', plural: 'Курсы валют' },
  admin: { useAsTitle: 'currency', defaultColumns: ['currency', 'kztPerUnit', 'effectiveAt'] },
  access: { read: isEditor, create: isEditor, update: isAdmin, delete: isAdmin },
  fields: [
    {
      name: 'currency',
      label: 'Валюта',
      type: 'select',
      options: ['USD', 'EUR', 'RUB'],
      required: true,
    },
    textField('kztPerUnit', 'Тенге за единицу', true),
    { name: 'effectiveAt', label: 'Действует с', type: 'date', required: true },
  ],
}

export const pricingSettings: GlobalConfig = {
  slug: 'pricing-settings',
  label: 'Настройки цены',
  access: { read: isAdmin, update: isAdmin },
  fields: [{ name: 'vat', label: 'НДС, %', type: 'text', defaultValue: '16', required: true }],
}
