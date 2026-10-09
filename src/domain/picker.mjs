// @ts-check
/**
 * Подбор комплекта на странице товара. Чистые функции без базы и сети: одинаково работают
 * на сервере (заявка, начальный выбор) и в браузере (переключение галочек).
 *
 * Подбор состоит из переключателей (редакция S392 / SPro, срок 1 год / 3 года) и шагов:
 * - base — входит всегда (основа SCAD++ SSB);
 * - one — один вариант (AutoCAD или AutoCAD LT);
 * - many — галочки (Ж/Б, металл, дерево; дополнительные функции);
 * - bundle — готовый комплект: если выбран, заменяет всё остальное.
 * У варианта может быть несколько предложений, подходящее выбирается по переключателям:
 * у предложения в «Значениях переключателей» стоит, например, S392.
 *
 * Деньги здесь не считаются: цена варианта — строка, рассчитанная сервером, только для показа.
 * Итог считает сервер по ID предложений (src/domain/pricing.mjs).
 */

/** @typedef {'base' | 'one' | 'many' | 'bundle'} StepMode */

/**
 * @typedef {object} PickerOffer
 * @property {string} id
 * @property {string} configuration
 * @property {string[]} variants  Значения переключателей, к которым относится предложение.
 * @property {string | null} price  Цена за единицу с НДС, уже отформатированная сервером.
 *
 * @typedef {object} PickerItem
 * @property {string} key
 * @property {number} productId
 * @property {string} label
 * @property {string | null} note
 * @property {PickerOffer[]} offers
 * @property {string | null} fixedOffer  Конкретное предложение, если задано в подборе.
 * @property {boolean} preselect
 * @property {string} [anchor]  Якорь строки: адрес старой страницы товара ведёт прямо к ней.
 *
 * @typedef {object} PickerStep
 * @property {string} key
 * @property {string} title
 * @property {string | null} hint
 * @property {StepMode} mode
 * @property {boolean} collapsed
 * @property {PickerItem[]} items
 *
 * @typedef {object} PickerSwitch
 * @property {string} key
 * @property {string} title
 * @property {{ value: string, note: string | null }[]} options
 *
 * @typedef {object} PickerView
 * @property {PickerSwitch[]} switches
 * @property {PickerStep[]} steps
 *
 * @typedef {object} PickerState
 * @property {Record<string, string>} switches  Ключ переключателя → выбранное значение.
 * @property {Record<string, string>} one  Ключ шага → ключ выбранного варианта.
 * @property {string[]} many  Ключи отмеченных вариантов.
 * @property {string | null} bundle  Ключ выбранного комплекта.
 *
 * @typedef {object} PickedLine
 * @property {PickerItem} item
 * @property {PickerOffer | null} offer  null — цена по запросу (нет предложения).
 * @property {string} stepTitle
 */

/**
 * Подходит ли предложение к выбранным переключателям. Если у предложения есть значения
 * какого-то переключателя, среди них должно быть выбранное; значения, которых нет ни в одном
 * переключателе, не мешают.
 * @param {PickerOffer} offer
 * @param {PickerSwitch[]} switches
 * @param {Record<string, string>} selected
 */
export function offerFits(offer, switches, selected) {
  for (const sw of switches) {
    const own = offer.variants.filter((v) => sw.options.some((o) => same(o.value, v)))
    if (own.length && !own.some((v) => same(v, selected[sw.key] ?? ''))) return false
  }
  return true
}

/**
 * Значения сравниваются без регистра и пробелов: «SPro» = «S Pro» = «SPRO».
 * @param {string} a
 * @param {string} b
 */
function same(a, b) {
  const norm = (/** @type {string} */ s) => s.toLowerCase().replace(/\s+/g, '')
  return norm(a) === norm(b)
}

/**
 * Предложение варианта при выбранных переключателях. Если задано конкретное — оно (если подходит),
 * иначе самое точное: больше совпавших значений, при равенстве — первое по порядку (дешевле).
 * @param {PickerItem} item
 * @param {PickerSwitch[]} switches
 * @param {Record<string, string>} selected
 * @returns {PickerOffer | null}
 */
export function offerFor(item, switches, selected) {
  const pool = item.fixedOffer ? item.offers.filter((o) => o.id === item.fixedOffer) : item.offers
  let best = /** @type {PickerOffer | null} */ (null)
  let bestScore = -1
  for (const offer of pool) {
    if (!offerFits(offer, switches, selected)) continue
    const score = offer.variants.filter((v) =>
      Object.values(selected).some((s) => same(s, v)),
    ).length
    if (score > bestScore) {
      best = offer
      bestScore = score
    }
  }
  return best
}

/**
 * Вариант недоступен при этих переключателях: предложения есть, но ни одно не подходит
 * (например, полной конфигурации нет в редакции S392). Без предложений — не «недоступен»,
 * а «по запросу».
 * @param {PickerItem} item
 * @param {PickerSwitch[]} switches
 * @param {Record<string, string>} selected
 */
export function itemUnavailable(item, switches, selected) {
  return item.offers.length > 0 && !offerFor(item, switches, selected)
}

/**
 * Начальный выбор: первые значения переключателей, отмеченные «Выбран сразу» варианты,
 * в шаге «один вариант» — отмеченный или первый доступный. pick — товар из адреса (?pick=ID):
 * старый адрес пакета SCAD ведёт на SCAD Office с уже выбранным пакетом.
 * @param {PickerView} view
 * @param {number | null} [pick]
 * @returns {PickerState}
 */
export function initialState(view, pick = null) {
  /** @type {Record<string, string>} */
  const switches = {}
  for (const sw of view.switches) switches[sw.key] = sw.options[0]?.value ?? ''
  /** @type {PickerState} */
  const state = { switches, one: {}, many: [], bundle: null }
  for (const step of view.steps) {
    const available = step.items.filter((i) => !itemUnavailable(i, view.switches, switches))
    if (step.mode === 'one') {
      const chosen = available.find((i) => i.preselect) ?? available[0] ?? step.items[0]
      if (chosen) state.one[step.key] = chosen.key
    }
    if (step.mode === 'many')
      state.many.push(...step.items.filter((i) => i.preselect).map((i) => i.key))
    if (step.mode === 'bundle') {
      const chosen = step.items.find((i) => i.preselect)
      if (chosen && !state.bundle) state.bundle = chosen.key
    }
  }
  return pick == null ? state : applyPick(view, state, pick)
}

/**
 * @param {PickerView} view
 * @param {PickerState} state
 * @param {number} productId
 * @returns {PickerState}
 */
function applyPick(view, state, productId) {
  for (const step of view.steps) {
    const item = step.items.find((i) => i.productId === productId)
    if (!item) continue
    if (step.mode === 'one') return { ...state, one: { ...state.one, [step.key]: item.key } }
    if (step.mode === 'many')
      return { ...state, many: [...new Set([...state.many, item.key])], bundle: null }
    if (step.mode === 'bundle') return { ...state, bundle: item.key }
    return state
  }
  return state
}

/**
 * Переключить значение переключателя. Выбранный в шаге «один вариант» вариант, который стал
 * недоступен, меняется на первый доступный; недоступные галочки и комплект снимаются.
 * @param {PickerView} view
 * @param {PickerState} state
 * @param {string} switchKey
 * @param {string} value
 * @returns {PickerState}
 */
export function setSwitch(view, state, switchKey, value) {
  const switches = { ...state.switches, [switchKey]: value }
  const ok = (/** @type {PickerItem} */ i) => !itemUnavailable(i, view.switches, switches)
  /** @type {Record<string, string>} */
  const one = { ...state.one }
  const all = view.steps.flatMap((s) => s.items)
  for (const step of view.steps) {
    if (step.mode !== 'one') continue
    const current = step.items.find((i) => i.key === one[step.key])
    if (current && ok(current)) continue
    const next = step.items.find(ok)
    if (next) one[step.key] = next.key
  }
  const many = state.many.filter((key) => {
    const item = all.find((i) => i.key === key)
    return item ? ok(item) : false
  })
  const bundleItem = all.find((i) => i.key === state.bundle)
  const bundle = bundleItem && ok(bundleItem) ? state.bundle : null
  return { switches, one, many, bundle }
}

/**
 * Что выбрано сейчас: строки с предложениями в порядке шагов. Выбранный комплект заменяет
 * всё остальное.
 * @param {PickerView} view
 * @param {PickerState} state
 * @returns {PickedLine[]}
 */
export function pickedLines(view, state) {
  /** @type {PickedLine[]} */
  const lines = []
  const add = (/** @type {PickerStep} */ step, /** @type {PickerItem} */ item) => {
    if (itemUnavailable(item, view.switches, state.switches)) return
    lines.push({
      item,
      offer: offerFor(item, view.switches, state.switches),
      stepTitle: step.title,
    })
  }
  if (state.bundle) {
    for (const step of view.steps) {
      const item = step.mode === 'bundle' && step.items.find((i) => i.key === state.bundle)
      if (item) add(step, item)
    }
    if (lines.length) return lines
  }
  for (const step of view.steps) {
    if (step.mode === 'base') for (const item of step.items) add(step, item)
    if (step.mode === 'one') {
      const item = step.items.find((i) => i.key === state.one[step.key])
      if (item) add(step, item)
    }
    if (step.mode === 'many')
      for (const item of step.items) if (state.many.includes(item.key)) add(step, item)
  }
  return lines
}

/**
 * Подпись выбранного варианта для итога и заявки: короткое название из подбора. Редакция или
 * срок показываются отдельно (переключатели), поэтому комплектацию из Битрикса не повторяем.
 * @param {PickedLine} line
 */
export function lineLabel(line) {
  return line.item.label
}

/**
 * Обычная страница без настроенного подбора: один шаг «Комплектация» из предложений самого
 * товара. Так у всех товаров один шаблон и одна логика выбора.
 * @param {number} productId
 * @param {PickerOffer[]} offers
 * @param {Record<string, string>} licenses  ID предложения → условия лицензии (пояснение).
 * @returns {PickerView}
 */
export function offersAsPicker(productId, offers, licenses) {
  if (!offers.length) return { switches: [], steps: [] }
  return {
    switches: [],
    steps: [
      {
        key: 'offers',
        title: 'Комплектация',
        hint: null,
        mode: offers.length > 1 ? 'one' : 'base',
        collapsed: false,
        items: offers.map((offer) => ({
          key: `o${offer.id}`,
          productId,
          label: offer.configuration,
          note: licenses[offer.id] && licenses[offer.id] !== '—' ? licenses[offer.id] : null,
          offers: [offer],
          fixedOffer: offer.id,
          preselect: false,
        })),
      },
    ],
  }
}
