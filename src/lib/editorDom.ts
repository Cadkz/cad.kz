/**
 * Помощники визуального редактора текста в админке (только в браузере): выделение, абзацы,
 * заголовки, списки, вставка блоков. Ссылки и вставка текста — document.execCommand (устарел,
 * но есть во всех браузерах). Заголовки и списки — своим кодом: команды браузера кладут список
 * внутрь абзаца и сбрасывают курсор. Картинки, видео и таблицы — `insertBlock`, чтобы не
 * попасть внутрь абзаца или списка. Отмена — своя история (`useEditorHistory`).
 */

/** Выделение внутри редактора: запоминаем перед кнопкой с полем ввода, возвращаем при вставке. */
export function saveSelection(root: HTMLElement): Range | null {
  const selection = window.getSelection()
  if (!selection?.rangeCount) return null
  const range = selection.getRangeAt(0)
  return root.contains(range.commonAncestorContainer) ? range.cloneRange() : null
}

export function restoreSelection(root: HTMLElement, range: Range | null) {
  root.focus()
  const selection = window.getSelection()
  if (!selection) return
  selection.removeAllRanges()
  if (range) selection.addRange(range)
  else {
    // Выделения не было — ставим курсор в конец текста.
    const end = document.createRange()
    end.selectNodeContents(root)
    end.collapse(false)
    selection.addRange(end)
  }
}

export function command(name: string, value?: string) {
  document.execCommand(name, false, value)
}

export function insertHtml(html: string) {
  command('insertHTML', html)
}

/** Элемент, в котором стоит курсор (ближайший к нему с тегом из tags), внутри root. */
export function closestAtCursor(root: HTMLElement, tags: string): HTMLElement | null {
  const selection = window.getSelection()
  const node = selection?.anchorNode
  if (!node || !root.contains(node)) return null
  const element = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement
  const found = element?.closest<HTMLElement>(tags) ?? null
  return found && root.contains(found) ? found : null
}

const LIST = new Set(['UL', 'OL'])

/** Блоки верхнего уровня редактора, которых касается выделение (по порядку). */
function topBlocks(root: HTMLElement, range: Range): HTMLElement[] {
  const top = (node: Node) => {
    let current: Node | null = node
    while (current && current.parentNode !== root) current = current.parentNode
    return current
  }
  const first = top(
    range.startContainer === root
      ? (root.childNodes[range.startOffset] ?? root.lastChild ?? root)
      : range.startContainer,
  )
  const last = top(
    range.endContainer === root
      ? (root.childNodes[Math.max(range.endOffset - 1, 0)] ?? root.lastChild ?? root)
      : range.endContainer,
  )
  const blocks: HTMLElement[] = []
  let inside = false
  for (const child of [...root.childNodes]) {
    if (child === first) inside = true
    if (inside) {
      if (child instanceof HTMLElement) blocks.push(child)
      else if (child.textContent?.trim()) {
        // Голый текст в редакторе — оборачиваем в абзац.
        const paragraph = document.createElement('p')
        child.replaceWith(paragraph)
        paragraph.append(child)
        blocks.push(paragraph)
      }
    }
    if (child === last) break
  }
  return blocks
}

type Caret = { node: Node; offset: number }

/** Курсор до правки: Range «живой» и при переносе узлов съезжает, поэтому запоминаем точку. */
const caretOf = (range: Range): Caret => ({ node: range.endContainer, offset: range.endOffset })

/** Курсор после правки: на прежнее место, если узел остался в тексте, иначе в начало блока. */
function keepCaret(caret: Caret, fallback: Node | null) {
  const selection = window.getSelection()
  if (!selection) return
  const next = document.createRange()
  try {
    if (!caret.node.isConnected) throw new Error('узла нет')
    next.setStart(caret.node, caret.offset)
  } catch {
    if (!fallback) return
    next.selectNodeContents(fallback)
  }
  next.collapse(true)
  selection.removeAllRanges()
  selection.addRange(next)
}

function moveChildren(from: Node, to: Node) {
  while (from.firstChild) to.appendChild(from.firstChild)
  if (!to.firstChild) to.appendChild(document.createElement('br'))
}

function currentRange(root: HTMLElement): Range | null {
  const selection = window.getSelection()
  if (!selection?.rangeCount) return null
  const range = selection.getRangeAt(0)
  return root.contains(range.commonAncestorContainer) ? range : null
}

/**
 * Абзац, раздел (h2), подзаголовок (h3) или выноска для блоков под курсором. Пункты списка
 * выходят из списка: список делится на части до и после них.
 */
export function setBlock(root: HTMLElement, tag: 'p' | 'h2' | 'h3' | 'blockquote'): boolean {
  const range = currentRange(root)
  if (!range) return false
  const caret = caretOf(range)
  // Что менять — решаем до правок: потом выделение съедет.
  const plan = topBlocks(root, range).map((block) => ({
    block,
    picked: LIST.has(block.tagName)
      ? [...block.children].filter((item) => range.intersectsNode(item))
      : [],
  }))
  let firstNew: HTMLElement | null = null
  const make = (source: Node) => {
    const block = document.createElement(tag)
    moveChildren(source, block)
    firstNew ??= block
    return block
  }
  for (const { block, picked } of plan) {
    if (block.tagName === 'TABLE' || block.tagName === 'FIGURE') continue
    if (!LIST.has(block.tagName)) {
      block.replaceWith(make(block))
      continue
    }
    const items = [...block.children]
    if (!picked.length) continue
    const after = document.createElement(block.tagName)
    for (const item of items.slice(items.indexOf(picked.at(-1) as Element) + 1)) after.append(item)
    const created = picked.map((item) => {
      const made = make(item)
      item.remove()
      return made
    })
    block.after(...created, ...(after.children.length ? [after] : []))
    if (!block.children.length) block.remove()
  }
  keepCaret(caret, firstNew)
  return true
}

/** Список или нумерованные шаги для блоков под курсором; повторное нажатие — обратно абзацы. */
export function toggleList(root: HTMLElement, ordered: boolean): boolean {
  const range = currentRange(root)
  if (!range) return false
  const tag = ordered ? 'OL' : 'UL'
  const caret = caretOf(range)
  const blocks = topBlocks(root, range).filter(
    (block) => block.tagName !== 'TABLE' && block.tagName !== 'FIGURE',
  )
  if (!blocks.length) return false
  if (blocks.every((block) => block.tagName === tag)) return setBlock(root, 'p')
  const list = document.createElement(tag)
  for (const block of blocks) {
    if (LIST.has(block.tagName)) list.append(...block.children)
    else {
      const item = document.createElement('li')
      moveChildren(block, item)
      list.append(item)
    }
  }
  blocks[0]?.before(list)
  for (const block of blocks) block.remove()
  keepCaret(caret, list.lastElementChild)
  return true
}

/** Пустой редактор и новые строки — абзацы <p>, а не голый текст и <div>. */
export function prepareEditor(root: HTMLElement) {
  command('defaultParagraphSeparator', 'p')
  if (!root.firstChild) root.innerHTML = '<p><br></p>'
}

function placeCaret(node: Node) {
  const range = document.createRange()
  range.selectNodeContents(node)
  range.collapse(true)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

const hasContent = (node: Node) =>
  Boolean(node.textContent?.trim()) ||
  (node instanceof HTMLElement && Boolean(node.querySelector('img, figure, table')))

/**
 * Картинка, видео или таблица — отдельным блоком после абзаца, в котором курсор (не внутрь
 * списка или заголовка). Пустой абзац под курсором заменяется. После блока — абзац для
 * продолжения текста; курсор — в первую ячейку таблицы или в этот абзац.
 */
export function insertBlock(root: HTMLElement, html: string) {
  const template = document.createElement('template')
  template.innerHTML = html
  const inserted = [...template.content.childNodes]
  let top: Node | null = window.getSelection()?.anchorNode ?? null
  if (top && top !== root && root.contains(top)) {
    while (top.parentNode && top.parentNode !== root) top = top.parentNode
  } else top = null
  if (top && !hasContent(top)) {
    top.parentNode?.replaceChild(template.content, top)
  } else if (top) {
    ;(top as ChildNode).after(template.content)
  } else root.append(template.content)
  const last = inserted.at(-1)
  let next = last?.nextSibling ?? null
  if (!(next instanceof HTMLParagraphElement)) {
    const paragraph = document.createElement('p')
    paragraph.innerHTML = '<br>'
    if (last) (last as ChildNode).after(paragraph)
    else root.append(paragraph)
    next = paragraph
  }
  const cell = inserted.find((node): node is HTMLTableElement => node instanceof HTMLTableElement)
  placeCaret(cell?.querySelector('th, td') ?? next)
}
