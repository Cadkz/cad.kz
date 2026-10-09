'use client'

import { useCartQuote } from '@/lib/useCartQuote'
import { useCheckout } from '@/lib/useCheckout'
import { useCart } from '../CartProvider/CartProvider'
import { CheckoutDone } from '../CheckoutDone/CheckoutDone'
import { CheckoutForm } from '../CheckoutForm/CheckoutForm'
import { EmptyCart } from '../EmptyCart/EmptyCart'
import { OrderSummary } from '../OrderSummary/OrderSummary'
import styles from './CheckoutView.module.css'

/** Оформление заказа: сводка, форма и результат. Цену подтверждает только сервер. */
export function CheckoutView() {
  const { items, ready } = useCart()
  const { quote, setQuote, error, busy, retry } = useCartQuote(items, ready)
  const checkout = useCheckout(quote, setQuote)

  if (!ready) return <EmptyCart loading />
  if (checkout.done) return <CheckoutDone order={checkout.done} />
  if (!items.length) return <EmptyCart />

  return (
    <div className={styles.layout}>
      <div className={styles.summary}>
        <OrderSummary quote={quote} busy={busy} error={error} onRetry={retry} />
      </div>
      <div className={styles.form}>
        <CheckoutForm
          sending={checkout.sending}
          canSubmit={Boolean(quote) && !busy}
          confirmPrice={Boolean(checkout.priceNotice)}
          serverErrors={checkout.serverErrors}
          formError={checkout.formError}
          priceNotice={checkout.priceNotice}
          onSubmit={checkout.submit}
        />
      </div>
    </div>
  )
}
