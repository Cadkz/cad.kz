import type { Access } from 'payload'

/** Только администратор. */
export const isAdmin: Access = ({ req }) => req.user?.role === 'admin'

/** Администратор или редактор (маркетолог). */
export const isEditor: Access = ({ req }) =>
  req.user?.role === 'admin' || req.user?.role === 'editor'

/** Администратор или менеджер по продажам: видят заказы, только чтение. */
export const canReadOrders: Access = ({ req }) =>
  req.user?.role === 'admin' || req.user?.role === 'manager'

/** Гости видят только опубликованное, вошедшие пользователи — всё. */
export const publishedOrSignedIn: Access = ({ req }) =>
  req.user ? true : { status: { equals: 'published' } }

export const nobody: Access = () => false
export const everyone: Access = () => true

/** Администратор видит всех, остальные только свою учётную запись. */
export const adminOrSelf: Access = ({ req }) => {
  if (req.user?.role === 'admin') return true
  return req.user ? { id: { equals: req.user.id } } : false
}
