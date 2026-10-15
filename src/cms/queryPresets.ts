import type { Config } from 'payload'
import { isEditor } from './access'

/** Подписи стандартных вариантов доступа Payload — по-русски. */
const CONSTRAINT_LABELS: Record<string, string> = {
  everyone: 'Все',
  onlyMe: 'Только я',
  specificUsers: 'Выбранные люди',
  admins: 'Только администратор',
}

/**
 * Виды списков (Query Presets): сохранённые фильтр и колонки у товаров, предложений и публикаций.
 * Сохраняют и видят администратор и маркетолог. Свой вид — «Только я» или для всех; готовые
 * виды сайта (src/domain/presetSeed.mjs) видят все, а менять и удалять их может администратор.
 */
export const queryPresets: NonNullable<Config['queryPresets']> = {
  labels: { singular: 'Вид списка', plural: 'Виды списков' },
  access: { read: isEditor, create: isEditor, update: isEditor, delete: isEditor },
  constraints: {
    update: [
      {
        label: CONSTRAINT_LABELS.admins,
        value: 'admins',
        access: ({ req }) => req.user?.role === 'admin',
      },
    ],
    delete: [
      {
        label: CONSTRAINT_LABELS.admins,
        value: 'admins',
        access: ({ req }) => req.user?.role === 'admin',
      },
    ],
  },
  filterConstraints: ({ options }) =>
    options.map((option) =>
      typeof option === 'string'
        ? { label: CONSTRAINT_LABELS[option] ?? option, value: option }
        : { ...option, label: CONSTRAINT_LABELS[option.value] ?? option.label },
    ),
}
