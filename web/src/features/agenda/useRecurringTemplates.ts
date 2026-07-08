import { addDoc, collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthGate'
import { db } from '../../firebase'
import { capitalizeFirst } from '../../lib/text'
import type { ScheduleBlockType } from './useScheduleBlocks'

export type RecurringTemplate = {
  id: string
  title: string
  startTime: string
  endTime: string
  type: ScheduleBlockType
  /** 0=domingo .. 6=sábado */
  weekdays: number[]
}

export function useRecurringTemplates() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<RecurringTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return onSnapshot(
      collection(db, 'users', user.uid, 'recurringScheduleTemplates'),
      (snapshot) => {
        setTemplates(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as RecurringTemplate))
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('useRecurringTemplates onSnapshot error', err)
        setError(err.message)
        setLoading(false)
      },
    )
  }, [user.uid])

  const addTemplate = (template: Omit<RecurringTemplate, 'id'>) =>
    addDoc(collection(db, 'users', user.uid, 'recurringScheduleTemplates'), {
      ...template,
      title: capitalizeFirst(template.title),
    })

  const deleteTemplate = (id: string) =>
    deleteDoc(doc(db, 'users', user.uid, 'recurringScheduleTemplates', id))

  return { templates, loading, error, addTemplate, deleteTemplate }
}
