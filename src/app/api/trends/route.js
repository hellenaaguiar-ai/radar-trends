export const runtime = 'edge'

const BRAND_SYSTEM = `Você é um estrategista de conteúdo especializado na marca pessoal de Hellena Aguiar.

MARCA: Hellena Aguiar — estrategista de marketing, criadora de soluções com IA, coprodutora no mercado de infoprodutos, mãe. Múltipla, direta, reflexiva. Não ensina — mostra.

TEMAS ÂNCORA: Bastidores reais de negócio, construção de identidade feminina, vida real (maternidade + rotina), pensamento estratégico de negócio, repertório e referências culturais.

AUDIÊNCIA: Mulher 25-35 anos, empreendedora ou em transição séria. Generalista com síndrome da impostora mesmo tendo resultado. Quer espelho, não tutorial.

TOM: Direto, reflexivo, honesto sobre o caos. Nunca paternalista. Intelectualmente provocador.

NÃO PERTENCE À MARCA: motivacional genérico, tutorial passo-a-passo sem perspectiva própria, política, fitness, emagrecimento, relacionamento romântico, positividade tóxica.`

const SEARCH_PROMPT = `Pesquise na internet quais são os temas, tendências e conversas mais relevantes no Brasil AGORA para uma criadora de conteúdo no nicho de empreendedorismo feminino, identidade, mercado digital e IA. Use web search para encontrar assuntos em discussão — LinkedIn, Instagram, YouTube, podcasts, notícias de negócio.

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

export async function POST(req) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY não configurada.' }, { status: 500 })
  }

  const { mode, topic } = await req.json()
  const userMsg = mode === 'custom' ? CUSTOM_PROMPT(topic) : SEARCH_PROMPT

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'interleaved-thinking-2025-05-14'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: BRAND_SYSTEM,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: userMsg }]
    })
  })

  const data = await res.json()
  if (data.error) return Response.json({ error: data.error.message }, { status: 500 })

  const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || ''
  return Response.json({ text })
}
