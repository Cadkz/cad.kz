// Каталог по замечаниям владельца 22.10.2026 (раздел HANDOFF «Каталог как в Битриксе»):
// «САПР и черчение» влито в «Архитектуру и BIM», мобильные приложения убраны, LT комплект
// переименован, у АВС-KZ и модулей АВС выбор «Новая лицензия / Обновление» внутри страницы.

/** Направление, которое вливается в другое, и его новое название. */
export const MERGE_SECTIONS = {
  from: 'cad',
  into: 'arch',
  title: 'САПР, архитектура и BIM',
}

/** Мобильные приложения из каталога убираются, адрес ведёт на программу (slug). */
export const MOBILE_APPS = [{ title: /mobile app/i, redirect: 'autocad' }]

/** Переименования программ: адрес прежний, старое название остаётся для поиска. */
export const PROGRAM_RENAMES = [
  {
    slug: 'autocad_revit_lt_suite',
    title: 'LT комплект: AutoCAD + Revit',
    aliases: 'AutoCAD Revit LT Suite, LT Suite, комплект LT, автокад ревит',
  },
]

/** Значения переключателя «Покупка». Обновление в цену «от» каталога не входит. */
export const NEW_LICENSE = 'Новая лицензия'
export const RENEWAL = 'Обновление'

const PURCHASE = {
  title: 'Покупка',
  options: [
    { value: NEW_LICENSE, note: 'Программы ещё нет — покупаете впервые' },
    { value: RENEWAL, note: 'Программа уже есть — переход на новую версию' },
  ],
}

const KEY = {
  title: 'Защита лицензии',
  options: [
    { value: 'Ключ Guardant', note: 'USB-ключ: можно переносить между компьютерами' },
    { value: 'Привязка к компьютеру', note: 'Без ключа, работает на одном компьютере' },
  ],
}

const BASE = {
  title: 'Сметная база РСНБ',
  options: [
    { value: 'Без базы', note: null },
    { value: 'С базой РСНБ', note: 'Сразу с республиканской сметно-нормативной базой' },
  ],
}

/**
 * Программы АВС: основная страница, её «Обновление для …» (предложения переезжают внутрь,
 * карточка обновления скрывается и ведёт на программу), переключатели и раздел.
 * base — у предложений обновления есть вариант с базой РСНБ и без.
 */
export const AVS_PROGRAMS = [
  {
    slug: 'the_software_package_avs_4',
    renewal: 'obnovlenie_dlya_avs_4',
    label: 'АВС-KZ (АВС-4)',
    note: 'Сметы по нормативам Республики Казахстан',
    switches: [PURCHASE, KEY, BASE],
    base: true,
  },
  {
    slug: 'avs_akkord',
    renewal: 'obnovlenie_dlya_avs_akkord',
    label: 'АВС АККОРД',
    note: 'Сметы на ремонт и реконструкцию',
    switches: [PURCHASE, KEY],
  },
  {
    slug: 'avs_pir',
    renewal: 'obnovlenie_dlya_avs_pir',
    label: 'АВС ПИР',
    note: 'Сметы на проектно-изыскательские работы',
    switches: [PURCHASE, KEY],
  },
  {
    slug: 'avs_rekompozitor',
    renewal: 'obnovlenie_dlya_avs_rekompozitor',
    label: 'АВС Рекомпозитор',
    note: null,
    switches: [PURCHASE, KEY],
  },
]

/** Направление программ АВС: все в «Сметах» (АККОРД стоял в «Архитектуре и BIM»). */
export const AVS_SECTION = 'estimate'

/** У модулей АВС на карточке свой цветной значок из галереи, а не общий синий АВС. */
export const OWN_CARD_IMAGE = [
  'avs_akkord',
  'avs_pir',
  'avs_rekompozitor',
  'avs_tssp_tsifrovaya_spetsifikatsiya_proekta',
]

/**
 * Значения переключателей предложения АВС. Новая лицензия — «Новая лицензия» + прежние значения
 * (ключ, база); обновление — «Обновление» + база по названию комплектации, без ключа (для
 * обновления неважен, подходит к любому).
 * @param {string[]} current
 * @param {string} configuration
 * @param {{ renewal: boolean, base: boolean }} opts
 * @returns {string[]}
 */
export function avsOfferVariants(current, configuration, { renewal, base }) {
  // Повторный запуск: обновление, уже перенесённое в программу, остаётся обновлением.
  if (!renewal && current.includes(RENEWAL)) return current
  const own = current.filter((v) => v !== NEW_LICENSE && v !== RENEWAL)
  if (!renewal) return [NEW_LICENSE, ...own]
  if (!base) return [RENEWAL]
  if (/без\s*рснб|рснб\s*нет/i.test(configuration)) return [RENEWAL, 'Без базы']
  if (/с\s*рснб|рснб\s*да/i.test(configuration)) return [RENEWAL, 'С базой РСНБ']
  return [RENEWAL]
}
