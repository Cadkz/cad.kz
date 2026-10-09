'use client'

import { useState } from 'react'
import { AdminButton } from '@/components/AdminButton/AdminButton'
import { PriceColumns } from '@/components/PriceColumns/PriceColumns'
import { PriceMatchTable } from '@/components/PriceMatchTable/PriceMatchTable'
import { downloadCurrent, type PriceVendor, usePriceList } from '@/lib/usePriceList'
import styles from './PriceUpload.module.css'

const CURRENCIES = ['KZT', 'EUR', 'USD', 'RUB']

/** Загрузка прайса: чей прайс и в чём цены → файл → колонки → проверка → запись. */
export function PriceUpload({ vendors }: { vendors: PriceVendor[] }) {
  const list = usePriceList(vendors)
  const { settings, preview } = list
  const [downloading, setDownloading] = useState(false)
  const vendor = vendors.find((v) => v.id === settings.vendor)
  const chosen = preview?.rows.filter((row) => row.use).length ?? 0

  return (
    <div className={styles.root}>
      <section className={styles.step}>
        <h2 className={styles.title}>1. Чей прайс и в чём цены</h2>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span>Производитель</span>
            <select
              value={settings.vendor ?? ''}
              onChange={(e) => list.chooseVendor(e.target.value ? Number(e.target.value) : null)}
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title} ({v.offers})
                </option>
              ))}
              <option value="">Все производители</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Валюта цен в файле</span>
            <select
              value={settings.currency}
              onChange={(e) => list.setSettings({ currency: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={settings.includesVat}
              onChange={(e) => list.setSettings({ includesVat: e.target.checked })}
            />
            Цены в файле с НДС
          </label>
          {settings.includesVat && (
            <label className={styles.field}>
              <span>НДС в файле, %</span>
              <input
                className={styles.vat}
                inputMode="decimal"
                value={settings.sourceVat}
                onChange={(e) => list.setSettings({ sourceVat: e.target.value.trim() })}
              />
            </label>
          )}
        </div>
        <p className={styles.hint}>
          Цена на сайте = цена из файла × курс из «Курсы валют» + НДС Казахстана, вверх до тенге.
          Своего прайса нет? Скачайте текущие цены, поправьте в Excel и загрузите обратно: строки
          найдутся по ID.{' '}
          <button
            type="button"
            className={styles.link}
            disabled={downloading}
            onClick={async () => {
              setDownloading(true)
              await downloadCurrent(settings.vendor, vendor?.title ?? 'все').catch(() => null)
              setDownloading(false)
            }}
          >
            Скачать текущие цены
          </button>
        </p>
      </section>

      <section className={styles.step}>
        <h2 className={styles.title}>2. Файл прайса</h2>
        <input
          type="file"
          accept=".xlsx,.csv,.xls,.html,.htm"
          onChange={(e) => {
            const picked = e.target.files?.[0]
            if (picked) list.chooseFile(picked)
          }}
        />
        <p className={styles.hint}>
          Excel (.xlsx) или CSV. Файл читается здесь, в браузере, и никуда не загружается.
        </p>
        {list.file && list.file.sheets.length > 1 && (
          <label className={styles.field}>
            <span>Лист (по умолчанию первый — актуальный)</span>
            <select value={list.sheet} onChange={(e) => list.chooseSheet(Number(e.target.value))}>
              {list.file.sheets.map((s, i) => (
                <option key={s.name} value={i}>
                  {s.name} ({s.rows.length} строк)
                </option>
              ))}
            </select>
          </label>
        )}
        {list.file && list.columns && (
          <PriceColumns
            rows={list.rows}
            columns={list.columns}
            sets={list.sets}
            onChange={list.setColumns}
            onChooseSet={list.chooseSet}
          />
        )}
        {list.file && (
          <div>
            <AdminButton disabled={list.busy} onClick={list.check}>
              {list.busy && !preview ? 'Проверяю…' : 'Проверить прайс'}
            </AdminButton>
          </div>
        )}
      </section>

      {list.error && <p className={styles.error}>{list.error}</p>}
      {list.done && <p className={styles.done}>{list.done}</p>}

      {preview && (
        <section className={styles.step}>
          <h2 className={styles.title}>3. Проверка и запись</h2>
          <PriceMatchTable
            preview={preview}
            onToggle={(index, use) => list.update(index, { use })}
            onPick={list.pick}
          />
          <div className={styles.actions}>
            <AdminButton disabled={list.busy || chosen === 0} onClick={list.apply}>
              {list.busy ? 'Записываю…' : `Записать цены (${chosen})`}
            </AdminButton>
            <span className={styles.hint}>
              Названия из прайса запоминаются: в следующий раз эти строки найдутся сами.
            </span>
          </div>
        </section>
      )}
    </div>
  )
}
