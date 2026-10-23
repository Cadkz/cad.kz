'use client'

import { ChevronRight, Plus } from 'lucide-react'
import { CatalogTreeProducts } from '@/components/CatalogTreeProducts/CatalogTreeProducts'
import { CatalogTreeVendors } from '@/components/CatalogTreeVendors/CatalogTreeVendors'
import { TREE_GROUPS } from '@/domain/adminCatalog.mjs'
import type { CatalogTreeData } from '@/lib/adminCatalog'
import { useCatalogTree } from '@/lib/useCatalogTree'
import styles from './CatalogTree.module.css'

/**
 * Дерево каталога, как в Битриксе: вкладки → производители → товары. Поиск — по названиям
 * товаров всей вкладки. Под деревом — производители без товаров.
 */
export function CatalogTree({ data }: { data: CatalogTreeData }) {
  const tree = useCatalogTree(data)
  const groupLabel = TREE_GROUPS.find((item) => item.value === tree.group)?.label ?? ''
  const inFolder = tree.folder != null
  const showProducts = inFolder || tree.query.trim() !== ''
  return (
    <div className={styles.root}>
      <div className={styles.tabs} role="tablist" aria-label="Раздел каталога">
        {TREE_GROUPS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tree.group === item.value}
            className={styles.tab}
            onClick={() => tree.go({ group: item.value, folder: null })}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={styles.bar}>
        <nav className={styles.path} aria-label="Путь по каталогу">
          {inFolder ? (
            <button
              type="button"
              className={styles.crumb}
              onClick={() => tree.go({ group: tree.group, folder: null })}
            >
              {groupLabel}
            </button>
          ) : (
            <span>{groupLabel}</span>
          )}
          {inFolder && (
            <>
              <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
              <span>{tree.vendorTitle(tree.folder)}</span>
            </>
          )}
        </nav>
        <input
          className={styles.search}
          type="search"
          placeholder="Найти товар во вкладке"
          aria-label="Найти товар во вкладке"
          value={tree.query}
          onChange={(event) => tree.setQuery(event.target.value)}
        />
        <a className={styles.add} href="/admin/collections/products/create">
          <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
          Добавить товар
        </a>
      </div>

      {tree.message && (
        <p className={tree.message.kind === 'ok' ? styles.ok : styles.error} role="status">
          {tree.message.text}{' '}
          {tree.message.undo && (
            <button
              type="button"
              className={styles.undo}
              onClick={() => tree.message?.undo && tree.save(tree.message.undo, true)}
            >
              Отменить
            </button>
          )}
        </p>
      )}

      {showProducts ? <CatalogTreeProducts tree={tree} /> : <CatalogTreeVendors tree={tree} />}

      {!showProducts && tree.empty.length > 0 && (
        <p className={styles.note}>
          Производители без товаров:{' '}
          {tree.empty.map((vendor, index) => (
            <span key={vendor.id}>
              {index > 0 && ', '}
              <a href={`/admin/collections/manufacturers/${vendor.id}`}>{vendor.title}</a>
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
