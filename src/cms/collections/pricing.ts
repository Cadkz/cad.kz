import type { CollectionConfig, GlobalConfig } from 'payload'
import { isAdmin, isEditor } from '../access'
import { textField } from '../fields'
import { logRateChange, logVatChange } from '../hooks/activity'

/**
 * История курсов. Маркетолог добавляет новую запись с датой — старые не правятся,
 * чтобы у каждой рассчитанной цены оставался проверяемый курс.
 */
export const exchangeRates: CollectionConfig = {
  slug: 'exchange-rates',
  labels: { singular: 'Курс', plural: 'Курсы валют' },
  admin: { useAsTitle: 'currency', defaultColumns: ['currency', 'kztPerUnit', 'effectiveAt'] },
  access: { read: isEditor, create: isEditor, update: isAdmin, delete: isAdmin },
  hooks: { afterChange: [logRateChange] },
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
  label: 'НДС и настройки цены',
  access: { read: isAdmin, update: isAdmin },
  hooks: { afterChange: [logVatChange] },
  fields: [{ name: 'vat', label: 'НДС, %', type: 'text', defaultValue: '16', required: true }],
}
