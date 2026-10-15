import type { Field } from 'payload'

/**
 * Вид страницы товара и подбор комплекта (src/domain/picker.mjs). Подбор — шаги с вариантами:
 * основа (входит всегда), один вариант, галочки, готовый комплект. Переключатели (редакция, срок)
 * выбирают у каждого варианта подходящее предложение по полю «Значения переключателей».
 */
export const pageViewFields: Field[] = [
  {
    name: 'pageView',
    label: 'Вид страницы',
    type: 'select',
    defaultValue: 'standard',
    required: true,
    options: [
      { label: 'Обычная: список комплектаций', value: 'standard' },
      { label: 'С подбором по шагам (ходовые товары)', value: 'picker' },
      { label: 'Без своей страницы (входит в подбор или семейство)', value: 'none' },
    ],
    admin: {
      position: 'sidebar',
      description:
        'Без своей страницы — товар виден только в подборе или на странице семейства, ' +
        'прежний адрес ведёт туда.',
    },
  },
  {
    name: 'renewLabel',
    label: 'Кнопка продления',
    type: 'text',
    admin: {
      position: 'sidebar',
      description:
        'Например, «Обновить версию». Пусто — «Продлить лицензию» у стандартной лицензии, ' +
        'у остальных кнопки нет.',
    },
  },
]

const switchField: Field = {
  name: 'switches',
  label: 'Переключатели',
  type: 'array',
  maxRows: 2,
  labels: { singular: 'Переключатель', plural: 'Переключатели' },
  admin: {
    description:
      'Общий выбор для всех шагов: редакция (S392 / SPro) или срок (1 год / 3 года). ' +
      'У предложения значение пишется в поле «Значения переключателей» точно так же.',
  },
  fields: [
    { name: 'title', label: 'Название', type: 'text', required: true },
    {
      name: 'options',
      label: 'Значения',
      type: 'array',
      minRows: 2,
      labels: { singular: 'Значение', plural: 'Значения' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'value', label: 'Значение', type: 'text', required: true },
            { name: 'note', label: 'Пояснение', type: 'text' },
          ],
        },
      ],
    },
  ],
}

const itemFields: Field[] = [
  {
    name: 'product',
    label: 'Товар',
    type: 'relationship',
    relationTo: 'products',
    required: true,
  },
  {
    name: 'offers',
    label: 'Только эти предложения',
    type: 'relationship',
    relationTo: 'offers',
    hasMany: true,
    filterOptions: ({ siblingData }) => {
      const product = (siblingData as { product?: unknown } | undefined)?.product
      return typeof product === 'number' ? { product: { equals: product } } : true
    },
    admin: {
      description:
        'Пусто — все предложения товара. Например, «Полная конфигурация» — её предложения S392 и SPro: ' +
        'из них по переключателю берётся подходящее.',
    },
  },
  {
    type: 'row',
    fields: [
      {
        name: 'label',
        label: 'Короткое название',
        type: 'text',
        admin: { width: '50%', description: 'Пусто — название товара.' },
      },
      {
        name: 'note',
        label: 'Пояснение',
        type: 'text',
        admin: { width: '50%' },
      },
    ],
  },
  { name: 'preselect', label: 'Выбран сразу', type: 'checkbox' },
  {
    name: 'tasks',
    label: 'Задачи для фильтра каталога',
    type: 'text',
    hasMany: true,
    admin: {
      description:
        'Нужны, только если у шага стоит «Показывать в каталоге карточками»: по ним карточка ' +
        'находится в «Уточнить по задачам». Названия — точно как у задач товаров.',
    },
  },
]

const stepField: Field = {
  name: 'steps',
  label: 'Шаги подбора',
  type: 'array',
  labels: { singular: 'Шаг', plural: 'Шаги' },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'title', label: 'Заголовок шага', type: 'text', required: true },
        {
          name: 'mode',
          label: 'Как выбирать',
          type: 'select',
          required: true,
          defaultValue: 'one',
          options: [
            { label: 'Входит всегда (основа)', value: 'base' },
            { label: 'Один вариант', value: 'one' },
            { label: 'Галочки, можно несколько', value: 'many' },
            { label: 'Готовый комплект (заменяет выбор)', value: 'bundle' },
          ],
        },
      ],
    },
    { name: 'hint', label: 'Подсказка', type: 'text' },
    {
      name: 'collapsed',
      label: 'Свернуть список (для длинных списков дополнений)',
      type: 'checkbox',
    },
    {
      name: 'inCatalog',
      label: 'Показывать в каталоге карточками',
      type: 'checkbox',
      admin: {
        description:
          'Каждый вариант шага — своя карточка в каталоге рядом с товаром (например, пакеты GEO5). ' +
          'Кнопка карточки открывает эту страницу с уже выбранным вариантом.',
      },
    },
    {
      name: 'items',
      label: 'Варианты',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Вариант', plural: 'Варианты' },
      fields: itemFields,
    },
  ],
}

export const pickerField: Field = {
  name: 'picker',
  label: 'Подбор комплекта',
  type: 'group',
  admin: {
    condition: (data) => data?.pageView === 'picker',
    description:
      'Например, SCAD Office: переключатель «Редакция», шаги «Основа», «Что будете проверять», ' +
      '«Дополнительные функции», «Готовые комплекты». Цена считается сервером.',
  },
  fields: [switchField, stepField],
}
