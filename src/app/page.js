'use client'
import { useState, useRef } from 'react'

const s = {
  page: {
    background: '#0a0a0f',
    color: '#e8e8f0',
    fontFamily: "'DM Mono', 'Fira Code', 'Courier New', monospace",
    minHeight: '100vh',
    padding: '40px 20px',
  },
  wrap: { maxWidth: 760, margin: '0 auto' },
  label: { fontSize: 10, letterSpacing: '0.2em', color: '#555', textTransform: 'uppercase', marginBottom: 6 },
  h1: {
    fontSize: 28,
    fontWeight: 700,
    background: 'linear-gradient(90deg, #00ff88, #ff6b35, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: 6,
    lineHeight: 1.2,
  },
  subtitle: { fontSize: 12, color: '#555', marginBottom: 32 },
  controls: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  btnRun: {
    background: '#e8e8f0',
    color: '#0a0a0f',
    border: 'none',
    borderRadius: 8,
    padding: '10px 22px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.05em',
    transition: 'opacity 0.15s',
  },
  btnFilter: (active) => ({
    background: active ? '#0f0f1a' : 'transparent',
    border: `1px solid ${active ? '#333' : '#1e1e2e'}`,
    borderRadius: 6,
    padding: '7px 14px',
    fontSize: 11,
    color: active ? '#e8e8f0' : '#555',
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  }),
  customRow: { display: 'flex', gap: 8, marginBottom: 24 },
  input: {
    flex: 1,
    background: '#0f0f1a',
    border: '1px solid #1e1e2e',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    color: '#e8e8f0',
    fontFamily: 'inherit',
    outline: 'none',
  },
  btnSmall: {
    background: 'transparent',
    border: '1px solid #1e1e2e',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 12,
    color: '#666',
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  status: { fontSize: 12, color: '#555', marginBottom: 16, minHeight: 18, letterSpacing: '0.04em' },
  results: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: {
    background: '#0f0f1a',
    border: '1px solid #1e1e2e',
    borderRadius: 12,
    padding: '18px 20px',
  },
  cardTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#e8e8f0', lineHeight: 1.4 },
  badge: (fit) => ({
    fontSize: 10,
    padding: '3px 10px',
    borderRadius: 20,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    background: fit === 'Alta' ? 'rgba(0,255,136,0.12)' : fit === 'Média' ? 'rgba(255,107,53,0.12)' : 'rgba(167,139,250,0.12)',
    color: fit === 'Alta' ? '#00ff88' : fit === 'Média' ? '#ff6b35' : '#a78bfa',
    border: `1px solid ${fit === 'Alta' ? 'rgba(0,255,136,0.2)' : fit === 'Média' ? 'rgba(255,107,53,0.2)' : 'rgba(167,139,250,0.2)'}`,
  }),
  cardAngle: { fontSize: 12, color: '#aaa', lineHeight: 1.7, marginBottom: 12 },
  cardMeta: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  tag: {
    fontSize: 10,
    padding: '3px 8px',
    borderRadius: 4,
    background: '#14141f',
    color: '#555',
    border: '1px solid #1e1e2e',
    letterSpacing: '0.03em',
  },
  empty: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#555',
    fontSize: 13,
    background: '#0f0f1a',
    borderRadius: 12,
    border: '1px solid #1e1e2e',
    lineHeight: 1.8,
  },
}

function parseResults(raw) {
  const items = []
  const blocks = raw.split(/\n---+\n|\n(?=\*\*[^*])/g)
  for (const block of blocks) {
    if (block.trim().length < 20) continue
    const titleMatch = block.match(/\*\*(.+?)\*\*/)
    const fitMatch = block.match(/[Ff]it[^:]*:\s*(Alta|Média|Baixa|alta|média|baixa)/i)
    const angleMatch = block.match(/[Ââ]ngulo[^:]*:\s*([\s\S]{20,300}?)(?:\n[A-ZÂ]|\n---|\n\*\*|$)/)
    const formatMatch = block.match(/[Ff]ormato[^:]*:\s*([^\n]{5,100})/)
    const timingMatch = block.match(/[Tt]iming[^:]*:\s*([^\n]{5,60})/)
    if (titleMatch && fitMatch) {
      items.push({
        title: titleMatch[1].replace(/[*#]/g, '').trim(),
        fit: fitMatch[1].charAt(0).toUpperCase() + fitMatch[1].slice(1).toLowerCase(),
        angle: angleMatch ? angleMatch[1].replace(/[*_]/g, '').trim().replace(/\n+/g, ' ').slice(0, 280) : '',
        format: formatMatch ? formatMatch[1].trim() : '',
        timing: timingMatch ? timingMatch[1].trim() : '',
      })
    }
  }
  return items
}

const STEPS = [
  'Pesquisando tendências em alta no Brasil...',
  'Rastreando conversas no mercado digital feminino...',
  'Analisando fit com o seu posicionamento...',
  'Gerando ângulos exclusivos para o seu canal...',
]

export default function Home() {
  const [results, setResults] = useState([])
  const [filter, setFilter] = useState('todos')
  const [status, setStatus] = useState('')
  const [loadingRun, setLoadingRun] = useState(false)
  const [loadingCustom, setLoadingCustom] = useState(false)
  const [topic, setTopic] = useState('')
  const [rawVisible, setRawVisible] = useState('')
  const stepRef = useRef(null)

  function startSteps() {
    let i = 0
    setStatus(STEPS[0])
    stepRef.current = setInterval(() => {
      if (++i < STEPS.length) setStatus(STEPS[i])
    }, 3200)
  }
  function stopSteps() { clearInterval(stepRef.current) }

  async function callAPI(mode, topicVal) {
    const res = await fetch('/api/trends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, topic: topicVal }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return data.text
  }

  async function runAgent() {
    setLoadingRun(true)
    setRawVisible('')
    startSteps()
    try {
      const raw = await callAPI('search')
      stopSteps()
      const parsed = parseResults(raw)
      if (parsed.length === 0) {
        setRawVisible(raw.slice(0, 1000))
        setStatus('Resposta recebida — formato inesperado. Tente novamente.')
      } else {
        setResults(parsed)
        setStatus(`${parsed.length} temas analisados · ${parsed.filter(r => r.fit === 'Alta').length} com fit alto`)
      }
    } catch (e) {
      stopSteps()
      setStatus('Erro: ' + e.message)
    }
    setLoadingRun(false)
  }

  async function runCustom() {
    if (!topic.trim()) return
    setLoadingCustom(true)
    setStatus(`Pesquisando: "${topic}"...`)
    try {
      const raw = await callAPI('custom', topic)
      const parsed = parseResults(raw)
      if (parsed.length > 0) {
        setResults(prev => [...parsed, ...prev])
        setStatus(`Tema analisado · Fit: ${parsed[0].fit}`)
      } else {
        setResults(prev => [{ title: topic, fit: 'Média', angle: raw.slice(0, 280), format: '', timing: '' }, ...prev])
        setStatus('Análise concluída.')
      }
      setTopic('')
    } catch (e) {
      setStatus('Erro ao analisar. Tente novamente.')
    }
    setLoadingCustom(false)
  }

  const filtered = filter === 'todos' ? results : results.filter(r => r.fit === filter)

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <div style={{ marginBottom: 32 }}>
          <div style={s.label}>Agente de inteligência de conteúdo</div>
          <div style={s.h1}>Radar de Trends</div>
          <div style={s.subtitle}>Pesquisa tendências em tempo real · filtra pelo seu posicionamento de marca</div>
        </div>

        <div style={s.controls}>
          <button
            style={{ ...s.btnRun, opacity: loadingRun ? 0.5 : 1 }}
            onClick={runAgent}
            disabled={loadingRun}
          >
            {loadingRun ? 'Buscando...' : '↗ Buscar trends agora'}
          </button>
          {['todos', 'Alta', 'Média', 'Baixa'].map(f => (
            <button key={f} style={s.btnFilter(filter === f)} onClick={() => setFilter(f)}>
              {f === 'todos' ? 'Todos' : f === 'Alta' ? 'Fit alto' : f === 'Média' ? 'Fit médio' : 'Fit baixo'}
            </button>
          ))}
        </div>

        <div style={s.customRow}>
          <input
            style={s.input}
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runCustom()}
            placeholder="Analisar tema específico... ex: burnout feminino, IA no mercado criativo"
          />
          <button
            style={{ ...s.btnSmall, opacity: loadingCustom ? 0.5 : 1 }}
            onClick={runCustom}
            disabled={loadingCustom}
          >
            {loadingCustom ? 'Analisando...' : 'Analisar ↗'}
          </button>
        </div>

        {status && <div style={s.status}>{status}</div>}

        <div style={s.results}>
          {filtered.length === 0 && !rawVisible && (
            <div style={s.empty}>
              Clique em "Buscar trends agora" para o agente pesquisar e filtrar temas relevantes para a sua marca.<br />
              Ou digite um tema específico no campo acima para análise direta.
            </div>
          )}
          {rawVisible && (
            <div style={{ ...s.card }}>
              <div style={{ ...s.cardAngle, whiteSpace: 'pre-wrap' }}>{rawVisible}</div>
            </div>
          )}
          {filtered.map((item, i) => (
            <div key={i} style={s.card}>
              <div style={s.cardTop}>
                <div style={s.cardTitle}>{item.title}</div>
                <span style={s.badge(item.fit)}>Fit {item.fit}</span>
              </div>
              {item.angle && <div style={s.cardAngle}>{item.angle}</div>}
              <div style={s.cardMeta}>
                {item.format && <span style={s.tag}>{item.format}</span>}
                {item.timing && <span style={s.tag}>{item.timing}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
