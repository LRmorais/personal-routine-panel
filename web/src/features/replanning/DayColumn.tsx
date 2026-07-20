import { useState, type FormEvent, type ReactNode } from 'react'
import { ActionSheet } from '../../components/ActionSheet'
import { ErrorBanner } from '../../components/ErrorBanner'
import { DragHandle, SortableList } from '../../components/SortableList'
import { REPLAN_REASONS, useReplanHistory, useTasks, type ReplanReason, type TaskItem } from './useTasks'

function PushTaskPanel({
  task,
  onCancel,
  onConfirm,
}: {
  task: TaskItem
  onCancel: () => void
  onConfirm: (reason: ReplanReason, note: string) => void
}) {
  const [reason, setReason] = useState<ReplanReason | null>(null)
  const [note, setNote] = useState('')

  return (
    <div className="rounded-lg border border-amber-800 bg-amber-950/40 p-3">
      <p className="text-sm text-slate-200">Por que "{task.title}" não fechou hoje?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {REPLAN_REASONS.map((r) => (
          <button
            key={r.value}
            onClick={() => setReason(r.value)}
            className={`rounded-full border px-3 py-1 text-xs ${
              reason === r.value
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'border-slate-700 text-slate-300'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Nota (opcional)"
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
      />
      <div className="mt-2 flex justify-end gap-3">
        <button onClick={onCancel} className="text-sm text-slate-400 active:text-slate-200">
          Cancelar
        </button>
        <button
          onClick={() => reason && onConfirm(reason, note)}
          disabled={!reason}
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white active:bg-amber-700 disabled:opacity-50"
        >
          Adiar para amanhã
        </button>
      </div>
    </div>
  )
}

function EditTaskPanel({
  task,
  onCancel,
  onSave,
}: {
  task: TaskItem
  onCancel: () => void
  onSave: (title: string) => void
}) {
  const [title, setTitle] = useState(task.title)

  return (
    <div className="flex items-center gap-2 rounded-lg border border-blue-800 bg-blue-950/30 p-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
      />
      <button
        onClick={() => title.trim() && onSave(title)}
        disabled={!title.trim()}
        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white active:bg-blue-700 disabled:opacity-50"
      >
        Salvar
      </button>
      <button onClick={onCancel} className="text-sm text-slate-400 active:text-slate-200">
        Cancelar
      </button>
    </div>
  )
}

function reasonLabel(reason: ReplanReason) {
  return REPLAN_REASONS.find((r) => r.value === reason)?.label ?? reason
}

function TaskDetails({ task, onSaveNotes }: { task: TaskItem; onSaveNotes: (notes: string) => void }) {
  const { history, loading } = useReplanHistory(task.id)
  const [notes, setNotes] = useState(task.notes ?? '')

  return (
    <div className="mt-2 border-t border-slate-800 pt-2">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => onSaveNotes(notes)}
        placeholder="Notas (opcional)"
        rows={2}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
      />
      {task.pushCount > 0 && (
        <div className="mt-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Histórico de adiamento ({task.pushCount}x)
          </p>
          {loading && <p className="text-xs text-slate-500">Carregando...</p>}
          <ul className="mt-1 flex flex-col gap-1">
            {history.map((h) => (
              <li key={h.id} className="text-xs text-slate-400">
                {h.fromDate} → {h.toDate}: {reasonLabel(h.reason)}
                {h.reasonNote && ` — "${h.reasonNote}"`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * The full interactive task list for a single day: add form, pending/done
 * lists with drag reorder, and the edit/push/delete menu. Used both as the
 * "Dia" tab content and as one column of the "Semana" board.
 */
export function DayColumn({
  date,
  header,
  boundedHeight = false,
}: {
  date: string
  header?: ReactNode
  boundedHeight?: boolean
}) {
  const {
    tasks,
    loading,
    error,
    addTask,
    completeTask,
    cancelTask,
    pushTaskToTomorrow,
    updateTaskNotes,
    updateTaskTitle,
    movePendingTask,
  } = useTasks(date)
  const [title, setTitle] = useState('')
  const [pushingTaskId, setPushingTaskId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null)
  const menuTask = tasks.find((t) => t.id === menuTaskId) ?? null

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    addTask(title)
    setTitle('')
  }

  const pending = tasks.filter((t) => t.status === 'pending')
  const done = tasks.filter((t) => t.status === 'done')

  return (
    <div className={boundedHeight ? 'flex h-full min-h-0 flex-col' : 'flex flex-col'}>
      {header}

      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nova tarefa"
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-slate-100 placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white active:bg-blue-700 disabled:opacity-50"
        >
          Adicionar
        </button>
      </form>

      <ErrorBanner message={error} />

      {tasks.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Progresso</span>
            <span>
              {done.length}/{tasks.length}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${(done.length / tasks.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div
        className={
          boundedHeight
            ? 'mt-4 flex flex-1 flex-col gap-2 overflow-y-auto'
            : 'mt-4 flex flex-col gap-2'
        }
      >
        {loading && <p className="text-sm text-slate-500">Carregando...</p>}
        {!loading && tasks.length === 0 && (
          <p className="text-sm text-slate-500">Nenhuma tarefa nesse dia ainda.</p>
        )}

        <SortableList
          items={pending}
          onReorder={movePendingTask}
          rowClassName={(task) =>
            pushingTaskId === task.id || editingTaskId === task.id
              ? ''
              : 'rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5'
          }
        >
          {(task, dragHandleProps) =>
            pushingTaskId === task.id ? (
              <PushTaskPanel
                task={task}
                onCancel={() => setPushingTaskId(null)}
                onConfirm={(reason, note) => {
                  pushTaskToTomorrow(task, reason, note)
                  setPushingTaskId(null)
                }}
              />
            ) : editingTaskId === task.id ? (
              <EditTaskPanel
                task={task}
                onCancel={() => setEditingTaskId(null)}
                onSave={(newTitle) => {
                  updateTaskTitle(task.id, newTitle)
                  setEditingTaskId(null)
                }}
              />
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => completeTask(task.id)}
                    aria-label="Concluir"
                    className="h-5 w-5 shrink-0 rounded-full border-2 border-slate-600 active:border-green-500"
                  />
                  <button
                    onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                    className="min-w-0 flex-1 text-left text-slate-100"
                  >
                    <span className="truncate">{task.title}</span>
                    {task.pushCount > 0 && (
                      <span className="ml-2 text-xs text-amber-400">adiada {task.pushCount}x</span>
                    )}
                  </button>
                  <DragHandle dragHandleProps={dragHandleProps} />
                  <button
                    onClick={() => setMenuTaskId(task.id)}
                    aria-label="Mais ações"
                    className="shrink-0 px-1 text-lg leading-none text-slate-500 active:text-slate-300"
                  >
                    ⋯
                  </button>
                </div>
                {expandedTaskId === task.id && (
                  <TaskDetails task={task} onSaveNotes={(notes) => updateTaskNotes(task.id, notes)} />
                )}
              </>
            )
          }
        </SortableList>

        {done.length > 0 && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Concluídas · {done.length} 🎉
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {done.map((task) =>
                editingTaskId === task.id ? (
                  <EditTaskPanel
                    key={task.id}
                    task={task}
                    onCancel={() => setEditingTaskId(null)}
                    onSave={(newTitle) => {
                      updateTaskTitle(task.id, newTitle)
                      setEditingTaskId(null)
                    }}
                  />
                ) : (
                  <div
                    key={task.id}
                    className="flex animate-[task-complete-pop_0.35s_ease-out] items-center gap-2.5 rounded-lg border border-green-900 bg-green-950/30 px-3 py-2.5"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs text-white">
                      ✓
                    </span>
                    <span className="min-w-0 flex-1 truncate text-slate-400 line-through decoration-green-700">
                      {task.title}
                    </span>
                    <button
                      onClick={() => setMenuTaskId(task.id)}
                      aria-label="Mais ações"
                      className="shrink-0 px-1 text-lg leading-none text-slate-500 active:text-slate-300"
                    >
                      ⋯
                    </button>
                  </div>
                ),
              )}
            </div>
          </div>
        )}
      </div>

      {menuTask && (
        <ActionSheet
          title={menuTask.title}
          onClose={() => setMenuTaskId(null)}
          actions={
            menuTask.status === 'pending'
              ? [
                  { label: 'Editar', onClick: () => setEditingTaskId(menuTask.id) },
                  { label: 'Adiar para amanhã', onClick: () => setPushingTaskId(menuTask.id) },
                  { label: 'Excluir', onClick: () => cancelTask(menuTask.id), danger: true },
                ]
              : [
                  { label: 'Editar', onClick: () => setEditingTaskId(menuTask.id) },
                  { label: 'Excluir', onClick: () => cancelTask(menuTask.id), danger: true },
                ]
          }
        />
      )}
    </div>
  )
}
