'use client'

import {
  BetweenHorizontalEnd,
  BetweenVerticalEnd,
  Heading2,
  Heading3,
  ImagePlus,
  Link,
  List,
  ListOrdered,
  type LucideIcon,
  Pilcrow,
  Redo2,
  Table,
  TextQuote,
  Trash2,
  Undo2,
  Unlink,
  Video,
} from 'lucide-react'
import styles from './EditorToolbar.module.css'

export type ToolAction =
  | 'p'
  | 'h2'
  | 'h3'
  | 'ul'
  | 'ol'
  | 'quote'
  | 'link'
  | 'unlink'
  | 'image'
  | 'video'
  | 'table'
  | 'undo'
  | 'redo'
  | 'addRow'
  | 'addColumn'
  | 'removeRow'
  | 'removeColumn'
  | 'removeTable'

type Tool = { action: ToolAction; label: string; Icon: LucideIcon; text?: string }

const GROUPS: Tool[][] = [
  [
    { action: 'undo', label: 'Отменить (Ctrl+Z)', Icon: Undo2 },
    { action: 'redo', label: 'Повторить (Ctrl+Y)', Icon: Redo2 },
  ],
  [
    { action: 'p', label: 'Обычный абзац', Icon: Pilcrow },
    { action: 'h2', label: 'Раздел — попадает в оглавление статьи', Icon: Heading2 },
    { action: 'h3', label: 'Подзаголовок внутри раздела', Icon: Heading3 },
    { action: 'quote', label: 'Выноска — важное примечание в рамке', Icon: TextQuote },
  ],
  [
    { action: 'ul', label: 'Список', Icon: List },
    { action: 'ol', label: 'Нумерованные шаги', Icon: ListOrdered },
  ],
  [
    { action: 'link', label: 'Ссылка на выделенный текст', Icon: Link },
    { action: 'unlink', label: 'Убрать ссылку', Icon: Unlink },
  ],
  [
    {
      action: 'image',
      label: 'Картинка из «Медиа» или с компьютера',
      Icon: ImagePlus,
      text: 'Картинка',
    },
    { action: 'video', label: 'Видео YouTube, Rutube, VK или Vimeo', Icon: Video, text: 'Видео' },
    { action: 'table', label: 'Таблица', Icon: Table, text: 'Таблица' },
  ],
]

const TABLE_TOOLS: Tool[] = [
  { action: 'addRow', label: 'Добавить строку ниже', Icon: BetweenHorizontalEnd, text: 'Строка' },
  {
    action: 'addColumn',
    label: 'Добавить колонку справа',
    Icon: BetweenVerticalEnd,
    text: 'Колонка',
  },
  { action: 'removeRow', label: 'Удалить строку', Icon: Trash2, text: 'Строку' },
  { action: 'removeColumn', label: 'Удалить колонку', Icon: Trash2, text: 'Колонку' },
  { action: 'removeTable', label: 'Удалить таблицу целиком', Icon: Trash2, text: 'Таблицу' },
]

type Props = { onAction: (action: ToolAction) => void; inTable: boolean; disabled?: boolean }

/** Кнопки визуального редактора: нажатие не уводит курсор из текста (mousedown без фокуса). */
export function EditorToolbar({ onAction, inTable, disabled }: Props) {
  const button = ({ action, label, Icon, text }: Tool) => (
    <button
      key={action}
      type="button"
      className={text ? styles.wide : styles.button}
      title={label}
      aria-label={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onAction(action)}
    >
      <Icon size={16} strokeWidth={1.75} aria-hidden />
      {text && <span>{text}</span>}
    </button>
  )
  return (
    <div className={styles.root}>
      <div className={styles.row} role="toolbar" aria-label="Оформление текста">
        {GROUPS.map((group) => (
          <div key={group[0]?.action} className={styles.group}>
            {group.map(button)}
          </div>
        ))}
      </div>
      {inTable && (
        <div className={styles.row} role="toolbar" aria-label="Таблица">
          <span className={styles.caption}>Таблица:</span>
          <div className={styles.group}>{TABLE_TOOLS.slice(0, 2).map(button)}</div>
          <span className={styles.caption}>удалить:</span>
          <div className={styles.group}>{TABLE_TOOLS.slice(2).map(button)}</div>
        </div>
      )}
    </div>
  )
}
