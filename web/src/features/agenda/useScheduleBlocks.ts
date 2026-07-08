import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthGate'
import { db } from '../../firebase'
import { isWeekday, todayDateString } from '../../lib/dates'
import type { RecurringTemplate } from './useRecurringTemplates'

export type ScheduleBlockType = 'standup' | 'adhoc_call' | 'focus_block' | 'other'

export type ScheduleBlock = {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  type: ScheduleBlockType
}

export type ScheduleBlockWithOverlap = ScheduleBlock & { overlapping: boolean }

export function useScheduleBlocks() {
  const { user } = useAuth()
  const today = todayDateString()
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'users', user.uid, 'scheduleBlocks'), where('date', '==', today))
    return onSnapshot(q, (snapshot) => {
      setBlocks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ScheduleBlock))
      setLoading(false)
    })
  }, [user.uid, today])

  const sorted = useMemo(
    () => [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [blocks],
  )

  const blocksWithOverlap = useMemo<ScheduleBlockWithOverlap[]>(() => {
    return sorted.map((block, i) => {
      const prev = sorted[i - 1]
      const next = sorted[i + 1]
      const overlapping =
        (!!prev && block.startTime < prev.endTime) || (!!next && next.startTime < block.endTime)
      return { ...block, overlapping }
    })
  }, [sorted])

  const addBlock = (block: Omit<ScheduleBlock, 'id' | 'date'>) =>
    addDoc(collection(db, 'users', user.uid, 'scheduleBlocks'), { ...block, date: today })

  const deleteBlock = (id: string) => deleteDoc(doc(db, 'users', user.uid, 'scheduleBlocks', id))

  // Client-side stand-in for the scheduled Cloud Function that would otherwise
  // materialize today's recurring blocks at 6am (Cloud Scheduler requires Blaze).
  const materializeFromTemplates = (templates: RecurringTemplate[]) => {
    if (!isWeekday(today)) return
    const existingTitles = new Set(blocks.map((b) => b.title))
    templates
      .filter((t) => !existingTitles.has(t.title))
      .forEach((t) => addBlock({ title: t.title, startTime: t.startTime, endTime: t.endTime, type: t.type }))
  }

  return { blocks: blocksWithOverlap, loading, addBlock, deleteBlock, materializeFromTemplates }
}
