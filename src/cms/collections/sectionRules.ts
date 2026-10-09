import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
} from 'payload'
import { applySectionRules } from '../../lib/sectionRules'
import { isAdmin, isEditor } from '../access'
import { textField } from '../fields'

/** Признак в context: правила записываются пачкой, пересчёт товаров — один раз в конце. */
export const SKIP_APPLY_CONTEXT = 'skipSectionRulesApply'

const reapply: CollectionAfterChangeHook & CollectionAfterDeleteHook = async ({ req, context }) => {
  if (context[SKIP_APPLY_CONTEXT]) return
  const report = await applySectionRules(req.payload, req)
  req.payload.logger.info(
    `Правила разделов применены: проверено ${report.checked}, изменено ${report.changed}, скрыто ${report.hidden}, без правила ${report.noRule}`,
  )
}

/**
 * Правила разделов: какой основной и дополнительные разделы получает товар.
 * Проверяются по порядку, срабатывает первое подходящее. После сохранения или удаления
 * правила товары с галочкой «Подбирать разделы по правилам» пересчитываются.
 */
export const sectionRules: CollectionConfig = {
  slug: 'section-rules',
  labels: { singular: 'Правило разделов', plural: 'Правила разделов' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'order', 'manufacturer', 'mainSection', 'retire'],
    description:
      'Новый товар (из импорта или созданный вручную) получает разделы по первому подходящему правилу. ' +
      'Правила проверяются по порядку — от меньшего числа к большему. Товары, у которых разделы ' +
      'поменяли вручную, правила не трогают.',
  },
  defaultSort: 'order',
  access: { read: isEditor, create: isEditor, update: isEditor, delete: isAdmin },
  hooks: { afterChange: [reapply], afterDelete: [reapply] },
  fields: [
    textField('title', 'Название правила', true),
    {
      name: 'order',
      label: 'Порядок проверки',
      type: 'number',
      required: true,
      defaultValue: 1000,
      admin: {
        description:
          'Меньше — проверяется раньше. Узкое правило (по словам в названии) ставьте раньше общего ' +
          'правила того же производителя.',
      },
    },
    {
      name: 'manufacturer',
      label: 'Производитель',
      type: 'relationship',
      relationTo: 'manufacturers',
      admin: { description: 'Пусто — любой производитель.' },
    },
    {
      name: 'kind',
      label: 'Тип товара',
      type: 'select',
      options: [
        { label: 'Программное обеспечение', value: 'software' },
        { label: 'Оборудование', value: 'hardware' },
        { label: 'Курс', value: 'course' },
        { label: 'Услуга', value: 'service' },
      ],
      admin: { description: 'Пусто — любой тип.' },
    },
    {
      name: 'words',
      label: 'Слова в названии',
      type: 'text',
      admin: {
        description:
          'Через запятую — подходит любое из слов: «revit, autocad». Плюс — нужны все части: ' +
          '«project studio+фундамент». Можно писать начало слова: «геолог». Пусто — подходит любой товар.',
      },
    },
    {
      name: 'mainSection',
      label: 'Основной раздел',
      type: 'relationship',
      relationTo: 'sections',
    },
    {
      name: 'extraSections',
      label: 'Дополнительные разделы',
      type: 'relationship',
      relationTo: 'sections',
      hasMany: true,
    },
    {
      name: 'retire',
      label: 'Снят с продажи — скрывать с сайта',
      type: 'checkbox',
      admin: {
        description:
          'Подходящие товары снимаются с публикации. Старые ссылки на них ведут на товары производителя.',
      },
    },
  ],
}
