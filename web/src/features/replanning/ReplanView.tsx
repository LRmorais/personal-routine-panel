import { useState, type FormEvent } from 'react'
import { REPLAN_REASONS, useTasks, type ReplanReason, type TaskItem } from './useTasks'

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

export function ReplanView() {
  const { tasks, loading, error, addTask, completeTask, cancelTask, pushTaskToTomorrow } = useTasks()
  const [title, setTitle] = useState('')
  const [pushingTaskId, setPushingTaskId] = useState<string | null>(null)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    addTask(title)
    setTitle('')
  }

  const pending = tasks.filter((t) => t.status === 'pending')
  const done = tasks.filter((t) => t.status === 'done')

  return (
    <div className="flex h-full flex-col p-4">
      <h2 className="text-lg font-semibold text-slate-100">Tarefas de hoje</h2>
      <p className="mt-1 text-sm text-slate-400">
        No fim do dia, toda tarefa pendente precisa de um motivo pra ir pra amanhã.
      </p>

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

      {error && <p className="mt-3 text-sm text-red-400">Erro ao carregar: {error}</p>}

      <div className="mt-6 flex flex-1 flex-col gap-2 overflow-y-auto">
        {loading && <p className="text-sm text-slate-500">Carregando...</p>}
        {!loading && tasks.length === 0 && (
          <p className="text-sm text-slate-500">Nenhuma tarefa hoje ainda.</p>
        )}

        {pending.map((task) =>
          pushingTaskId === task.id ? (
            <PushTaskPanel
              key={task.id}
              task={task}
              onCancel={() => setPushingTaskId(null)}
              onConfirm={(reason, note) => {
                pushTaskToTomorrow(task, reason, note)
                setPushingTaskId(null)
              }}
            />
          ) : (
            <div
              key={task.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5"
            >
              <span className="text-slate-100">{task.title}</span>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => completeTask(task.id)}
                  className="text-sm text-green-400 active:text-green-300"
                >
                  Concluir
                </button>
                <button
                  onClick={() => setPushingTaskId(task.id)}
                  className="text-sm text-amber-400 active:text-amber-300"
                >
                  Adiar
                </button>
                <button
                  onClick={() => cancelTask(task.id)}
                  className="text-sm text-slate-500 active:text-slate-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ),
        )}

        {done.length > 0 && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Concluídas</p>
            <div className="mt-2 flex flex-col gap-2">
              {done.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2.5 text-slate-500 line-through"
                >
                  {task.title}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
