import { addDoc, collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthGate'
import { db } from '../../firebase'
import type { ScheduleBlockType } from './useScheduleBlocks'

export type RecurringTemplate = {
  id: string
  title: string
  startTime: string
  endTime: string
  type: ScheduleBlockType
}

export function useRecurringTemplates() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<RecurringTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onSnapshot(collection(db, 'users', user.uid, 'recurringScheduleTemplates'), (snapshot) => {
      setTemplates(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as RecurringTemplate))
      setLoading(false)
    })
  }, [user.uid])

  const addTemplate = (template: Omit<RecurringTemplate, 'id'>) =>
    addDoc(collection(db, 'users', user.uid, 'recurringScheduleTemplates'), template)

  const deleteTemplate = (id: string) =>
    deleteDoc(doc(db, 'users', user.uid, 'recurringScheduleTemplates', id))

  return { templates, loading, addTemplate, deleteTemplate }
}
