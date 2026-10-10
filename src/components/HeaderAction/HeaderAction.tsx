import Link from 'next/link'
import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import styles from './HeaderAction.module.css'

type Common = {
  icon: ReactNode
  /** Подпись рядом со значком (от 960 px). Без неё — только значок, название в aria-label. */
  label?: string
  /** Название для экранного диктора, если подписи нет или она короче смысла. */
  ariaLabel?: string
  /** Число на значке (корзина). */
  badge?: ReactNode
  /** Цвет значка: обычный или зелёный WhatsApp. */
  tone?: 'default' | 'whatsapp'
  /** Скрыть от ширины: sm — от 640 px (лупа), md — от 960 px (меню). Правило здесь, а не у
   *  родителя: порядок CSS-файлов в сборке не гарантирован, а специфичность у них одна. */
  hideFrom?: 'sm' | 'md'
  className?: string
}

type AsLink = Common & { href: string; external?: boolean }
type AsButton = Common &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
    href?: undefined
    ref?: Ref<HTMLButtonElement>
  }

/**
 * Кнопка шапки: значок и, от 960 px, подпись. Без рамки и заливки — фон появляется только
 * при наведении и нажатии, поэтому шапка не превращается в ряд белых капсул.
 */
export function HeaderAction(props: AsLink | AsButton) {
  const { icon, label, ariaLabel, badge, tone = 'default', hideFrom, className } = props
  const hide = hideFrom === 'sm' ? styles.hideFromSm : hideFrom === 'md' ? styles.hideFromMd : null
  const cls = [styles.action, label && styles.labelled, styles[tone], hide, className]
    .filter(Boolean)
    .join(' ')
  const content = (
    <>
      <span className={styles.icon}>
        {icon}
        {badge}
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </>
  )
  if (props.href !== undefined) {
    if (props.external)
      return (
        <a
          href={props.href}
          className={cls}
          aria-label={ariaLabel}
          target="_blank"
          rel="noreferrer"
        >
          {content}
        </a>
      )
    return (
      <Link href={props.href} className={cls} aria-label={ariaLabel}>
        {content}
      </Link>
    )
  }
  const {
    icon: _icon,
    label: _label,
    ariaLabel: _aria,
    badge: _badge,
    tone: _tone,
    hideFrom: _hide,
    className: _class,
    ref,
    type = 'button',
    ...rest
  } = props
  return (
    <button ref={ref} type={type} className={cls} aria-label={ariaLabel} {...rest}>
      {content}
    </button>
  )
}
