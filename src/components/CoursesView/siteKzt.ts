import { quote } from '@/domain/pricing.mjs'

/** Цена из таблицы УЦ (тенге, итоговая) так, как её покажет сайт: вниз до тысячи. */
export function siteKzt(amount: string) {
  return quote({ amount, rate: '1', includesVat: true, sourceVat: '16', targetVat: '16' }).unitKzt
}
