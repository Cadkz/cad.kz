'use client'

import { Check, ShoppingCart } from 'lucide-react'
import type { Action } from '@/domain/buyScenario.mjs'
import { requestNeedsChoice } from '@/domain/pickerRequest.mjs'
import { usePickerCart } from '@/lib/usePickerCart'
import { Button, ButtonLink } from '../Button/Button'
import { usePickerContext } from '../PickerProvider/PickerProvider'

type Props = {
  action: Action
  variant: 'primary' | 'outline' | 'text'
}

/**
 * Одна кнопка итога по сценарию покупки: корзина (после нажатия — «В корзине — оформить»),
 * заявка нужного вида (окно «Как связаться», подпись кнопки уходит менеджеру) или переход
 * к блоку страницы.
 */
export function PickerAction({ action, variant }: Props) {
  const { lines, openRequest, view, meta } = usePickerContext()
  const { canAdd, added, addToCart } = usePickerCart()
  const size = variant === 'text' ? 'sm' : 'md'
  const block = variant !== 'text'
  if (action.type === 'anchor')
    return (
      <ButtonLink href={action.href} variant={variant} size={size} block={block}>
        {action.label}
      </ButtonLink>
    )
  if (action.type === 'cart')
    return added ? (
      <ButtonLink href="/cart" block={block} size={size} variant="secondary">
        <Check size={20} strokeWidth={1.75} aria-hidden="true" />В корзине — оформить
      </ButtonLink>
    ) : (
      <Button block={block} size={size} variant={variant} disabled={!canAdd} onClick={addToCart}>
        <ShoppingCart size={20} strokeWidth={1.75} aria-hidden="true" />
        {action.label}
      </Button>
    )
  const needsChoice = requestNeedsChoice(
    action.kind,
    view.steps.length > 0,
    Boolean(meta.familySlug),
  )
  return (
    <Button
      block={block}
      size={size}
      variant={variant}
      disabled={needsChoice && !lines.length}
      onClick={() => openRequest(action.kind, action.label)}
    >
      {action.label}
    </Button>
  )
}
