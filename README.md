# Radar de Trends — Hellena Aguiar

Agente de inteligência de conteúdo com web search integrado. Pesquisa tendências em tempo real e filtra pelo posicionamento da marca.

## Deploy no Vercel

### 1. Suba o código para o GitHub

```bash
git init
git add .
git commit -m "primeiro commit"
git remote add origin https://github.com/SEU_USUARIO/radar-trends.git
git push -u origin main
```

### 2. Importe no Vercel

- Acesse [vercel.com](https://vercel.com)
- Clique em **Add New → Project**
- Selecione o repositório `radar-trends`
- Clique em **Deploy**

### 3. Configure a variável de ambiente

Após o deploy (ou antes, em *Environment Variables* durante o import):

- Nome: `ANTHROPIC_API_KEY`
- Valor: sua chave `sk-ant-...` (console.anthropic.com)

Redeploy se adicionou depois do primeiro deploy.

## Rodando local

```bash
npm install
cp .env.example .env.local
# edite .env.local e coloque sua chave
npm run dev
```

Acesse http://localhost:3000
