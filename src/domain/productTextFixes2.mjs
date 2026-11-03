// @ts-check
// Сверка текстов, этап 2 (03.11.2026, ответы владельца 18:21): Csoft, MagiCAD, НТП, Chaos, Canon,
// WideTEK, курсы, SEO и пустые анонсы. Только данные и чистые функции: запись — разовая настройка
// src/lib/productTextsSetup2.ts. Как в этапе 1, текст меняется, только если в базе ещё старый.
//
// Решения владельца 03.11.2026, 18:21:
// - Project Studio CS 2018 и AutomatiCS 2011 «вряд ли продаются» — в черновик переходы на 2018.x
//   и AutomatiCS 2011; остальные Project Studio CS и подписки AutomatiCS остаются.
// - Курсы — только из таблицы расписания УЦ (Google Диск). Сверка 03.11.2026: все 36 курсов сайта
//   в таблице есть (и пять со старого сайта тоже), «повторы» — разные программы таблицы; не скрываем.
// - АРС-ПС — хотя бы логотип: у товара без фото на странице логотип программы или производителя.

/** @typedef {import('./productTextFixes.mjs').ProductTexts} ProductTexts */

/** Общая SEO-фраза старого сайта на 468 товарах (одна и та же на всех страницах). */
export const GENERIC_SEO = 'Полный комплекс решений для проектировщиков.'

/**
 * SEO-описание из фразы карточки: «Название — для чего. Где купить». Без фразы — пусто: страница
 * возьмёт анонс товара (src/lib/seo.ts).
 * @param {{ title: string, kind: string, phrase: string | null }} input
 */
export function seoFromPhrase({ title, kind, phrase }) {
  if (!phrase) return ''
  const what = phrase.charAt(0).toLowerCase() + phrase.slice(1).replace(/[.!?]$/, '')
  const tail =
    kind === 'hardware'
      ? 'Купить в CAD.kz: поставка по Казахстану, счёт для юрлиц, сервис.'
      : kind === 'course'
        ? 'Обучение в учебном центре CAD.kz, онлайн.'
        : 'Официальная лицензия в CAD.kz: счёт для юрлиц, оплата картой.'
  return `${title} — ${what}. ${tail}`
}

/**
 * Анонс из фразы карточки (просьба владельца: пустые анонсы — взять фразу карточки).
 * @param {string | null} phrase
 */
export function summaryFromPhrase(phrase) {
  if (!phrase) return null
  return /[.!?]$/.test(phrase) ? phrase : `${phrase}.`
}

/** Названия: [что найти (начало или фрагмент), на что заменить]. Порядок важен. */
/** @type {[RegExp, string][]} */
const TITLE_EDITS = [
  // TDMS: «TDMS (7.x (Client)» — скобка не закрыта, версия в названии не нужна.
  [/^TDMS \(7\.x \((.+)\)$/, 'TDMS $1'],
  [/^Право на использование программного обеспечения\s+/, ''],
  [/, subscribtion$/i, ', Subscription'],
  // НТП: «СТАРТ - Проф» карточка делила по тире на «СТАРТ» и «Проф» (titleDash).
  [/^(СТАРТ|ПАССАТ|Штуцер|БДТП|Гидросистема|Revit)\s+-\s*(\S)/, '$1-$2'],
  [/^(Программное обеспечение (?:Revit|База данных текущего проекта БДТП))\s+-\s*(\S)/, '$1-$2'],
  [/"Штуцер - МКЭ"/, '«Штуцер-МКЭ»'],
  [/ПАССАТ-базовый/g, 'ПАССАТ-Базовый'],
  [/^БДТП-базовый модуль$/, 'БДТП-Базовый модуль'],
  [/БДТП-Кип(?=[,\s]|$)/, 'БДТП-КИП'],
  // Chaos: учебные лицензии по-английски со скобками.
  [/^Academic licenses, \(Main Product\), учебный/, 'Учебная лицензия Chaos, основной продукт,'],
  [
    /^Academic licenses, \(Additional Product\), учебный/,
    'Учебная лицензия Chaos, дополнительный продукт,',
  ],
  [/^Academic licenses, Render Node, учебный/, 'Учебная лицензия Chaos, Render Node,'],
  [/^Ключ аппаратной защиты dongle для Vray$/, 'Ключ аппаратной защиты (dongle) для V-Ray'],
  // Canon: «картридж Océ ColorWave…» с маленькой буквы.
  [/^картридж /, 'Картридж '],
]

/**
 * Исправленное название. MagiCAD из линейки «для AutoCAD» получает «для AutoCAD», как программы
 * для Revit получают «для Revit».
 * @param {string} title
 * @param {{ line?: string | null }} [context]
 */
export function fixedTitle(title, context = {}) {
  let result = title
  for (const [find, replace] of TITLE_EDITS) result = result.replace(find, replace)
  if (
    context.line === 'MagiCAD для AutoCAD' &&
    /^MagiCAD /.test(result) &&
    !/AutoCAD|Revit|Object Enabler|Suite/.test(result)
  )
    result = `${result} для AutoCAD`
  return result
}

/** Точечные правки описаний во всём каталоге: [что найти, на что заменить]. */
/** @type {[string, string][]} */
export const TEXT_EDITS_2 = [
  ['архитектурно-строительная части', 'архитектурно-строительной части'],
  ['заземления и расчет зон молниезащиты', 'заземления и расчёта зон молниезащиты'],
  [
    'Модель рассчитана на самые широкие листовые оригиналы в линейке CL.',
    'Модель рассчитана на самые широкие листовые оригиналы в линейке CL — до 1524 мм (60 дюймов).',
  ],
]

/** Подписка Csoft: в описании было «Срок действия 1 год», а продаётся на 1, 2 и 3 года. */
const SUBSCRIPTION_OLD = 'Срок действия 1 год'
const SUBSCRIPTION_NEW =
  'Подписка на обновления на 1, 2 или 3 года: все новые версии программы, вышедшие за срок подписки. Срок выбирается при покупке.'

/**
 * Черновые тексты оборудования Canon (пачка исследователя): повтор абзаца, служебные пометки,
 * ширина дважды, «технологию Струйная пигментная».
 */
/** @type {RegExp[]} */
const CANON_DROP = [
  /^Параметры качества зависят от выбранного материала и режима вывода\.$/,
  /^Производительность нужно оценивать при фактическом формате чертежей и загрузке очереди\.$/,
  /^Набор финишных опций, сканирующая система и рулонный запас зависят от исполнения\.$/,
  /^Сверяйте модель устройства и точный артикул до оформления заказа\.$/,
  /^Смешение близких названий расходников для разных поколений опасно\.$/,
  /^- Заводскую массу именно торговой упаковки/,
  /^- Slug содержит/,
  /^- Не представлен проверенный артикул/,
  /^- Масса\/объём и ресурс конкретной упаковки не подтверждены\.$/,
  /^- Текущий статус продаж у производителя/,
  /^- Скорость конкретной конфигурации подтверждается у производителя$/,
  /^- Сверять с предлагаемым вариантом поставки$/,
  /^- Требуется подтверждение комплектации$/,
]

/** @type {[RegExp, string][]} */
const CANON_EDITS = [
  [/ ?Параметры качества зависят от выбранного материала и режима вывода\./g, ''],
  [/ использует технологию Струйная пигментная\./g, ' печатает пигментными чернилами.'],
  [/ использует технологию LED\/тонер\./g, ' печатает по технологии LED тонером.'],
  [
    / использует технологию CrystalPoint\/TonerPearls\./g,
    ' печатает по технологии CrystalPoint гранулами TonerPearls.',
  ],
  [/ Текущий коммерческий статус конкретной позиции без артикула не установлен\./g, ''],
  [/^Карточка относится к предыдущему поколению/gm, 'Расходник для предыдущего поколения'],
  [
    /; модель TZ-30000 сохраняется в карточках CAD\.kz как прежнее поколение\./g,
    '; TZ-30000 — её прежнее поколение.',
  ],
  [
    /^Уточните код на упаковке, региональную поставку и остатки у менеджера CAD\.kz\.$/gm,
    'Код на упаковке и наличие уточнит менеджер CAD.kz.',
  ],
  // «- Максимальная ширина: 36 дюйм» и сразу «- Максимальная ширина: 914 мм» → одна строка.
  [/^- (Максимальная ширина(?: носителя)?): (\d+) дюйм\n- \1: (\d+) мм$/gm, '- $1: $2" ($3 мм)'],
]

/**
 * @param {string} text
 */
export function canonCleanup(text) {
  let result = text
  for (const [find, replace] of CANON_EDITS) result = result.replace(find, replace)
  const blocks = result.split(/\n\s*\n/)
  const intro = blocks[0]?.trim()
  const kept = blocks
    .map((block) =>
      block
        .split('\n')
        .filter((row) => !CANON_DROP.some((re) => re.test(row.trim())))
        .join('\n')
        .trim(),
    )
    // Первый абзац повторялся под «## Назначение…» — оставляем один раз.
    .filter((block, index) => block && !(index > 0 && block === intro))
  // Заголовок без содержимого после чистки не нужен.
  const out = kept.filter(
    (block, index) =>
      !(
        block.startsWith('## ') &&
        (index === kept.length - 1 || kept[index + 1]?.startsWith('## '))
      ),
  )
  return out.join('\n\n')
}

/** Лёгкая чистка текста plotWAVE T30/T35: не «большие объёмы» и не «высокая нагрузка». */
export function plotwaveT30(/** @type {string} */ text) {
  return text
    .replace(
      /технических комплектов с высокой нагрузкой/g,
      'технических комплектов в небольших и средних объёмах',
    )
    .replace(/^- Сценарий: САПР\/ГИС, Большие объёмы$/m, '- Сценарий: САПР/ГИС')
}

/**
 * MagiCAD: первая строка повторяет название («## MagiCAD Вентиляция для AutoCAD»), абзацы набраны
 * заголовками («## MagiCAD Вентиляция — это мощный модуль…»), а настоящие подзаголовки — обычной
 * строкой над абзацем («Назначение модуля\nМодуль…»).
 * @param {string} text
 */
export function magicadCleanup(text) {
  const blocks = text.split(/\n\s*\n/).map((block) => block.trim())
  const first = blocks[0]?.split('\n') ?? []
  const head = (first[0] ?? '').replace(/^#+\s*/, '')
  if (/^MagiCAD\b/.test(head) && head.length < 70 && !/[.!?]$/.test(head)) {
    first.shift()
    blocks[0] = first.join('\n').trim()
  }
  return blocks
    .filter(Boolean)
    .map((block) => {
      if (block.startsWith('## ')) {
        const heading = block.slice(3)
        return heading.length > 60 || /[.!?]$/.test(heading) ? heading : block
      }
      const rows = block.split('\n')
      const top = rows[0] ?? ''
      if (rows.length > 1 && top.length < 60 && !/[.:;!?,]$/.test(top) && !/^[-|#>\d]/.test(top))
        return `## ${top}\n\n${rows.slice(1).join('\n')}`
      return block
    })
    .join('\n\n')
}

/**
 * Описание после этапа 2: мягкие переносы (U+00AD) вон, точечные правки, правила производителя.
 * @param {string} text
 * @param {{ vendor: string | null, slug: string }} context
 */
export function stage2Description(text, { vendor, slug }) {
  let result = text.replace(/­/g, '')
  for (const [find, replace] of TEXT_EDITS_2) result = result.split(find).join(replace)
  if (result.trim() === SUBSCRIPTION_OLD) result = SUBSCRIPTION_NEW
  if (vendor === 'MagiCAD') result = magicadCleanup(result)
  if (vendor === 'Canon') result = canonCleanup(result)
  if (slug === 'plotwave_t30_35') result = plotwaveT30(result)
  return result
}

/** Товары, которые больше не продаются (ответ владельца 03.11.2026): в черновик. */
export function isRetired(
  /** @type {{ title: string, kind: string, legacyKey?: string | null }} */ p,
) {
  if (/->\s*Project Studio CS .+ 2018\.x/.test(p.title)) return true
  if (p.title === 'AutomatiCS 2011') return true
  // Курсы только из таблицы расписания УЦ: курсы старого сайта заведены импортом из Битрикса.
  if (p.kind === 'course' && /^bitrix:/.test(p.legacyKey ?? '')) return true
  return false
}

/**
 * Комплектации: [адрес товара, было, стало]. У TDMS AddIns for AutoCAD в комплектациях были
 * и варианты для nanoCAD — подписываем понятно, товар называется «для AutoCAD и nanoCAD».
 * @type {[string, string, string][]}
 */
export const OFFER_RENAMES_2 = [
  [
    'tdms_7_x_addins_for_autocad',
    'Право на использование программного обеспечения TDMS (7.x (AddIns for AutoCAD), сетевая лицензия, первое пользовательское место)',
    'Для AutoCAD, первое место',
  ],
  [
    'tdms_7_x_addins_for_autocad',
    'Право на использование программного обеспечения TDMS (7.x (AddIns for AutoCAD), сетевая лицензия, доп. пользовательское место)',
    'Для AutoCAD, доп. место',
  ],
  [
    'tdms_7_x_addins_for_autocad',
    'Право на использование программного обеспечения TDMS (7.x (AddIns for nanoCAD), сетевая лицензия, первое пользовательское место)',
    'Для nanoCAD, первое место',
  ],
  [
    'tdms_7_x_addins_for_autocad',
    'Право на использование программного обеспечения TDMS (7.x (AddIns for nanoCAD), сетевая лицензия, доп. пользовательское место)',
    'Для nanoCAD, доп. место',
  ],
]

/** Комплектации «Версия 2018.x» у Project Studio CS — в черновик вместе с переходами на 2018. */
export const RETIRED_OFFER = 'Версия 2018.x'

/** TDMS: модули по одному общему описанию — у каждого своя строка «Коротко». */
const TDMS_ROLES = {
  Client: 'Рабочее место пользователя TDMS: документы, задания и согласования',
  Professional: 'Расширенное рабочее место TDMS для руководителей и ГИПов',
  Developer: 'Настройка TDMS под процессы компании: объекты, формы и сценарии',
  Viewer: 'Просмотр документов и данных TDMS без права изменения',
  WebClient: 'Работа с TDMS через браузер без установки программы',
  WebDeveloper: 'Настройка веб-интерфейса TDMS под процессы компании',
  'Application Server': 'Сервер приложений TDMS: общая база для всех рабочих мест',
  'File Server': 'Файловый сервер TDMS: хранение файлов проектов и версий',
  'AddIns for Microsoft Office': 'Работа с документами TDMS прямо из Word и Excel',
  'AddIns for AutoCAD': 'Работа с чертежами TDMS прямо из AutoCAD и nanoCAD',
}

/**
 * Анонсы и тексты по адресу товара (формат этапа 1). Курсы: анонсы-обрывки с l-p.kz
 * («Вы научитесь:», «Категория слушателей – …») и пустые.
 * @type {ProductTexts[]}
 */
export const PRODUCT_TEXTS_2 = [
  ...Object.entries(TDMS_ROLES).map(([role, text]) => ({
    slug: `tdms_7_x_${role.toLowerCase().replace(/ /g, '_')}`,
    summary: { to: `${text}.`, ifEmpty: true },
    ...(role === 'AddIns for AutoCAD'
      ? {
          title: {
            from: 'TDMS (7.x (AddIns for AutoCAD)',
            to: 'TDMS AddIns для AutoCAD и nanoCAD',
          },
        }
      : {}),
  })),
  {
    slug: 'model_studio_cs_enterprise_license',
    summary: {
      to: 'Одна лицензия на любую программу линейки Model Studio CS: запускается та, что нужна проектировщику сейчас, включая новые программы линейки.',
      ifHas: 'Открытые распределительные системы',
    },
    description: {
      to: `Корпоративная лицензия Model Studio CS позволяет запускать любую программу линейки Model Studio CS. Одной лицензии достаточно, чтобы работать в той программе, которая нужна проектировщику сейчас: не нужно покупать отдельные лицензии на каждую.

## Какие программы открывает

- Model Studio CS Трубопроводы и Технологические схемы
- Model Studio CS Строительные решения и Генплан
- Model Studio CS Отопление и вентиляция, Водоснабжение и канализация
- Model Studio CS Электрика, Электротехнические схемы, Кабельное хозяйство, Компоновщик щитов
- Model Studio CS ЛЭП, Открытые распределительные устройства, Молниезащита, ОПС

Состав линейки и условия лицензии на текущую версию подтвердит менеджер CAD.kz.

## Кому подходит

Большим проектным организациям: лицензии можно перераспределять между проектировщиками по мере необходимости. Корпоративная лицензия распространяется и на программы линейки, которые выйдут в будущем.`,
      ifHas: 'Открытые распределительные системы',
    },
  },
  {
    slug: 'shirokoformatnyy_skaner_widetek_60cl_s_shirinoy_60_1524_mm_podstavkoy_21_touch_bsw_scanwizard_fc_war',
    summary: {
      to: 'WideTEK 60CL — широкоформатный сканер для чертежей, планов и карт шириной до 1524 мм (60 дюймов) в проектных организациях и архивах.',
      ifHas: 'широкоформатный сканер для чертежей, планов и карт в проектных',
    },
  },
  {
    slug: 'plotwave_t30_35',
    summary: {
      to: 'Компактная монохромная широкоформатная система LED/тонер для чертежей до A0 в небольших и средних объёмах.',
      ifHas: 'для быстрых тиражей',
    },
  },
  ...[
    [
      'scad-office',
      'Архитекторам, инженерам-конструкторам',
      'Расчёт и проектирование строительных конструкций в SCAD Office: расчётная модель, нагрузки, подбор сечений и армирования.',
    ],
    [
      'seminar-vozmozhnosti-vlozhennyh-semeystv-revit-dekompoziciya',
      'Неужели',
      'Семинар о вложенных семействах Revit: как собирать сложные семейства из готовых частей и вести подсчёт элементов.',
    ],
    [
      'praktikum-autodesk-revit-ov-vk',
      'Дать исчерпывающее',
      'Практикум по модели инженерных сетей здания в Autodesk Revit: отопление, вентиляция, водопровод и канализация.',
    ],
    [
      'praktikum-autodesk-revit-arhitektura',
      'Рекомендуется стремиться',
      'Практикум по архитектурной модели здания в Autodesk Revit: повторяете шаги за преподавателем и сразу задаёте вопросы.',
    ],
    [
      'vizualnoe-instrumentalnoe-obsledovanie-zdaniy-sooruzheniy',
      'В рамках обучения рассматриваются',
      'Обследование зданий и сооружений: нормативная база, визуальные и инструментальные методы, характерные дефекты и их причины.',
    ],
    [
      'seminar-dynamo-proektirovschikov-avtomatizaciya-zadach',
      'Вы научитесь:',
      'Семинар по Dynamo для Autodesk Revit: как автоматизировать повторяющиеся задачи проектировщика визуальными сценариями.',
    ],
    [
      '1s-buhgalteriya',
      'Начальные требования',
      'Курс по 1С:Бухгалтерии: бухгалтерский и налоговый учёт в программе на практических примерах.',
    ],
    [
      'osnovy-proektirovaniya-zhelezobetonnyh-konstrukciy-sp-rk-en',
      'Чему вы научитесь',
      'Проектирование железобетонных конструкций по СП РК EN 1992-1-1 (Eurocode 2): основные проверки и расчёты на примерах.',
    ],
    [
      'autodesk-civil-3d-proektirovanie-vneshnih-setey-uglublennyy',
      'Категория слушателей',
      'Углублённый курс по проектированию внешних инженерных сетей в Autodesk Civil 3D.',
    ],
    [
      'kompleksnyy-autocad-p-id-autocad-plant-3d',
      'Категория слушателей',
      'Технологические схемы в AutoCAD P&ID и 3D-модели трубопроводов в AutoCAD Plant 3D: от схемы до изометрий и спецификаций.',
    ],
    [
      'autodesk-revit-arhitektora',
      'Прежде всего данный курс',
      'Архитектурная BIM-модель здания в Autodesk Revit: стены, перекрытия, виды, спецификации и листы.',
    ],
    [
      'praktikum-autodesk-revit-structure',
      'Прежде всего данный курс',
      'Практикум по конструктивной модели здания в Autodesk Revit: несущие конструкции, виды и чертежи.',
    ],
  ].map(([slug, ifHas, to]) => ({ slug, summary: { to, ifHas } })),
  ...[
    [
      'podhody-k-parametrizacii-rabota-osnovnym-funkcionalom',
      'Параметризация и основные инструменты Geomagic Design X: от 3D-скана к редактируемой CAD-модели.',
    ],
    [
      'raschet-pk-lira-fem-soglasno-eurocodes-sp-rk-en-uroven',
      'Расчёт конструкций в ЛИРА-FEM по Еврокодам СП РК EN для начинающих: от расчётной схемы до результатов.',
    ],
    [
      'praktika-sozdaniya-cifrovyh-modeley-zdaniy-sooruzheniy',
      'Создание цифровых моделей зданий и сооружений в LIRA-CAD (САПФИР) и передача их на расчёт.',
    ],
    [
      'polnyy-bim-menedzher',
      'Полный курс для BIM-менеджера: стандарты, организация совместной работы и внедрение BIM в компании.',
    ],
    [
      'osnovy-smetnogo-dela-ispolzovaniem-smetnoy-sistemy-avs',
      'Основы сметного дела на практике: составление смет в сметной системе АВС.',
    ],
    [
      'tekla-structures-km-kzh',
      'Моделирование металлических и железобетонных конструкций в Tekla Structures и выпуск чертежей КМ и КЖ.',
    ],
  ].map(([slug, to]) => ({ slug, summary: { to, ifEmpty: true } })),
]
