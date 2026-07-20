import { useState, type FormEvent } from 'react'
import { ActionSheet } from '../../components/ActionSheet'
import { ErrorBanner } from '../../components/ErrorBanner'
import { DragHandle, SortableList } from '../../components/SortableList'
import { addDays, formatDayLabel, todayDateString } from '../../lib/dates'
import {
  REPLAN_REASONS,
  useReplanHistory,
  useTasks,
  useUpcomingTasks,
  type ReplanReason,
  type TaskItem,
} from './useTasks'

function DayNavigator({
  date,
  onChange,
}: {
  date: string
  onChange: (date: string) => void
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => onChange(addDays(date, -1))}
        aria-label="Dia anterior"
        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 active:bg-slate-800"
      >
        ‹
      </button>
      <button
        onClick={() => onChange(todayDateString())}
        className="min-w-28 text-center text-base font-medium text-slate-100 active:text-blue-400"
      >
        {formatDayLabel(date)}
      </button>
      <button
        onClick={() => onChange(addDays(date, 1))}
        aria-label="Próximo dia"
        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 active:bg-slate-800"
      >
        ›
      </button>
    </div>
  )
}

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

function UpcomingSection({ onJumpTo }: { onJumpTo: (date: string) => void }) {
  const { tasks, loading } = useUpcomingTasks()
  if (loading || tasks.length === 0) return null

  const groups: { date: string; tasks: TaskItem[] }[] = []
  for (const task of tasks) {
    const group = groups[groups.length - 1]
    if (group?.date === task.planDate) group.tasks.push(task)
    else groups.push({ date: task.planDate, tasks: [task] })
  }

  return (
    <div className="mt-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">Próximos dias</p>
      <div className="mt-2 flex flex-col gap-3">
        {groups.map((group) => (
          <div key={group.date}>
            <button
              onClick={() => onJumpTo(group.date)}
              className="text-xs font-medium text-blue-400 active:text-blue-300"
            >
              {formatDayLabel(group.date)}
            </button>
            <div className="mt-1 flex flex-col gap-1.5">
              {group.tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onJumpTo(group.date)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-left text-sm text-slate-300 active:bg-slate-800"
                >
                  {task.title}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ReplanView() {
  const [viewDate, setViewDate] = useState(todayDateString())
  const {
    tasks,
    loading,
    error,
    addTask,
    completeTask,
    cancelTask,
    pushTaskToTomorrow,
    updateTaskNotes,
    movePendingTask,
  } = useTasks(viewDate)
  const [title, setTitle] = useState('')
  const [pushingTaskId, setPushingTaskId] = useState<string | null>(null)
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
    <div className="flex h-full flex-col p-4">
      <h2 className="text-lg font-semibold text-slate-100">Tarefas</h2>
      <p className="mt-1 text-sm text-slate-400">
        No fim do dia, toda tarefa pendente precisa de um motivo pra ir pra amanhã.
      </p>

      <div className="mt-3">
        <DayNavigator date={viewDate} onChange={setViewDate} />
      </div>

      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nova tarefa"
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-slate-100 placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white active:bg-blue-700 disabled:opacity-50"
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

      <div className="mt-4 flex flex-1 flex-col gap-2 overflow-y-auto">
        {loading && <p className="text-sm text-slate-500">Carregando...</p>}
        {!loading && tasks.length === 0 && (
          <p className="text-sm text-slate-500">Nenhuma tarefa nesse dia ainda.</p>
        )}

        <SortableList
          items={pending}
          onReorder={movePendingTask}
          rowClassName={(task) =>
            pushingTaskId === task.id ? '' : 'rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5'
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
                    className="flex-1 text-left text-slate-100"
                  >
                    {task.title}
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
              {done.map((task) => (
                <div
                  key={task.id}
                  className="flex animate-[task-complete-pop_0.35s_ease-out] items-center gap-2.5 rounded-lg border border-green-900 bg-green-950/30 px-3 py-2.5"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs text-white">
                    ✓
                  </span>
                  <span className="flex-1 text-slate-400 line-through decoration-green-700">
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
              ))}
            </div>
          </div>
        )}

        <UpcomingSection onJumpTo={setViewDate} />
      </div>

      {menuTask && (
        <ActionSheet
          title={menuTask.title}
          onClose={() => setMenuTaskId(null)}
          actions={
            menuTask.status === 'pending'
              ? [
                  { label: 'Adiar para amanhã', onClick: () => setPushingTaskId(menuTask.id) },
                  { label: 'Excluir', onClick: () => cancelTask(menuTask.id), danger: true },
                ]
              : [{ label: 'Excluir', onClick: () => cancelTask(menuTask.id), danger: true }]
          }
        />
      )}
    </div>
  )
}
