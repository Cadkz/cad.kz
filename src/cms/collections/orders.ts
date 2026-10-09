import { APIError, type CollectionBeforeDeleteHook, type CollectionConfig } from 'payload'
import { isAdmin, nobody } from '../access'
import { relationField, textField } from '../fields'

/**
 * Заказ нельзя изменить и удалить ни из админки, ни из кода: снимок цены должен остаться таким,
 * каким его видел покупатель. Создаёт заказ только сервер при оформлении.
 */
const forbidChange: CollectionConfig['hooks'] = {
  beforeChange: [
    ({ operation, data }) => {
      if (operation === 'update') throw new APIError('Заказ нельзя изменить', 403)
      return data
    },
  ],
  beforeDelete: [
    (() => {
      throw new APIError('Заказ нельзя удалить', 403)
    }) satisfies CollectionBeforeDeleteHook,
  ],
}

const readOnly = { readOnly: true } as const

/** Заказы с сайта: администратор видит список и состав снимка, только чтение. Менеджеры работают в Битрикс24. */
export const orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Заказ', plural: 'Заказы' },
  admin: {
    group: 'Продажи',
    useAsTitle: 'number',
    defaultColumns: ['number', 'createdAt', 'contactName', 'buyerType', 'totalKzt', 'mode'],
  },
  defaultSort: '-createdAt',
  access: { read: isAdmin, create: nobody, update: nobody, delete: nobody },
  hooks: forbidChange,
  fields: [
    {
      name: 'snapshotView',
      type: 'ui',
      admin: {
        components: { Field: '/components/OrderSnapshotView/OrderSnapshotView#OrderSnapshotView' },
      },
    },
    { name: 'number', label: 'Номер', type: 'text', unique: true, required: true, index: true },
    {
      name: 'mode',
      label: 'Режим сайта',
      type: 'select',
      required: true,
      options: [
        { label: 'Демо: менеджерам не передан', value: 'demo' },
        { label: 'Рабочий', value: 'live' },
      ],
    },
    {
      name: 'buyerType',
      label: 'Покупатель',
      type: 'select',
      required: true,
      options: [
        { label: 'Физическое лицо', value: 'individual' },
        { label: 'Юридическое лицо', value: 'company' },
      ],
    },
    textField('contactName', 'Имя', true),
    textField('contactPhone', 'Телефон', true),
    textField('contactEmail', 'Почта', true),
    textField('companyName', 'Организация'),
    textField('bin', 'БИН или ИИН'),
    { name: 'comment', label: 'Комментарий покупателя', type: 'textarea' },
    textField('totalKzt', 'Итого с НДС, ₸', true),
    {
      name: 'consent',
      label: 'Согласие на обработку данных',
      type: 'group',
      fields: [
        { name: 'accepted', label: 'Дано', type: 'checkbox' },
        { name: 'at', label: 'Когда', type: 'date' },
        textField('version', 'Версия текста'),
        { name: 'text', label: 'Текст, который видел покупатель', type: 'textarea' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Служебные данные',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'snapshot',
          label: 'Снимок заказа (данные как сохранены)',
          type: 'json',
          required: true,
          admin: readOnly,
        },
        {
          name: 'idempotencyKey',
          label: 'Ключ повтора',
          type: 'text',
          unique: true,
          required: true,
        },
        textField('fingerprint', 'Отпечаток заявки', true),
        textField('clientHash', 'Отметка адреса (для лимита частоты)'),
      ],
    },
  ],
}

/** Очередь передачи заявок в CRM. Запись появляется в той же транзакции, что и заказ. */
export const crmDeliveries: CollectionConfig = {
  slug: 'crm-deliveries',
  labels: { singular: 'Передача в CRM', plural: 'Передача в CRM' },
  admin: {
    group: 'Система',
    useAsTitle: 'idempotencyKey',
    defaultColumns: ['order', 'request', 'state', 'attempts', 'updatedAt'],
  },
  defaultSort: '-createdAt',
  access: { read: isAdmin, create: nobody, update: nobody, delete: nobody },
  fields: [
    { name: 'idempotencyKey', label: 'Ключ повтора', type: 'text', unique: true, required: true },
    relationField('order', 'Заказ', 'orders'),
    relationField('request', 'Заявка без корзины', 'site-requests'),
    {
      name: 'state',
      label: 'Состояние',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'Ждёт отправки', value: 'pending' },
        { label: 'Отправляется', value: 'processing' },
        { label: 'Не отправлено: демо', value: 'not-sent-demo' },
        { label: 'Отправлено', value: 'sent' },
        { label: 'Ошибка, будет повтор', value: 'failed' },
        { label: 'Попытки закончились', value: 'dead' },
      ],
    },
    { name: 'attempts', label: 'Попыток', type: 'number', defaultValue: 0 },
    { name: 'nextAttemptAt', label: 'Следующая попытка', type: 'date' },
    { name: 'ambiguous', label: 'Итог прошлой попытки неясен', type: 'checkbox' },
    textField('lastError', 'Последняя ошибка'),
    textField('externalId', 'Номер в CRM'),
    { name: 'snapshot', label: 'Данные для CRM', type: 'json', required: true },
  ],
}

/**
 * Заявки без корзины: запрос цены, продление, помощь с выбором, КП по семейству. Клиент выбрал
 * «Перезвоните мне». Создаёт только сервер (/api/request), изменить и удалить нельзя.
 */
export const siteRequests: CollectionConfig = {
  slug: 'site-requests',
  labels: { singular: 'Заявка без корзины', plural: 'Заявки без корзины' },
  admin: {
    group: 'Продажи',
    useAsTitle: 'number',
    defaultColumns: ['number', 'createdAt', 'kind', 'productTitle', 'contactName', 'mode'],
  },
  defaultSort: '-createdAt',
  access: { read: isAdmin, create: nobody, update: nobody, delete: nobody },
  hooks: forbidChange,
  fields: [
    { name: 'number', label: 'Номер', type: 'text', unique: true, required: true, index: true },
    {
      name: 'kind',
      label: 'Что нужно',
      type: 'select',
      required: true,
      options: [
        { label: 'Запрос цены', value: 'price' },
        { label: 'Продление', value: 'renew' },
        { label: 'Помощь с выбором', value: 'help' },
        { label: 'Коммерческое предложение', value: 'quote' },
      ],
    },
    {
      name: 'mode',
      label: 'Режим сайта',
      type: 'select',
      required: true,
      options: [
        { label: 'Демо: менеджерам не передана', value: 'demo' },
        { label: 'Рабочий', value: 'live' },
      ],
    },
    textField('productTitle', 'Страница', true),
    textField('page', 'Адрес страницы'),
    textField('contactName', 'Имя', true),
    textField('contactPhone', 'Телефон', true),
    { name: 'comment', label: 'Комментарий', type: 'textarea' },
    {
      name: 'items',
      label: 'Выбор клиента (как сохранён)',
      type: 'json',
      required: true,
      admin: readOnly,
    },
    textField('totalKzt', 'Итого с НДС, ₸ (если цена известна)'),
    {
      name: 'consent',
      label: 'Согласие на обработку данных',
      type: 'group',
      fields: [
        { name: 'accepted', label: 'Дано', type: 'checkbox' },
        { name: 'at', label: 'Когда', type: 'date' },
        textField('version', 'Версия текста'),
        { name: 'text', label: 'Текст, который видел клиент', type: 'textarea' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Служебные данные',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'idempotencyKey',
          label: 'Ключ повтора',
          type: 'text',
          unique: true,
          required: true,
        },
        textField('clientHash', 'Отметка адреса (для лимита частоты)'),
      ],
    },
  ],
}
