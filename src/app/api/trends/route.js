export const runtime = 'edge'

const BRAND_SYSTEM = `Você é um estrategista de conteúdo especializado na marca pessoal de Hellena Aguiar.

MARCA: Hellena Aguiar — estrategista de marketing, criadora de soluções com IA, coprodutora no mercado de infoprodutos, mãe. Múltipla, direta, reflexiva. Não ensina — mostra.

TEMAS ÂNCORA: Bastidores reais de negócio, construção de identidade feminina, vida real (maternidade + rotina), pensamento estratégico de negócio, repertório e referências culturais.

AUDIÊNCIA: Mulher 25-35 anos, empreendedora ou em transição séria. Generalista com síndrome da impostora mesmo tendo resultado. Quer espelho, não tutorial.

TOM: Direto, reflexivo, honesto e opinativo. Nunca paternalista. Intelectualmente provocador.

NÃO PERTENCE À MARCA: motivacional genérico, tutorial passo-a-passo sem perspectiva própria, política, fitness, emagrecimento, relacionamento romântico, positividade tóxica.`

const SEARCH_PROMPT = `Pesquise na internet quais são os temas, tendências e conversas mais relevantes no Brasil AGORA para uma criadora de conteúdo no nicho de empreendedorismo feminino, identidade, mercado digital e IA.

Use web search para encontrar assuntos em discussão em LinkedIn, Instagram, YouTube, podcasts e notícias de negócio.

Depois de pesquisar, analise cada tema pelo filtro da marca da Hellena e retorne EXATAMENTE neste formato para cada tema:

**[TÍTULO DO TEMA]**
Fit com a marca: [Alta / Média / Baixa]
Ângulo sugerido: [Como ela abordaria de forma única — perspectiva específica, 2-3 frases]
Formato recomendado: [Vídeo longo / Reel / Vídeo longo + Reel / Post reflexivo]
Timing: [Urgente / Evergreen / Evitar]

---

Retorne entre 6 e 8 temas. Seja honesto no fit — não force temas que não se encaixam.`

const CUSTOM_PROMPT = (topic) => `Pesquise na internet sobre o tema: "${topic}" — o que está sendo discutido sobre isso no Brasil agora, quem está falando, que perspectivas estão surgindo.

Depois analise pelo filtro da marca da Hellena Aguiar e retorne neste formato:

**[TÍTULO DO TEMA]**
Fit com a marca: [Alta / Média / Baixa]
Ângulo sugerido: [Como ela abordaria de forma única — perspectiva específica, 2-3 frases]
Formato recomendado: [Vídeo longo / Reel / Vídeo longo + Reel / Post reflexivo]
Timing: [Urgente / Evergreen / Evitar]`

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
}

export async function POST(req) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY

    console.log('ANTHROPIC_API_KEY exists?', !!apiKey)

    if (!apiKey) {
      return jsonResponse(
        { error: 'ANTHROPIC_API_KEY não configurada.' },
        500
      )
    }

    let requestBody

    try {
      requestBody = await req.json()
    } catch {
      return jsonResponse(
        { error: 'Body inválido. Envie JSON válido.' },
        400
      )
    }

    const { mode, topic } = requestBody || {}

    if (!mode) {
      return jsonResponse(
        { error: 'Parâmetro "mode" é obrigatório.' },
        400
      )
    }

    if (mode === 'custom' && !topic?.trim()) {
      return jsonResponse(
        { error: 'Parâmetro "topic" é obrigatório no modo custom.' },
        400
      )
    }

    const userMsg = mode === 'custom'
      ? CUSTOM_PROMPT(topic.trim())
      : SEARCH_PROMPT

    const anthropicPayload = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      system: BRAND_SYSTEM,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search'
        }
      ],
      messages: [
        {
          role: 'user',
          content: userMsg
        }
      ]
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(anthropicPayload)
    })

    const rawText = await res.text()

    console.log('Anthropic status:', res.status)
    console.log('Anthropic raw response:', rawText)

    let data
    try {
      data = JSON.parse(rawText)
    } catch {
      return jsonResponse(
        {
          error: 'Resposta inválida do Anthropic.',
          raw: rawText
        },
        500
      )
    }

    if (!res.ok) {
      return jsonResponse(
        {
          error: data?.error?.message || 'Erro ao consultar o Anthropic.',
          details: data
        },
        res.status
      )
    }

    const text =
      data?.content
        ?.filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n') || ''

    if (!text) {
      return jsonResponse(
        {
          error: 'A resposta do Anthropic veio sem conteúdo de texto.',
          details: data
        },
        500
      )
    }

    return jsonResponse({ text }, 200)
  } catch (error) {
    console.error('Erro interno em /api/trends:', error)

    return jsonResponse(
      {
        error: error?.message || 'Erro interno ao buscar trends.'
      },
      500
    )
  }
}

export async function GET() {
  return jsonResponse(
    {
      error: 'Method not allowed. Use POST.'
    },
    405
  )
}