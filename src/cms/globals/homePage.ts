import type { GlobalConfig } from 'payload'
import { everyone, isEditor } from '../access'
import { textField } from '../fields'

const link = [textField('linkLabel', 'Текст кнопки'), textField('linkHref', 'Ссылка кнопки')]

/**
 * Тексты главной страницы. Обещания и цифры (сроки, количество решений) — только отсюда,
 * чтобы их проверял и менял редактор, а не программист.
 */
export const homePage: GlobalConfig = {
  slug: 'home-page',
  label: 'Главная страница',
  access: { read: everyone, update: isEditor },
  fields: [
    textField('eyebrow', 'Плашка над баннером'),
    textField('title', 'Заголовок страницы (h1)', true),
    {
      name: 'sideCards',
      label: 'Карточки справа от баннера',
      type: 'array',
      maxRows: 2,
      fields: [
        textField('title', 'Заголовок', true),
        { name: 'text', label: 'Текст', type: 'textarea' },
        ...link,
        { name: 'dark', label: 'Тёмная карточка', type: 'checkbox' },
      ],
    },
    {
      name: 'trust',
      label: 'Блок «Официальный партнёр»',
      type: 'group',
      admin: {
        description:
          'Под первым экраном: заголовок и логотипы производителей. Статус и подпись — ' +
          'по желанию. Пустой список партнёров — блок не показывается.',
      },
      fields: [
        textField('title', 'Заголовок'),
        { name: 'lead', label: 'Подзаголовок', type: 'textarea' },
        {
          name: 'partners',
          label: 'Партнёрства',
          type: 'array',
          maxRows: 8,
          fields: [
            textField('vendor', 'Производитель', true),
            {
              name: 'logo',
              label: 'Логотип',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Без него показывается название.' },
            },
            textField('status', 'Статус (необязательно)'),
            textField('note', 'Подпись (необязательно)'),
            textField('href', 'Ссылка (каталог производителя, сертификат)'),
          ],
        },
        {
          name: 'links',
          label: 'Ссылки под блоком',
          type: 'array',
          maxRows: 3,
          admin: { description: 'Например, «Реквизиты компании» → /about/requisites.' },
          fields: [textField('label', 'Текст', true), textField('href', 'Ссылка', true)],
        },
      ],
    },
    {
      name: 'bim',
      label: 'Блок «Внедрение BIM»',
      type: 'group',
      fields: [
        textField('eyebrow', 'Плашка'),
        textField('title', 'Заголовок'),
        { name: 'lead', label: 'Вводный текст', type: 'textarea' },
        {
          name: 'stages',
          label: 'Этапы',
          type: 'array',
          maxRows: 4,
          fields: [
            textField('title', 'Этап', true),
            { name: 'text', label: 'Описание', type: 'textarea' },
          ],
        },
        {
          name: 'stats',
          label: 'Цифры',
          type: 'array',
          maxRows: 3,
          fields: [textField('value', 'Значение', true), textField('label', 'Подпись', true)],
        },
        ...link,
      ],
    },
    {
      name: 'process',
      label: 'Как мы работаем',
      type: 'array',
      maxRows: 3,
      fields: [
        textField('title', 'Шаг', true),
        { name: 'text', label: 'Описание', type: 'textarea' },
      ],
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
    {
      name: 'cta',
      label: 'Баннер внизу страницы',
      type: 'group',
      fields: [
        textField('title', 'Заголовок'),
        { name: 'text', label: 'Текст', type: 'textarea' },
        ...link,
      ],
    },
  ],
}
