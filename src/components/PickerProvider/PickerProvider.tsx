'use client'

import { createContext, type ReactNode, useContext, useState } from 'react'
import type { Scenario } from '@/domain/buyScenario.mjs'
import type { PickerView } from '@/domain/picker.mjs'
import { requestLines } from '@/domain/pickerRequest.mjs'
import { type KindProfile, kindProfile } from '@/domain/productKind.mjs'
import type { RequestKind } from '@/domain/siteRequest.mjs'
import type { Contacts } from '@/lib/navigation'
import type { PickTarget } from '@/lib/product'
import { type PickerApi, usePicker } from '@/lib/usePicker'
import { RequestDialog } from '../RequestDialog/RequestDialog'

export type PickerMeta = {
  productId: number
  productTitle: string
  /** Подпись кнопки продления; пусто — кнопки нет. */
  renewLabel: string | null
  /** Тип товара: от него зависят подписи (лицензии, участники) и главное действие. */
  kind?: string | null
  /** Страница семейства: корзины нет, только «Получить КП». */
  familySlug?: string | null
  /** Сценарий покупки и признаки страницы для кнопок итога (src/domain/buyScenario.mjs). */
  scenario?: Scenario
  demo?: boolean
  /** Под товаром есть «С этим покупают» и описание: ссылки-якоря у оборудования и курсов. */
  picks?: boolean
  about?: boolean
  contacts: Pick<Contacts, 'phones' | 'whatsappHref' | 'email'>
}

type ContextValue = PickerApi & {
  view: PickerView
  meta: PickerMeta
  profile: KindProfile
  /** Открыть окно заявки; button — подпись нажатой кнопки, уходит менеджеру в Битрикс24. */
  openRequest: (kind: RequestKind, button?: string) => void
}

const Context = createContext<ContextValue | null>(null)

type Props = { view: PickerView; meta: PickerMeta; pick: PickTarget | null; children: ReactNode }

/**
 * Общий выбор для страницы товара: шаги подбора в основной колонке и итог в боковой видят одно
 * состояние. Здесь же окно «Как связаться» для запроса цены, продления и помощи с выбором.
 */
export function PickerProvider({ view, meta, pick, children }: Props) {
  const api = usePicker(view, pick)
  const [request, setRequest] = useState<{ kind: RequestKind; button: string } | null>(null)
  const openRequest = (kind: RequestKind, button?: string) =>
    setRequest({ kind, button: button ?? '' })
  return (
    <Context.Provider value={{ ...api, view, meta, profile: kindProfile(meta.kind), openRequest }}>
      {children}
      <RequestDialog
        kind={request?.kind ?? null}
        button={request?.button ?? ''}
        onClose={() => setRequest(null)}
        pageTitle={meta.productTitle}
        pageProductId={meta.productId}
        familySlug={meta.familySlug ?? null}
        quantity={api.quantity}
        choices={view.switches.map((sw) => ({
          title: sw.title,
          value: api.state.switches[sw.key] ?? '',
        }))}
        lines={requestLines(
          api.lines.map((line) => ({
            productId: line.item.productId,
            offerId: line.offer?.id ?? null,
            label: line.item.label,
            detail: null,
          })),
          meta.productId,
          meta.productTitle,
          view.steps.length > 0,
          Boolean(meta.familySlug),
        )}
        contacts={meta.contacts}
      />
    </Context.Provider>
  )
}

export function usePickerContext() {
  const value = useContext(Context)
  if (!value) throw new Error('PickerProvider is required')
  return value
}
