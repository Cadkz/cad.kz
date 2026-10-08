import Catalog from '@/components/Catalog'
export default function Home() {
  return (
    <main className="legacy">
      <section className="hero">
        <div>
          <p className="eyebrow">ИНЖЕНЕРНЫЕ РЕШЕНИЯ В КАЗАХСТАНЕ</p>
          <h1>
            От вашей задачи
            <br />к точному решению.
          </h1>
          <p>
            Программное обеспечение, оборудование и знания
            <br />
            для тех, кто проектирует будущее.
          </p>
          <a className="button" href="#catalog">
            Найти решение ↗
          </a>
        </div>
        <div className="hero-card">
          <span>CAD / BIM / GIS</span>
          <div className="geometry" aria-hidden="true">
            ◇
          </div>
          <p>
            Проектируйте.
            <br />
            Рассчитывайте.
            <br />
            Создавайте.
          </p>
        </div>
      </section>
      <Catalog />
      <section id="consultant" className="consultant">
        <p className="eyebrow">ВАШ ИНЖЕНЕРНЫЙ КОНСУЛЬТАНТ</p>
        <h2>Начните с задачи</h2>
        <p>ИИ-консультант будет помогать с подбором, лицензиями и комплектациями круглосуточно.</p>
        <p>
          <strong>Пока не подключён.</strong> Доступен демонстрационный каталог с серверным расчётом
          учебных цен.
        </p>
      </section>
    </main>
  )
}
