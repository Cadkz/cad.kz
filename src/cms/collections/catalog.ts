import type { CollectionConfig, Field } from 'payload'
import { SCAN_OPTIONS } from '../../domain/artecScans.mjs'
import { SCENARIO_LABELS, SCENARIOS } from '../../domain/buyScenario.mjs'
import { CHECK_LABELS, CHECKS } from '../../domain/quality.mjs'
import {
  contentCollection,
  legacyFields,
  relationField,
  seoField,
  slugField,
  statusField,
  textField,
} from '../fields'
import { productSections } from '../hooks/productSections'
import { offerQualityChange, offerQualityDelete, productQuality } from '../hooks/quality'
import { pageViewFields, pickerField } from './picker'

const PRODUCTS_LINK = '/components/ProductsLink/ProductsLink'
/** Визуальный редактор с режимом HTML и таблицами — тот же, что у новостей и страниц. */
const BODY_EDITOR = '/components/BodyEditor/BodyEditor#BodyEditor'

/**
 * «Товары (N)»: в списке — колонка, в карточке — ссылка справа. Открывает «Товары» уже
 * отфильтрованными по этой записи, как папку в Битриксе. В базе ничего не хранит.
 */
function productsLinkField(by: 'manufacturer' | 'line' | 'section'): Field {
  return {
    name: 'productsLink',
    label: 'Товары',
    type: 'ui',
    admin: {
      position: 'sidebar',
      components: {
        Cell: { path: `${PRODUCTS_LINK}#ProductsCell`, serverProps: { by } },
        Field: { path: `${PRODUCTS_LINK}#ProductsField`, serverProps: { by } },
      },
    },
  }
}

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
  'compass',
] as const

const levelOptions = [
  { label: 'Флагман — самым первым', value: 'flagship' },
  { label: 'Топ продаж — выше остальных', value: 'top' },
  { label: 'Обычный', value: 'normal' },
  { label: 'В конце списка', value: 'low' },
]

const scenarioOptions = SCENARIOS.map((value) => ({ label: SCENARIO_LABELS[value], value }))

/**
 * Сценарий покупки (src/domain/buyScenario.mjs): от него кнопки карточки и страницы товара.
 * У раздела — по умолчанию для его товаров, у товара — свой, если отличается.
 */
function scenarioField(forProduct: boolean): Field {
  return {
    name: 'scenario',
    label: 'Сценарий покупки',
    type: 'select',
    options: scenarioOptions,
    admin: {
      position: 'sidebar',
      description: forProduct
        ? 'От него кнопки на карточке и странице товара. Пусто — как у основного раздела.'
        : 'Кнопки по умолчанию для товаров раздела. У товара можно выбрать свой сценарий. ' +
          'Пусто — по типу товара.',
    },
  }
}

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
        ? 'Пусто — как у производителя. Флагман — первым в меню и каталоге, топ продаж — сразу ' +
          'после флагманов.'
        : 'Уровень для всех товаров производителя, если у товара свой не выбран. ' +
          'Топы продаж показываются первыми в меню, каталоге и подборках.',
    },
  }
}

const manufacturersBase = contentCollection({
  slug: 'manufacturers',
  singular: 'Производитель',
  plural: 'Производители',
  fields: [
    productsLinkField('manufacturer'),
    {
      name: 'order',
      label: 'Сорт.',
      type: 'number',
      min: 0,
      admin: {
        position: 'sidebar',
        description:
          'Как «Сорт.» в Битриксе: меньше — выше. Порядок производителей в админке «Каталог» и ' +
          'плиток производителей на сайте. Где у раздела заданы «Первыми в разделе», сначала они. ' +
          'Пусто — после производителей с числом, по топам продаж.',
      },
    },
    priorityField(false),
    textField('website', 'Сайт'),
    {
      name: 'logo',
      label: 'Логотип',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Показывается в карточках программ производителя, у которых нет своего логотипа. ' +
          'Лучше SVG или PNG от 400 px с прозрачным фоном.',
      },
    },
    {
      name: 'image',
      label: 'Картинка для товаров без своей',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Показывается на странице товара, если у товара пустая галерея. В карточках каталога ' +
          'у программ — «Логотип», у оборудования — фото из галереи.',
      },
    },
  ],
})

/** Колонка «Товары» — сразу после названия: открыть товары производителя одним щелчком. */
export const manufacturers: CollectionConfig = {
  ...manufacturersBase,
  admin: {
    ...manufacturersBase.admin,
    defaultColumns: ['title', 'productsLink', 'order', 'status'],
  },
}

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
      productsLinkField('line'),
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
      {
        type: 'collapsible',
        label: 'Страница семейства',
        fields: [
          {
            name: 'familyPage',
            label: 'Своя страница семейства',
            type: 'checkbox',
            admin: {
              description:
                'Редкие товары линейки собираются на одной странице списком с галочками и кнопкой ' +
                '«Получить КП». Товары с видом «Без своей страницы» ведут сюда.',
            },
          },
          {
            name: 'slug',
            label: 'Адрес страницы',
            type: 'text',
            unique: true,
            index: true,
            admin: {
              condition: (data) => Boolean(data?.familyPage),
              description: 'Латиницей через дефис: /families/<адрес>.',
            },
          },
          {
            name: 'intro',
            label: 'Текст вверху страницы',
            type: 'textarea',
            admin: { condition: (data) => Boolean(data?.familyPage) },
          },
          {
            name: 'renewLabel',
            label: 'Кнопка обновления',
            type: 'text',
            admin: {
              condition: (data) => Boolean(data?.familyPage),
              description:
                'Например, «Обновить версию». Пусто — кнопки нет. Заявка менеджеру без корзины: ' +
                'он сам уточнит лицензию клиента.',
            },
          },
          {
            name: 'seo',
            label: 'Для поисковиков',
            type: 'group',
            admin: { condition: (data) => Boolean(data?.familyPage) },
            fields: [
              textField('title', 'Заголовок вкладки (title)'),
              { name: 'description', label: 'Описание в поиске (description)', type: 'textarea' },
            ],
          },
        ],
      },
    ],
  }),
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'productsLink', 'manufacturer', 'order', 'status'],
    description:
      'Группы товаров внутри производителя. Товар попадает в линейку полем «Линейка» в карточке ' +
      'товара. Линейка без опубликованных товаров на сайте не показывается.',
  },
}

const sectionsBase = contentCollection({
  slug: 'sections',
  singular: 'Раздел',
  plural: 'Разделы',
  fields: [
    productsLinkField('section'),
    slugField(),
    {
      name: 'parent',
      label: 'Родительский раздел',
      type: 'relationship',
      relationTo: 'sections',
      admin: {
        description:
          'Подраздел: в меню, фильтре и на главной не показывается отдельно, его товары видны ' +
          'в родительском разделе. Например, «Расходные материалы» внутри «Широкоформатной печати».',
      },
    },
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
    scenarioField(false),
    {
      name: 'demoButton',
      label: 'Запись на демонстрацию',
      type: 'checkbox',
      admin: {
        position: 'sidebar',
        description:
          'У оборудования раздела главная кнопка — «Записаться на демонстрацию» (3D-сканеры).',
      },
    },
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

export const sections: CollectionConfig = {
  ...sectionsBase,
  admin: { ...sectionsBase.admin, defaultColumns: ['title', 'productsLink', 'parent', 'status'] },
}

/** «Основное», как в Битриксе: тип, производитель, линейка и «Сорт.». Разделы и поиск — ниже. */
const productBasicFields: Field[] = [
  {
    type: 'row',
    fields: [
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
        admin: { width: '40%' },
      },
      {
        name: 'manufacturer',
        label: 'Производитель',
        type: 'relationship',
        relationTo: 'manufacturers',
        admin: { width: '60%' },
      },
    ],
  },
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
        label: 'Сорт. (порядок в линейке)',
        type: 'number',
        admin: {
          width: '40%',
          description:
            'Как «Сорт.» в Битриксе: меньше — выше у своего производителя. Основа линейки ' +
            '(SCAD Office) — 1, пакеты — 2, модули — 3. Топы продаж всё равно первыми.',
        },
      },
    ],
  },
]

/** «Анонс», как в Битриксе: что видно в карточке каталога и в шапке страницы товара. */
const productAnnounceFields: Field[] = [
  {
    name: 'summary',
    label: 'Коротко для карточки (1–2 предложения)',
    type: 'textarea',
    admin: { description: 'Показывается в карточке каталога и под названием на странице товара.' },
  },
  {
    name: 'cardImage',
    label: 'Картинка для карточки',
    type: 'upload',
    relationTo: 'media',
    admin: {
      description:
        'Можно перетащить файл прямо сюда. У программы — её логотип, у оборудования — фото ' +
        'самого устройства. Пусто — логотип программы или производителя, у оборудования — ' +
        'первая картинка галереи.',
    },
  },
  {
    name: 'tasks',
    label: 'Для каких задач',
    type: 'array',
    labels: { singular: 'Задача', plural: 'Задачи' },
    admin: {
      description: '3–4 коротких пункта: показываются в шапке страницы товара.',
    },
    fields: [textField('title', 'Задача', true)],
  },
]

/**
 * «Подробно», как в Битриксе: описание в визуальном редакторе с режимом HTML (тот же, что у
 * новостей). Хранится разметкой сайта: старые тексты не меняются, пока их не правили.
 */
const productDetailFields: Field[] = [
  {
    name: 'description',
    label: 'Описание',
    type: 'textarea',
    admin: { components: { Field: BODY_EDITOR } },
  },
]

/** «Картинки»: галерея страницы товара, файлы перетаскиваются прямо в поле. */
const productImageFields: Field[] = [
  {
    name: 'gallery',
    label: 'Галерея',
    type: 'upload',
    relationTo: 'media',
    hasMany: true,
    admin: {
      description:
        'Перетащите сюда картинки с компьютера — можно несколько сразу — или выберите из уже ' +
        'загруженных. Порядок меняется перетаскиванием, первая — главная на странице товара.',
    },
  },
]

/**
 * «Примеры сканов» у 3D-сканеров (24.10.2026): какие готовые 3D-модели показать на странице
 * и в каком порядке. Сами модели — библиотека сайта (src/domain/artecScans.mjs): тяжёлые
 * исходники сканов сначала уменьшают, поэтому выбор — из списка, а не загрузкой файла.
 */
const productScanFields: Field[] = [
  {
    name: 'scans',
    label: 'Примеры сканов',
    type: 'array',
    labels: { singular: 'Скан', plural: 'Сканы' },
    admin: {
      description:
        'Показываются на странице товара галереей: превью листаются, по нажатию модель ' +
        'открывается крупно, её можно крутить и приближать. Порядок — перетаскиванием, первый ' +
        'скан идёт первым. Пусто — блока нет. Новый скан в список добавляет разработчик.',
    },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'scan',
            label: 'Скан',
            type: 'select',
            required: true,
            options: SCAN_OPTIONS,
            admin: { width: '60%' },
          },
          {
            name: 'title',
            label: 'Своя подпись',
            type: 'text',
            admin: { width: '40%', description: 'Пусто — подпись из списка.' },
          },
        ],
      },
    ],
  },
]

/** Где товар виден в каталоге и как его находит поиск. */
const productCatalogFields: Field[] = [
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
  {
    name: 'searchAliases',
    label: 'Другие названия для поиска',
    type: 'text',
    admin: {
      description:
        'Через запятую: как товар ещё называют покупатели, например «акад, автокад». ' +
        'Поиск на сайте находит товар и по этим словам. Опечатки и русские буквы вместо латинских ' +
        'поиск понимает сам — их вписывать не нужно.',
    },
  },
]

/** «Характеристики и связи»: блоки страницы товара ниже описания и связи с другими товарами. */
const productPageFields: Field[] = [
  {
    name: 'properties',
    label: 'Характеристики',
    type: 'array',
    fields: [
      {
        type: 'row',
        fields: [textField('name', 'Название', true), textField('value', 'Значение', true)],
      },
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
  relationField('requiresProducts', 'Требуется базовое ПО', 'products', true),
  {
    type: 'collapsible',
    label: 'Похожие и «С этим покупают»',
    admin: {
      initCollapsed: true,
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
  {
    type: 'collapsible',
    label: 'Служебное: данные для фильтров оборудования',
    admin: {
      initCollapsed: true,
      description: 'Заполняется автоматически. Обычно менять не нужно.',
    },
    fields: [
      {
        name: 'researchData',
        label: 'Данные исследования: фильтры и статус модели',
        type: 'json',
        admin: {
          description:
            'Категория, значения фильтров, статус модели и замена. Не меняет публикацию товара.',
        },
      },
    ],
  },
]

/**
 * Карточка товара в админке по вкладкам, как в Битриксе (решение владельца 23.10.2026):
 * «Основное», «Анонс», «Подробно», «Картинки», «Цены», «Характеристики и связи», «SEO».
 * Справа — активность, адрес, показ. Вкладки и свёрнутые блоки без имени: данные в базе лежат
 * как раньше, миграция не нужна.
 */
const productTabs: Field = {
  type: 'tabs',
  tabs: [
    { label: 'Основное', fields: [...productBasicFields, ...productCatalogFields] },
    { label: 'Анонс', fields: productAnnounceFields },
    { label: 'Подробно', fields: productDetailFields },
    { label: 'Картинки', fields: productImageFields },
    {
      label: 'Примеры сканов',
      admin: { condition: (data) => data?.kind === 'hardware' },
      fields: productScanFields,
    },
    {
      label: 'Цены',
      fields: [
        {
          name: 'offersTable',
          type: 'ui',
          admin: { components: { Field: '/components/ProductOffers/ProductOffers#ProductOffers' } },
        },
      ],
    },
    {
      label: 'Подбор комплекта',
      admin: { condition: (data) => data?.pageView === 'picker' },
      fields: [pickerField],
    },
    { label: 'Характеристики и связи', fields: productPageFields },
    {
      label: 'SEO',
      fields: [
        seoField,
        {
          type: 'collapsible',
          label: 'Служебное: перенос со старого сайта',
          admin: {
            initCollapsed: true,
            description: 'Заполняется при переносе со старого сайта. Обычно менять не нужно.',
          },
          fields: legacyFields,
        },
      ],
    },
  ],
}

/** «Активность», как в Битриксе: значения в базе прежние (черновик / опубликовано). */
const activityField: Field = {
  ...statusField,
  label: 'Активность',
  options: [
    // Порядок значений как в statusField: от него зависит тип в базе.
    { label: 'Нет — скрыт с сайта (черновик)', value: 'draft' },
    { label: 'Да — показывать на сайте', value: 'published' },
  ],
  admin: { position: 'sidebar' },
}

const productCollection = contentCollection({
  slug: 'products',
  singular: 'Товар',
  plural: 'Товары',
  fields: [],
})

/**
 * Отметка заполненности (src/lib/productQuality.ts): считается сама, руками не правится.
 * Хранится в товаре, чтобы список можно было сортировать и фильтровать по ней.
 */
const qualityFields: Field[] = [
  {
    name: 'qualityScore',
    label: 'Заполненность',
    type: 'number',
    index: true,
    admin: {
      position: 'sidebar',
      readOnly: true,
      components: {
        Field: '/components/QualityField/QualityField#QualityField',
        Cell: '/components/QualityMark/QualityMark#QualityCell',
      },
    },
  },
  {
    name: 'qualityGaps',
    label: 'Чего не хватает',
    type: 'select',
    hasMany: true,
    options: CHECKS.map((value) => ({ label: CHECK_LABELS[value], value })),
    admin: {
      position: 'sidebar',
      readOnly: true,
      disableListColumn: true,
      components: { Field: '/components/QualityField/QualityField#QualityHidden' },
    },
  },
]

export const products: CollectionConfig = {
  ...productCollection,
  // Справа сверху вниз: заполненность, публикация, адрес, показ, затем свёрнутые SEO и служебное.
  fields: [
    textField('title', 'Название', true),
    ...qualityFields,
    activityField,
    { ...slugField(), admin: { position: 'sidebar' } },
    priorityField(true),
    {
      name: 'topOrder',
      label: 'Место в топе продаж',
      type: 'number',
      min: 1,
      max: 99,
      admin: {
        position: 'sidebar',
        description:
          'Топы продаж идут первыми во всём каталоге и меню, по местам: 1 — самым первым. ' +
          'Одинаковое место — по названию. Пусто — товар не в топе, порядок по «Приоритету показа».',
      },
    },
    scenarioField(true),
    ...pageViewFields,
    productTabs,
  ],
  enableQueryPresets: true,
  admin: {
    ...productCollection.admin,
    defaultColumns: ['title', 'qualityScore', 'manufacturer', 'mainSection', 'priority', 'status'],
  },
  // Заполненность — после разделов: она смотрит, есть ли у товара раздел.
  hooks: { beforeChange: [productSections, productQuality] },
}

const offerCollection = contentCollection({
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
      name: 'variants',
      label: 'Значения переключателей',
      type: 'text',
      hasMany: true,
      admin: {
        description:
          'Для подбора: редакция или срок этого предложения, например S392 или «1 год», так же, ' +
          'как в переключателе у товара. Пусто — подходит при любом выборе.',
      },
    },
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

export const offers: CollectionConfig = {
  ...offerCollection,
  enableQueryPresets: true,
  admin: {
    ...offerCollection.admin,
    defaultColumns: ['title', 'product', 'amount', 'currency', 'status', 'updatedAt'],
  },
  // У товара могли появиться или пропасть предложения и цена — пересчитать его заполненность.
  hooks: { afterChange: [offerQualityChange], afterDelete: [offerQualityDelete] },
}
