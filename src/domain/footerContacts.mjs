/**
 * Подвал и контакты по аудиту 21.10.2026 (пакет 3: М5, Г7, Г9, Т3).
 * Номер WhatsApp показываем цифрами — его ищут глазами, а не только кнопкой.
 * Разовая настройка дописывает в «Контакты и подвал» то, что есть на старом cad.kz
 * (основной городской номер и адрес офиса), и меняет описание компании — только если
 * эти поля не правили в админке.
 */

/** Номер Казахстана из цифр: 77015501893 → +7 (701) 550-18-93. Другое — как пришло. */
export function formatKzPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  const local = digits.length === 11 && /^[78]/.test(digits) ? digits.slice(1) : null
  if (!local) return String(value ?? '').trim()
  // городской Астаны: код 7172 и шесть цифр; мобильный — код из трёх цифр и семь
  if (local.startsWith('7172'))
    return `+7 (7172) ${local.slice(4, 6)}-${local.slice(6, 8)}-${local.slice(8)}`
  return `+7 (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6, 8)}-${local.slice(8)}`
}

/** Прежнее описание компании в подвале (демоданные) и новое по аудиту (Т3). */
export const FOOTER_TEXT_AUDIT = [
  'Комплексные решения для проектировщиков: софт, оборудование, обучение и консалтинг по BIM в Казахстане.',
  'Программы для проектирования, оборудование и обучение для проектных организаций Казахстана. Официальный партнёр Autodesk, SCAD Soft, Fine.',
]

/** Основной городской номер и адрес офиса — как на старом cad.kz (страница «Контакты»). */
export const OFFICE_FROM_OLD_SITE = {
  phone: { label: '+7 (7172) 57-70-75', tel: '+77172577075' },
  address: 'г. Астана, ул. Пушкина, 6/1',
}

const PHONES_MAX = 3

/**
 * Что поменять в «Контактах и подвале». Возвращает новые значения только изменённых полей
 * и список изменений словами. Правленное в админке не трогает: описание — только прежнее,
 * адрес — только пустой, номер — только если его ещё нет и есть место (не больше трёх).
 */
export function footerSettingsPatch(settings) {
  const data = {}
  const changed = []
  const [oldText, newText] = FOOTER_TEXT_AUDIT
  if ((settings.footerText ?? '').trim() === oldText) {
    data.footerText = newText
    changed.push('описание компании')
  }
  const phones = settings.phones ?? []
  const digits = (tel) => String(tel ?? '').replace(/\D/g, '')
  const office = OFFICE_FROM_OLD_SITE.phone
  if (!phones.some((p) => digits(p.tel) === digits(office.tel)) && phones.length < PHONES_MAX) {
    data.phones = [{ ...office }, ...phones.map(({ label, tel }) => ({ label, tel }))]
    changed.push(`основной номер ${office.label}`)
  }
  if (!(settings.address ?? '').trim()) {
    data.address = OFFICE_FROM_OLD_SITE.address
    changed.push('адрес офиса')
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
