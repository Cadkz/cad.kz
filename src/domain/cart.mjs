/** The offer ID identifies a complete configuration, not just a product. */
export function normalizeCart(input) {
  if (!Array.isArray(input) || input.length > 50)
    throw new Error('В корзине допускается до 50 строк')
  const merged = new Map()
  for (const line of input) {
    if (!line || typeof line.offerId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(line.offerId))
      throw new Error('Некорректное предложение')
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 999)
      throw new Error('Количество должно быть от 1 до 999')
    const quantity = (merged.get(line.offerId) || 0) + line.quantity
    if (quantity > 999) throw new Error('Не более 999 единиц одной комплектации')
    merged.set(line.offerId, quantity)
  }
  return Array.from(merged, ([offerId, quantity]) => ({ offerId, quantity }))
}

/**
 * Строка-запрос (просьба владельца 27.10.2026): у большинства товаров нет одной комплектации
 * с ценой, поэтому в корзину кладётся сам товар или семейство, а комплектацию и цену подбирает
 * менеджер при оформлении. Ключ строки — «p<ID товара>» или «l<ID линейки>»; у предложения
 * с ценой ключ — просто его числовой ID.
 * @param {string} key
 * @returns {{ kind: 'product' | 'line', id: number } | null}
 */
export function parseRequestKey(key) {
  const match = /^([pl])([1-9]\d{0,8})$/.exec(key)
  if (!match) return null
  return { kind: match[1] === 'p' ? 'product' : 'line', id: Number(match[2]) }
}

/** @param {number} productId */
export const productRequestKey = (productId) => `p${productId}`

/** @param {number} lineId */
export const lineRequestKey = (lineId) => `l${lineId}`
