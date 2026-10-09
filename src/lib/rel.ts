/** Значение связи Payload: число (depth 0) или загруженный документ. */
type Rel = number | { id: number } | null | undefined

/** ID связанного документа или null. */
export function relId(value: Rel) {
  if (value == null) return null
  return typeof value === 'number' ? value : value.id
}

/** ID списка связей без пустых. */
export function relIds(values: Rel[] | null | undefined): number[] {
  return (values ?? []).map(relId).filter((id): id is number => id != null)
}
