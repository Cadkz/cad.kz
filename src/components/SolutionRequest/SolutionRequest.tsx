'use client'

import { MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { openAssistant } from '@/lib/openAssistant'
import { Button } from '../Button/Button'
import { Drawer } from '../Drawer/Drawer'
import { SolutionForm } from '../SolutionForm/SolutionForm'
import styles from './SolutionRequest.module.css'

type Props = {
  /** Надпись на кнопке (из админки «Главная страница»). */
  label: string
  directions: { slug: string; title: string }[]
  /** Номер WhatsApp (wa.me): запасной путь в той же панели, уже набранная задача уходит туда же. */
  whatsappHref: string | null
}

/**
 * Главная кнопка первого экрана («Подобрать по задаче»): открывает чат с Кадди. Если консультант
 * на сайте выключен — панель с короткой заявкой: клиент пишет задачу словами, менеджер подбирает
 * программы и перезванивает.
 */
export function SolutionRequest({ label, directions, whatsappHref }: Props) {
  const [open, setOpen] = useState(false)
  // Что человек уже написал в форме: переходит в WhatsApp, чтобы не набирать задачу заново.
  const [task, setTask] = useState('')
  const text = `Здравствуйте! Помогите подобрать программы. Моя задача: ${task.trim()}`
  return (
    <>
      <Button variant="light" onClick={() => openAssistant() || setOpen(true)}>
        <MessageCircle size={20} strokeWidth={1.75} aria-hidden="true" />
        {label}
      </Button>
      {open && (
        <Drawer open onClose={() => setOpen(false)} title={label}>
          <div className={styles.body}>
            <p className={styles.intro}>
              Опишите задачу своими словами — менеджер подберёт программы или оборудование,
              перезвонит и пришлёт предложение.
            </p>
            <SolutionForm directions={directions} onTaskChange={setTask} />
            {whatsappHref && (
              <p className={styles.alt}>
                Удобнее переписываться?{' '}
                <a
                  href={`${whatsappHref}?text=${encodeURIComponent(text)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.link}
                >
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
