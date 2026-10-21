/**
 * Подвал и контакты по аудиту 21.10.2026 (пакет 3: М5, Г7, Г9, Т3) и правкам владельца.
 * Разовая настройка дописывает в «Контакты и подвал» адрес, часы и LinkedIn, меняет
 * описание компании — только если эти поля не правили в админке.
 */

/**
 * Описание компании в подвале: прежние варианты (демоданные и первая версия по аудиту)
 * и текущее — без перечня партнёров (решение владельца 21.10.2026).
 */
export const FOOTER_TEXT_OLD = [
  'Комплексные решения для проектировщиков: софт, оборудование, обучение и консалтинг по BIM в Казахстане.',
  'Программы для проектирования, оборудование и обучение для проектных организаций Казахстана. Официальный партнёр Autodesk, SCAD Soft, Fine.',
]
export const FOOTER_TEXT =
  'Программы для проектирования, оборудование и обучение для проектных организаций Казахстана.'

/** Адрес офиса — как на старом cad.kz (страница «Контакты»), часы — по словам владельца. */
export const OFFICE = {
  address: 'г. Астана, ул. Пушкина, 6/1',
  hours: 'Пн–Пт 9:00–18:00',
}

/**
 * Номер, который первая версия настройки дописала со старого сайта. Владелец решил
 * показывать только два номера (21.10.2026) — убираем его, если он записан именно так.
 */
export const EXTRA_PHONE = { label: '+7 (7172) 57-70-75', tel: '+77172577075' }

export const LINKEDIN_URL = 'https://www.linkedin.com/company/тоо-cad-kz/'

/**
 * Что поменять в «Контактах и подвале». Возвращает новые значения только изменённых полей
 * и список изменений словами. Правленное в админке не трогает: описание — только прежнее,
 * адрес и часы — только пустые, LinkedIn — только если его нет, номер убирает только
 * дописанный настройкой (с той же подписью).
 */
export function footerSettingsPatch(settings) {
  const data = {}
  const changed = []
  if (FOOTER_TEXT_OLD.includes((settings.footerText ?? '').trim())) {
    data.footerText = FOOTER_TEXT
    changed.push('описание компании')
  }
  const phones = settings.phones ?? []
  const kept = phones.filter((p) => !(p.tel === EXTRA_PHONE.tel && p.label === EXTRA_PHONE.label))
  if (kept.length !== phones.length) {
    data.phones = kept.map(({ label, tel }) => ({ label, tel }))
    changed.push(`убран номер ${EXTRA_PHONE.label}`)
  }
  if (!(settings.address ?? '').trim()) {
    data.address = OFFICE.address
    changed.push('адрес офиса')
  }
  if (!(settings.hours ?? '').trim()) {
    data.hours = OFFICE.hours
    changed.push('часы работы')
  }
  const socials = settings.socials ?? []
  if (!socials.some((s) => s.network === 'linkedin')) {
    data.socials = [
      ...socials.map(({ network, url }) => ({ network, url })),
      { network: 'linkedin', url: LINKEDIN_URL },
    ]
    changed.push('LinkedIn')
  }
  return { data, changed }
}

/**
 * Соцсети для подвала без повторов: Telegram в соцсетях с той же ссылкой, что «Написать
 * в Telegram», второй раз не показываем.
 * @template {{ network: string, url: string }} T
 * @param {T[] | null | undefined} socials
 * @param {string | null | undefined} telegramHref
 * @returns {T[]}
 */
export function footerSocials(socials, telegramHref) {
  const clean = (url) => String(url ?? '').replace(/\/+$/, '')
  return (socials ?? []).filter(
    (s) => !(s.network === 'telegram' && telegramHref && clean(s.url) === clean(telegramHref)),
  )
}
