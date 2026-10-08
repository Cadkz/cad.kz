// Проверка частей импорта, которые страница админки присылает на сервер. Выгрузки разбираются
// в браузере (файлы на сервер не уходят), поэтому сервер не верит присланному на слово:
// принимает только ожидаемые поля с ограничениями по длине и формату.

const CURRENCIES = new Set(['KZT', 'USD', 'EUR', 'RUB'])
const KINDS = new Set(['software', 'hardware', 'course', 'service'])

class InputError extends Error {}

const fail = (message) => {
  throw new InputError(message)
}

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

function text(value, name, max, { optional = false } = {}) {
  if (optional && (value === null || value === undefined || value === '')) return null
  if (typeof value !== 'string' || !value.trim()) fail(`нет поля «${name}»`)
  if (value.length > max) fail(`поле «${name}» длиннее ${max} знаков`)
  return value
}

function list(value, name, max) {
  if (!Array.isArray(value)) fail(`поле «${name}» должно быть списком`)
  if (value.length > max) fail(`в поле «${name}» больше ${max} значений`)
  return value
}

function key(value, pattern, name) {
  if (typeof value !== 'string' || !pattern.test(value)) fail(`неверный ключ «${name}»`)
  return value
}

const PRODUCT_KEY = /^bitrix:product:\d{1,12}$/
const OFFER_KEY = /^bitrix:(offer|product-price):\d{1,12}$/

/** Путь картинки на старом сайте: «/upload/…», без адреса другого сервера. */
function imagePaths(value) {
  return list(value, 'картинки', 50).map((item) => {
    const imagePath = text(item, 'картинка', 500)
    if (!imagePath.startsWith('/') || imagePath.startsWith('//'))
      fail('картинка не со старого сайта')
    return imagePath
  })
}

function product(item) {
  if (!isObject(item) || !isObject(item.data)) fail('неверный формат')
  const { data } = item
  if (!KINDS.has(data.kind)) fail('неизвестный тип товара')
  const slug = text(item.slug, 'адрес', 200)
  if (!/^[A-Za-z0-9_-]+$/.test(slug)) fail('адрес содержит недопустимые знаки')
  return {
    legacyKey: key(item.legacyKey, PRODUCT_KEY, 'товар'),
    bitrixId: text(String(item.bitrixId ?? ''), 'ID', 12),
    slug,
    manufacturer: text(item.manufacturer, 'производитель', 200, { optional: true }),
    images: imagePaths(item.images ?? []),
    data: {
      title: text(data.title, 'название', 500),
      kind: data.kind,
      summary: text(data.summary, 'анонс', 5000, { optional: true }),
      description: text(data.description, 'описание', 200_000, { optional: true }),
      properties: list(data.properties ?? [], 'характеристики', 50).map((p) => ({
        name: text(p?.name, 'название характеристики', 200),
        value: text(p?.value, 'значение характеристики', 2000),
      })),
    },
  }
}

function offer(item) {
  if (!isObject(item) || !isObject(item.data)) fail('неверный формат')
  const { data } = item
  if (typeof data.amount !== 'string' || !/^\d{1,15}(\.\d{1,4})?$/.test(data.amount))
    fail('цена в неверном формате')
  if (!CURRENCIES.has(data.currency)) fail('неизвестная валюта')
  if (typeof data.includesVat !== 'boolean') fail('не указано, включён ли НДС')
  if (typeof data.sourceVat !== 'string' || !/^\d{1,2}(\.\d{1,2})?$/.test(data.sourceVat))
    fail('ставка НДС в неверном формате')
  return {
    legacyKey: key(item.legacyKey, OFFER_KEY, 'вариант'),
    productLegacyKey: key(item.productLegacyKey, PRODUCT_KEY, 'товар варианта'),
    data: {
      title: text(data.title, 'название', 500),
      configuration: text(data.configuration, 'комплектация', 500),
      license: text(data.license, 'лицензия', 500),
      amount: data.amount,
      currency: data.currency,
      includesVat: data.includesVat,
      sourceVat: data.sourceVat,
    },
  }
}

/** Картинки товара: ключ, название (подпись картинки) и пути. */
function imageItem(item) {
  if (!isObject(item)) fail('неверный формат')
  return {
    legacyKey: key(item.legacyKey, PRODUCT_KEY, 'товар'),
    images: imagePaths(item.images),
    data: { title: text(item.title, 'название', 500) },
  }
}

const READERS = { product, offer, image: imageItem }
const LABELS = { product: 'Товар', offer: 'Вариант', image: 'Картинки товара' }

/**
 * Проверяет список частей одного вида (product, offer, image) не длиннее max.
 * Возвращает { items } или { error } с понятным текстом: какая строка и что не так.
 */
export function readItems(kind, value, max) {
  if (!Array.isArray(value) || !value.length) return { error: 'Пустая часть импорта' }
  if (value.length > max) return { error: `Слишком большая часть: больше ${max} записей` }
  const items = []
  for (const [index, item] of value.entries()) {
    try {
      items.push(READERS[kind](item))
    } catch (error) {
      if (!(error instanceof InputError)) throw error
      const id = isObject(item) && typeof item.legacyKey === 'string' ? ` (${item.legacyKey})` : ''
      return { error: `${LABELS[kind]} №${index + 1}${id}: ${error.message}` }
    }
  }
  return { items }
}

/** Названия производителей для начала запуска. */
export function readManufacturers(value) {
  try {
    return { items: list(value, 'производители', 1000).map((n) => text(n, 'производитель', 200)) }
  } catch (error) {
    if (!(error instanceof InputError)) throw error
    return { error: `Производители: ${error.message}` }
  }
}

/** Ключи всех товаров и вариантов плана: для снятия с публикации пропавшего. */
export function readKeys(value) {
  if (!Array.isArray(value) || value.length > 50_000) return { error: 'Неверный список ключей' }
  for (const item of value)
    if (typeof item !== 'string' || !(PRODUCT_KEY.test(item) || OFFER_KEY.test(item)))
      return { error: 'Неверный ключ в списке' }
  return { items: value }
}
