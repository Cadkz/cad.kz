'use client'

import { useEffect } from 'react'
import { pickStageKaddi } from '@/domain/kaddiStage.mjs'
import {
  ASSISTANT_STATE_EVENT,
  type AssistantStateDetail,
  assistantOpen,
} from '@/lib/openAssistant'

const SELECTOR = '[data-kaddi="stage"]'

/**
 * Кадди страницы считается в экране чуть раньше, чем въезжает снизу (на 20 % высоты экрана):
 * угловой Кадди успевает уйти до того, как страничный покажется.
 */
const ROOT_MARGIN = '0px 0px 20% 0px'

/**
 * Правило «на экране один Кадди» (решение владельца 16.10.2026, вечер; логика выбора —
 * `pickStageKaddi` в `src/domain/kaddiStage.mjs`). Следит за всеми Кадди страниц (Mascot со stage):
 * - окно чата открыто — все Кадди страницы прячутся (в окне свой Кадди);
 * - Кадди страницы в экране — <html data-kaddi-page> (Кадди в углу уходит вниз за край экрана),
 *   из нескольких в экране виден один: data-kaddi-shown="true", остальные "false";
 * - <html data-kaddi-stage="ready"> — первый расчёт сделан: до него угловой Кадди не показывается,
 *   чтобы на 404 или в пустой корзине он не выскакивал и тут же не убегал.
 * Новые Кадди после перехода по ссылке подхватываются сами (MutationObserver), ушедшие — забываются.
 */
export function KaddiStage() {
  useEffect(() => {
    const root = document.documentElement
    if (!('IntersectionObserver' in window)) {
      root.dataset.kaddiStage = 'ready'
      return
    }

    const tracked = new Set<HTMLElement>()
    const visible = new Set<HTMLElement>()
    let current: HTMLElement | null = null
    let chatOpen = assistantOpen()

    const update = () => {
      const inView = [...visible]
        .filter((el) => el.isConnected)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
      current = pickStageKaddi({ chatOpen, current, visible: inView })
      for (const el of tracked) el.dataset.kaddiShown = String(el === current)
      if (current) root.dataset.kaddiPage = 'true'
      else delete root.dataset.kaddiPage
      root.dataset.kaddiStage = 'ready'
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!(entry.target instanceof HTMLElement)) continue
          if (entry.isIntersecting) visible.add(entry.target)
          else visible.delete(entry.target)
        }
        update()
      },
      { rootMargin: ROOT_MARGIN },
    )

    const register = (el: Element, later: boolean) => {
      if (!(el instanceof HTMLElement) || tracked.has(el)) return
      tracked.add(el)
      // Появился после загрузки (пустая корзина, поиск) — прячем до расчёта, чтобы не мелькнул
      // вторым. Бывшие на странице с самого начала не трогаем: на первом кадре ничего не мигает.
      if (later) el.dataset.kaddiShown = 'false'
      io.observe(el)
    }

    const scan = (node: ParentNode, later: boolean) => {
      if (node instanceof Element && node.matches(SELECTOR)) register(node, later)
      for (const el of node.querySelectorAll(SELECTOR)) register(el, later)
    }

    const forget = () => {
      let changed = false
      for (const el of tracked) {
        if (el.isConnected) continue
        io.unobserve(el)
        tracked.delete(el)
        visible.delete(el)
        if (el === current) current = null
        changed = true
      }
      if (changed) update()
    }

    scan(document, false)
    // Кадди на странице нет — наблюдатель ничего не сообщит, угловой можно показывать сразу.
    if (tracked.size === 0) update()

    const mo = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) scan(node, true)
        }
      }
      if (records.some((record) => record.removedNodes.length > 0)) forget()
    })
    mo.observe(document.body, { childList: true, subtree: true })

    const onChat = (event: Event) => {
      const detail = (event as CustomEvent<AssistantStateDetail>).detail
      chatOpen = detail.open
      update()
    }
    window.addEventListener(ASSISTANT_STATE_EVENT, onChat)

    return () => {
      window.removeEventListener(ASSISTANT_STATE_EVENT, onChat)
      mo.disconnect()
      io.disconnect()
      delete root.dataset.kaddiPage
      delete root.dataset.kaddiStage
    }
  }, [])

  return null
}
