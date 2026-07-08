import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { useEffect, useRef, useState } from 'react'
import { db } from '../../firebase'
import { useAuth } from '../../auth/AuthGate'
import { capitalizeFirst } from '../../lib/text'

const RESOLVED_LIMIT = 20

export type InboxItem = {
  id: string
  text: string
  createdAt: Timestamp | null
  status: 'open' | 'snoozed' | 'resolved' | 'converted_to_task'
  snoozedUntil: Timestamp | null
  resolvedAt: Timestamp | null
}

export function useInboxItems() {
  const { user } = useAuth()
  const [openItems, setOpenItems] = useState<InboxItem[]>([])
  const [snoozedItems, setSnoozedItems] = useState<InboxItem[]>([])
  const [resolvedItems, setResolvedItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reactivatingRef = useRef(new Set<string>())

  useEffect(() => {
    const q = query(
      collection(db, 'users', user.uid, 'inboxItems'),
      where('status', 'in', ['open', 'snoozed']),
      orderBy('createdAt', 'desc'),
    )
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as InboxItem)
        const now = Date.now()
        const open: InboxItem[] = []
        const snoozed: InboxItem[] = []

        for (const item of items) {
          const due = item.status === 'snoozed' && (item.snoozedUntil?.toMillis() ?? Infinity) <= now
          if (item.status === 'open' || due) {
            open.push(item)
            if (due && !reactivatingRef.current.has(item.id)) {
              reactivatingRef.current.add(item.id)
              updateDoc(doc(db, 'users', user.uid, 'inboxItems', item.id), {
                status: 'open',
                snoozedUntil: null,
              }).finally(() => reactivatingRef.current.delete(item.id))
            }
          } else {
            snoozed.push(item)
          }
        }

        setOpenItems(open)
        setSnoozedItems(snoozed)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('useInboxItems onSnapshot error', err)
        setError(err.message)
        setLoading(false)
      },
    )
  }, [user.uid])

  useEffect(() => {
    const q = query(
      collection(db, 'users', user.uid, 'inboxItems'),
      where('status', '==', 'resolved'),
      orderBy('resolvedAt', 'desc'),
      limit(RESOLVED_LIMIT),
    )
    return onSnapshot(q, (snapshot) => {
      setResolvedItems(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as InboxItem))
    })
  }, [user.uid])

  const addItem = (text: string) => {
    const capitalized = capitalizeFirst(text)
    if (!capitalized) return
    return addDoc(collection(db, 'users', user.uid, 'inboxItems'), {
      text: capitalized,
      status: 'open',
      source: 'web',
      createdAt: serverTimestamp(),
    })
  }

  const resolveItem = (id: string) =>
    updateDoc(doc(db, 'users', user.uid, 'inboxItems', id), {
      status: 'resolved',
      resolvedAt: serverTimestamp(),
    })

  const discardItem = (id: string) => deleteDoc(doc(db, 'users', user.uid, 'inboxItems', id))

  const markConvertedToTask = (id: string, taskId: string) =>
    updateDoc(doc(db, 'users', user.uid, 'inboxItems', id), {
      status: 'converted_to_task',
      linkedTaskId: taskId,
    })

  const snoozeItem = (id: string, until: Date) =>
    updateDoc(doc(db, 'users', user.uid, 'inboxItems', id), {
      status: 'snoozed',
      snoozedUntil: Timestamp.fromDate(until),
    })

  const reactivateItem = (id: string) =>
    updateDoc(doc(db, 'users', user.uid, 'inboxItems', id), {
      status: 'open',
      snoozedUntil: null,
    })

  return {
    items: openItems,
    snoozedItems,
    resolvedItems,
    loading,
    error,
    addItem,
    resolveItem,
    discardItem,
    snoozeItem,
    reactivateItem,
    markConvertedToTask,
  }
}
