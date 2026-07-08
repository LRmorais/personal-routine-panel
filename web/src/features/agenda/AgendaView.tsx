import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ErrorBanner } from '../../components/ErrorBanner'
import { useRecurringTemplates, type RecurringTemplate } from './useRecurringTemplates'
import { useScheduleBlocks, type ScheduleBlockType } from './useScheduleBlocks'

const TYPE_LABELS: Record<ScheduleBlockType, string> = {
  standup: 'Reunião',
  adhoc_call: 'Ligação avulsa',
  focus_block: 'Foco',
  other: 'Outro',
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const WEEKDAYS_MON_FRI = [1, 2, 3, 4, 5]

type BlockFields = { title: string; startTime: string; endTime: string; type: ScheduleBlockType }

function BlockForm({
  initial,
  submitLabel = 'Adicionar',
  onSubmit,
  onCancel,
}: {
  initial?: BlockFields
  submitLabel?: string
  onSubmit: (fields: BlockFields) => void
  onCancel?: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [startTime, setStartTime] = useState(initial?.startTime ?? '')
  const [endTime, setEndTime] = useState(initial?.endTime ?? '')
  const [type, setType] = useState<ScheduleBlockType>(initial?.type ?? 'standup')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !startTime || !endTime) return
    onSubmit({ title: title.trim(), startTime, endTime, type })
    if (!initial) {
      setTitle('')
      setStartTime('')
      setEndTime('')
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título"
        className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
      />
      <input
        type="time"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-100"
      />
      <input
        type="time"
        value={endTime}
        onChange={(e) => setEndTime(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-100"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as ScheduleBlockType)}
        className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-100"
      >
        {Object.entries(TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white active:bg-blue-700"
      >
        {submitLabel}
      </button>
      {onCancel && (
        <button onClick={onCancel} type="button" className="text-sm text-slate-400 active:text-slate-200">
          Cancelar
        </button>
      )}
    </form>
  )
}

function WeekdayPicker({ value, onChange }: { value: number[]; onChange: (weekdays: number[]) => void }) {
  const toggle = (day: number) =>
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort())

  return (
    <div className="flex gap-1">
      {WEEKDAY_LABELS.map((label, day) => (
        <button
          key={day}
          type="button"
          onClick={() => toggle(day)}
          className={`h-8 w-8 rounded-full text-xs ${
            value.includes(day) ? 'bg-blue-600 text-white' : 'border border-slate-700 text-slate-400'
          }`}
        >
          {label[0]}
        </button>
      ))}
    </div>
  )
}

function TemplateForm({
  onSubmit,
}: {
  onSubmit: (fields: BlockFields & { weekdays: number[] }) => void
}) {
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [type, setType] = useState<ScheduleBlockType>('standup')
  const [weekdays, setWeekdays] = useState<number[]>(WEEKDAYS_MON_FRI)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !startTime || !endTime || weekdays.length === 0) return
    onSubmit({ title: title.trim(), startTime, endTime, type, weekdays })
    setTitle('')
    setStartTime('')
    setEndTime('')
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
        />
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-100"
        />
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-100"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ScheduleBlockType)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-100"
        >
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <WeekdayPicker value={weekdays} onChange={setWeekdays} />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white active:bg-blue-700"
        >
          Adicionar modelo
        </button>
      </div>
    </form>
  )
}

export function AgendaView() {
  const {
    blocks,
    loading: blocksLoading,
    error: blocksError,
    addBlock,
    deleteBlock,
    updateBlock,
    materializeFromTemplates,
  } = useScheduleBlocks()
  const {
    templates,
    loading: templatesLoading,
    error: templatesError,
    addTemplate,
    deleteTemplate,
  } = useRecurringTemplates()
  const materializedRef = useRef(false)
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)

  useEffect(() => {
    if (materializedRef.current || blocksLoading || templatesLoading) return
    materializedRef.current = true
    materializeFromTemplates(templates)
    // only ever run once per mount, after both collections have loaded — see materializeFromTemplates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocksLoading, templatesLoading])

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Agenda de hoje</h2>
        <p className="mt-1 text-sm text-slate-400">Horários sobrepostos aparecem destacados.</p>
        <ErrorBanner message={blocksError} />

        <div className="mt-4 flex flex-col gap-2">
          {blocksLoading && <p className="text-sm text-slate-500">Carregando...</p>}
          {!blocksLoading && blocks.length === 0 && (
            <p className="text-sm text-slate-500">Nada na agenda hoje ainda.</p>
          )}
          {blocks.map((block) =>
            editingBlockId === block.id ? (
              <div key={block.id} className="rounded-lg border border-slate-700 bg-slate-900 p-2">
                <BlockForm
                  initial={block}
                  submitLabel="Salvar"
                  onCancel={() => setEditingBlockId(null)}
                  onSubmit={(fields) => {
                    updateBlock(block.id, fields)
                    setEditingBlockId(null)
                  }}
                />
              </div>
            ) : (
              <div
                key={block.id}
                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 ${
                  block.overlapping ? 'border-amber-600 bg-amber-950/40' : 'border-slate-800 bg-slate-900'
                }`}
              >
                <div>
                  <span className="text-sm text-slate-400">
                    {block.startTime}–{block.endTime} · {TYPE_LABELS[block.type]}
                    {block.overlapping && ' · sobreposto'}
                  </span>
                  <p className="text-slate-100">{block.title}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => setEditingBlockId(block.id)}
                    className="text-sm text-blue-400 active:text-blue-300"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="text-sm text-slate-500 active:text-slate-300"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ),
          )}
        </div>

        <div className="mt-3">
          <BlockForm onSubmit={(fields) => addBlock(fields)} />
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Modelos recorrentes</p>
        <ErrorBanner message={templatesError} />
        <div className="mt-2 flex flex-col gap-2">
          {!templatesLoading &&
            templates.map((t: RecurringTemplate) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5"
              >
                <span className="text-slate-300">
                  {t.startTime}–{t.endTime} · {t.title}{' '}
                  <span className="text-xs text-slate-500">
                    ({(t.weekdays ?? WEEKDAYS_MON_FRI).map((d) => WEEKDAY_LABELS[d]).join(', ')})
                  </span>
                </span>
                <button
                  onClick={() => deleteTemplate(t.id)}
                  className="shrink-0 text-sm text-slate-500 active:text-slate-300"
                >
                  Remover
                </button>
              </div>
            ))}
        </div>
        <div className="mt-3">
          <TemplateForm onSubmit={(fields) => addTemplate(fields)} />
        </div>
      </div>
    </div>
  )
}
