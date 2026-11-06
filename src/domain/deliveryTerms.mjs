// Сроки поставки по производителям (владелец, 06.11.2026). Везде «от»: точный срок подтверждает
// менеджер. Исключение — АСКОН: «до 5 дней» (владелец, 06.11.2026, 15:48). Производители без строки (АРС-ПС, MagiCAD) — общий текст условий покупки.

const afterPay = (ru, kk, en) => ({ ru, kk, en })

/** title — название производителя в админке (без учёта регистра). */
export const VENDOR_DELIVERY = [
  {
    title: 'Autodesk',
    software: afterPay(
      'от 1 дня после оплаты',
      'төлемнен кейін 1 күннен бастап',
      'from 1 day after payment',
    ),
  },
  {
    title: 'АВС',
    software: afterPay(
      'от 3 дней после оплаты',
      'төлемнен кейін 3 күннен бастап',
      'from 3 days after payment',
    ),
  },
  {
    title: 'SCAD Soft',
    software: afterPay(
      'от 1 дня после оплаты, без учёта доставки ключа',
      'төлемнен кейін 1 күннен бастап, кілтті жеткізуді есептемегенде',
      'from 1 day after payment, excluding key delivery',
    ),
  },
  {
    title: 'Fine Software',
    software: afterPay(
      'от 1 дня после оплаты',
      'төлемнен кейін 1 күннен бастап',
      'from 1 day after payment',
    ),
  },
  {
    title: 'Artec 3D',
    software: afterPay(
      'от 3 рабочих дней после оплаты',
      'төлемнен кейін 3 жұмыс күнінен бастап',
      'from 3 business days after payment',
    ),
    hardware: afterPay(
      'от 2 недель с момента оплаты',
      'төлемнен кейін 2 аптадан бастап',
      'from 2 weeks after payment',
    ),
  },
  {
    title: 'Csoft Development',
    software: afterPay(
      'от 1 дня после оплаты',
      'төлемнен кейін 1 күннен бастап',
      'from 1 day after payment',
    ),
  },
  {
    title: 'ЛИРА-FEM',
    software: afterPay(
      'от 3 дней после оплаты, без учёта доставки ключа',
      'төлемнен кейін 3 күннен бастап, кілтті жеткізуді есептемегенде',
      'from 3 days after payment, excluding key delivery',
    ),
  },
  {
    title: 'АСКОН',
    software: afterPay(
      'до 5 дней после оплаты',
      'төлемнен кейін 5 күнге дейін',
      'up to 5 days after payment',
    ),
  },
  {
    title: 'НТП Трубопровод',
    software: afterPay(
      'от 30 календарных дней после оплаты',
      'төлемнен кейін 30 күнтізбелік күннен бастап',
      'from 30 calendar days after payment',
    ),
  },
  {
    title: 'Base',
    software: afterPay(
      'от 15 дней: ключ защиты едет из России. Онлайн-лицензия — от 3 дней',
      '15 күннен бастап: қорғау кілті Ресейден жеткізіледі. Онлайн-лицензия — 3 күннен бастап',
      'from 15 days: the protection key ships from Russia. Online license — from 3 days',
    ),
  },
  {
    title: 'Chaos Group',
    software: afterPay(
      'от 5 дней после оплаты',
      'төлемнен кейін 5 күннен бастап',
      'from 5 days after payment',
    ),
  },
  {
    title: 'TDMS Фарватер',
    software: afterPay(
      'от 2 дней после оплаты',
      'төлемнен кейін 2 күннен бастап',
      'from 2 days after payment',
    ),
  },
  {
    title: 'Canon',
    hardware: afterPay(
      'под заказ, от 6 недель',
      'тапсырыс бойынша, 6 аптадан бастап',
      'made to order, from 6 weeks',
    ),
  },
  {
    title: 'WideTEK',
    hardware: afterPay(
      'от 40 дней после оплаты',
      'төлемнен кейін 40 күннен бастап',
      'from 40 days after payment',
    ),
  },
]

/** Товары со своим сроком: title — часть названия (регулярное выражение). */
export const PRODUCT_DELIVERY = [
  { title: /TZ-?30000/i, delivery: afterPay('в наличии', 'қоймада бар', 'in stock') },
]

/** Прежний текст АСКОН (06.11.2026): меняется на «до 5 дней», если в админке его не правили. */
export const ASKON_OLD = afterPay(
  'от 5 дней после оплаты',
  'төлемнен кейін 5 күннен бастап',
  'from 5 days after payment',
)
