import { useState, type FormEvent } from 'react'
import { ActionSheet } from '../../components/ActionSheet'
import { ErrorBanner } from '../../components/ErrorBanner'
import { formatDateTime, tomorrowDateString } from '../../lib/dates'
import { useTasks } from '../replanning/useTasks'
import { useInboxItems, type InboxItem } from './useInboxItems'

const SNOOZE_OPTIONS: { label: string; until: () => Date }[] = [
  { label: '+3h', until: () => new Date(Date.now() + 3 * 60 * 60 * 1000) },
  { label: 'Amanhã 9h', until: () => new Date(`${tomorrowDateString()}T09:00:00-03:00`) },
]

function SnoozePicker({ onPick, onCancel }: { onPick: (until: Date) => void; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2">
      {SNOOZE_OPTIONS.map((opt) => (
        <button
          key={opt.label}
          onClick={() => onPick(opt.until())}
          className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 active:bg-slate-800"
        >
          {opt.label}
        </button>
      ))}
      <button onClick={onCancel} className="text-xs text-slate-500 active:text-slate-300">
        Cancelar
      </button>
    </div>
  )
}

function formatSnoozedUntil(item: InboxItem) {
  return item.snoozedUntil ? formatDateTime(item.snoozedUntil.toDate()) : ''
}

function formatCreatedAt(item: InboxItem) {
  return item.createdAt ? formatDateTime(item.createdAt.toDate()) : ''
}

export function InboxView() {
  const {
    items,
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
  } = useInboxItems()
  const { addTask } = useTasks()
  const [text, setText] = useState('')
  const [snoozingId, setSnoozingId] = useState<string | null>(null)
  const [menuItemId, setMenuItemId] = useState<string | null>(null)
  const menuItem = items.find((i) => i.id === menuItemId) ?? null
  const resolvedMenuItem = resolvedItems.find((i) => i.id === menuItemId) ?? null

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    addItem(text)
    setText('')
  }

  const sendToTasks = async (item: InboxItem) => {
    const taskRef = await addTask(item.text, item.id)
    if (taskRef) await markConvertedToTask(item.id, taskRef.id)
  }

  return (
    <div className="flex h-full flex-col p-4">
      <h2 className="text-lg font-semibold text-slate-100">Captura rápida</h2>
      <p className="mt-1 text-sm text-slate-400">Anote agora, decida depois.</p>

      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="O que você precisa lembrar?"
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-slate-100 placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white active:bg-blue-700 disabled:opacity-50"
        >
          Adicionar
        </button>
      </form>

      <ErrorBanner message={error} />

      <ul className="mt-6 flex flex-1 flex-col gap-2 overflow-y-auto">
        {loading && <li className="text-sm text-slate-500">Carregando...</li>}
        {!loading && items.length === 0 && snoozedItems.length === 0 && (
          <li className="text-sm text-slate-500">Nada pendente por aqui.</li>
        )}
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => resolveItem(item.id)}
                aria-label="Resolver"
                className="h-5 w-5 shrink-0 rounded-full border-2 border-slate-600 active:border-green-500"
              />
              <div className="flex-1">
                <p className="text-slate-100">{item.text}</p>
                <p className="text-xs text-slate-600">{formatCreatedAt(item)}</p>
              </div>
              <button
                onClick={() => setMenuItemId(item.id)}
                aria-label="Mais ações"
                className="shrink-0 px-1 text-lg leading-none text-slate-500 active:text-slate-300"
              >
                ⋯
              </button>
            </div>
            {snoozingId === item.id && (
              <SnoozePicker
                onPick={(until) => {
                  snoozeItem(item.id, until)
                  setSnoozingId(null)
                }}
                onCancel={() => setSnoozingId(null)}
              />
            )}
          </li>
        ))}

        {snoozedItems.length > 0 && (
          <>
            <li className="mt-4 text-xs uppercase tracking-wide text-slate-500">Adiados</li>
            {snoozedItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2.5"
              >
                <div>
                  <span className="text-slate-400">{item.text}</span>
                  <p className="text-xs text-slate-600">
                    capturado em {formatCreatedAt(item)} · volta em {formatSnoozedUntil(item)}
                  </p>
                </div>
                <button
                  onClick={() => reactivateItem(item.id)}
                  className="shrink-0 text-sm text-slate-500 active:text-slate-300"
                >
                  Reativar agora
                </button>
              </li>
            ))}
          </>
        )}

        {resolvedItems.length > 0 && (
          <>
            <li className="mt-4 text-xs uppercase tracking-wide text-slate-500">
              Resolvidos · {resolvedItems.length}
            </li>
            {resolvedItems.map((item) => (
              <li
                key={item.id}
                className="flex animate-[task-complete-pop_0.35s_ease-out] items-center gap-2.5 rounded-lg border border-green-900 bg-green-950/30 px-3 py-2.5"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs text-white">
                  ✓
                </span>
                <div className="flex-1">
                  <p className="text-slate-400 line-through decoration-green-700">{item.text}</p>
                  <p className="text-xs text-slate-600">capturado em {formatCreatedAt(item)}</p>
                </div>
                <button
                  onClick={() => setMenuItemId(item.id)}
                  aria-label="Mais ações"
                  className="shrink-0 px-1 text-lg leading-none text-slate-500 active:text-slate-300"
                >
                  ⋯
                </button>
              </li>
            ))}
          </>
        )}
      </ul>

      {menuItem && (
        <ActionSheet
          title={menuItem.text}
          onClose={() => setMenuItemId(null)}
          actions={[
            { label: 'Adiar', onClick: () => setSnoozingId(menuItem.id) },
            { label: 'Enviar para tarefas de hoje', onClick: () => sendToTasks(menuItem) },
            { label: 'Descartar', onClick: () => discardItem(menuItem.id), danger: true },
          ]}
        />
      )}

      {resolvedMenuItem && (
        <ActionSheet
          title={resolvedMenuItem.text}
          onClose={() => setMenuItemId(null)}
          actions={[{ label: 'Excluir', onClick: () => discardItem(resolvedMenuItem.id), danger: true }]}
        />
      )}
    </div>
  )
}
