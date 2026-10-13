import styles from './RenewSteps.module.css'

const steps = [
  { title: 'Заявка', text: 'Выберите программу и оставьте телефон — остальное уточним сами.' },
  { title: 'Проверка', text: 'Менеджер сверит лицензию и предложит вариант продления.' },
  { title: 'Счёт', text: 'Пришлём счёт на организацию или частное лицо.' },
  { title: 'Ключ', text: 'После оплаты продлим лицензию и поможем с установкой.' },
]

/** Как проходит продление: четыре шага в правой колонке страницы «Продление лицензий». */
export function RenewSteps() {
  return (
    <section className={styles.box} aria-labelledby="renew-steps-title">
      <h2 id="renew-steps-title" className={styles.title}>
        Как проходит продление
      </h2>
      <ol className={styles.list}>
        {steps.map((step) => (
          <li key={step.title} className={styles.step}>
            <span className={styles.name}>{step.title}</span>
            <span className={styles.text}>{step.text}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
