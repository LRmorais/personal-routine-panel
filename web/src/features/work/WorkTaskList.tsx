import { useState, type FormEvent } from 'react'
import { ActionSheet } from '../../components/ActionSheet'
import { ErrorBanner } from '../../components/ErrorBanner'
import { DragHandle, SortableList } from '../../components/SortableList'
import { fireConfettiFrom } from '../../lib/confetti'
import { todayDateString } from '../../lib/dates'
import { useWorkTasks, type WorkTask } from './useWorkTasks'

function EditTaskPanel({
  task,
  onCancel,
  onSave,
}: {
  task: WorkTask
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

function SubtaskChecklist({
  task,
  onAdd,
  onToggle,
  onStart,
  onPause,
  onRemove,
}: {
  task: WorkTask
  onAdd: (title: string) => void
  onToggle: (subtaskId: string) => void
  onStart: (subtaskId: string) => void
  onPause: (subtaskId: string) => void
  onRemove: (subtaskId: string) => void
}) {
  const [title, setTitle] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    onAdd(title)
    setTitle('')
  }

  return (
    <div className="mt-2 border-t border-slate-800 pt-2">
      {task.subtasks.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {task.subtasks.map((subtask) => (
            <li key={subtask.id} className="flex items-center gap-2">
              <button
                onClick={() => onToggle(subtask.id)}
                aria-label="Concluir subtask"
                className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                  subtask.done ? 'border-green-600 bg-green-600' : 'border-slate-600'
                }`}
              />
              <span
                className={`min-w-0 flex-1 truncate text-sm ${
                  subtask.done ? 'text-slate-500 line-through' : 'text-slate-200'
                }`}
              >
                {subtask.title}
                {subtask.inProgress && !subtask.done && (
                  <span className="ml-2 text-xs text-blue-400">em andamento</span>
                )}
              </span>
              {!subtask.done && (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => onStart(subtask.id)}
                    aria-label="Iniciar subtask"
                    className={`flex h-6 w-6 items-center justify-center rounded text-xs ${
                      subtask.inProgress
                        ? 'btn-primary text-white'
                        : 'bg-slate-800 text-slate-400 active:bg-slate-700'
                    }`}
                  >
                    ▶
                  </button>
                  <button
                    onClick={() => onPause(subtask.id)}
                    aria-label="Pausar subtask"
                    className={`flex h-6 w-6 items-center justify-center rounded text-xs ${
                      !subtask.inProgress
                        ? 'bg-slate-700 text-slate-300'
                        : 'bg-slate-800 text-slate-400 active:bg-slate-700'
                    }`}
                  >
                    ⏸
                  </button>
                </div>
              )}
              <button
                onClick={() => onRemove(subtask.id)}
                aria-label="Excluir subtask"
                className="shrink-0 px-1 text-sm text-slate-600 active:text-red-400"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={onSubmit} className="mt-2 flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nova subtask"
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="shrink-0 rounded-lg bg-slate-800 px-2.5 py-1.5 text-sm text-slate-200 active:bg-slate-700 disabled:opacity-50"
        >
          +
        </button>
      </form>
    </div>
  )
}

export function WorkTaskList({
  clientId,
  clientName,
}: {
  clientId: string
  clientName: string
}) {
  const {
    tasks,
    loading,
    error,
    addTask,
    updateTaskTitle,
    updateTaskNotes,
    completeTask,
    startTask,
    pauseTask,
    cancelTask,
    clearDoneTasks,
    moveTask,
    addSubtask,
    toggleSubtask,
    setSubtaskInProgress,
    removeSubtask,
    scheduleForToday,
  } =useWorkTasks(clientId)
  const [title, setTitle] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null)
  const menuTask = tasks.find((t) => t.id === menuTaskId) ?? null
  const today = todayDateString()

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    addTask(title)
    setTitle('')
  }

  const pending = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress')
  const done = tasks.filter((t) => t.status === 'done')

  return (
    <div className="flex flex-col">
      <h3 className="text-base font-semibold text-slate-100">{clientName}</h3>

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

      <div className="mt-4 flex flex-col gap-2">
        {loading && <p className="text-sm text-slate-500">Carregando...</p>}
        {!loading && tasks.length === 0 && (
          <p className="text-sm text-slate-500">Nenhuma tarefa para esse cliente ainda.</p>
        )}

        <SortableList
          items={pending}
          onReorder={moveTask}
          rowClassName={(task) =>
            editingTaskId === task.id
              ? ''
              : task.status === 'in_progress'
                ? 'rounded-2xl border border-blue-500/70 bg-blue-950/40 px-3.5 py-3'
                : 'card px-3.5 py-3'
          }
        >
          {(task, dragHandleProps) =>
            editingTaskId === task.id ? (
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
                    onClick={(e) => {
                      fireConfettiFrom(e.currentTarget)
                      completeTask(task.id)
                    }}
                    aria-label="Concluir"
                    className={`h-7 w-7 shrink-0 rounded-full border-2 transition active:scale-90 active:border-green-400 ${
                      task.status === 'in_progress' ? 'border-blue-400 bg-blue-500/30' : 'border-slate-500'
                    }`}
                  />
                  <button
                    onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                    className="min-w-0 flex-1 text-left text-slate-100"
                  >
                    <span className="truncate">{task.title}</span>
                    {task.status === 'in_progress' && (
                      <span className="ml-2 text-xs text-blue-400">em andamento</span>
                    )}
                    {task.subtasks.length > 0 && (
                      <span className="ml-2 text-xs text-slate-500">
                        {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
                      </span>
                    )}
                    {task.lastScheduledDate === today && (
                      <span className="ml-2 text-xs text-teal-400">agendada hoje</span>
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
                  <div className="mt-2 border-t border-slate-800 pt-2">
                    <textarea
                      defaultValue={task.notes ?? ''}
                      onBlur={(e) => updateTaskNotes(task.id, e.target.value)}
                      placeholder="Notas (opcional)"
                      rows={2}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
                    />
                    <SubtaskChecklist
                      task={task}
                      onAdd={(subtaskTitle) => addSubtask(task.id, subtaskTitle)}
                      onToggle={(subtaskId) => toggleSubtask(task.id, subtaskId)}
                      onStart={(subtaskId) => setSubtaskInProgress(task.id, subtaskId, true)}
                      onPause={(subtaskId) => setSubtaskInProgress(task.id, subtaskId, false)}
                      onRemove={(subtaskId) => removeSubtask(task.id, subtaskId)}
                    />
                  </div>
                )}
              </>
            )
          }
        </SortableList>

        {done.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Concluídas · {done.length} 🎉</p>
              <button
                onClick={() => {
                  if (window.confirm(`Limpar ${done.length} tarefa(s) concluída(s) de ${clientName}?`)) {
                    clearDoneTasks()
                  }
                }}
                className="text-xs text-slate-400 active:text-red-400"
              >
                Limpar
              </button>
            </div>
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
                    className="flex animate-pop items-center gap-2.5 rounded-2xl border border-green-800/60 bg-green-950/30 px-3 py-2.5"
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
            menuTask.status === 'done'
              ? [
                  { label: 'Editar', onClick: () => setEditingTaskId(menuTask.id) },
                  { label: 'Excluir', onClick: () => cancelTask(menuTask.id), danger: true },
                ]
              : [
                  { label: 'Editar', onClick: () => setEditingTaskId(menuTask.id) },
                  menuTask.status === 'in_progress'
                    ? { label: 'Pausar', onClick: () => pauseTask(menuTask.id) }
                    : { label: 'Iniciar', onClick: () => startTask(menuTask.id) },
                  { label: 'Agendar para hoje', onClick: () => scheduleForToday(menuTask) },
                  { label: 'Excluir', onClick: () => cancelTask(menuTask.id), danger: true },
                ]
          }
        />
      )}
    </div>
  )
}
