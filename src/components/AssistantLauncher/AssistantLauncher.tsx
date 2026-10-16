'use client'

import { type MouseEvent, useEffect, useState } from 'react'
import { Mascot } from '../Mascot/Mascot'
import styles from './AssistantLauncher.module.css'

/** Подсказка «Помочь с выбором?» — один раз за посещение, через несколько секунд после входа. */
const HINT_KEY = 'kaddi-hint-shown'
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
  /** Чат только что часто открывали и закрывали — Кадди сидит недовольный. */
  grumpy: boolean
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
}

/**
 * Кадди с чертежами в правом нижнем углу экрана — кнопка ИИ-консультанта (от 640 px; на телефоне
 * Кадди — голова в шапке). Сидит в каске и моргает; при наведении моргает сразу и показывает
 * «Спросить Кадди», не двигаясь; при нажатии пружинит. Раз за посещение сам моргает и
 * спрашивает «Помочь с выбором?». Если чат дёргают (grumpy) — сидит недовольный.
 * Пока окно чата открыто, Кадди прячется: окно стоит на его месте.
 * Пока в экране Кадди страницы (KaddiStage — на экране один Кадди), съезжает вниз за край экрана.
 * Со строкой подбора внизу (до 960 px) поднимается над ней.
 */
export function AssistantLauncher({ open, grumpy, onClick }: Props) {
  const [hint, setHint] = useState(false)

  useEffect(() => {
    if (open || hintAlreadyShown()) return
    let hide: ReturnType<typeof setTimeout> | undefined
    let show: ReturnType<typeof setTimeout> | undefined
    const wait = () => {
      show = setTimeout(() => {
        // Кадди в углу сейчас уступил место Кадди страницы (KaddiStage) — спросим позже.
        if (document.documentElement.dataset.kaddiPage) return wait()
        rememberHint()
        setHint(true)
        hide = setTimeout(() => setHint(false), HINT_SHOW_MS)
      }, HINT_DELAY_MS)
    }
    wait()
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [open])

  return (
    <button
      type="button"
      className={styles.launcher}
      data-open={open}
      data-hint={hint && !open && !grumpy}
      data-grumpy={grumpy}
      aria-label="Спросить Кадди — ИИ-консультант CAD.kz"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={(event) => {
        setHint(false)
        onClick(event)
      }}
    >
      <span className={styles.bubble} aria-hidden="true">
        {grumpy ? 'Я никуда не убегаю' : hint ? 'Помочь с выбором?' : 'Спросить Кадди'}
      </span>
      <span className={styles.cat}>
        <Mascot pose="blueprint" size="launcher" eager stage={false} className={styles.rest} />
        <Mascot
          pose="grumpy"
          size="launcher"
          hover={false}
          stage={false}
          className={styles.grumpy}
        />
      </span>
    </button>
  )
}
