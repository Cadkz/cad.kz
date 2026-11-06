import type { Field, GlobalConfig } from 'payload'
import { everyone, isEditor } from '../access'
import { textField, translateTexts } from '../fields'

const BIM_SHARED = new Set(['linkHref'])

const paragraphs = (name: string, label: string): Field => ({
  name,
  label,
  type: 'textarea',
  admin: { description: 'Каждая строка — отдельный абзац.' },
})

/** Подпись над заголовком, заголовок и текст: блоки «Зачем», «Как мы помогаем», «Результат». */
const block = (name: string, label: string): Field => ({
  name,
  label,
  type: 'group',
  fields: [
    textField('eyebrow', 'Надпись над заголовком'),
    textField('title', 'Заголовок'),
    paragraphs('text', 'Текст'),
  ],
})

/**
 * Страница BIM (/bim) под баннером BIM: опыт, зачем BIM, как мы помогаем, задачи, результат,
 * призыв. Баннер вверху — из «Главной сайта» (блок «Внедрение BIM»).
 */
export const bimPage: GlobalConfig = {
  slug: 'bim-page',
  label: 'Страница BIM',
  access: { read: everyone, update: isEditor },
  fields: translateTexts(
    [
      {
        name: 'proof',
        label: 'Опыт (строка под баннером)',
        type: 'array',
        maxRows: 3,
        fields: [textField('title', 'Крупно', true), textField('text', 'Подпись')],
      },
      block('intro', 'Зачем BIM'),
      block('help', 'Как мы помогаем'),
      textField('servicesTitle', 'Заголовок задач (например, Какие задачи можем решить)'),
      {
        name: 'services',
        label: 'Задачи',
        type: 'array',
        maxRows: 6,
        admin: {
          description:
            'Карточка: номер, название, когда нужно; по кнопке «Что мы сделаем» — работы и результат.',
        },
        fields: [
          textField('title', 'Название', true),
          { name: 'problem', label: 'Когда нужно', type: 'textarea' },
          { name: 'work', label: 'Что мы сделаем', type: 'textarea' },
          textField('result', 'Результат'),
        ],
      },
      block('outcome', 'Результат совместной работы'),
      {
        name: 'cta',
        label: 'Баннер внизу',
        type: 'group',
        fields: [
          textField('title', 'Заголовок'),
          paragraphs('text', 'Текст'),
          textField('linkLabel', 'Текст кнопки'),
          {
            name: 'linkHref',
            label: 'Ссылка кнопки',
            type: 'text',
            admin: { description: 'Слово whatsapp — чат WhatsApp из «Контакты и подвал».' },
          },
        ],
      },
    ],
    BIM_SHARED,
  ),
}
