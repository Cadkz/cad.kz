import styles from './OfficeMap.module.css'

/** Адрес для поиска на карте: без «г.», «ул.», «д.» карты находят дом точнее. */
export function mapQuery(address: string) {
  return address
    .replace(/\s+/g, ' ')
    .replace(/(^|[\s,])(г|ул|д|пр|пр-т)\.\s*/giu, '$1')
    .trim()
}

/** Ссылки на офис: 2ГИС (своя ссылка из настроек, если она на 2ГИС) и Google Карты. */
export function mapLinks(address: string, mapUrl: string | null) {
  const query = encodeURIComponent(mapQuery(address))
  return {
    twoGis: mapUrl?.includes('2gis') ? mapUrl : `https://2gis.kz/astana/search/${query}`,
    google: `https://www.google.com/maps/search/?api=1&query=${query}`,
  }
}

/**
 * Мини-карта офиса на странице «Контакты» (решение владельца 13.10.2026): встроенные Google
 * Карты по адресу из настроек, без ключа и без скриптов на нашей странице. Грузится лениво.
 */
export function OfficeMap({ address }: { address: string }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery(address))}&z=16&output=embed`
  return (
    <div className={styles.map}>
      <iframe
        src={src}
        title={`Офис CAD.kz на карте: ${address}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className={styles.frame}
      />
    </div>
  )
}
