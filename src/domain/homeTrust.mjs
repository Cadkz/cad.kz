// @ts-check
// Наполнение блока «Официальный партнёр производителей» на главной.
// v1 — статусы словами; v2 (решение владельца 11.10.2026) — коротко: заголовок и логотипы,
// без статусов и пояснений. Производители — те, чьи сертификаты выложены на старом cad.kz
// («О компании» → «Сертификаты компании»). Логотипы — со старого cad.kz (цветной вариант);
// у SCAD Soft и Canon там своих нет — показывается название, логотип владелец загрузит в админке.
// Дальше блок правится в админке: «Главная страница» → «Блок «Официальный партнёр»».

/** Первое наполнение (11.10.2026), по нему v2 узнаёт, что блок не правили вручную. */
export const TRUST_SEED_V1_VENDORS = ['Autodesk', 'SCAD Soft', 'Fine Software', 'Canon']

export const TRUST_SEED = {
  title: 'Официальный партнёр производителей',
  /** @type {string | null} */
  lead: null,
  partners: [
    { vendor: 'Autodesk', logoPath: '/upload/iblock/683/683f6f7d2d26861e1c2493ce7ea53ed7.png' },
    { vendor: 'SCAD Soft', logoPath: null },
    {
      vendor: 'Fine Software',
      logoPath: '/upload/iblock/7f5/az2jsxd7xj4f01j2utb56t4rbbfl8dnw.png',
    },
    { vendor: 'АВС', logoPath: '/upload/iblock/535/bmfz2m4kff6l23o505jex2atzm84f0lh.png' },
    {
      vendor: 'CSoft Development',
      logoPath: '/upload/iblock/907/be3rh6o9gci06l3hkpgc7nlt6c22d1qw.png',
    },
    { vendor: 'Canon', logoPath: null },
  ],
  /** @type {{ label: string, href: string }[]} */
  links: [],
}

/** Блок без логотипов — для демоданных и как запасной вариант, если старый сайт недоступен. */
export const TRUST_DATA = {
  title: TRUST_SEED.title,
  lead: TRUST_SEED.lead,
  partners: TRUST_SEED.partners.map(({ vendor }) => ({ vendor })),
  links: TRUST_SEED.links,
}
