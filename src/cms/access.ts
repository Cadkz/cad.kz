import type { Access } from 'payload'

/** Только администратор. */
export const isAdmin: Access = ({ req }) => req.user?.role === 'admin'

/** Администратор или редактор (маркетолог). */
export const isEditor: Access = ({ req }) =>
  req.user?.role === 'admin' || req.user?.role === 'editor'

/** Гости видят только опубликованное, вошедшие пользователи — всё. */
export const publishedOrSignedIn: Access = ({ req }) =>
  req.user ? true : { status: { equals: 'published' } }

export const nobody: Access = () => false
export const everyone: Access = () => true
