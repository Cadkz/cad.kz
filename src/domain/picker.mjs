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
 * @property {string[]} fixedOffers  Только эти предложения (например, полная конфигурация S392 и SPro); пусто — все.
 * @property {boolean} preselect
 * @property {string} [anchor]  Якорь строки: адрес старой страницы товара ведёт прямо к ней.
 * @property {string[]} [includes]  Ключи вариантов, которые уже входят в этот пакет (семейства).
 *
 * @typedef {object} PickerStep
 * @property {string} key
 * @property {string} title
 * @property {string | null} hint
 * @property {StepMode} mode
 * @property {boolean} collapsed
 * @property {PickerItem[]} items
 * @property {string | null} [icon]  Значок группы (семейство по задачам): вместо номера шага.
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
 * Предложение варианта при выбранных переключателях: из заданных у варианта (или всех предложений
 * товара) — подходящее и самое точное: больше совпавших значений, при равенстве — первое по порядку (дешевле).
 * @param {PickerItem} item
 * @param {PickerSwitch[]} switches
 * @param {Record<string, string>} selected
 * @returns {PickerOffer | null}
 */
export function offerFor(item, switches, selected) {
  const pool = item.fixedOffers.length
    ? item.offers.filter((o) => item.fixedOffers.includes(o.id))
    : item.offers
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
 * старый адрес пакета SCAD ведёт на SCAD Office с уже выбранным пакетом. Строка — ключ варианта
 * (?item=…): карточка пакета GEO5 в каталоге открывает GEO5 с этим пакетом.
 * @param {PickerView} view
 * @param {number | string | null} [pick]
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
      const chosen = available.find((i) => i.preselect)
      if (chosen && !state.bundle) state.bundle = chosen.key
    }
  }
  return pick == null ? state : applyPick(view, state, pick)
}

/**
 * @param {PickerView} view
 * @param {PickerState} state
 * @param {number | string} pick  ID товара или ключ варианта
 * @returns {PickerState}
 */
function applyPick(view, state, pick) {
  for (const step of view.steps) {
    const item = step.items.find((i) =>
      typeof pick === 'string' ? i.key === pick : i.productId === pick,
    )
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
 * Переключить значение переключателя. Выбранный в шаге «один вариант» вариант или комплект,
 * который стал недоступен, меняется на первый доступный; недоступные галочки снимаются.
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
  // Выбранного комплекта нет в новой редакции — берём другой доступный комплект того же шага,
  // чтобы человек остался среди готовых комплектов; нет ни одного — переходим к ручной сборке.
  let bundle = null
  if (state.bundle) {
    const step = view.steps.find((s) => s.items.some((i) => i.key === state.bundle))
    const current = step?.items.find((i) => i.key === state.bundle)
    const next = current && ok(current) ? current : step?.items.find(ok)
    bundle = next ? next.key : null
  }
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
      for (const item of step.items)
        if (state.many.includes(item.key) && !includedBy(view, state, item.key)) add(step, item)
  }
  return lines
}

/**
 * Отмеченный пакет, в который уже входит этот вариант, или null: тогда вариант показывается
 * как «входит в пакет» и в итог отдельной строкой не попадает.
 * @param {PickerView} view
 * @param {PickerState} state
 * @param {string} key
 * @returns {PickerItem | null}
 */
export function includedBy(view, state, key) {
  for (const step of view.steps)
    for (const item of step.items)
      if (state.many.includes(item.key) && item.includes?.includes(key)) return item
  return null
}

/**
 * Галочка в шаге «несколько». Отмеченный пакет снимает галочки с программ, которые в него
 * входят, чтобы не заплатить за одно дважды. Выбор готового комплекта сбрасывается.
 * @param {PickerView} view
 * @param {PickerState} state
 * @param {string} key
 * @returns {PickerState}
 */
export function toggleMany(view, state, key) {
  if (state.many.includes(key))
    return { ...state, bundle: null, many: state.many.filter((k) => k !== key) }
  const item = view.steps.flatMap((s) => s.items).find((i) => i.key === key)
  const inside = item?.includes ?? []
  return {
    ...state,
    bundle: null,
    many: [...state.many.filter((k) => !inside.includes(k)), key],
  }
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
 * @param {string} [title]  Название шага по типу товара: «Вариант поставки», «Формат обучения».
 * @returns {PickerView}
 */
export function offersAsPicker(productId, offers, licenses, title = 'Комплектация') {
  if (!offers.length) return { switches: [], steps: [] }
  return {
    switches: [],
    steps: [
      {
        key: 'offers',
        title,
        hint: null,
        mode: offers.length > 1 ? 'one' : 'base',
        collapsed: false,
        items: offers.map((offer) => ({
          key: `o${offer.id}`,
          productId,
          label: offer.configuration,
          note: licenses[offer.id] && licenses[offer.id] !== '—' ? licenses[offer.id] : null,
          offers: [offer],
          fixedOffers: [offer.id],
          preselect: false,
        })),
      },
    ],
  }
}

/**
 * Значение переключателя «Обновление» (у АВС: «Новая лицензия / Обновление»): цена обновления
 * в «от» каталога не входит, иначе карточка показывает цену для тех, у кого программа уже есть.
 * @param {string} value
 */
export function isRenewal(value) {
  return /^обновлени[ея]/i.test(value.trim())
}

/**
 * Самый дешёвый комплект, который можно собрать в подборе, — для цены «от» в каталоге.
 * Значения «Обновление» не перебираются (isRenewal).
 * Для каждого сочетания переключателей: всё из шагов «основа» плюс самый дешёвый вариант
 * каждого шага «один вариант»; отдельно — каждый готовый комплект. Галочки (шаг «несколько»)
 * необязательны и в минимум не входят. Сборка, где хоть одна обязательная строка без цены,
 * не считается. Ничего не собирается — null («по запросу»).
 * @param {PickerView} view
 * @param {(offerId: string) => bigint | null} unitOf  Цена за единицу с НДС, посчитанная сервером.
 * @returns {bigint | null}
 */
export function cheapestTotal(view, unitOf) {
  /** @type {Record<string, string>[]} */
  let combos = [{}]
  for (const sw of view.switches) {
    const priced = sw.options.filter((o) => !isRenewal(o.value))
    const options = priced.length ? priced : sw.options
    combos = combos.flatMap((c) => options.map((o) => ({ ...c, [sw.key]: o.value })))
  }
  /** @type {bigint | null} */
  let best = null
  const consider = (/** @type {bigint | null} */ sum) => {
    if (sum != null && (best == null || sum < best)) best = sum
  }
  const priceOf = (/** @type {PickerItem} */ item, /** @type {Record<string, string>} */ sel) => {
    const offer = offerFor(item, view.switches, sel)
    return offer ? unitOf(offer.id) : null
  }
  for (const sel of combos) {
    /** @type {bigint | null} */
    let manual = 0n
    let parts = 0
    // Без break: даже если ручная сборка не считается, готовые комплекты ниже ещё проверяются.
    for (const step of view.steps) {
      if (step.mode === 'base')
        for (const item of step.items) {
          if (itemUnavailable(item, view.switches, sel)) continue
          const unit = priceOf(item, sel)
          manual = unit == null || manual == null ? null : manual + unit
          parts++
        }
      if (step.mode === 'one') {
        const units = step.items
          .filter((i) => !itemUnavailable(i, view.switches, sel))
          .map((i) => priceOf(i, sel))
          .filter((u) => u != null)
        if (!units.length || manual == null) manual = null
        else {
          manual = manual + units.reduce((a, b) => (b < a ? b : a))
          parts++
        }
      }
      if (step.mode === 'bundle')
        for (const item of step.items)
          if (!itemUnavailable(item, view.switches, sel)) consider(priceOf(item, sel))
    }
    if (parts) consider(manual)
  }
  return best
}
