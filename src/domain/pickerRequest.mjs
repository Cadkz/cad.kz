/** Цена без готовых комплектаций запрашивается по самому товару. Семейство требует выбора. */
/** @param {string} kind @param {boolean} hasSteps @param {boolean} family */
export function requestNeedsChoice(kind, hasSteps, family) {
  return (kind === 'quote' || kind === 'price') && (hasSteps || family)
}

/**
 * @param {{productId: number, offerId: string | null, label: string, detail: string | null}[]} lines
 * @param {number} productId
 * @param {string} title
 * @param {boolean} hasSteps
 * @param {boolean} family
 */
export function requestLines(lines, productId, title, hasSteps, family) {
  if (lines.length || hasSteps || family) return lines
  return [{ productId, offerId: null, label: title, detail: null }]
}
