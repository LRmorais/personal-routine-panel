import { useEffect, useState } from 'react'
import { WorkClientList } from './WorkClientList'
import { WorkTaskList } from './WorkTaskList'
import { useWorkClients } from './useWorkClients'

export function WorkView() {
  const workClients = useWorkClients()
  const { clients, archivedClients } = workClients
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedClientId && clients.length > 0) setSelectedClientId(clients[0].id)
  }, [selectedClientId, clients])

  const selectedClient =
    clients.find((c) => c.id === selectedClientId) ??
    archivedClients.find((c) => c.id === selectedClientId) ??
    null

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <WorkClientList
        {...workClients}
        selectedClientId={selectedClientId}
        onSelectClient={(client) => setSelectedClientId(client.id)}
      />

      {selectedClient && (
        <div className="mt-6 border-t border-slate-800 pt-4">
          <WorkTaskList clientId={selectedClient.id} clientName={selectedClient.name} />
        </div>
      )}
    </div>
  )
}
