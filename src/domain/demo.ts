/**
 * Демонстрационное наполнение CMS. Используется только скриптом scripts/seed-demo.mjs
 * и только в APP_MODE=demo. Страницы сайта этот файл не читают — они берут данные из Payload.
 * Цены, сроки и описания учебные: перед публикацией их проверяет редактор.
 */

type Icon = 'building' | 'columns' | 'layers' | 'route' | 'wrench' | 'droplet' | 'cog'
type MoreIcon = 'image' | 'file' | 'scan' | 'printer' | 'monitor' | 'graduation'

export type DemoSection = {
  key: string
  title: string
  summary: string
  menuGroup: 'software' | 'hardware' | 'service'
  isDirection: boolean
  icon: Icon | MoreIcon
  tone: 'navy' | 'blue' | 'graphite'
  order: number
}

export type DemoOffer = {
  key: string
  configuration: string
  license: string
  amount: string
  currency: 'KZT' | 'USD' | 'EUR' | 'RUB'
  includesVat: boolean
  sourceVat: string
}

export type DemoProduct = {
  key: string
  title: string
  kind: 'software' | 'hardware' | 'course' | 'service'
  manufacturer: string
  sections: string[]
  tasks: string[]
  summary: string
  description: string
  requires?: string[]
  recommended?: string[]
  properties?: { name: string; value: string }[]
  faq?: { question: string; answer: string }[]
  offers: DemoOffer[]
}

export type DemoPublication = {
  key: string
  kind: 'news' | 'article' | 'promotion'
  title: string
  topic: string
  excerpt: string
  publishedAt: string
  body: string
}

export const demoSections: DemoSection[] = [
  {
    key: 'arch',
    title: 'Архитектура и строительство',
    summary: 'AutoCAD, Revit — проектирование зданий и BIM-координация.',
    menuGroup: 'software',
    isDirection: true,
    icon: 'building',
    tone: 'navy',
    order: 10,
  },
  {
    key: 'structural',
    title: 'Расчёт конструкций',
    summary: 'SCAD Office — КЖ и КМ, расчёт зданий и сооружений.',
    menuGroup: 'software',
    isDirection: true,
    icon: 'columns',
    tone: 'blue',
    order: 20,
  },
  {
    key: 'geotech',
    title: 'Геотехника и геология',
    summary: 'GEO5 — устойчивость, фундаменты, подпорные стены и модули для геологов.',
    menuGroup: 'software',
    isDirection: true,
    icon: 'layers',
    tone: 'graphite',
    order: 30,
  },
  {
    key: 'infra',
    title: 'Инфраструктура и генплан',
    summary: 'Civil 3D — дороги, генплан и инженерные сети площадки.',
    menuGroup: 'software',
    isDirection: true,
    icon: 'route',
    tone: 'blue',
    order: 40,
  },
  {
    key: 'mep',
    title: 'Инженерные сети',
    summary: 'MagiCAD — ОВ, ВК и электрика внутри модели Revit.',
    menuGroup: 'software',
    isDirection: true,
    icon: 'wrench',
    tone: 'navy',
    order: 50,
  },
  {
    key: 'pipes',
    title: 'Технологические трубопроводы',
    summary: 'НТП Трубопровод — расчёты трубопроводов промышленных объектов.',
    menuGroup: 'software',
    isDirection: true,
    icon: 'droplet',
    tone: 'graphite',
    order: 60,
  },
  {
    key: 'machine',
    title: 'Машиностроение',
    summary: 'Деталь и сборка, 3D-сканеры Artec для реверс-инжиниринга.',
    menuGroup: 'software',
    isDirection: true,
    icon: 'cog',
    tone: 'graphite',
    order: 70,
  },
  {
    key: 'viz',
    title: 'Визуализация',
    summary: '3ds Max — рендеринг и презентация проекта.',
    menuGroup: 'software',
    isDirection: true,
    icon: 'image',
    tone: 'blue',
    order: 80,
  },
  {
    key: 'estimate',
    title: 'Сметы и документооборот',
    summary: 'АВС-4 — сметы по казахстанским нормативам.',
    menuGroup: 'software',
    isDirection: true,
    icon: 'file',
    tone: 'navy',
    order: 90,
  },
  {
    key: 'scanners',
    title: '3D-сканеры',
    summary: 'Портативные сканеры для обмеров и реверс-инжиниринга.',
    menuGroup: 'hardware',
    isDirection: false,
    icon: 'scan',
    tone: 'navy',
    order: 110,
  },
  {
    key: 'plotters',
    title: 'Плоттеры',
    summary: 'Широкоформатная печать чертежей и постеров.',
    menuGroup: 'hardware',
    isDirection: false,
    icon: 'printer',
    tone: 'navy',
    order: 120,
  },
  {
    key: 'training',
    title: 'Обучение',
    summary: 'Курсы учебного центра CAD.kz.',
    menuGroup: 'service',
    isDirection: false,
    icon: 'graduation',
    tone: 'navy',
    order: 210,
  },
]

const kzt = (key: string, configuration: string, license: string, amount: string): DemoOffer => ({
  key,
  configuration,
  license,
  amount,
  currency: 'KZT',
  includesVat: true,
  sourceVat: '16',
})

export const demoProducts: DemoProduct[] = [
  {
    key: 'autocad',
    title: 'AutoCAD',
    kind: 'software',
    manufacturer: 'Autodesk',
    sections: ['arch'],
    tasks: ['Архитектура и генплан', '2D-чертежи'],
    summary: 'Универсальная 2D/3D-система автоматизированного проектирования.',
    description:
      'AutoCAD — базовый инструмент проектировщика: чертежи, оформление листов, работа с внешними ссылками и наборами листов. Подходит для архитектурных, строительных и инженерных разделов.',
    recommended: ['revit'],
    properties: [
      { name: 'Платформа', value: 'Windows 10/11 (64-bit)' },
      { name: 'Лицензия', value: 'подписка, именная' },
    ],
    offers: [
      kzt('autocad-1y', 'Подписка на 1 год', 'Именная подписка', '1850000'),
      kzt('autocad-3y', 'Подписка на 3 года', 'Именная подписка', '4995000'),
    ],
  },
  {
    key: 'revit',
    title: 'Revit',
    kind: 'software',
    manufacturer: 'Autodesk',
    sections: ['arch'],
    tasks: ['Архитектура и генплан', 'BIM-координация'],
    summary: 'BIM-платформа для проектирования архитектуры и конструкций.',
    description:
      'Revit — информационная модель здания: архитектура, конструкции и инженерные системы в одном файле. Чертежи и спецификации обновляются вместе с моделью.',
    recommended: ['autocad', 'magicad'],
    offers: [
      kzt('revit-1y', 'Подписка на 1 год', 'Именная подписка', '2450000'),
      kzt('revit-3y', 'Подписка на 3 года', 'Именная подписка', '6615000'),
    ],
  },
  {
    key: 'scad-office',
    title: 'SCAD Office',
    kind: 'software',
    manufacturer: 'SCAD Soft',
    sections: ['structural'],
    tasks: ['Расчёт зданий и сооружений', 'КЖ — железобетон', 'КМ — металлоконструкции'],
    summary: 'Расчёт и конструирование строительных конструкций методом конечных элементов.',
    description:
      'SCAD Office — модульный комплекс для расчёта и конструирования: железобетонные и стальные конструкции, сейсмика, программы-сателлиты для узлов и сечений.',
    recommended: ['geo5'],
    offers: [
      kzt('scad-s392', 'Редакция S392, постоянная', 'Локальная, бессрочная', '5568000'),
      kzt('scad-promax', 'Редакция S Promax, постоянная', 'Локальная, бессрочная', '6124800'),
      kzt('scad-rent', 'Редакция S392, аренда 3 месяца', 'Локальная, срочная', '1392000'),
    ],
  },
  {
    key: 'geo5',
    title: 'GEO5',
    kind: 'software',
    manufacturer: 'Fine Software',
    sections: ['geotech'],
    tasks: ['Устойчивость откосов', 'Свайные фундаменты', 'Подпорные стены'],
    summary: 'Комплекс программ для геотехнического проектирования: готовые пакеты под задачи.',
    description:
      'GEO5 — более 30 геотехнических программ: устойчивость откосов, подпорные стены, свайные и плитные фундаменты, шахты, тоннели, МКЭ и геология. Покупаются готовыми пакетами или по отдельности.',
    recommended: ['scad-office', 'autocad'],
    properties: [
      { name: 'ОС', value: 'Windows 10/11 (64-bit)' },
      { name: 'Лицензия', value: 'Personal: 1 пользователь, бессрочная' },
    ],
    faq: [
      {
        question: 'Чем пакет отличается от отдельных модулей?',
        answer:
          'Пакет — набор модулей под задачу со скидкой. Если нужен один-два модуля, выгоднее купить их отдельно.',
      },
      {
        question: 'Можно ли докупить модуль позже?',
        answer: 'Да, недостающие модули докупаются к уже купленному пакету в любой момент.',
      },
    ],
    offers: [
      {
        key: 'geo5-stability',
        configuration: 'Пакет «Расчёт устойчивости», Personal',
        license: 'Локальная, бессрочная',
        amount: '4200',
        currency: 'EUR',
        includesVat: false,
        sourceVat: '0',
      },
      {
        key: 'geo5-foundations',
        configuration: 'Пакет «Фундаменты», Personal',
        license: 'Локальная, бессрочная',
        amount: '3600',
        currency: 'EUR',
        includesVat: false,
        sourceVat: '0',
      },
    ],
  },
  {
    key: 'civil-3d',
    title: 'Civil 3D',
    kind: 'software',
    manufacturer: 'Autodesk',
    sections: ['infra'],
    tasks: ['Генплан и дороги'],
    summary: 'Проектирование генплана, дорог и инженерных сетей площадки.',
    description:
      'Civil 3D — цифровая модель рельефа, трассы, профили и объёмы земляных работ. Связан с AutoCAD и Revit.',
    offers: [kzt('civil-1y', 'Подписка на 1 год', 'Именная подписка', '2300000')],
  },
  {
    key: 'magicad',
    title: 'MagiCAD',
    kind: 'software',
    manufacturer: 'MagiCAD Group',
    sections: ['mep'],
    tasks: ['ОВ и вентиляция', 'Водопровод и канализация', 'Электроснабжение'],
    summary: 'Надстройка для Revit — проектирование ОВ, ВК и электрики с базой оборудования.',
    description:
      'MagiCAD работает внутри Revit и AutoCAD: расчёты сетей, библиотека реального оборудования производителей, проверка коллизий.',
    requires: ['revit'],
    offers: [
      kzt('magicad-perm', 'Модуль «Вентиляция», постоянная', 'Локальная, бессрочная', '1450000'),
      kzt('magicad-1y', 'Модуль «Вентиляция», подписка на 1 год', 'Подписка', '580000'),
    ],
  },
  {
    key: 'ntp-truboprovod',
    title: 'НТП Трубопровод',
    kind: 'software',
    manufacturer: 'НТП Трубопровод',
    sections: ['pipes'],
    tasks: ['Технологические трубопроводы'],
    summary: 'Инженерные расчёты трубопроводов и оборудования на промышленных объектах.',
    description:
      'Расчёт на прочность, гидравлика и тепловые расчёты технологических трубопроводов по отраслевым нормам.',
    offers: [kzt('ntp-perm', 'Старт-Проф, постоянная', 'Локальная, бессрочная', '760000')],
  },
  {
    key: 'artec-leo',
    title: 'Artec Leo',
    kind: 'hardware',
    manufacturer: 'Artec 3D',
    sections: ['scanners', 'machine'],
    tasks: ['Реверс-инжиниринг', '3D-сканирование'],
    summary: 'Портативный беспроводной 3D-сканер для обмеров и реверс-инжиниринга.',
    description:
      'Artec Leo сканирует без компьютера и проводов: экран на корпусе показывает модель в реальном времени. Подходит для реверс-инжиниринга деталей и оцифровки объектов.',
    properties: [
      { name: 'Точность', value: 'до 0,1 мм' },
      { name: 'Питание', value: 'встроенный аккумулятор' },
    ],
    offers: [
      {
        key: 'leo-base',
        configuration: 'Сканер с ПО Artec Studio на 1 год',
        license: 'Гарантия 1 год',
        amount: '18150',
        currency: 'USD',
        includesVat: false,
        sourceVat: '0',
      },
    ],
  },
  {
    key: '3ds-max',
    title: '3ds Max',
    kind: 'software',
    manufacturer: 'Autodesk',
    sections: ['viz'],
    tasks: ['Архитектурная визуализация'],
    summary: '3D-моделирование и рендеринг для архитектурной визуализации.',
    description:
      '3ds Max — моделирование, текстуры, свет и рендер для презентации проекта заказчику.',
    offers: [kzt('max-1y', 'Подписка на 1 год', 'Именная подписка', '1950000')],
  },
  {
    key: 'abc-4',
    title: 'АВС-4',
    kind: 'software',
    manufacturer: 'АВС',
    sections: ['estimate'],
    tasks: ['Сметы'],
    summary: 'Сметные расчёты по нормативной базе Республики Казахстан.',
    description:
      'АВС-4 — составление смет и актов, обновление редакций нормативной базы, выгрузка в отчётные формы.',
    offers: [kzt('abc-perm', 'Рабочее место, постоянная', 'Локальная, бессрочная', '690000')],
  },
  {
    key: 'canon-tm-300',
    title: 'Canon imagePROGRAF TM-300',
    kind: 'hardware',
    manufacturer: 'Canon',
    sections: ['plotters'],
    tasks: ['Печать чертежей'],
    summary: 'Плоттер формата A0 для чертежей и постеров.',
    description:
      'Пятицветный широкоформатный плоттер для проектных бюро: быстрая печать чертежей, постеров и карт.',
    properties: [{ name: 'Формат', value: 'до 36″ (A0)' }],
    offers: [kzt('tm300-base', 'Плоттер без подставки', 'Гарантия 1 год', '1290000')],
  },
  {
    key: 'revit-course',
    title: 'Курс «Revit для проектировщиков»',
    kind: 'course',
    manufacturer: 'CAD.kz',
    sections: ['training', 'arch'],
    tasks: ['Обучение', 'BIM-координация'],
    summary: 'Практический курс учебного центра CAD.kz: от модели до листов.',
    description:
      'Курс для архитекторов и конструкторов: шаблон проекта, семейства, совместная работа и выпуск документации.',
    recommended: ['revit'],
    offers: [kzt('course-group', 'Групповое обучение, 40 часов', 'Сертификат CAD.kz', '240000')],
  },
]

const p = (...lines: string[]) => lines.join('\n\n')

export const demoPublications: DemoPublication[] = [
  {
    key: 'revit-2027',
    kind: 'news',
    title: 'Что нового в Revit 2027 для междисциплинарных команд',
    topic: 'BIM',
    excerpt:
      'Разбираем изменения в совместной работе, координации моделей и обмене данными между разделами.',
    publishedAt: '2026-07-23',
    body: p(
      'Revit 2027 продолжает курс на совместную работу: изменения затрагивают облачные модели, обмен данными между разделами и выпуск документации.',
      '## Совместная работа',
      'Синхронизация с центральной моделью стала заметно быстрее на больших проектах, а конфликты при одновременном редактировании показываются до сохранения.',
      '## Координация разделов',
      'Связанные модели смежников можно фильтровать по разделам, а результаты проверки коллизий переносить в задания без ручного экспорта.',
      '## Что сделать перед переходом',
      'Проверьте шаблоны и семейства на совместимость и обновляйте рабочие файлы всей командой одновременно.',
    ),
  },
  {
    key: 'abc-kz-2026-7',
    kind: 'news',
    title: 'Обновление редакции АВС-KZ 2026.7',
    topic: 'Релизы ПО',
    excerpt: 'Что изменилось в сметных нормативах и как перейти на новую редакцию без потери смет.',
    publishedAt: '2026-07-17',
    body: p(
      'Вышла редакция нормативной базы АВС-KZ 2026.7. Обновление затрагивает сборники цен и индексы.',
      '## Что изменилось',
      'Обновлены сметные цены на материалы и индексы пересчёта. Структура сборников не менялась.',
      '## Как перейти',
      'Сделайте резервную копию текущих смет, затем установите обновление и пересчитайте открытые объекты.',
    ),
  },
  {
    key: 'geo5-retaining-walls',
    kind: 'news',
    title: 'GEO5: новые модули для расчёта подпорных стен',
    topic: 'Геотехника',
    excerpt: 'Что добавили в последнем релизе и как это ускоряет расчёт удерживающих конструкций.',
    publishedAt: '2026-07-10',
    body: p(
      'В новом релизе GEO5 расширены возможности расчёта подпорных стен и ограждений котлованов.',
      '## Что нового',
      'Добавлены новые типы армирования и проверка по предельным состояниям с подробным отчётом.',
      '## Кому пригодится',
      'Проектировщикам ограждающих конструкций и геотехникам, которые считают стены уголкового и гравитационного типа.',
    ),
  },
  {
    key: 'magicad-clashes',
    kind: 'news',
    title: 'MagiCAD: как избежать коллизий инженерных сетей на этапе модели',
    topic: 'Инжиниринг',
    excerpt:
      'Настраиваем автоматическую проверку пересечений вентиляции, водоснабжения и электрики.',
    publishedAt: '2026-07-04',
    body: p(
      'Коллизии дешевле всего исправлять в модели. MagiCAD помогает находить их до выдачи чертежей.',
      '## Настройка проверки',
      'Задайте допуски для каждой пары систем и запускайте проверку после каждого крупного изменения.',
      '## Отчёт для смежников',
      'Результаты выгружаются списком с видами, чтобы смежники видели место пересечения.',
    ),
  },
  {
    key: 'autocad-sheets',
    kind: 'news',
    title: 'Организация листов и видовых экранов в AutoCAD для больших проектов',
    topic: 'Проектирование',
    excerpt: 'Структура шаблона, которая не разваливается, когда в проекте больше сотни листов.',
    publishedAt: '2026-06-20',
    body: p(
      'Когда листов становится больше сотни, порядок в шаблоне экономит часы на каждой выдаче.',
      '## Наборы листов',
      'Подшивка хранит свойства проекта в одном месте: штампы заполняются автоматически.',
      '## Видовые экраны',
      'Используйте именованные виды и слои видовых экранов, чтобы не терять масштабы при правках.',
    ),
  },
  {
    key: 'choose-3d-scanner',
    kind: 'news',
    title: 'Как выбрать 3D-сканер для обмерных работ',
    topic: '3D-сканирование',
    excerpt: 'Точность, скорость и размер объекта: на что смотреть при выборе сканера.',
    publishedAt: '2026-06-12',
    body: p(
      'Выбор 3D-сканера начинается с задачи: размер объекта, нужная точность и условия съёмки.',
      '## Размер объекта',
      'Для деталей подходят сканеры с высокой точностью, для помещений и крупных объектов — с большим полем зрения.',
      '## Точность и скорость',
      'Высокая точность нужна для реверс-инжиниринга, для обмеров важнее скорость и автономность.',
    ),
  },
  {
    key: 'promo-autodesk-renewal',
    kind: 'promotion',
    title: 'Скидка на продление лицензий Autodesk',
    topic: 'Акция',
    excerpt: 'Продлите подписку на AutoCAD и Revit до конца квартала на выгодных условиях.',
    publishedAt: '2026-09-01',
    body: p('Условия акции уточняйте у менеджера: размер скидки зависит от количества лицензий.'),
  },
  {
    key: 'promo-artec-leo',
    kind: 'promotion',
    title: 'Новое поступление 3D-сканеров Artec Leo',
    topic: 'Акция',
    excerpt: 'Портативные сканеры для обмерных работ и реверс-инжиниринга — в наличии в Астане.',
    publishedAt: '2026-09-10',
    body: p('Демонстрацию сканера можно провести в офисе CAD.kz в Астане.'),
  },
  {
    key: 'promo-bim-course',
    kind: 'promotion',
    title: 'Курс «BIM для ГИПов» — набор в новую группу',
    topic: 'Обучение',
    excerpt: 'Практический курс по координации моделей для главных инженеров проектов.',
    publishedAt: '2026-09-15',
    body: p('Даты старта группы и программу курса уточняйте у менеджера учебного центра.'),
  },
]

export const demoRates = [
  { currency: 'USD' as const, kztPerUnit: '540' },
  { currency: 'EUR' as const, kztPerUnit: '600' },
]

export const demoSettings = {
  phones: [
    { label: '+7 (7172) 578-028', tel: '+77172578028' },
    { label: '+7 (771) 936-50-20', tel: '+77719365020' },
  ],
  whatsapp: '77015501893',
  email: 'office@cad.kz',
  footerText:
    'Комплексные решения для проектировщиков: софт, оборудование, обучение и консалтинг по BIM в Казахстане.',
}

/** Тексты главной по макету. Обещания и сроки — учебные, их подтверждает редактор. */
export const demoHome = {
  eyebrow: 'Более 5 000 решений для проектировщиков',
  title: 'Софт, оборудование и обучение для проектных организаций и частных специалистов',
  sideCards: [
    {
      title: 'Подберём комплект под ваше ТЗ',
      text: 'Пришлите список задач — предложим софт и технику за 1 рабочий день.',
      linkLabel: 'Отправить ТЗ',
      linkHref: 'whatsapp',
      dark: false,
    },
    {
      title: 'Работаем по госзакупкам',
      text: 'Полный пакет документов и опыт участия в тендерах для госорганизаций.',
      linkLabel: 'Узнать условия',
      linkHref: 'whatsapp',
      dark: true,
    },
  ],
  bim: {
    eyebrow: 'Отдельное направление',
    title: 'Внедрение BIM в проектную практику',
    lead: 'Аудит текущих процессов, разработка BIM-регламента, координация моделей смежных разделов в Navisworks, электронный архив в TDMS Фарватер и обучение команды — под ключ или отдельными этапами.',
    stages: [
      {
        title: 'Аудит и регламент',
        text: 'Разбираем текущий процесс проектирования, формируем BIM-стандарт под вашу организацию.',
      },
      {
        title: 'Координация моделей',
        text: 'Сводим модели смежных разделов в Navisworks, снимаем коллизии до выхода на площадку.',
      },
      {
        title: 'Архив и документооборот',
        text: 'Разворачиваем TDMS Фарватер — единый электронный архив проекта с контролем версий.',
      },
      {
        title: 'Обучение команды',
        text: 'Учебный центр CAD.kz — Revit и BIM-координация для проектировщиков и ГИПов.',
      },
    ],
    stats: [
      { value: '4', label: 'этапа внедрения' },
      { value: 'от 2 недель', label: 'на пилотный проект' },
      { value: 'Revit · Navisworks · TDMS', label: 'стек инструментов' },
    ],
    linkLabel: 'Обсудить внедрение',
    linkHref: 'whatsapp',
  },
  process: [
    {
      title: 'Заявка и подбор',
      text: 'Опишите задачу — соберём комплектацию по выгодной цене со скидками от вендоров.',
    },
    {
      title: 'Счёт и поставка',
      text: 'Оформляем лицензию или отгружаем технику — работаем и с частными компаниями, и по госзакупкам.',
    },
    {
      title: 'Обучение и поддержка',
      text: 'Помогаем внедрить, обучаем в собственном учебном центре и сопровождаем весь срок лицензии.',
    },
  ],
  faq: [
    {
      question: 'Как оформить заказ и получить счёт?',
      answer:
        'Соберите комплектацию в каталоге или позвоните нам — менеджер пришлёт счёт и договор.',
    },
    {
      question: 'Работаете только с юрлицами или можно физлицу?',
      answer:
        'Работаем и с проектными организациями, и с частными специалистами — комплектация и способ оплаты подбираются под тип покупателя.',
    },
    {
      question: 'Сколько времени занимает поставка лицензии?',
      answer:
        'Электронные лицензии обычно приходят в течение 1–2 рабочих дней после оплаты. Сроки на оборудование зависят от наличия на складе.',
    },
    {
      question: 'Что с поддержкой после покупки?',
      answer:
        'Помогаем с установкой и настройкой, отвечаем на технические вопросы по продукту в течение всего срока действия лицензии.',
    },
  ],
  cta: {
    title: 'Нашли дешевле? Сравним цену',
    text: 'Пришлите коммерческое предложение конкурента — подберём условия не хуже или объясним разницу в комплектации.',
    linkLabel: 'Отправить предложение',
    linkHref: 'whatsapp',
  },
}
