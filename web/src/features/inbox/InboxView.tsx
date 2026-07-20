import { useState, type FormEvent } from 'react'
import { ActionSheet } from '../../components/ActionSheet'
import { ErrorBanner } from '../../components/ErrorBanner'
import { DragHandle, SortableList } from '../../components/SortableList'
import { formatDateTime, todayDateString } from '../../lib/dates'
import { useTasks } from '../replanning/useTasks'
import { useInboxItems, type InboxItem } from './useInboxItems'

function SchedulePicker({
  onPick,
  onCancel,
}: {
  onPick: (date: string) => void
  onCancel: () => void
}) {
  const [date, setDate] = useState(todayDateString())

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={date}
        min={todayDateString()}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100"
      />
      <button
        onClick={() => onPick(date)}
        className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white active:bg-blue-700"
      >
        Agendar
      </button>
      <button onClick={onCancel} className="text-xs text-slate-500 active:text-slate-300">
        Cancelar
      </button>
    </div>
  )
}

function formatCreatedAt(item: InboxItem) {
  return item.createdAt ? formatDateTime(item.createdAt.toDate()) : ''
}

export function InboxView() {
  const {
    items,
    resolvedItems,
    loading,
    error,
    addItem,
    resolveItem,
    discardItem,
    markConvertedToTask,
    moveItem,
  } = useInboxItems()
  const { addTask } = useTasks()
  const [text, setText] = useState('')
  const [schedulingId, setSchedulingId] = useState<string | null>(null)
  const [menuItemId, setMenuItemId] = useState<string | null>(null)
  const menuItem = items.find((i) => i.id === menuItemId) ?? null
  const resolvedMenuItem = resolvedItems.find((i) => i.id === menuItemId) ?? null

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    addItem(text)
    setText('')
  }

  const scheduleAsTask = async (item: InboxItem, planDate: string) => {
    const taskRef = await addTask(item.text, item.id, planDate)
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

      <div className="mt-6 flex flex-1 flex-col gap-2 overflow-y-auto">
        {loading && <p className="text-sm text-slate-500">Carregando...</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-slate-500">Nada pendente por aqui.</p>
        )}

        <SortableList
          items={items}
          onReorder={moveItem}
          rowClassName="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5"
        >
          {(item, dragHandleProps) => (
            <>
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
                <DragHandle dragHandleProps={dragHandleProps} />
                <button
                  onClick={() => setMenuItemId(item.id)}
                  aria-label="Mais ações"
                  className="shrink-0 px-1 text-lg leading-none text-slate-500 active:text-slate-300"
                >
                  ⋯
                </button>
              </div>
              {schedulingId === item.id && (
                <SchedulePicker
                  onPick={(date) => {
                    scheduleAsTask(item, date)
                    setSchedulingId(null)
                  }}
                  onCancel={() => setSchedulingId(null)}
                />
              )}
            </>
          )}
        </SortableList>

        {resolvedItems.length > 0 && (
          <>
            <p className="mt-4 text-xs uppercase tracking-wide text-slate-500">
              Resolvidos · {resolvedItems.length}
            </p>
            {resolvedItems.map((item) => (
              <div
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
              </div>
            ))}
          </>
        )}
      </div>

      {menuItem && (
        <ActionSheet
          title={menuItem.text}
          onClose={() => setMenuItemId(null)}
          actions={[
            { label: 'Agendar', onClick: () => setSchedulingId(menuItem.id) },
            { label: 'Enviar para tarefas de hoje', onClick: () => scheduleAsTask(menuItem, todayDateString()) },
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
