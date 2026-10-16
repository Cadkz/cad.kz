import Image, { type StaticImageData } from 'next/image'
import blueprint from '../../../public/images/mascot/kaddi-blueprint.png'
import blueprintBlink from '../../../public/images/mascot/kaddi-blueprint-blink.png'
import emptyCart from '../../../public/images/mascot/kaddi-empty-cart.png'
import emptyCartBlink from '../../../public/images/mascot/kaddi-empty-cart-blink.png'
import greeting from '../../../public/images/mascot/kaddi-greeting.png'
import grumpy from '../../../public/images/mascot/kaddi-grumpy.png'
import grumpyBlink from '../../../public/images/mascot/kaddi-grumpy-blink.png'
import head from '../../../public/images/mascot/kaddi-head.png'
import headBlink from '../../../public/images/mascot/kaddi-head-blink.png'
import laptop from '../../../public/images/mascot/kaddi-laptop.png'
import laptopBlink from '../../../public/images/mascot/kaddi-laptop-blink.png'
import loaf from '../../../public/images/mascot/kaddi-loaf.png'
import loafBlink from '../../../public/images/mascot/kaddi-loaf-blink.png'
import loafWave from '../../../public/images/mascot/kaddi-loaf-wave.png'
import loafWaveBlink from '../../../public/images/mascot/kaddi-loaf-wave-blink.png'
import neutral from '../../../public/images/mascot/kaddi-neutral.png'
import neutralBlink from '../../../public/images/mascot/kaddi-neutral-blink.png'
import notFound from '../../../public/images/mascot/kaddi-not-found.png'
import notFoundBlink from '../../../public/images/mascot/kaddi-not-found-blink.png'
import search from '../../../public/images/mascot/kaddi-search.png'
import searchBlink from '../../../public/images/mascot/kaddi-search-blink.png'
import success from '../../../public/images/mascot/kaddi-success.png'
import tangled from '../../../public/images/mascot/kaddi-tangled.png'
import tangledBlink from '../../../public/images/mascot/kaddi-tangled-blink.png'
import think from '../../../public/images/mascot/kaddi-think.png'
import thinkBlink from '../../../public/images/mascot/kaddi-think-blink.png'
import yarn from '../../../public/images/mascot/kaddi-yarn.png'
import yarnBlink from '../../../public/images/mascot/kaddi-yarn-blink.png'
import styles from './Mascot.module.css'

/**
 * Позы Кадди. blink — слой того же размера, где видны только закрытые глаза:
 * кладётся поверх и на мгновение проявляется (моргание).
 * think (думает) и laptop (с ноутбуком) смотрят вправо — только для окна ИИ-консультанта,
 * где Кадди слева от сообщений; на страницы справа от текста их не ставить.
 * blueprint (сидит в каске с чертежами, смотрит влево) — Кадди-консультант в углу экрана
 * (с 13.10.2026, вечер); loaf (буханка) и loaf-wave (лёжа машет лапой) — прежний угол, в запасе;
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
  blueprint: { src: blueprint, blink: blueprintBlink },
} satisfies Record<string, { src: StaticImageData; blink: StaticImageData | null }>

export type MascotPose = keyof typeof POSES
export type MascotSize = 'head' | 'icon' | 'avatar' | 'launcher' | 'xs' | 'sm' | 'md' | 'lg'

/** Наибольшая высота показа в px — как токены --icon-box, --mascot-*; по ней браузер берёт файл 1x/2x. */
const HEIGHT: Record<MascotSize, number> = {
  head: 32,
  icon: 40,
  avatar: 64,
  launcher: 96,
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
  /**
   * Участвует в правиле «на экране один Кадди» (KaddiStage): пока виден другой Кадди, этот прячется.
   * По умолчанию — все Кадди страниц, кроме головы-значка в кнопках. false — Кадди окна чата,
   * угла экрана (их показ решают сами окно и кнопка) и витрины поз /kaddi.
   */
  stage?: boolean
  className?: string
}

/**
 * Кадди — персонаж CAD.kz для пустых состояний и будущего ИИ-консультанта.
 * Картинка декоративная: смысл несут заголовок и текст рядом, скринридер её пропускает.
 * Появляется один раз, моргает раз в несколько секунд и при наведении; при prefers-reduced-motion — без движения.
 * Стоит справа от текста и смотрит влево, на текст и кнопки (позы search, empty-cart, not-found отражены).
 */
export function Mascot({
  pose,
  size = 'md',
  eager = false,
  hover = true,
  stage = pose !== 'head',
  className,
}: Props) {
  const { src, blink } = POSES[pose]
  const height = HEIGHT[size]
  const width = Math.round((src.width * height) / src.height)
  const loading = eager ? 'eager' : 'lazy'
  const classes = [styles.mascot, styles[size], hover && styles.hover, className]
    .filter(Boolean)
    .join(' ')
  return (
    <span className={classes} aria-hidden="true" data-kaddi={stage ? 'stage' : undefined}>
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
