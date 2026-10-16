import styles from './HiddenTitle.module.css'

/**
 * Заголовок страницы для поисковиков и экранных дикторов, на экране не виден. Главная без
 * первого баннера (решение владельца 16.10.2026): видимый первый блок — BIM с h2, а h1 страницы
 * остаётся прежним текстом из админки «Главная».
 */
export function HiddenTitle({ children }: { children: string }) {
  return <h1 className={styles.title}>{children}</h1>
}
