/** Перевод с формами по числу (t из getT/useT). */
type PluralT = { plural: (n: number, one: string, few: string, many: string) => string }

/** «1 позиция», «3 позиции», «12 позиций»; с t — на языке страницы. */
export function positions(n: number, t?: PluralT): string {
  const word = t
    ? t.plural(n, 'позиция', 'позиции', 'позиций')
    : plural(n, 'позиция', 'позиции', 'позиций')
  return `${n} ${word}`
}

/** Форма слова по числу: plural(3, 'цена', 'цены', 'цен') → «цены». */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}
