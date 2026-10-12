import Image, { type StaticImageData } from 'next/image'
import emptyCart from '../../../public/images/mascot/kadi-empty-cart.png'
import emptyCartBlink from '../../../public/images/mascot/kadi-empty-cart-blink.png'
import greeting from '../../../public/images/mascot/kadi-greeting.png'
import grumpy from '../../../public/images/mascot/kadi-grumpy.png'
import grumpyBlink from '../../../public/images/mascot/kadi-grumpy-blink.png'
import head from '../../../public/images/mascot/kadi-head.png'
import headBlink from '../../../public/images/mascot/kadi-head-blink.png'
import laptop from '../../../public/images/mascot/kadi-laptop.png'
import laptopBlink from '../../../public/images/mascot/kadi-laptop-blink.png'
import loaf from '../../../public/images/mascot/kadi-loaf.png'
import loafBlink from '../../../public/images/mascot/kadi-loaf-blink.png'
import loafWave from '../../../public/images/mascot/kadi-loaf-wave.png'
import loafWaveBlink from '../../../public/images/mascot/kadi-loaf-wave-blink.png'
import neutral from '../../../public/images/mascot/kadi-neutral.png'
import neutralBlink from '../../../public/images/mascot/kadi-neutral-blink.png'
import notFound from '../../../public/images/mascot/kadi-not-found.png'
import notFoundBlink from '../../../public/images/mascot/kadi-not-found-blink.png'
import search from '../../../public/images/mascot/kadi-search.png'
import searchBlink from '../../../public/images/mascot/kadi-search-blink.png'
import success from '../../../public/images/mascot/kadi-success.png'
import tangled from '../../../public/images/mascot/kadi-tangled.png'
import tangledBlink from '../../../public/images/mascot/kadi-tangled-blink.png'
import think from '../../../public/images/mascot/kadi-think.png'
import thinkBlink from '../../../public/images/mascot/kadi-think-blink.png'
import yarn from '../../../public/images/mascot/kadi-yarn.png'
import yarnBlink from '../../../public/images/mascot/kadi-yarn-blink.png'
import styles from './Mascot.module.css'

/**
 * Позы Кади. blink — слой того же размера, где видны только закрытые глаза:
 * кладётся поверх и на мгновение проявляется (моргание).
 * think (думает) и laptop (с ноутбуком) смотрят вправо — только для окна ИИ-консультанта,
 * где Кади слева от сообщений; на страницы справа от текста их не ставить.
 * loaf (буханка) и loaf-wave (лёжа машет лапой) — Кади-консультант в углу экрана;
 * grumpy (недовольный) — когда чат часто открывают и закрывают; tangled (запутался в нитках,
 * удивлён) — «Запутались в комплектациях?» у подбора; yarn (играет с клубком) — в запасе.
 */
const POSES = {
  neutral: { src: neutral, blink: neutralBlink },
  search: { src: search, blink: searchBlink },
  'empty-cart': { src: emptyCart, blink: emptyCartBlink },
  'not-found': { src: notFound, blink: notFoundBlink },
  success: { src: success, blink: null },
  greeting: { src: greeting, blink: null },
  think: { src: think, blink: thinkBlink },
  laptop: { src: laptop, blink: laptopBlink },
  head: { src: head, blink: headBlink },
  loaf: { src: loaf, blink: loafBlink },
  'loaf-wave': { src: loafWave, blink: loafWaveBlink },
  grumpy: { src: grumpy, blink: grumpyBlink },
  tangled: { src: tangled, blink: tangledBlink },
  yarn: { src: yarn, blink: yarnBlink },
} satisfies Record<string, { src: StaticImageData; blink: StaticImageData | null }>

export type MascotPose = keyof typeof POSES
export type MascotSize = 'icon' | 'avatar' | 'launcher' | 'xs' | 'sm' | 'md' | 'lg'

/** Наибольшая высота показа в px — как токены --icon-box, --mascot-*; по ней браузер берёт файл 1x/2x. */
const HEIGHT: Record<MascotSize, number> = {
  icon: 40,
  avatar: 64,
  launcher: 80,
  xs: 96,
  sm: 120,
  md: 160,
  lg: 240,
}

type Props = {
  pose: MascotPose
  size?: MascotSize
  /** На первом экране (404) — грузить сразу, а не по прокрутке. */
  eager?: boolean
  /** Своя реакция на наведение (наклон и лишнее моргание). false — реакцию задаёт родитель. */
  hover?: boolean
  className?: string
}

/**
 * Кади — персонаж CAD.kz для пустых состояний и будущего ИИ-консультанта.
 * Картинка декоративная: смысл несут заголовок и текст рядом, скринридер её пропускает.
 * Появляется один раз, моргает раз в несколько секунд и при наведении; при prefers-reduced-motion — без движения.
 * Стоит справа от текста и смотрит влево, на текст и кнопки (позы search, empty-cart, not-found отражены).
 */
export function Mascot({ pose, size = 'md', eager = false, hover = true, className }: Props) {
  const { src, blink } = POSES[pose]
  const height = HEIGHT[size]
  const width = Math.round((src.width * height) / src.height)
  const loading = eager ? 'eager' : 'lazy'
  const classes = [styles.mascot, styles[size], hover && styles.hover, className]
    .filter(Boolean)
    .join(' ')
  return (
    <span className={classes} aria-hidden="true">
      <span className={styles.pose}>
        <Image
          src={src}
          alt=""
          width={width}
          height={height}
          loading={loading}
          className={styles.figure}
        />
        {blink && (
          <Image
            src={blink}
            alt=""
            width={width}
            height={height}
            loading={loading}
            className={styles.blink}
          />
        )}
      </span>
    </span>
  )
}
