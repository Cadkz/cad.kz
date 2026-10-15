'use client'

import { videoEmbed } from '@/domain/video.mjs'
import { EditorPrompt } from '../EditorPrompt/EditorPrompt'

export type InsertKind = 'link' | 'video'

const PROMPTS = {
  link: {
    label: 'Адрес ссылки',
    placeholder: 'https://… или /catalog/…',
    hint: 'Ссылка встанет на выделенный текст; без выделения вставится сам адрес.',
    check: (url: string) =>
      /^(https?:\/\/|\/|mailto:|tel:)\S+$/i.test(url)
        ? null
        : 'Адрес начинается с https://, / (страница этого сайта), mailto: или tel:',
  },
  video: {
    label: 'Ссылка на видео',
    placeholder: 'https://www.youtube.com/watch?v=… или https://rutube.ru/video/…',
    hint: 'Скопируйте адрес ролика из браузера. На сайте будет плеер на всю ширину текста.',
    check: (url: string) =>
      videoEmbed(url) ? null : 'Нужна ссылка на ролик YouTube, Rutube, VK Видео или Vimeo.',
  },
} satisfies Record<
  InsertKind,
  { label: string; placeholder: string; hint: string; check: (url: string) => string | null }
>

type Props = { kind: InsertKind; onSubmit: (url: string) => void; onCancel: () => void }

/** Строка ввода адреса ссылки или видео в редакторе текста. */
export function EditorInsertPrompt({ kind, onSubmit, onCancel }: Props) {
  return <EditorPrompt key={kind} {...PROMPTS[kind]} onSubmit={onSubmit} onCancel={onCancel} />
}
