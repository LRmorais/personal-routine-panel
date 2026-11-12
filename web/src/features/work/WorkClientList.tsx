import { useState, type FormEvent } from 'react'
import { ActionSheet } from '../../components/ActionSheet'
import { ErrorBanner } from '../../components/ErrorBanner'
import { DragHandle, SortableList } from '../../components/SortableList'
import type { WorkClient } from './useWorkClients'

function RenameClientPanel({
  name,
  onCancel,
  onSave,
}: {
  name: string
  onCancel: () => void
  onSave: (name: string) => void
}) {
  const [value, setValue] = useState(name)

  return (
    <div className="flex items-center gap-2 rounded-lg border border-blue-800 bg-blue-950/30 p-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
      />
      <button
        onClick={() => value.trim() && onSave(value)}
        disabled={!value.trim()}
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

export function WorkClientList({
  clients,
  archivedClients,
  openCounts,
  loading,
  error,
  addClient,
  renameClient,
  archiveClient,
  unarchiveClient,
  deleteClient,
  moveClient,
  selectedClientId,
  onSelectClient,
}: {
  clients: WorkClient[]
  archivedClients: WorkClient[]
  openCounts: Record<string, number>
  loading: boolean
  error: string | null
  addClient: (name: string) => void
  renameClient: (id: string, name: string) => void
  archiveClient: (id: string) => void
  unarchiveClient: (id: string) => void
  deleteClient: (id: string) => void
  moveClient: (fromIndex: number, toIndex: number) => void
  selectedClientId: string | null
  onSelectClient: (client: WorkClient) => void
}) {
  const [name, setName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [menuClientId, setMenuClientId] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const menuClient =
    clients.find((c) => c.id === menuClientId) ??
    archivedClients.find((c) => c.id === menuClientId) ??
    null

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    addClient(name)
    setName('')
  }

  return (
    <div className="flex flex-col">
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-50">Trabalho</h2>
      <p className="mt-1 text-sm text-slate-400">Seus clientes e projetos.</p>

      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Novo cliente"
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-slate-100 placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="shrink-0 rounded-lg btn-primary px-4 py-2.5 font-medium text-white active:bg-blue-700 disabled:opacity-50"
        >
          Adicionar
        </button>
      </form>

      <ErrorBanner message={error} />

      <div className="mt-4 flex flex-col gap-2">
        {loading && <p className="text-sm text-slate-500">Carregando...</p>}
        {!loading && clients.length === 0 && (
          <p className="text-sm text-slate-500">Nenhum cliente ainda.</p>
        )}

        <SortableList
          items={clients}
          onReorder={moveClient}
          rowClassName={(client) =>
            renamingId === client.id
              ? ''
              : client.id === selectedClientId
                ? 'rounded-lg border border-blue-700 bg-blue-950/20 px-3 py-2.5'
                : 'card px-3 py-2.5'
          }
        >
          {(client, dragHandleProps) =>
            renamingId === client.id ? (
              <RenameClientPanel
                name={client.name}
                onCancel={() => setRenamingId(null)}
                onSave={(newName) => {
                  renameClient(client.id, newName)
                  setRenamingId(null)
                }}
              />
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onSelectClient(client)}
                  className="min-w-0 flex-1 text-left text-slate-100"
                >
                  <span className="truncate">{client.name}</span>
                  {(openCounts[client.id] ?? 0) > 0 && (
                    <span className="ml-2 text-xs text-slate-500">
                      {openCounts[client.id]} aberta{openCounts[client.id] === 1 ? '' : 's'}
                    </span>
                  )}
                </button>
                <DragHandle dragHandleProps={dragHandleProps} />
                <button
                  onClick={() => setMenuClientId(client.id)}
                  aria-label="Mais ações"
                  className="shrink-0 px-1 text-lg leading-none text-slate-500 active:text-slate-300"
                >
                  ⋯
                </button>
              </div>
            )
          }
        </SortableList>

        {archivedClients.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowArchived((v) => !v)}
              className="text-xs uppercase tracking-wide text-slate-500"
            >
              Arquivados · {archivedClients.length} {showArchived ? '▲' : '▼'}
            </button>
            {showArchived && (
              <div className="mt-2 flex flex-col gap-2">
                {archivedClients.map((client) =>
                  renamingId === client.id ? (
                    <RenameClientPanel
                      key={client.id}
                      name={client.name}
                      onCancel={() => setRenamingId(null)}
                      onSave={(newName) => {
                        renameClient(client.id, newName)
                        setRenamingId(null)
                      }}
                    />
                  ) : (
                    <div
                      key={client.id}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                        client.id === selectedClientId
                          ? 'border-blue-700 bg-blue-950/20'
                          : 'border-slate-800 bg-slate-900/60'
                      }`}
                    >
                      <button
                        onClick={() => onSelectClient(client)}
                        className="min-w-0 flex-1 text-left text-slate-400"
                      >
                        {client.name}
                      </button>
                      <button
                        onClick={() => setMenuClientId(client.id)}
                        aria-label="Mais ações"
                        className="shrink-0 px-1 text-lg leading-none text-slate-500 active:text-slate-300"
                      >
                        ⋯
                      </button>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {menuClient && (
        <ActionSheet
          title={menuClient.name}
          onClose={() => setMenuClientId(null)}
          actions={
            menuClient.archived
              ? [
                  { label: 'Reativar', onClick: () => unarchiveClient(menuClient.id) },
                  { label: 'Excluir', onClick: () => deleteClient(menuClient.id), danger: true },
                ]
              : [
                  { label: 'Renomear', onClick: () => setRenamingId(menuClient.id) },
                  { label: 'Arquivar', onClick: () => archiveClient(menuClient.id) },
                ]
          }
        />
      )}
    </div>
  )
}
