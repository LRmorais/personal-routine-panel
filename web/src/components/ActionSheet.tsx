export type SheetAction = {
  label: string
  onClick: () => void
  danger?: boolean
}

export function ActionSheet({
  title,
  actions,
  onClose,
}: {
  title: string
  actions: SheetAction[]
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md animate-rise rounded-t-3xl border-t border-slate-700/60 bg-slate-900 p-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="px-3 py-2 text-sm text-slate-500">{title}</p>
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => {
              action.onClick()
              onClose()
            }}
            className={`w-full rounded-xl px-3 py-3.5 text-left text-base font-medium active:bg-slate-800 ${
              action.danger ? 'text-red-400' : 'text-slate-100'
            }`}
          >
            {action.label}
          </button>
        ))}
        <button
          onClick={onClose}
          className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-3.5 text-center font-medium text-slate-300 active:bg-slate-800"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
