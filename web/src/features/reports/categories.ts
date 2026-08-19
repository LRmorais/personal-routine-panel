export type CategoryType = 'work' | 'life'

export type TaskCategory = { id: string; label: string; pattern: RegExp; type: CategoryType }

/**
 * Keyword tags found in task titles/notes: work clients/companies plus the
 * recurring personal-life areas of the day (commute, home, gym, groceries).
 * Add more entries here as new patterns come up — matching is a simple
 * keyword regex, no UI to manage this yet.
 */
export const TASK_CATEGORIES: TaskCategory[] = [
  { id: 'clube-gazeta', label: 'Clube Gazeta', pattern: /clube|gazeta/i, type: 'work' },
  { id: 'montreal', label: 'Montreal', pattern: /montreal/i, type: 'work' },
  { id: 'techlead', label: 'Techlead', pattern: /techlead/i, type: 'work' },
  { id: 'academia', label: 'Academia', pattern: /academia|treino|creatina/i, type: 'life' },
  {
    id: 'casa',
    label: 'Casa',
    pattern: /\bcasa\b|lou[çc]a|arrumar|limpar|organizar|cozinh|almo[çc]o|jantar/i,
    type: 'life',
  },
  { id: 'transporte-esposa', label: 'Esposa/Transporte', pattern: /esposa|\bamor\b/i, type: 'life' },
  { id: 'mercado', label: 'Mercado', pattern: /mercado|compras/i, type: 'life' },
]

export const UNCATEGORIZED_ID = 'avulsa'

export function categorizeTask(task: { title: string; notes: string | null }): string {
  const text = `${task.title} ${task.notes ?? ''}`
  const match = TASK_CATEGORIES.find((category) => category.pattern.test(text))
  return match?.id ?? UNCATEGORIZED_ID
}

export function categoryLabel(id: string): string {
  if (id === UNCATEGORIZED_ID) return 'Avulsa'
  return TASK_CATEGORIES.find((category) => category.id === id)?.label ?? id
}

export function categoryType(id: string): CategoryType {
  if (id === UNCATEGORIZED_ID) return 'life'
  return TASK_CATEGORIES.find((category) => category.id === id)?.type ?? 'life'
}
