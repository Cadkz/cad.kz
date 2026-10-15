'use client'

import { FieldError, TextInput, useDocumentInfo, useField, useFormFields } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'
import { type ChangeEvent, useEffect, useRef } from 'react'
import { slugFromTitle } from '@/domain/slug.mjs'
import { newsHref } from '@/lib/navigationHrefs'
import styles from './SlugField.module.css'

/**
 * Адрес публикации в админке, как «Символьный код» в Битриксе: у новой публикации сам
 * набирается из названия, пока его не правят руками. У сохранённой не меняется сам — иначе
 * старые ссылки на неё перестанут открываться.
 */
export const SlugField: TextFieldClientComponent = ({ path, field, readOnly }) => {
  const { value, setValue, showError } = useField<string>({ path })
  const title = useFormFields(([fields]) => fields.title?.value)
  const { id } = useDocumentInfo()
  // Сохранённая публикация или адрес правили руками — за названием больше не следим.
  const manual = useRef(Boolean(id))
  const fromTitle = slugFromTitle(typeof title === 'string' ? title : '')

  useEffect(() => {
    if (!manual.current && fromTitle !== (value ?? '')) setValue(fromTitle)
  }, [fromTitle, value, setValue])

  const label = typeof field.label === 'string' ? field.label : 'Адрес'
  return (
    <div className={styles.root}>
      <TextInput
        path={path}
        label={label}
        required
        readOnly={readOnly}
        value={value ?? ''}
        showError={showError}
        Error={<FieldError path={path} showError={showError} />}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          manual.current = true
          setValue(event.target.value)
        }}
      />
      <p className={styles.hint}>
        {value ? `Адрес на сайте: ${newsHref(value)}` : 'Заполнится из названия.'}{' '}
        {id
          ? 'Если поменять адрес, старые ссылки на публикацию перестанут открываться.'
          : 'Набирается сам из названия, можно поправить.'}
      </p>
      {!readOnly && value !== fromTitle && fromTitle && (
        <button
          type="button"
          className={styles.link}
          onClick={() => {
            manual.current = true
            setValue(fromTitle)
          }}
        >
          Сделать из названия
        </button>
      )}
    </div>
  )
}
