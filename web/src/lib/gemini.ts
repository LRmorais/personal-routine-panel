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

export type ReportNarrativeResult = {
  narrative: string
  highlights: string[]
  suggestions: string[]
}

const NARRATIVE_SCHEMA = {
  type: 'object',
  properties: {
    narrative: { type: 'string' },
    highlights: { type: 'array', items: { type: 'string' } },
    suggestions: { type: 'array', items: { type: 'string' } },
  },
  required: ['narrative', 'highlights', 'suggestions'],
}

export function generateReportNarrative(
  statsJson: string,
  comparisonJson: string | null,
  periodLabel: string,
): Promise<ReportNarrativeResult> {
  const prompt = `Você é um assistente que analisa a produtividade e a rotina de uma única pessoa a partir de dados reais de um app de tarefas pessoal. Contexto: ela trabalha home office, atende 3 clientes/empresas (Clube Gazeta, Montreal, Techlead), e também registra atividades da vida pessoal no mesmo app (levar a esposa ao trabalho, tarefas de casa, mercado, academia).

Período analisado: ${periodLabel}

Estatísticas do período (JSON):
${statsJson}

${comparisonJson ? `Comparação com o período anterior (JSON):\n${comparisonJson}\n` : ''}
O campo "byCategory" agrupa as tarefas por área. Cada grupo tem um "type": "work" (cliente/empresa: Clube Gazeta, Montreal, Techlead) ou "life" (vida pessoal: Academia, Casa, Esposa/Transporte, Mercado). O grupo "Avulsa" (type "life") é o que sobra sem categoria clara.

Escreva um resumo (5 a 7 frases) em português do Brasil, em tom direto e honesto (elogie o que foi bem, mas aponte claramente onde o desempenho caiu), cobrindo:
1. Uma avaliação geral do lado profissional: olhando só os grupos "work", a pessoa trabalhou bem neste período? Baseie-se na taxa de conclusão desses grupos, no volume de tarefas não concluídas e na tendência em relação ao período anterior.
2. Como foi o trabalho em cada cliente/empresa presente em "byCategory" com type "work" — onde foi o maior volume de horas, e como ficou a taxa de conclusão em cada um.
3. Um comentário breve sobre a rotina pessoal (grupos "life": academia, casa, esposa/transporte, mercado, avulsa) — não trate baixa conclusão nessas áreas como um problema de desempenho, é só contexto de rotina (ex: quantas vezes foi à academia, se a rotina de levar a esposa foi constante).

Depois, liste de 3 a 5 destaques curtos (highlights), cada um com no máximo 1 frase, priorizando os pontos mais acionáveis do lado profissional (ex: um cliente específico com baixa conclusão, dia mais produtivo, tendência de piora/melhora); no máximo 1 highlight pode ser sobre a vida pessoal.

Por fim, liste de 2 a 4 sugestões práticas e específicas (suggestions) pra essa pessoa melhorar produtividade e organização no próximo período — baseadas nos padrões reais que você identificou nesses dados (ex: dia da semana fraco, cliente com muita tarefa não concluída, tarefas avulsas competindo com trabalho, poucas tarefas com duração registrada dificultando o próprio acompanhamento). Evite conselhos genéricos que não tenham relação com os números apresentados; se não houver um padrão claro o suficiente pra sugerir algo específico, sugira algo simples relacionado ao próprio hábito de registro (ex: registrar duração com mais consistência).

Responda apenas com JSON válido no formato solicitado. Não invente números além dos fornecidos nas estatísticas acima. Se algum grupo de "byCategory" não tiver tarefas neste período, não o mencione.`

  return generateStructuredContent<ReportNarrativeResult>(prompt, NARRATIVE_SCHEMA)
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
