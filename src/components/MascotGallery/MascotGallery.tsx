import { Grid } from '../Grid/Grid'
import { Mascot, type MascotPose, type MascotSize } from '../Mascot/Mascot'
import styles from './MascotGallery.module.css'

type Item = { pose: MascotPose; size: MascotSize; title: string; where: string }

/** Позы Кадди с тем размером, в каком они стоят (или будут стоять) на сайте. */
const ITEMS: Item[] = [
  { pose: 'not-found', size: 'lg', title: 'С чертежом', where: 'Страница 404' },
  { pose: 'empty-cart', size: 'md', title: 'С коробкой', where: 'Пустая корзина' },
  {
    pose: 'search',
    size: 'md',
    title: 'С лупой',
    where: 'Поиск без результатов, фильтр каталога без товаров',
  },
  { pose: 'think', size: 'md', title: 'Думает', where: 'ИИ-консультант: ожидание ответа' },
  { pose: 'laptop', size: 'md', title: 'С ноутбуком', where: 'ИИ-консультант: работает' },
  { pose: 'loaf', size: 'md', title: 'Буханка', where: 'ИИ-консультант: кнопка в углу от 640 px' },
  {
    pose: 'loaf-wave',
    size: 'md',
    title: 'Буханка машет',
    where: 'ИИ-консультант: наведение и подсказка',
  },
  { pose: 'grumpy', size: 'md', title: 'Недовольный', where: 'Чат открыли 3 раза за 8 с' },
  { pose: 'tangled', size: 'md', title: 'В нитках', where: '«Запутались в комплектациях?»' },
  { pose: 'yarn', size: 'md', title: 'С клубком', where: 'Запас, пока не выводится' },
  { pose: 'greeting', size: 'md', title: 'Приветствие', where: 'Запас (была кнопка в углу)' },
  { pose: 'neutral', size: 'md', title: 'Спокойный', where: 'Запас, пока не выводится' },
  { pose: 'success', size: 'md', title: 'Доволен', where: 'После заявки — при запуске' },
  {
    pose: 'head',
    size: 'avatar',
    title: 'Голова',
    where: 'Шапка окна чата; кнопка в шапке сайта на телефоне',
  },
]

/** Служебная витрина поз Кадди для демоверсии: проверить вид и моргание. */
export function MascotGallery() {
  return (
    <Grid as="ul" span={{ base: 12, sm: 6, md: 4 }} className={styles.list}>
      {ITEMS.map((item) => (
        <li key={item.pose} className={styles.item}>
          <div className={styles.stage}>
            <Mascot pose={item.pose} size={item.size} />
          </div>
          <p className={styles.title}>{item.title}</p>
          <p className={styles.where}>{item.where}</p>
        </li>
      ))}
    </Grid>
  )
}
