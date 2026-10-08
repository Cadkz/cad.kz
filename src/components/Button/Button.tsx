import Link from 'next/link'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'outline' | 'light' | 'ghostDark' | 'text'
type Size = 'md' | 'sm'
type Common = { variant?: Variant; size?: Size; block?: boolean; children: ReactNode }

function classes(
  { variant = 'primary', size = 'md', block }: Omit<Common, 'children'>,
  extra?: string,
) {
  return [styles.button, styles[variant], styles[size], block && styles.block, extra]
    .filter(Boolean)
    .join(' ')
}

/** Кнопка действия. Варианты: primary (navy), secondary (голубая плашка), outline, light (белая на тёмном), ghostDark (полупрозрачная на тёмном), text (ссылка-кнопка). */
export function Button({
  variant,
  size,
  block,
  className,
  type = 'button',
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={classes({ variant, size, block }, className)} {...rest} />
}

/** То же оформление для ссылки. Внешние адреса открываются обычной ссылкой. */
export function ButtonLink({
  href,
  variant,
  size,
  block,
  className,
  children,
  external,
}: Common & { href: string; className?: string; external?: boolean }) {
  const cls = classes({ variant, size, block }, className)
  if (external || href.startsWith('http'))
    return (
      <a href={href} className={cls} target="_blank" rel="noreferrer">
        {children}
      </a>
    )
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  )
}
