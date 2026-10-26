import { collectionInfo } from '@/domain/catalogPresentation.mjs'
import styles from './CollectionContents.module.css'

/** Единственное дополнение страницы товара: проверенный состав коллекции. */
export function CollectionContents({
  product,
}: {
  product: { title: string; slug: string; vendor: string | null }
}) {
  const collection = collectionInfo(product)
  if (!collection) return null
  return (
    <section className={styles.root} aria-label="Что входит в коллекцию">
      <h2>Что входит в коллекцию</h2>
      <p>{collection.summary} Это набор отдельных приложений в одной подписке.</p>
      <ul>
        {collection.included.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      <h3>Когда стоит выбрать набор</h3>
      <p>{collection.benefit}</p>
      <a href={collection.source} target="_blank" rel="noreferrer">
        Состав и условия на сайте Autodesk
      </a>
    </section>
  )
}
