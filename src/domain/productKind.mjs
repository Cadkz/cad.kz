// @ts-check
/**
 * Один шаблон страницы товара для всех типов, но содержимое говорит на языке типа:
 * у программ — лицензии и комплектация, у оборудования — варианты поставки и технические
 * характеристики, у курсов — формат, программа и запись, у услуг — состав работ и консультация.
 * Блоки и дизайн общие, меняются только подписи и главное действие.
 */

/** @typedef {'software' | 'hardware' | 'course' | 'service'} ProductKind */

/**
 * @typedef {object} KindProfile
 * @property {string} configTitle  Заголовок блока выбора на обычной странице.
 * @property {string} stepTitle  Шаг выбора из предложений товара.
 * @property {string} about  Заголовок описания.
 * @property {string} specs  Заголовок характеристик.
 * @property {string} quantity  Подпись количества в итоге.
 * @property {string} quantityAria  Подсказка поля количества для экранного диктора.
 * @property {string | null} actionLabel  Своё главное действие вместо «Получить КП» / «Запросить цену».
 * @property {string} similar  Заголовок блока похожих.
 */

/** @type {Record<ProductKind, KindProfile>} */
export const KIND_PROFILES = {
  software: {
    configTitle: 'Лицензия и цена',
    stepTitle: 'Лицензия и комплектация',
    about: 'О программе',
    specs: 'Характеристики',
    quantity: 'Лицензий',
    quantityAria: 'Количество лицензий (рабочих мест)',
    actionLabel: null,
    similar: 'Похожие программы',
  },
  hardware: {
    configTitle: 'Варианты поставки и цена',
    stepTitle: 'Вариант поставки',
    about: 'Об оборудовании',
    specs: 'Технические характеристики',
    quantity: 'Количество',
    quantityAria: 'Количество устройств',
    actionLabel: null,
    similar: 'Похожее оборудование',
  },
  course: {
    configTitle: 'Формат обучения и цена',
    stepTitle: 'Формат обучения',
    about: 'Программа курса',
    specs: 'Продолжительность и формат',
    quantity: 'Участников',
    quantityAria: 'Количество участников',
    actionLabel: 'Записаться на курс',
    similar: 'Другие курсы',
  },
  service: {
    configTitle: 'Стоимость услуги',
    stepTitle: 'Вариант услуги',
    about: 'Состав работ и этапы',
    specs: 'Условия',
    quantity: 'Количество',
    quantityAria: 'Количество',
    actionLabel: 'Запросить консультацию',
    similar: 'Другие услуги',
  },
}

/**
 * Профиль типа; неизвестный тип — как программа.
 * @param {string | null | undefined} kind
 * @returns {KindProfile}
 */
export function kindProfile(kind) {
  return KIND_PROFILES[/** @type {ProductKind} */ (kind)] ?? KIND_PROFILES.software
}
