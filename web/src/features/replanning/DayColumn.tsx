import { useState, type FormEvent, type ReactNode } from 'react'
import { ActionSheet } from '../../components/ActionSheet'
import { ErrorBanner } from '../../components/ErrorBanner'
import { DragHandle, SortableList } from '../../components/SortableList'
import { fireConfettiFrom } from '../../lib/confetti'
import { tomorrowDateString } from '../../lib/dates'
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
                ? 'border-blue-500 btn-primary text-white'
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

function DuplicateTaskPanel({
  task,
  onCancel,
  onConfirm,
}: {
  task: TaskItem
  onCancel: () => void
  onConfirm: (toDate: string) => void
}) {
  const [date, setDate] = useState(tomorrowDateString(task.planDate))

  return (
    <div className="rounded-lg border border-purple-800 bg-purple-950/30 p-3">
      <p className="text-sm text-slate-200">Duplicar "{task.title}" para qual dia?</p>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
        />
        <button
          onClick={() => onConfirm(date)}
          className="shrink-0 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white active:bg-purple-700"
        >
          Duplicar
        </button>
      </div>
      <button onClick={onCancel} className="mt-2 text-sm text-slate-400 active:text-slate-200">
        Cancelar
      </button>
    </div>
  )
}

function BulkDuplicatePanel({
  count,
  onCancel,
  onConfirm,
}: {
  count: number
  onCancel: () => void
  onConfirm: (toDate: string) => void
}) {
  const [date, setDate] = useState(tomorrowDateString())

  return (
    <div className="mt-2 rounded-lg border border-purple-800 bg-purple-950/30 p-3">
      <p className="text-sm text-slate-200">
        Duplicar {count} tarefa{count === 1 ? '' : 's'} selecionada{count === 1 ? '' : 's'} para qual dia?
      </p>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
        />
        <button
          onClick={() => onConfirm(date)}
          className="shrink-0 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white active:bg-purple-700"
        >
          Duplicar
        </button>
      </div>
      <button onClick={onCancel} className="mt-2 text-sm text-slate-400 active:text-slate-200">
        Cancelar
      </button>
    </div>
  )
}

function DurationPanel({
  task,
  onCancel,
  onConfirm,
}: {
  task: TaskItem
  onCancel: () => void
  onConfirm: (hours: number | null) => void
}) {
  const [hours, setHours] = useState(task.durationHours != null ? String(task.durationHours) : '')

  return (
    <div className="rounded-lg border border-teal-800 bg-teal-950/30 p-3">
      <p className="text-sm text-slate-200">Quantas horas durou "{task.title}"?</p>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={0.25}
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          autoFocus
          placeholder="Ex: 1.5"
          className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
        />
        <button
          onClick={() => onConfirm(hours.trim() === '' ? null : Number(hours))}
          className="shrink-0 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white active:bg-teal-700"
        >
          Salvar
        </button>
      </div>
      <button onClick={onCancel} className="mt-2 text-sm text-slate-400 active:text-slate-200">
        Cancelar
      </button>
    </div>
  )
}

function ClosedTaskRow({
  task,
  variant,
  selectionMode,
  selected,
  onToggleSelect,
  onOpenMenu,
}: {
  task: TaskItem
  variant: 'done' | 'not_done'
  selectionMode: boolean
  selected: boolean
  onToggleSelect: () => void
  onOpenMenu: () => void
}) {
  const isDone = variant === 'done'
  return (
    <div
      onClick={selectionMode ? onToggleSelect : undefined}
      className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 ${selectionMode ? 'cursor-pointer' : ''} ${
        isDone
          ? 'animate-pop border-green-800/60 bg-green-950/30'
          : 'border-red-900/60 bg-red-950/10'
      }`}
    >
      {selectionMode ? (
        <span
          aria-label="Selecionar"
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs text-white ${
            selected ? 'border-purple-500 bg-purple-500' : 'border-slate-600'
          }`}
        >
          {selected && '✓'}
        </span>
      ) : (
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs text-white ${
            isDone ? 'bg-green-500' : 'bg-red-900'
          }`}
        >
          {isDone ? '✓' : '✕'}
        </span>
      )}
      <span
        className={`min-w-0 flex-1 truncate line-through ${
          isDone ? 'text-slate-400 decoration-green-700' : 'text-slate-500 decoration-red-800'
        }`}
      >
        {task.title}
        {task.durationHours != null && (
          <span className="ml-2 text-xs no-underline text-slate-600">⏱ {task.durationHours}h</span>
        )}
      </span>
      {!selectionMode && (
        <button
          onClick={onOpenMenu}
          aria-label="Mais ações"
          className="shrink-0 px-1 text-lg leading-none text-slate-500 active:text-slate-300"
        >
          ⋯
        </button>
      )}
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
        className="rounded-lg btn-primary px-3 py-2 text-sm font-medium text-white active:bg-blue-700 disabled:opacity-50"
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

function TaskDetails({
  task,
  onSaveNotes,
  onSaveDuration,
}: {
  task: TaskItem
  onSaveNotes: (notes: string) => void
  onSaveDuration: (hours: number | null) => void
}) {
  const { history, loading } = useReplanHistory(task.id)
  const [notes, setNotes] = useState(task.notes ?? '')
  const [duration, setDuration] = useState(task.durationHours != null ? String(task.durationHours) : '')

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
      <div className="mt-2 flex items-center gap-2">
        <label className="text-xs text-slate-500">Duração (horas)</label>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={0.25}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          onBlur={() => onSaveDuration(duration.trim() === '' ? null : Number(duration))}
          placeholder="Ex: 1.5"
          className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 placeholder:text-slate-500"
        />
      </div>
      {task.pushCount > 0 && (
        <div className="mt-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
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
    startTask,
    pauseTask,
    markNotDone,
    cancelTask,
    cancelTasks,
    pushTaskToTomorrow,
    duplicateTask,
    duplicateTasks,
    updateTaskNotes,
    updateTaskTitle,
    updateTaskDuration,
    movePendingTask,
  } = useTasks(date)
  const [title, setTitle] = useState('')
  const [pushingTaskId, setPushingTaskId] = useState<string | null>(null)
  const [duplicatingTaskId, setDuplicatingTaskId] = useState<string | null>(null)
  const [durationTaskId, setDurationTaskId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDuplicating, setBulkDuplicating] = useState(false)
  const menuTask = tasks.find((t) => t.id === menuTaskId) ?? null

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    addTask(title)
    setTitle('')
  }

  const onDuplicate = (task: TaskItem, toDate: string) => {
    duplicateTask(task, toDate)
    setDuplicatingTaskId(null)
  }

  const onSaveDuration = (taskId: string, hours: number | null) => {
    updateTaskDuration(taskId, hours)
    setDurationTaskId(null)
  }

  const enterSelectionMode = () => {
    setPushingTaskId(null)
    setDuplicatingTaskId(null)
    setDurationTaskId(null)
    setEditingTaskId(null)
    setExpandedTaskId(null)
    setMenuTaskId(null)
    setSelectionMode(true)
  }

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedIds(new Set())
    setBulkDuplicating(false)
  }

  const toggleSelected = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const allSelected = tasks.length > 0 && selectedIds.size === tasks.length
  const toggleSelectAll = () => setSelectedIds(allSelected ? new Set() : new Set(tasks.map((t) => t.id)))

  const onBulkDelete = () => {
    cancelTasks(Array.from(selectedIds))
    exitSelectionMode()
  }

  const onBulkDuplicate = (toDate: string) => {
    duplicateTasks(
      tasks.filter((t) => selectedIds.has(t.id)),
      toDate,
    )
    exitSelectionMode()
  }

  const pending = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress')
  const done = tasks.filter((t) => t.status === 'done')
  const notDone = tasks.filter((t) => t.status === 'not_done')

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
          className="shrink-0 rounded-lg btn-primary px-4 py-2.5 font-medium text-white active:bg-blue-700 disabled:opacity-50"
        >
          Adicionar
        </button>
      </form>

      <ErrorBanner message={error} />

      {tasks.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>{done.length === tasks.length ? 'Tudo feito! 🎉' : 'Progresso do dia'}</span>
            <span className="text-slate-200">
              {done.length}/{tasks.length}
            </span>
          </div>
          <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-emerald-400 transition-all duration-700"
              style={{ width: `${(done.length / tasks.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          {selectionMode ? (
            <>
              <button onClick={toggleSelectAll} className="flex items-center gap-1.5">
                <span
                  aria-label="Selecionar todas"
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs text-white ${
                    allSelected ? 'border-purple-500 bg-purple-500' : 'border-slate-600'
                  }`}
                >
                  {allSelected && '✓'}
                </span>
                <span className="text-xs text-slate-400">Todos</span>
              </button>
              <span className="text-xs text-slate-400">{selectedIds.size} selecionada(s)</span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setBulkDuplicating(true)}
                  disabled={selectedIds.size === 0}
                  className="rounded-lg bg-purple-600 px-2.5 py-1 text-xs font-medium text-white active:bg-purple-700 disabled:opacity-40"
                >
                  Duplicar
                </button>
                <button
                  onClick={onBulkDelete}
                  disabled={selectedIds.size === 0}
                  className="rounded-lg bg-red-950 px-2.5 py-1 text-xs font-medium text-red-300 active:bg-red-900 disabled:opacity-40"
                >
                  Excluir
                </button>
                <button onClick={exitSelectionMode} className="text-xs text-slate-400 active:text-slate-200">
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={enterSelectionMode}
              className="ml-auto text-xs text-slate-400 active:text-slate-200"
            >
              Selecionar
            </button>
          )}
        </div>
      )}

      {bulkDuplicating && (
        <BulkDuplicatePanel
          count={selectedIds.size}
          onCancel={() => setBulkDuplicating(false)}
          onConfirm={onBulkDuplicate}
        />
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
            pushingTaskId === task.id || duplicatingTaskId === task.id || editingTaskId === task.id
              ? ''
              : task.status === 'in_progress'
                ? 'rounded-2xl border border-blue-500/70 bg-blue-950/40 px-3.5 py-3 shadow-[0_0_20px_-8px_rgb(139_92_246/0.8)]'
                : 'card px-3.5 py-3'
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
            ) : duplicatingTaskId === task.id ? (
              <DuplicateTaskPanel
                task={task}
                onCancel={() => setDuplicatingTaskId(null)}
                onConfirm={(toDate) => onDuplicate(task, toDate)}
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
                  {selectionMode ? (
                    <button
                      onClick={() => toggleSelected(task.id)}
                      aria-label="Selecionar"
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs text-white ${
                        selectedIds.has(task.id) ? 'border-purple-500 bg-purple-500' : 'border-slate-600'
                      }`}
                    >
                      {selectedIds.has(task.id) && '✓'}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        fireConfettiFrom(e.currentTarget, pending.length === 1 ? 70 : 24)
                        completeTask(task.id)
                      }}
                      aria-label="Concluir"
                      className={`h-7 w-7 shrink-0 rounded-full border-2 transition active:scale-90 active:border-green-400 active:bg-green-500/30 ${
                        task.status === 'in_progress' ? 'border-blue-400 bg-blue-500/30' : 'border-slate-500'
                      }`}
                    />
                  )}
                  <button
                    onClick={() =>
                      selectionMode
                        ? toggleSelected(task.id)
                        : setExpandedTaskId(expandedTaskId === task.id ? null : task.id)
                    }
                    className="min-w-0 flex-1 text-left text-slate-100"
                  >
                    <span className="truncate">{task.title}</span>
                    {task.status === 'in_progress' && (
                      <span className="ml-2 text-xs text-blue-400">em andamento</span>
                    )}
                    {task.pushCount > 0 && (
                      <span className="ml-2 text-xs text-amber-400">adiada {task.pushCount}x</span>
                    )}
                    {task.durationHours != null && (
                      <span className="ml-2 text-xs text-slate-500">⏱ {task.durationHours}h</span>
                    )}
                  </button>
                  {!selectionMode && (
                    <>
                      <DragHandle dragHandleProps={dragHandleProps} />
                      <button
                        onClick={() => setMenuTaskId(task.id)}
                        aria-label="Mais ações"
                        className="shrink-0 px-1 text-lg leading-none text-slate-500 active:text-slate-300"
                      >
                        ⋯
                      </button>
                    </>
                  )}
                </div>
                {!selectionMode && expandedTaskId === task.id && (
                  <TaskDetails
                    task={task}
                    onSaveNotes={(notes) => updateTaskNotes(task.id, notes)}
                    onSaveDuration={(hours) => updateTaskDuration(task.id, hours)}
                  />
                )}
              </>
            )
          }
        </SortableList>

        {done.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
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
                ) : duplicatingTaskId === task.id ? (
                  <DuplicateTaskPanel
                    key={task.id}
                    task={task}
                    onCancel={() => setDuplicatingTaskId(null)}
                    onConfirm={(toDate) => onDuplicate(task, toDate)}
                  />
                ) : durationTaskId === task.id ? (
                  <DurationPanel
                    key={task.id}
                    task={task}
                    onCancel={() => setDurationTaskId(null)}
                    onConfirm={(hours) => onSaveDuration(task.id, hours)}
                  />
                ) : (
                  <ClosedTaskRow
                    key={task.id}
                    task={task}
                    variant="done"
                    selectionMode={selectionMode}
                    selected={selectedIds.has(task.id)}
                    onToggleSelect={() => toggleSelected(task.id)}
                    onOpenMenu={() => setMenuTaskId(task.id)}
                  />
                ),
              )}
            </div>
          </div>
        )}

        {notDone.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Não concluídas · {notDone.length}
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {notDone.map((task) =>
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
                ) : duplicatingTaskId === task.id ? (
                  <DuplicateTaskPanel
                    key={task.id}
                    task={task}
                    onCancel={() => setDuplicatingTaskId(null)}
                    onConfirm={(toDate) => onDuplicate(task, toDate)}
                  />
                ) : durationTaskId === task.id ? (
                  <DurationPanel
                    key={task.id}
                    task={task}
                    onCancel={() => setDurationTaskId(null)}
                    onConfirm={(hours) => onSaveDuration(task.id, hours)}
                  />
                ) : (
                  <ClosedTaskRow
                    key={task.id}
                    task={task}
                    variant="not_done"
                    selectionMode={selectionMode}
                    selected={selectedIds.has(task.id)}
                    onToggleSelect={() => toggleSelected(task.id)}
                    onOpenMenu={() => setMenuTaskId(task.id)}
                  />
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
            menuTask.status === 'done' || menuTask.status === 'not_done'
              ? [
                  { label: 'Editar', onClick: () => setEditingTaskId(menuTask.id) },
                  { label: 'Registrar duração', onClick: () => setDurationTaskId(menuTask.id) },
                  { label: 'Duplicar para outro dia', onClick: () => setDuplicatingTaskId(menuTask.id) },
                  { label: 'Excluir', onClick: () => cancelTask(menuTask.id), danger: true },
                ]
              : [
                  { label: 'Editar', onClick: () => setEditingTaskId(menuTask.id) },
                  menuTask.status === 'in_progress'
                    ? { label: 'Pausar', onClick: () => pauseTask(menuTask.id) }
                    : { label: 'Iniciar', onClick: () => startTask(menuTask.id) },
                  { label: 'Duplicar para outro dia', onClick: () => setDuplicatingTaskId(menuTask.id) },
                  { label: 'Adiar para amanhã', onClick: () => setPushingTaskId(menuTask.id) },
                  { label: 'Marcar como não feita', onClick: () => markNotDone(menuTask.id) },
                  { label: 'Excluir', onClick: () => cancelTask(menuTask.id), danger: true },
                ]
          }
        />
      )}
    </div>
  )
}
