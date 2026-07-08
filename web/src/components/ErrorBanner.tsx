export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null
  return <p className="mt-3 text-sm text-red-400">Erro ao carregar: {message}</p>
}
