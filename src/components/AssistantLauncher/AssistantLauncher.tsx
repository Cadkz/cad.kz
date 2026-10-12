'use client'

import { type Ref, useEffect, useState } from 'react'
import { Mascot } from '../Mascot/Mascot'
import styles from './AssistantLauncher.module.css'

/** Подсказка «Помочь с выбором?» — один раз за посещение, через несколько секунд после входа. */
const HINT_KEY = 'kadi-hint-shown'
const HINT_DELAY_MS = 6000
const HINT_SHOW_MS = 7000

function hintAlreadyShown() {
  try {
    return window.sessionStorage.getItem(HINT_KEY) === '1'
  } catch {
    return true
  }
}

function rememberHint() {
  try {
    window.sessionStorage.setItem(HINT_KEY, '1')
  } catch {
    // Хранилище закрыто (приватное окно) — подсказка просто покажется ещё раз.
  }
}

type Props = {
  open: boolean
  onClick: () => void
  ref?: Ref<HTMLButtonElement>
}

/**
 * Кади в правом нижнем углу экрана — кнопка ИИ-консультанта.
 * Сидит и моргает; при наведении или фокусе машет лапой и показывает «Спросить Кади»;
 * при нажатии пружинит. Один раз за посещение сам машет и спрашивает «Помочь с выбором?».
 * Пока окно чата открыто, Кади прячется: окно стоит на его месте.
 * На телефоне со строкой подбора внизу поднимается над ней.
 */
export function AssistantLauncher({ open, onClick, ref }: Props) {
  const [hint, setHint] = useState(false)

  useEffect(() => {
    if (open || hintAlreadyShown()) return
    let hide: ReturnType<typeof setTimeout> | undefined
    const show = setTimeout(() => {
      rememberHint()
      setHint(true)
      hide = setTimeout(() => setHint(false), HINT_SHOW_MS)
    }, HINT_DELAY_MS)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [open])

  return (
    <button
      ref={ref}
      type="button"
      className={styles.launcher}
      data-open={open}
      data-hint={hint && !open}
      aria-label="Спросить Кади — ИИ-помощник CAD.kz"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => {
        setHint(false)
        onClick()
      }}
    >
      <span className={styles.bubble} aria-hidden="true">
        {hint ? 'Помочь с выбором?' : 'Спросить Кади'}
      </span>
      <span className={styles.cat}>
        <Mascot pose="neutral" size="launcher" eager hover={false} className={styles.sit} />
        <Mascot pose="greeting" size="launcher" eager hover={false} className={styles.wave} />
      </span>
    </button>
  )
}
