import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRecurringTemplates } from './useRecurringTemplates'
import { useScheduleBlocks, type ScheduleBlockType } from './useScheduleBlocks'

const TYPE_LABELS: Record<ScheduleBlockType, string> = {
  standup: 'Reunião',
  adhoc_call: 'Ligação avulsa',
  focus_block: 'Foco',
  other: 'Outro',
}

function BlockForm({
  onSubmit,
}: {
  onSubmit: (title: string, startTime: string, endTime: string, type: ScheduleBlockType) => void
}) {
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [type, setType] = useState<ScheduleBlockType>('standup')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !startTime || !endTime) return
    onSubmit(title.trim(), startTime, endTime, type)
    setTitle('')
    setStartTime('')
    setEndTime('')
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
        Adicionar
      </button>
    </form>
  )
}

export function AgendaView() {
  const { blocks, loading: blocksLoading, addBlock, deleteBlock, materializeFromTemplates } =
    useScheduleBlocks()
  const { templates, loading: templatesLoading, addTemplate, deleteTemplate } = useRecurringTemplates()
  const materializedRef = useRef(false)

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

        <div className="mt-4 flex flex-col gap-2">
          {blocksLoading && <p className="text-sm text-slate-500">Carregando...</p>}
          {!blocksLoading && blocks.length === 0 && (
            <p className="text-sm text-slate-500">Nada na agenda hoje ainda.</p>
          )}
          {blocks.map((block) => (
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
              <button
                onClick={() => deleteBlock(block.id)}
                className="shrink-0 text-sm text-slate-500 active:text-slate-300"
              >
                Remover
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <BlockForm onSubmit={(title, startTime, endTime, type) => addBlock({ title, startTime, endTime, type })} />
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Modelos recorrentes (todo dia útil)
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {!templatesLoading &&
            templates.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5"
              >
                <span className="text-slate-300">
                  {t.startTime}–{t.endTime} · {t.title}
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
          <BlockForm onSubmit={(title, startTime, endTime, type) => addTemplate({ title, startTime, endTime, type })} />
        </div>
      </div>
    </div>
  )
}
