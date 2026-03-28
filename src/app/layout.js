export const metadata = {
  title: 'Radar de Trends — Hellena Aguiar',
  description: 'Agente de inteligência de conteúdo com web search'
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
