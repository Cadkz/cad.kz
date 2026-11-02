// Типы переходов между страницами (React <ViewTransition>, src/styles/base.css «Переходы»):
// вперёд — старая гаснет со сдвигом влево, новая приходит справа; назад — наоборот. Ставятся на
// ссылки (Link transitionTypes): карточка каталога → товар и «Следующая» статья — вперёд, хлебные
// крошки и «Предыдущая» статья — назад. Открытие статьи из списка, меню, фильтры, «Назад»
// браузера — без анимации (решение владельца 02.11.2026, вечер).

export const NAV_FORWARD = ['nav-forward']
export const NAV_BACK = ['nav-back']

// Этап 2 (02.11.2026): смена условий каталога — карточки переезжают на новые места, лишние
// гаснут, новые проступают (FlowItem); листание страниц — список уходит в сторону листания.
export const CATALOG_FILTER = 'catalog-filter'
export const PAGE_FORWARD = 'page-forward'
export const PAGE_BACK = 'page-back'

/** Больше карточек сразу — без перелёта каждой: много снимков тормозят слабые компьютеры. */
export const FLOW_LIMIT = 24

/**
 * Тип перехода при смене страницы каталога: дальше — вперёд, ближе — назад.
 * @param {number} from
 * @param {number} to
 */
export const pageMotion = (from, to) => (to > from ? PAGE_FORWARD : PAGE_BACK)
