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
  slugTaken: 'Адрес уже занят другим товаром (новому дан адрес с номером из Битрикса)',
}

const KIND_TITLES = {
  software: 'Программы',
  hardware: 'Оборудование',
  course: 'Курсы',
  service: 'Услуги',
}

/**
 * @template T
 * @param {T[]} items
 * @param {(item: T) => string} key
 * @returns {[string, number][]}
 */
function count(items, key) {
  const result = new Map()
  for (const item of items) {
    const value = key(item)
    result.set(value, (result.get(value) ?? 0) + 1)
  }
  return [...result].sort((a, b) => b[1] - a[1])
}

/**
 * Цифры проверочного прогона: для отчёта файлом и для страницы импорта в админке.
 * @param {import('./bitrixCatalog.mjs').Catalog} catalog
 */
export function summarizeCatalog({ products, offers, issues, stats }) {
  const priced = offers.filter((o) => o.price)
  const simplePriced = products.filter((p) => p.price)
  const productsWithOffers = new Set(offers.map((o) => o.productLegacyKey))
  const pricedProducts = new Set(priced.map((o) => o.productLegacyKey))
  return {
    stats,
    products: products.length,
    offers: offers.length,
    pricedOffers: priced.length,
    productsWithOffers: productsWithOffers.size,
    simplePriced: simplePriced.length,
    noPrice: products.filter((p) => !p.price && !pricedProducts.has(p.legacyKey)).length,
    withImages: products.filter((p) => p.images.length).length,
    images: new Set(products.flatMap((p) => p.images)).size,
    kinds: count(products, (p) => KIND_TITLES[p.kind]),
    currencies: count(
      [...priced, ...simplePriced],
      (x) => `${x.price.currency}, НДС ${x.price.includesVat ? 'включён' : 'сверху'}`,
    ),
    manufacturers: count(products, (p) => p.manufacturer ?? 'не указан'),
    issues: count(issues, (i) => i.type).map(([type, total]) => ({
      type,
      title: ISSUE_TITLES[type] ?? type,
      total,
      items: issues.filter((i) => i.type === type),
    })),
  }
}

export function renderReport(catalog, { limit = Infinity } = {}) {
  const s = summarizeCatalog(catalog)
  const lines = [
    '# Проверочный прогон импорта из Битрикса',
    '',
    'В базу ничего не записано.',
    '',
    '## Итог',
    `- Товаров в выгрузке: ${s.stats.productsTotal}, включённых: ${s.stats.productsActive}, к переносу: ${s.products}.`,
    `- Предложений в выгрузке: ${s.stats.offersTotal}, включённых: ${s.stats.offersActive}, к переносу: ${s.offers}, из них с ценой: ${s.pricedOffers}.`,
    `- Товаров с вариантами: ${s.productsWithOffers}. Простых товаров с ценой в карточке: ${s.simplePriced}.`,
    `- Товаров без цены (кнопка «Запросить цену»): ${s.noPrice}.`,
    '',
    '## Типы товаров',
    ...s.kinds.map(([k, n]) => `- ${k}: ${n}`),
    '',
    '## Валюты цен',
    ...s.currencies.map(([k, n]) => `- ${k}: ${n}`),
    '',
    '## Производители',
    ...s.manufacturers.map(([k, n]) => `- ${k}: ${n}`),
    '',
    '## Проблемы',
  ]
  if (!s.issues.length) lines.push('Нет.')
  for (const group of s.issues) {
    lines.push('', `### ${group.title}: ${group.total}`)
    for (const issue of group.items.slice(0, limit))
      lines.push(`- [${issue.id}] ${issue.title}${issue.detail ? ` — ${issue.detail}` : ''}`)
    if (group.items.length > limit) lines.push(`- …и ещё ${group.items.length - limit}`)
  }
  return `${lines.join('\n')}\n`
}

const line = (title, c) =>
  `- ${title}: новых ${c.created}, обновлено ${c.updated}, без изменений ${c.unchanged}` +
  (c.unpublished ? `, снято с публикации ${c.unpublished}` : '')

/** Итог записи в базу: что создано, обновлено, снято с публикации; курсы и картинки. */
export function renderWriteResult(result, images = null) {
  const lines = [
    '# Импорт из Битрикса: запись в базу',
    '',
    line('Товары', result.products),
    line('Варианты с ценой', result.offers),
    `- Производители: новых ${result.manufacturers.created}, уже были ${result.manufacturers.unchanged}`,
  ]
  if (result.demoHidden) lines.push(`- Демотоваров снято с публикации: ${result.demoHidden}`)
  lines.push(
    result.rates.length
      ? `- Курсы: ${result.rates.map((r) => `${r.currency} ${r.from ?? 'нет'} → ${r.to}`).join(', ')}`
      : '- Курсы: без изменений',
  )
  if (images) {
    lines.push(
      `- Картинки: скачано ${images.downloaded}, уже были ${images.reused}, галерей заполнено ${images.products}, не скачалось ${images.failed.length}` +
        (images.postponed ? `, отложено до следующего запуска ${images.postponed}` : ''),
    )
    for (const f of images.failed.slice(0, 50))
      lines.push(`  - ${f.product}: ${f.path} (${f.reason})`)
  }
  if (result.issues.length) {
    lines.push('', '## Обратить внимание')
    for (const issue of result.issues)
      lines.push(
        `- ${ISSUE_TITLES[issue.type] ?? issue.type}: [${issue.id}] ${issue.title} — ${issue.detail}`,
      )
  }
  return `${lines.join('\n')}\n`
}
