import { useState, type FormEvent } from 'react'
import { useInboxItems } from './useInboxItems'

export function InboxView() {
  const { items, loading, error, addItem, resolveItem, discardItem } = useInboxItems()
  const [text, setText] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    addItem(text)
    setText('')
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

      {error && <p className="mt-3 text-sm text-red-400">Erro ao carregar: {error}</p>}

      <ul className="mt-6 flex flex-1 flex-col gap-2 overflow-y-auto">
        {loading && <li className="text-sm text-slate-500">Carregando...</li>}
        {!loading && items.length === 0 && (
          <li className="text-sm text-slate-500">Nada pendente por aqui.</li>
        )}
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5"
          >
            <span className="text-slate-100">{item.text}</span>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => resolveItem(item.id)}
                className="text-sm text-green-400 active:text-green-300"
              >
                Resolver
              </button>
              <button
                onClick={() => discardItem(item.id)}
                className="text-sm text-slate-500 active:text-slate-300"
              >
                Descartar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
