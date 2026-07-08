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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-slate-900 p-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]"
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
            className={`w-full rounded-lg px-3 py-3 text-left text-base active:bg-slate-800 ${
              action.danger ? 'text-red-400' : 'text-slate-100'
            }`}
          >
            {action.label}
          </button>
        ))}
        <button
          onClick={onClose}
          className="mt-1 w-full rounded-lg px-3 py-3 text-center text-slate-400 active:bg-slate-800"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
