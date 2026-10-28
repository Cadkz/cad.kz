import sharp from 'sharp'
import { SCAN_OPTIONS, sketchfabId } from '@/domain/artecScans.mjs'
import { keyOutBackground, POSTER_SIZE } from '@/domain/scanPoster.mjs'

/**
 * Превью сканов Artec (28.10.2026): снимок плеера Sketchfab — того же, что открывается в окне
 * просмотра, — с вырезанным фоном, WebP 640 × 480. Собираются при сборке сайта, отдаются как
 * статика; других адресов нет. Так превью и окно выглядят одинаково, как на artec3d.com.
 */
export const dynamicParams = false

export function generateStaticParams() {
  return SCAN_OPTIONS.map(({ value }) => ({ file: `${value}.webp` }))
}

type Thumbnails = { thumbnails?: { images?: { width: number; url: string }[] } }

/** Самая крупная картинка не шире 1024 px. */
async function thumbnailUrl(model: string) {
  const response = await fetch(`https://api.sketchfab.com/v3/models/${model}`)
  if (!response.ok) throw new Error(`Sketchfab ${model}: ${response.status}`)
  const images = ((await response.json()) as Thumbnails).thumbnails?.images ?? []
  const best = images.filter((image) => image.width <= 1024).sort((a, b) => b.width - a.width)[0]
  if (!best) throw new Error(`Sketchfab ${model}: нет превью`)
  return best.url
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const model = sketchfabId(file.replace(/\.webp$/, ''))
  if (!model) return new Response('Нет такого скана', { status: 404 })

  const source = Buffer.from(await (await fetch(await thumbnailUrl(model))).arrayBuffer())
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const box = keyOutBackground(data, info.width, info.height)
  if (!box) throw new Error(`Sketchfab ${model}: модель на превью не найдена`)

  const { width, height, margin } = POSTER_SIZE
  const fitted = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .extract(box)
    .resize({
      width: Math.round(width * (1 - 2 * margin)),
      height: Math.round(height * (1 - 2 * margin)),
      fit: 'inside',
    })
    .png()
    .toBuffer({ resolveWithObject: true })
  const left = Math.floor((width - fitted.info.width) / 2)
  const top = Math.floor((height - fitted.info.height) / 2)
  const poster = await sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: fitted.data, left, top }])
    .webp({ quality: 82, alphaQuality: 90 })
    .toBuffer()

  return new Response(new Uint8Array(poster), {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
