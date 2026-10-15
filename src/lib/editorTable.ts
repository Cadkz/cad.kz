/**
 * Таблицы в визуальном редакторе текста: новая таблица, строки и колонки, переход по ячейкам
 * клавишей Tab. Правки — прямо в DOM редактора; отмену даёт своя история (`useEditorHistory`).
 */
import { closestAtCursor } from './editorDom'

/** Новая пустая таблица: шапка и две строки. */
export function emptyTable(columns = 3, rows = 2) {
  const cells = (tag: string) => `<tr>${`<${tag}><br></${tag}>`.repeat(columns)}</tr>`
  return `<table><thead>${cells('th')}</thead><tbody>${cells('td').repeat(rows)}</tbody></table>`
}

/** Изменить таблицу, в которой стоит курсор. Возвращает true, если что-то поменялось. */
export const TABLE_ACTIONS = [
  'addRow',
  'addColumn',
  'removeRow',
  'removeColumn',
  'removeTable',
] as const
export type TableAction = (typeof TABLE_ACTIONS)[number]

export function isTableAction(action: string): action is TableAction {
  return (TABLE_ACTIONS as readonly string[]).includes(action)
}

export function editTable(root: HTMLElement, action: TableAction): boolean {
  const cell = closestAtCursor(root, 'td, th')
  const table = closestAtCursor(root, 'table')
  if (!(table instanceof HTMLTableElement)) return false
  if (action === 'removeTable') {
    table.remove()
    return true
  }
  if (!cell) return false
  const row = cell.parentElement as HTMLTableRowElement
  const index = (cell as HTMLTableCellElement).cellIndex
  const rows = [...table.querySelectorAll('tr')]
  if (action === 'addRow') {
    const next = document.createElement('tr')
    for (let i = 0; i < row.cells.length; i++) next.appendChild(document.createElement('td'))
    for (const td of next.cells) td.innerHTML = '<br>'
    // Из шапки новая строка идёт в начало данных, а не в шапку.
    if (row.parentElement?.tagName === 'THEAD') {
      const body = table.tBodies[0] ?? table.appendChild(document.createElement('tbody'))
      body.insertBefore(next, body.firstChild)
    } else row.after(next)
    return true
  }
  if (action === 'addColumn') {
    for (const tr of rows) {
      const tag = tr.parentElement?.tagName === 'THEAD' ? 'th' : 'td'
      const added = document.createElement(tag)
      added.innerHTML = '<br>'
      const at = tr.children[index]
      if (at) at.after(added)
      else tr.appendChild(added)
    }
    return true
  }
  if (action === 'removeRow') {
    if (rows.length <= 1) table.remove()
    else row.remove()
    return true
  }
  // removeColumn
  if (row.cells.length <= 1) table.remove()
  else for (const tr of rows) tr.children[index]?.remove()
  return true
}

/**
 * Tab в таблице — в следующую ячейку (Shift+Tab — в предыдущую), как в Word. На последней
 * ячейке Tab добавляет строку. false — курсор не в таблице: Tab работает как обычно.
 */
export function moveInTable(root: HTMLElement, back: boolean): boolean {
  const cell = closestAtCursor(root, 'td, th')
  const table = closestAtCursor(root, 'table')
  if (!cell || !table) return false
  const cells = [...table.querySelectorAll<HTMLElement>('th, td')]
  let target: HTMLElement | null = cells[cells.indexOf(cell) + (back ? -1 : 1)] ?? null
  if (!target && !back && editTable(root, 'addRow'))
    target = table.querySelector<HTMLElement>('tr:last-child td')
  if (!target) return true
  const range = document.createRange()
  range.selectNodeContents(target)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
  return true
}
