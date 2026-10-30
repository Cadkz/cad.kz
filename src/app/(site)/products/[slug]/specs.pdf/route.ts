import { buildSpecSheet } from '@/lib/specSheet'

/**
 * «Скачать характеристики, PDF» со страницы оборудования (пожелание владельца 30.10.2026):
 * документ для закупок и тендеров собирается на сервере при каждом запросе — всегда с текущими
 * характеристиками, контактами и датой.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  try {
    const sheet = await buildSpecSheet(slug, new URL(request.url).origin)
    if (!sheet) return new Response('У этого товара нет характеристик для PDF', { status: 404 })
    return new Response(new Uint8Array(sheet.pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${sheet.fileName}"`,
        // Пять минут в браузере: правка характеристик в админке видна почти сразу.
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch (error) {
    console.error('PDF характеристик не собрался', slug, error)
    return new Response('Не получилось собрать PDF. Повторите позже.', { status: 500 })
  }
}
