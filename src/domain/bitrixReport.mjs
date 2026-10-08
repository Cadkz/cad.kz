// Отчёт проверочного прогона импорта: понятным языком, для владельца сайта.

export const ISSUE_TITLES = {
  offerNoPrice: 'Включённые предложения без цены (будут «Запросить цену»)',
  zeroPrice: 'Цена 0 (не переносится, будет «Запросить цену»)',
  suspiciousPrice: 'Подозрительно большая цена, похожая на заглушку (не переносится)',
  unparsedPrice: 'Цена в непонятном формате',
  offerOrphan: 'Предложения, привязанные к несуществующему товару (пропущены)',
  offerProductInactive: 'Предложения выключенного товара (пропущены)',
  offerNotInPrices: 'Предложения, которых нет в выгрузке с ценами',
  duplicateVariant: 'Повтор предложения с тем же артикулом (оставлено одно, это пропущено)',
  ambiguousVariant:
    'Разные артикулы с одинаковым описанием (на сайте подписаны названием из Битрикса)',
  noSlug: 'Товары без символьного кода (адреса)',
  duplicateSlug: 'Повторяющийся символьный код',
}

const KIND_TITLES = {
  software: 'Программы',
  hardware: 'Оборудование',
  course: 'Курсы',
  service: 'Услуги',
}

function count(items, key) {
  const result = new Map()
  for (const item of items) {
    const value = key(item)
    result.set(value, (result.get(value) ?? 0) + 1)
  }
  return [...result].sort((a, b) => b[1] - a[1])
}

export function renderReport({ products, offers, issues, stats }, { limit = Infinity } = {}) {
  const priced = offers.filter((o) => o.price)
  const simplePriced = products.filter((p) => p.price)
  const productsWithOffers = new Set(offers.map((o) => o.productLegacyKey))
  const lines = [
    '# Проверочный прогон импорта из Битрикса',
    '',
    'В базу ничего не записано.',
    '',
    '## Итог',
    `- Товаров в выгрузке: ${stats.productsTotal}, включённых: ${stats.productsActive}, к переносу: ${products.length}.`,
    `- Предложений в выгрузке: ${stats.offersTotal}, включённых: ${stats.offersActive}, к переносу: ${offers.length}, из них с ценой: ${priced.length}.`,
    `- Товаров с вариантами: ${productsWithOffers.size}. Простых товаров с ценой в карточке: ${simplePriced.length}.`,
    `- Товаров без цены (кнопка «Запросить цену»): ${products.filter((p) => !p.price && !offers.some((o) => o.productLegacyKey === p.legacyKey && o.price)).length}.`,
    '',
    '## Типы товаров',
    ...count(products, (p) => KIND_TITLES[p.kind]).map(([k, n]) => `- ${k}: ${n}`),
    '',
    '## Валюты цен',
    ...count(
      [...priced, ...simplePriced],
      (x) => `${x.price.currency}, НДС ${x.price.includesVat ? 'включён' : 'сверху'}`,
    ).map(([k, n]) => `- ${k}: ${n}`),
    '',
    '## Производители',
    ...count(products, (p) => p.manufacturer ?? 'не указан').map(([k, n]) => `- ${k}: ${n}`),
    '',
    '## Проблемы',
  ]
  const byType = count(issues, (i) => i.type)
  if (!byType.length) lines.push('Нет.')
  for (const [type, total] of byType) {
    lines.push('', `### ${ISSUE_TITLES[type] ?? type}: ${total}`)
    const list = issues.filter((i) => i.type === type)
    for (const issue of list.slice(0, limit))
      lines.push(`- [${issue.id}] ${issue.title}${issue.detail ? ` — ${issue.detail}` : ''}`)
    if (list.length > limit) lines.push(`- …и ещё ${list.length - limit}`)
  }
  return `${lines.join('\n')}\n`
}
