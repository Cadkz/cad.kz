'use client'

import { ListChecks } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../Button/Button'
import { Drawer } from '../Drawer/Drawer'
import { SolutionForm } from '../SolutionForm/SolutionForm'
import styles from './SolutionRequest.module.css'

type Props = {
  directions: { slug: string; title: string }[]
  /** Ссылка WhatsApp с уже набранным началом сообщения: запасной путь в той же панели. */
  whatsappHref: string | null
}

/**
 * Кнопка «Подобрать решение» на первом экране главной и панель с короткой заявкой:
 * клиент пишет задачу словами, менеджер подбирает программы и перезванивает.
 */
export function SolutionRequest({ directions, whatsappHref }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <ListChecks size={20} strokeWidth={1.75} aria-hidden="true" />
        Подобрать решение
      </Button>
      {open && (
        <Drawer open onClose={() => setOpen(false)} title="Подобрать решение">
          <div className={styles.body}>
            <p className={styles.intro}>
              Опишите задачу своими словами — менеджер подберёт программы или оборудование,
              перезвонит и пришлёт предложение.
            </p>
            <SolutionForm directions={directions} />
            {whatsappHref && (
              <p className={styles.alt}>
                Удобнее переписываться?{' '}
                <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.link}>
                  Напишите задачу в WhatsApp
                </a>
              </p>
            )}
          </div>
        </Drawer>
      )}
    </>
  )
}
