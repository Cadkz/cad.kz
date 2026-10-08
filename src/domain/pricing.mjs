// Exact rational arithmetic: no binary floating-point money calculations.
function decimal(value) {
  if (typeof value !== 'string' || !/^\d{1,12}(\.\d{1,6})?$/.test(value))
    throw new Error('Некорректное десятичное значение')
  const [whole, fraction = ''] = value.split('.')
  return [BigInt(whole + fraction), 10n ** BigInt(fraction.length)]
}
function round(n, d) {
  return (n * 2n + d) / (2n * d)
}
export function quote({
  amount,
  rate,
  sourceVat = '16',
  targetVat = '16',
  includesVat = false,
  quantity = 1,
}) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999)
    throw new Error('Количество: от 1 до 999')
  if (typeof includesVat !== 'boolean') throw new Error('Некорректный флаг НДС')
  const [a, ad] = decimal(amount),
    [r, rd] = decimal(rate)
  const [s, sd] = decimal(sourceVat),
    [t, td] = decimal(targetVat)
  if (r === 0n || s > 100n * sd || t > 100n * td) throw new Error('Некорректный курс или НДС')
  let n = a * r * (100n * td + t),
    d = ad * rd * 100n * td
  if (includesVat) {
    n *= 100n * sd
    d *= 100n * sd + s
  }
  const unit = round(n, d),
    total = unit * BigInt(quantity)
  const vatMinor = round(total * t * 100n, 100n * td + t)
  return {
    unitKzt: unit.toString(),
    totalKzt: total.toString(),
    vatMinor: vatMinor.toString(),
    amount,
    rate,
    sourceVat,
    targetVat,
    includesVat,
    quantity,
    rule: 'KZT-unit-half-up-v1',
  }
}
