import type { ElementType, ReactNode } from 'react'
import styles from './Container.module.css'

type Props = { as?: ElementType; className?: string; children: ReactNode; id?: string }

/** Рамка сайта: ровно --container или ширина экрана минус два --gutter. */
export function Container({ as: Tag = 'div', className, children, id }: Props) {
  return (
    <Tag id={id} className={className ? `${styles.container} ${className}` : styles.container}>
      {children}
    </Tag>
  )
}
