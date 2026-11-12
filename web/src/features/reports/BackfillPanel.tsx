import { useState } from 'react'
import { useDurationBackfill } from './useDurationBackfill'

function InlineError({ message }: { message: string | null }) {
  if (!message) return null
  return <p className="text-sm text-red-400">{message}</p>
}

export function BackfillPanel() {
  const [open, setOpen] = useState(false)
  const {
    candidates,
    scanning,
    scanError,
    scanForCandidates,
    rows,
    processing,
    progress,
    processError,
    failedIds,
    runExtraction,
    toggleRow,
    editRow,
    applying,
    applySelected,
    lastApplied,
    undoLastApply,
  } = useDurationBackfill()

  return (
    <div className="mt-6 card p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-medium text-slate-200"
      >
        <span>Extrair durações antigas com IA</span>
        <span className="text-slate-500">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-xs text-slate-500">
            Busca tarefas antigas sem duração registrada cujo título ou notas mencionem tempo (ex: "durou
            2h"), e usa IA pra extrair o valor. Você revisa antes de aplicar.
          </p>

          <button
            onClick={scanForCandidates}
            disabled={scanning}
            className="self-start rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-100 active:bg-slate-700 disabled:opacity-50"
          >
            {scanning ? 'Buscando...' : 'Buscar tarefas antigas'}
          </button>
          <InlineError message={scanError} />

          {candidates.length > 0 && rows.length === 0 && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300">
              <span>{candidates.length} tarefa(s) candidata(s) encontrada(s)</span>
              <button
                onClick={runExtraction}
                disabled={processing}
                className="shrink-0 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white active:bg-teal-700 disabled:opacity-50"
              >
                {processing ? 'Extraindo...' : 'Extrair durações com IA'}
              </button>
            </div>
          )}

          {processing && progress && (
            <p className="text-xs text-slate-500">
              Processando lote {progress.current} de {progress.total}...
            </p>
          )}
          <InlineError message={processError} />

          {rows.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase text-slate-500">
                      <th className="px-2 py-1.5"></th>
                      <th className="px-2 py-1.5">Tarefa</th>
                      <th className="px-2 py-1.5">Trecho</th>
                      <th className="px-2 py-1.5">Horas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-t border-slate-800">
                        <td className="px-2 py-1.5">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={(e) => toggleRow(row.id, e.target.checked)}
                          />
                        </td>
                        <td className="max-w-[9rem] truncate px-2 py-1.5 text-slate-200">{row.title}</td>
                        <td className="max-w-[8rem] truncate px-2 py-1.5 text-xs text-slate-500">
                          {row.extractedText ?? '—'}
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            inputMode="decimal"
                            step={0.25}
                            min={0}
                            value={row.editedHours ?? ''}
                            onChange={(e) =>
                              editRow(row.id, e.target.value === '' ? null : Number(e.target.value))
                            }
                            className="w-16 rounded border border-slate-700 bg-slate-950 px-1.5 py-1 text-slate-100"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {failedIds.length > 0 && (
                <p className="text-xs text-amber-400">
                  {failedIds.length} tarefa(s) sem resultado — clique em "Extrair durações com IA" de novo
                  pra tentar novamente.
                </p>
              )}

              <button
                onClick={applySelected}
                disabled={applying}
                className="self-start rounded-lg btn-primary px-3 py-1.5 text-sm font-medium text-white active:bg-blue-700 disabled:opacity-50"
              >
                {applying ? 'Aplicando...' : 'Aplicar selecionados'}
              </button>
            </div>
          )}

          {lastApplied.length > 0 && (
            <button
              onClick={undoLastApply}
              disabled={applying}
              className="self-start text-xs text-slate-400 underline decoration-slate-600 active:text-slate-200"
            >
              Desfazer última aplicação ({lastApplied.length})
            </button>
          )}
        </div>
      )}
    </div>
  )
}
