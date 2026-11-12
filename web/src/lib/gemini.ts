const GEMINI_MODEL = 'gemini-3.5-flash-lite'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

export class GeminiApiError extends Error {}

async function generateStructuredContent<T>(prompt: string, responseSchema: object): Promise<T> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    throw new GeminiApiError(
      'Chave da API Gemini não configurada (VITE_GEMINI_API_KEY ausente no .env).',
    )
  }

  let response: Response
  try {
    response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema,
        },
      }),
    })
  } catch {
    throw new GeminiApiError('Não foi possível conectar à API do Gemini. Verifique sua conexão.')
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new GeminiApiError('Limite de uso da IA atingido. Tente novamente em alguns minutos.')
    }
    let apiMessage = ''
    try {
      const body = await response.json()
      apiMessage = body?.error?.message ?? ''
    } catch {
      // ignore, body wasn't JSON
    }
    if (response.status === 400 && /API key not valid/i.test(apiMessage)) {
      throw new GeminiApiError('Chave da API Gemini inválida.')
    }
    throw new GeminiApiError(`Erro ao chamar a IA (${response.status})${apiMessage ? `: ${apiMessage}` : '.'}`)
  }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (typeof text !== 'string') {
    throw new GeminiApiError('A IA não retornou nenhuma resposta utilizável.')
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new GeminiApiError('A IA retornou uma resposta em formato inesperado.')
  }
}

export type DurationExtractionInput = {
  id: string
  title: string
  notes: string | null
}

export type DurationExtractionResult = {
  id: string
  durationHours: number | null
  confidence: 'high' | 'medium' | 'low'
  extractedText: string | null
}

const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          durationHours: { type: 'number', nullable: true },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          extractedText: { type: 'string', nullable: true },
        },
        required: ['id', 'durationHours', 'confidence', 'extractedText'],
      },
    },
  },
  required: ['results'],
}

export async function extractDurationsBatch(
  tasks: DurationExtractionInput[],
): Promise<DurationExtractionResult[]> {
  const prompt = `Você vai analisar títulos e notas de tarefas de uma agenda pessoal em português. Cada tarefa pode conter, no texto, uma menção solta de quanto tempo ela durou (ex: "(durou 2h)", "durou 2 horas", "levou 1h e 30min", "levo uns 10min", "1h30", "30min", "2 horas e meia"). Ignore menções que sejam horário de execução, não duração (ex: "Academia treino de perna 18h", "Daily montreal 10h", "Iniciei trabalhos montreal 9:25", "às 14h") — extraia apenas DURAÇÃO, não o horário em que a tarefa aconteceu.

Tarefas (JSON):
${JSON.stringify(tasks)}

Para cada tarefa, retorne o mesmo "id" fornecido, sem alterações, junto com:
- "durationHours": a duração encontrada, convertida para horas decimais (ex: "1h30" vira 1.5). Use null se não houver nenhuma menção clara de duração no texto.
- "confidence": "high" se a menção for explícita e inequívoca, "medium" se for razoavelmente clara, "low" se for uma suposição fraca.
- "extractedText": o trecho exato do texto que originou a extração, ou null se durationHours for null.

Não invente valores. Se não houver menção clara de duração, retorne durationHours null e confidence "low". Responda apenas com JSON válido no formato solicitado.`

  const { results } = await generateStructuredContent<{ results: DurationExtractionResult[] }>(
    prompt,
    EXTRACTION_SCHEMA,
  )
  return results
}
