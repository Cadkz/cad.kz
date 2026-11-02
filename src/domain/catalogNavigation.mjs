/**
 * Названия вкладок каталога — одни и те же в меню «Каталог» (MegaMenu, MobileMenu) и в фильтре
 * страницы каталога (FilterPanel), чтобы оба пути выглядели и вели одинаково (решение владельца
 * 23.10.2026: каталог в меню синхронизирован с обычным каталогом).
 */
export const POPULAR_LABEL = 'Популярные решения'

export const GROUP_LABELS = {
  software: 'Программное обеспечение',
  hardware: 'Оборудование',
  service: 'Услуги',
}

/** Короткие ссылки «всё в группе» в меню (правка 02.11.2026: без длинных повторов названия). */
const GROUP_ALL_LABELS = {
  software: 'Все программы',
  hardware: 'Всё оборудование',
  service: 'Все услуги',
}

/**
 * @param {string} key группа каталога
 * @returns {string}
 */
export const groupAllLabel = (key) =>
  GROUP_ALL_LABELS[/** @type {keyof typeof GROUP_ALL_LABELS} */ (key)] ?? 'Смотреть все'

/**
 * Ссылка «все товары» раздела в мегаменю — коротко и по смыслу (правка 02.11.2026): у программ
 * «Все программы направления», у оборудования и услуг — название раздела («Все 3D-сканеры»,
 * «Все курсы» у обучения). Название с аббревиатурой в начале (САПР, BIM) не переводится в строчные.
 * @param {string} group группа вкладки: software, hardware, service
 * @param {string} title название раздела
 * @returns {string}
 */
export function sectionAllLabel(group, title) {
  if (group === 'software') return 'Все программы направления'
  if (/^обучение$/i.test(title)) return 'Все курсы'
  const acronym = /^\p{Lu}{2}/u.test(title)
  return `Все ${acronym ? title : title.charAt(0).toLowerCase() + title.slice(1)}`
}
