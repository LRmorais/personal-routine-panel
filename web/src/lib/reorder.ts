import { doc, writeBatch, type Firestore } from 'firebase/firestore'

export type Orderable = { id: string; order?: number | null }

/** Stable sort by explicit `order`; items without one keep their relative position (fallback order). */
export function sortByOrder<T extends Orderable>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
}

/** Moves the item at `fromIndex` to `toIndex`, then renumbers the whole list sequentially. */
export function reorderItem(
  db: Firestore,
  collectionPath: string[],
  items: Orderable[],
  fromIndex: number,
  toIndex: number,
) {
  if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return
  const next = [...items]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  const batch = writeBatch(db)
  next.forEach((item, i) => {
    if (item.order !== i) batch.update(doc(db, [...collectionPath, item.id].join('/')), { order: i })
  })
  return batch.commit()
}
