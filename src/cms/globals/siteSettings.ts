import type { GlobalConfig } from 'payload'
import { everyone, isEditor } from '../access'
import { textField } from '../fields'

/** Контакты и тексты шапки и подвала. Маркетолог меняет их в админке, а не в коде. */
export const siteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Контакты и подвал',
  access: { read: everyone, update: isEditor },
  fields: [
    {
      name: 'phones',
      label: 'Телефоны в шапке',
      type: 'array',
      maxRows: 3,
      fields: [
        textField('label', 'Как показывать', true),
        textField('tel', 'Номер для звонка', true),
      ],
    },
    textField('whatsapp', 'Номер WhatsApp (только цифры, с кодом страны)'),
    textField('telegram', 'Ссылка на Telegram'),
    textField('email', 'Электронная почта'),
    {
      name: 'address',
      label: 'Адрес офиса',
      type: 'textarea',
      admin: { description: 'Показывается на странице «Контакты».' },
    },
    textField('hours', 'Часы работы (например, Пн–Пт 9:00–18:00)'),
    textField('mapUrl', 'Ссылка на офис в 2ГИС или на картах'),
    {
      name: 'socials',
      label: 'Соцсети',
      type: 'array',
      fields: [
        {
          name: 'network',
          label: 'Соцсеть',
          type: 'select',
          required: true,
          options: [
            { label: 'Instagram', value: 'instagram' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'Telegram', value: 'telegram' },
            { label: 'LinkedIn', value: 'linkedin' },
          ],
        },
        textField('url', 'Ссылка', true),
      ],
    },
    { name: 'footerText', label: 'Текст в подвале', type: 'textarea' },
  ],
}
