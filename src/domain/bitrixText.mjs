// Описание товара из Битрикса (HTML) в простую разметку поля «Описание» нового сайта
// (src/lib/richText.ts): пустая строка — новый абзац, «## » — подзаголовок, «- » — пункт списка.
// Картинки, видео, стили и ссылки из старого HTML не переносятся: остаётся текст.
import { decodeEntities } from './bitrixFiles.mjs'

const BLOCK_BREAK = '\n\n'

/** Строчные теги (жирный, ссылка…) убираются без пробела, чтобы не было «САПР .». */
const INLINE_TAGS = /<\/?(a|b|strong|i|em|u|s|span|font|sup|sub|small|mark|abbr)\b[^>]*>/gi

/** Текст внутри тега без вложенной разметки, в одну строку. */
const inline = (html) =>
  decodeEntities(
    String(html)
      .replace(INLINE_TAGS, '')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim()

export function htmlToMarkup(html) {
  const source = String(html ?? '')
  if (!source.trim()) return ''
  const text = source
    .replace(/<(script|style|iframe|noscript)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(INLINE_TAGS, '')
    // Переносы строк в исходном HTML ничего не значат: значение имеют только теги.
    .replace(/[\r\n]+/g, ' ')
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_, inner) => {
      const title = inline(inner)
      return title ? `${BLOCK_BREAK}## ${title}${BLOCK_BREAK}` : BLOCK_BREAK
    })
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, inner) => {
      const item = inline(inner)
      return item ? `\n- ${item}\n` : ''
    })
    .replace(/<\/?(ul|ol)[^>]*>/gi, BLOCK_BREAK)
    .replace(/<\/t[dh]>/gi, ' — ')
    .replace(/<\/?(p|div|table|tbody|thead|tr|section|article|blockquote)[^>]*>/gi, BLOCK_BREAK)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')

  return (
    decodeEntities(text)
      .split('\n')
      .map((line) =>
        line
          .replace(/[ \t ]+/g, ' ')
          .replace(/( — )+$/, '')
          .replace(/^( — )+/, '')
          .trim(),
      )
      .join('\n')
      // Пункты списка, стоящие подряд, — один список; от соседнего текста — пустая строка.
      .replace(/^(- .*)\n{2,}(?=- )/gm, '$1\n')
      .replace(/^(- .*)\n(?!- |\n)/gm, `$1${BLOCK_BREAK}`)
      .replace(/^((?!- ).+)\n(?=- )/gm, `$1${BLOCK_BREAK}`)
      .replace(/\n{3,}/g, BLOCK_BREAK)
      .trim()
  )
}
