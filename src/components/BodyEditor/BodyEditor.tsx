'use client'

import { FieldError, useField } from '@payloadcms/ui'
import type { TextareaFieldClientComponent } from 'payload'
import { useId, useState } from 'react'
import { htmlToMarkup, markupToHtml } from '@/domain/bodyHtml.mjs'
import { VisualEditor } from '../VisualEditor/VisualEditor'
import styles from './BodyEditor.module.css'

type Mode = 'visual' | 'html'

/**
 * Поле «Текст» публикаций и страниц (решение владельца 15.10.2026, как «Детальное описание»
 * в Битриксе): визуальный редактор и режим HTML. Хранится разметкой сайта, HTML на сайт не
 * попадает: из любого HTML остаются абзацы, заголовки, списки, ссылки, картинки, видео, таблицы.
 */
export const BodyEditor: TextareaFieldClientComponent = ({ path, field, readOnly }) => {
  const { value, setValue, showError } = useField<string>({ path })
  const [mode, setMode] = useState<Mode>('visual')
  const [html, setHtml] = useState('')
  const htmlId = useId()
  const markup = value ?? ''

  const switchTo = (next: Mode) => {
    if (next === 'html') setHtml(markupToHtml(markup))
    setMode(next)
  }

  const label = typeof field.label === 'string' ? field.label : 'Текст'
  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <fieldset className={styles.tabs}>
          <legend className={styles.hidden}>Режим редактора</legend>
          {(
            [
              ['visual', 'Визуальный редактор'],
              ['html', 'HTML'],
            ] as const
          ).map(([key, title]) => (
            <button
              key={key}
              type="button"
              className={styles.tab}
              aria-pressed={mode === key}
              onClick={() => switchTo(key)}
            >
              {title}
            </button>
          ))}
        </fieldset>
      </div>
      <FieldError path={path} showError={showError} />
      {mode === 'visual' ? (
        <VisualEditor value={markup} onChange={setValue} readOnly={readOnly} />
      ) : (
        <>
          <label htmlFor={htmlId} className={styles.hidden}>
            {label} в HTML
          </label>
          <textarea
            id={htmlId}
            className={styles.source}
            value={html}
            readOnly={readOnly}
            spellCheck={false}
            onChange={(event) => {
              setHtml(event.target.value)
              setValue(htmlToMarkup(event.target.value))
            }}
          />
        </>
      )}
      <p className={styles.hint}>
        {mode === 'visual'
          ? 'Разделы (H2) попадают в оглавление статьи — не больше пяти. Текст из Word и с сайтов вставляется без шрифтов и цветов: на сайте у текста единый вид. Картинку можно перетащить или вставить из буфера.'
          : 'Можно вставить HTML с другого сайта или из Битрикса. Сохранится только то, что сайт умеет показать: абзацы, заголовки h2/h3, списки, выноски (blockquote), ссылки, картинки, видео (iframe YouTube, Rutube, VK, Vimeo) и таблицы.'}
      </p>
    </div>
  )
}
