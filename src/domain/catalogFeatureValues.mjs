/** Представление характеристик для покупателя. Исходные значения и свойства в CMS сохраняются. */
/** @param {string | undefined} category @param {string} key @param {string} value */
export function featureValue(category, key, value) {
  if (category === 'plotters' && key === 'rolls') {
    if (value === '1+1 опция' || value === '1+1') return '2'
    const numbers = value.match(/\d+/g)?.map(Number) ?? []
    return numbers.length ? String(Math.max(...numbers)) : value
  }
  if (key === 'resolution') return value.replace(/\s*[x×]\s*/g, ' × ')
  return value
}

/** @param {string | undefined} category @param {string} key @param {string} value */
export function featureLabel(category, key, value) {
  return category === 'plotters' && key === 'rolls'
    ? `${value} ${value === '6' ? 'рулонов' : 'рулона'}`
    : value
}

/** @param {string} category @param {{ key: string, label: string, type: string, values: string[] }} filter */
export function featureDefinition(category, filter) {
  const values = [
    ...new Set(filter.values.map((value) => featureValue(category, filter.key, value))),
  ]
  if (['width', 'rolls', 'accuracy', 'resolution'].includes(filter.key)) {
    const number = (value) =>
      Number(value.match(/\d+(?:[.,]\d+)?/)?.[0]?.replace(',', '.') ?? Infinity)
    values.sort((a, b) => number(a) - number(b))
  }
  if (filter.key === 'object_size') {
    const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    values.sort((a, b) => order.indexOf(a.split(' ')[0]) - order.indexOf(b.split(' ')[0]))
  }
  return {
    ...filter,
    label:
      category === 'plotters' && filter.key === 'rolls'
        ? 'Рулоны: максимум с опциями'
        : filter.label,
    values,
  }
}
