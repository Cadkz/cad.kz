// @ts-check
import corrections from './kaddiKnowledgeCorrections.json' with { type: 'json' }

export const KNOWLEDGE_CORRECTIONS_KEY = 'catalog-setup:kaddi-knowledge-owner-2026-11-05'
export const SCANNER_RENTAL_KEY = 'Справка: аренда 3D-сканеров'
export const SCANNER_RENTAL_TEXT = corrections.scannerRental

/** Только согласованные фрагменты; остальные тексты, в том числе исключения владельца, сохраняются.
 * @param {string} product @param {string} text
 */
export function correctKnowledgeText(product, text) {
  if (product === 'Справка: внедрение BIM') return corrections.bim
  // Актуальные условия аренды оборудования сообщил владелец: старые условия заменяются целиком.
  if (product === 'Справка: аренда плоттеров')
    return corrections.replacements.find((entry) => entry.product === product)?.after ?? text
  if (product === SCANNER_RENTAL_KEY) return SCANNER_RENTAL_TEXT
  let result = text
  for (const entry of corrections.replacements) {
    if (entry.product === product) result = result.replaceAll(entry.before, entry.after)
  }
  return result
}
