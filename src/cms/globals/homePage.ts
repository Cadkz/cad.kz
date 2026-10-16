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
    textField('eyebrow', 'Первый экран: плашка над заголовком'),
    textField('title', 'Первый экран: заголовок страницы (h1)', true),
    {
      name: 'hero',
      label: 'Первый экран: подбор по задаче',
      type: 'group',
      admin: {
        description:
          'Слева подзаголовок и главная кнопка (открывает чат с Кадди), справа карточка: поле ' +
          '«опишите задачу» и кнопки задач. Нажатие на задачу сразу задаёт Кадди вопрос из поля ' +
          '«Вопрос Кадди». Если консультант выключен, вопрос уходит в WhatsApp. Заголовок до ' +
          '50 знаков — в две строки, подзаголовок до 140.',
      },
      fields: [
        { name: 'lead', label: 'Подзаголовок', type: 'textarea' },
        textField('button', 'Главная кнопка (пусто — «Подобрать по задаче»)'),
        textField('cardTitle', 'Карточка справа: заголовок (пусто — «С чего начнём?»)'),
        textField('placeholder', 'Подсказка в поле ввода'),
        {
          name: 'tasks',
          label: 'Кнопки задач',
          type: 'array',
          maxRows: 8,
          labels: { singular: 'Задача', plural: 'Задачи' },
          admin: {
            description: 'Короткое название (одно-два слова) и вопрос, который уйдёт Кадди.',
          },
          fields: [
            textField('label', 'Название на кнопке', true),
            {
              name: 'question',
              label: 'Вопрос Кадди',
              type: 'textarea',
              required: true,
            },
          ],
        },
        { name: 'note', label: 'Подпись под карточкой', type: 'textarea' },
      ],
    },
    {
      name: 'sideCards',
      label: 'Карточки в блоке «Как мы работаем»',
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
      name: 'popular',
      label: 'Блок «Популярные решения»',
      type: 'group',
      admin: {
        description:
          'Первая вкладка меню «Каталог» (на телефоне — первая строка меню): до 8 плиток, маленький ' +
          'логотип и название. На главной блока больше нет. Порядок — по спросу (документ по CRM, ' +
          '12.10.2026). Пустой список — вкладки нет.',
      },
      fields: [
        textField('title', 'Заголовок'),
        { name: 'lead', label: 'Подзаголовок', type: 'textarea' },
        {
          name: 'items',
          label: 'Плитки',
          type: 'array',
          maxRows: 8,
          labels: { singular: 'Плитка', plural: 'Плитки' },
          fields: [
            {
              name: 'product',
              label: 'Товар',
              type: 'relationship',
              relationTo: 'products',
              admin: {
                description:
                  'С товара берётся логотип и ссылка. Если плитка про несколько программ ' +
                  '(«Inventor и Fusion»), впишите ссылку на каталог — товар нужен только для логотипа.',
              },
            },
            textField('title', 'Название (если не как у товара)'),
            textField('href', 'Ссылка (если не на товар)'),
          ],
        },
      ],
    },
    {
      name: 'renew',
      label: 'Полоса «Продление лицензий»',
      type: 'group',
      admin: {
        description:
          'Под направлениями: программы чипами ведут на страницу продления с выбранной ' +
          'программой. Пустой заголовок — полоса не показывается.',
      },
      fields: [textField('title', 'Заголовок'), { name: 'text', label: 'Текст', type: 'textarea' }],
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
