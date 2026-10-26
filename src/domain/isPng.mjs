/**
 * PNG ли файл из «Медиа»: по типу, а если тип не записан — по расширению имени.
 * @param {{ mimeType?: string | null, filename?: string | null }} media
 */
export function isPng(media) {
  if (media.mimeType) return media.mimeType === 'image/png'
  return /\.png$/i.test(media.filename ?? '')
}
