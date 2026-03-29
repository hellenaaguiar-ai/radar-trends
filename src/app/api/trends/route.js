export const runtime = 'edge'

const BRAND_SYSTEM = `Você é um estrategista de conteúdo especializado na marca pessoal de Hellena Aguiar.

MARCA: Hellena Aguiar — estrategista de marketing, criadora de soluções com IA, coprodutora no mercado de infoprodutos, mãe. Múltipla, direta, reflexiva. Não ensina — mostra.

TEMAS ÂNCORA: Bastidores reais de negócio, construção de identidade feminina, vida real (maternidade + rotina), pensamento estratégico de negócio, repertório e referências culturais.

AUDIÊNCIA: Mulher 25-35 anos, empreendedora ou em transição séria. Generalista com síndrome da impostora mesmo tendo resultado. Quer espelho, não tutorial.

TOM: Direto, reflexivo, honesto sobre o caos. Nunca paternalista. Intelectualmente provocador.

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

const CUSTOM_PROMPT = (topic: string) => `Pesquise na internet sobre o tema: "${topic}" — o que está sendo discutido sobre isso no Brasil agora, quem está falando, que perspectivas estão surgindo.

Depois analise pelo filtro da marca da Hellena Aguiar e retorne neste formato:

**[TÍTULO DO TEMA]**
Fit com a marca: [Alta / Média / Baixa]
Ângulo sugerido: [Como ela abordaria de forma única — perspectiva específica, 2-3 frases]
Formato recomendado: [Vídeo longo / Reel / Vídeo longo + Reel / Post reflexivo]
Timing: [Urgente / Evergreen / Evitar]`

// ─── HELPERS ──────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  })
}

// Parse defensivo — retorna null em vez de explodir se vier HTML ou texto cru
function safeParse(text: string) {
  try { return JSON.parse(text) }
  catch { return null }
}

// ─── POST ─────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return jsonResponse({ error: 'ANTHROPIC_API_KEY não configurada.' }, 500)
    }

    let requestBody: { mode?: string; topic?: string } | null = null
    try {
      requestBody = await req.json()
    } catch {
      return jsonResponse({ error: 'Body inválido. Envie JSON válido.' }, 400)
    }

    const { mode, topic } = requestBody || {}

    if (!mode) {
      return jsonResponse({ error: 'Parâmetro "mode" é obrigatório.' }, 400)
    }

    if (mode === 'custom' && !topic?.trim()) {
      return jsonResponse({ error: 'Parâmetro "topic" é obrigatório no modo custom.' }, 400)
    }

    const userMsg = mode === 'custom'
      ? CUSTOM_PROMPT(topic!.trim())
      : SEARCH_PROMPT

    const anthropicPayload = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      system: BRAND_SYSTEM,
      // ✅ versão atualizada do web search
      tools: [{ type: 'web_search_20260209', name: 'web_search' }],
      messages: [{ role: 'user', content: userMsg }]
    }

    // ✅ Timeout de 25s via AbortController
    // Edge functions costumam ter limite de 30s — deixa margem pra resposta
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 25_000)

    let res: Response
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
          // ✅ anthropic-beta removido — desnecessário e suspeito de incompatibilidade
        },
        body: JSON.stringify(anthropicPayload)
      })
    } catch (fetchErr: unknown) {
      const err = fetchErr as Error
      const msg = err?.name === 'AbortError'
        ? 'Timeout: a requisição demorou mais de 25s.'
        : err?.message || 'Erro de rede ao contatar o Anthropic.'
      return jsonResponse({ error: msg }, 502)
    } finally {
      clearTimeout(timer)
    }

    // ✅ Parse defensivo — não explode se vier HTML de gateway ou proxy
    const rawText = await res.text()
    const data = safeParse(rawText)

    if (!data) {
      console.error('Anthropic retornou não-JSON:', rawText.slice(0, 300))
      return jsonResponse(
        {
          error: 'Resposta inesperada do Anthropic (não-JSON).',
          hint: rawText.slice(0, 200)
        },
        502
      )
    }

    if (!res.ok) {
      return jsonResponse(
        {
          error: data?.error?.message || 'Erro na API do Anthropic.',
          details: data
        },
        res.status
      )
    }

    const text: string =
      data?.content
        ?.filter((b: { type: string }) => b.type === 'text')
        .map((b: { text: string }) => b.text)
        .join('\n') || ''

    if (!text) {
      return jsonResponse(
        {
          error: 'Anthropic respondeu mas sem bloco de texto.',
          details: data
        },
        500
      )
    }

    return jsonResponse({ text }, 200)

  } catch (error: unknown) {
    const err = error as Error
    console.error('Erro interno em /api/trends:', err)
    return jsonResponse({ error: err?.message || 'Erro interno.' }, 500)
  }
}

export async function GET() {
  return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405)
}