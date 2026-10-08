import type { ButtonHTMLAttributes } from 'react'
import styles from './AdminButton.module.css'

/** Кнопка для собственных страниц админки, в оформлении самой админки. */
export function AdminButton({
  secondary,
  className,
  type = 'button',
  ...rest
}: { secondary?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = [styles.button, secondary && styles.secondary, className].filter(Boolean).join(' ')
  return <button type={type} className={cls} {...rest} />
}
