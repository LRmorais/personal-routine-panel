import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../firebase'
import { useAuth } from '../../auth/AuthGate'

export type InboxItem = {
  id: string
  text: string
  createdAt: Timestamp | null
  status: 'open' | 'resolved'
}

export function useInboxItems() {
  const { user } = useAuth()
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(
      collection(db, 'users', user.uid, 'inboxItems'),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc'),
    )
    return onSnapshot(
      q,
      (snapshot) => {
        setItems(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as InboxItem))
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

  const addItem = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    return addDoc(collection(db, 'users', user.uid, 'inboxItems'), {
      text: trimmed,
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

  return { items, loading, error, addItem, resolveItem, discardItem }
}
