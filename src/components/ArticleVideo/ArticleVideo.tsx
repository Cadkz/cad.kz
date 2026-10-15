import styles from './ArticleVideo.module.css'

type Props = { title: string; embed: string; watch: string }

/**
 * Видео в тексте публикации: плеер YouTube, Rutube, VK или Vimeo в рамке 16 : 9. Плеер грузится,
 * только когда долистали (loading="lazy"), и не мешает первому экрану. Под ним — ссылка на ролик
 * на случай, если плеер у читателя заблокирован.
 */
export function ArticleVideo({ title, embed, watch }: Props) {
  return (
    <figure className={styles.figure}>
      <div className={styles.frame}>
        <iframe
          className={styles.player}
          src={embed}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <figcaption className={styles.caption}>
        <a href={watch} target="_blank" rel="noopener noreferrer">
          {title === 'Видео' ? 'Смотреть видео на сайте видеохостинга' : title}
        </a>
      </figcaption>
    </figure>
  )
}
