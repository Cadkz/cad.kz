/**
 * Видео в тексте публикации (решение владельца 15.10.2026): ссылка на ролик YouTube, Rutube,
 * VK Видео или Vimeo отдельной строкой «![Видео](адрес)» — на сайте плеер. Плеер встраивается
 * только с этих сайтов: чужой адрес остаётся просто ссылкой и не выводится плеером.
 */

const YOUTUBE_ID = /^[\w-]{11}$/

/**
 * Адрес ролика → { watch, embed } (страница ролика и адрес плеера) или null.
 * @param {string | null | undefined} value
 */
export function videoEmbed(value) {
  let url
  try {
    url = new URL(String(value ?? '').trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  const host = url.hostname.replace(/^(www\.|m\.)/, '')
  const parts = url.pathname.split('/').filter(Boolean)

  if (host === 'youtu.be' || host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const id =
      host === 'youtu.be'
        ? parts[0]
        : parts[0] === 'watch'
          ? url.searchParams.get('v')
          : ['embed', 'shorts', 'live', 'v'].includes(parts[0] ?? '')
            ? parts[1]
            : null
    if (!id || !YOUTUBE_ID.test(id)) return null
    return {
      watch: `https://www.youtube.com/watch?v=${id}`,
      embed: `https://www.youtube-nocookie.com/embed/${id}`,
    }
  }

  if (host === 'rutube.ru') {
    const id =
      parts[0] === 'video' || parts[0] === 'shorts'
        ? parts[1]
        : parts[1] === 'embed'
          ? parts[2]
          : null
    if (!id || !/^[a-f0-9]{32}$/i.test(id)) return null
    return { watch: `https://rutube.ru/video/${id}/`, embed: `https://rutube.ru/play/embed/${id}` }
  }

  if (host === 'vk.com' || host === 'vkvideo.ru' || host === 'vk.ru') {
    if (parts[0] === 'video_ext.php') {
      const oid = url.searchParams.get('oid')
      const id = url.searchParams.get('id')
      if (!oid || !id || !/^-?\d+$/.test(oid) || !/^\d+$/.test(id)) return null
      const hash = url.searchParams.get('hash')
      const query = `oid=${oid}&id=${id}${hash && /^\w+$/.test(hash) ? `&hash=${hash}` : ''}`
      return {
        watch: `https://vkvideo.ru/video${oid}_${id}`,
        embed: `https://vk.com/video_ext.php?${query}`,
      }
    }
    const match = /^video(-?\d+)_(\d+)$/.exec(parts.at(-1) ?? '')
    if (!match) return null
    return {
      watch: `https://vkvideo.ru/video${match[1]}_${match[2]}`,
      embed: `https://vk.com/video_ext.php?oid=${match[1]}&id=${match[2]}`,
    }
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = parts.find((part) => /^\d+$/.test(part))
    if (!id) return null
    return { watch: `https://vimeo.com/${id}`, embed: `https://player.vimeo.com/video/${id}` }
  }
  return null
}
