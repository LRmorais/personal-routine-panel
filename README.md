# Ritmo — Painel de Rotina Pessoal

PWA pessoal para captura de pensamentos recorrentes, replanejamento de tarefas, hábitos e agenda diária.

Fases de construção: 0) scaffolding + auth + instalabilidade — 1) captura rápida (inbox) — 2) replanejamento de fim de dia — 2.5) infra de push — 3) hábitos — 4) agenda + sync CalDAV com o iPhone.

## Estrutura

- `web/` — frontend React + TypeScript + Vite, PWA instalável.
- `functions/` — Cloud Functions (webhooks e jobs agendados), adicionadas a partir da Fase 1.
- `firebase.json`, `firestore.rules`, `firestore.indexes.json` — configuração do projeto Firebase.

## Setup inicial (passos manuais, uma vez)

1. **Versão do Node**: este projeto usa Node 25 via `nvm` (`.nvmrc` na raiz). Rode `nvm use` antes de qualquer comando.
2. **Criar o projeto no Firebase Console** (console.firebase.google.com): região `southamerica-east1`, ativar **Firestore** e **Authentication** (provedor **E-mail/senha** — não Google, ver nota abaixo).
3. **Instalar a CLI do Firebase e logar**:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
4. **Linkar este diretório ao projeto criado**: `firebase use --add`.
5. **Configurar variáveis de ambiente do frontend**: copie `web/.env.example` para `web/.env.local` (ou `.env`) e preencha com os dados do app web (Configurações do projeto → Geral → Seus apps → SDK). Use o domínio do Hosting (`<project-id>.web.app`) como `VITE_FIREBASE_AUTH_DOMAIN`.
6. **Travar as regras de segurança no seu usuário**: depois de criar sua conta no app (tela "Primeiro acesso"), pegue seu `uid` no Firebase Console (Authentication → Users) e substitua em `firestore.rules`.

> **Por que e-mail/senha e não "Entrar com Google"**: o Google bloqueia login OAuth dentro de WebViews embutidas (política deles desde 2016) — e um PWA instalado na tela de início do iOS roda numa WebView desse tipo. Não tem contorno no lado do app; e-mail/senha funciona normalmente porque não depende de redirecionar pra fora do app.

### Cloud Functions (Fase 1+) — precisa do plano Blaze

Funções (`captureInboxItem`, `pushScheduleToCalDAV` e as próximas) só podem ser implantadas com o projeto no plano **Blaze** (pay-as-you-go — tem tier gratuito generoso, custo esperado ~$0/mês nesse volume). Enquanto isso não for feito, o código já está pronto em `functions/src/` mas fica sem deploy — o app funciona normalmente sem essa parte (inbox, tarefas, hábitos e agenda já funcionam 100% sem Functions; a agenda usa uma materialização client-side dos modelos recorrentes em vez do cron job que dependeria de Blaze).

Quando for ativar o Blaze e implantar:
```bash
firebase functions:secrets:set SHORTCUT_WEBHOOK_SECRET   # segredo aleatório pro webhook do Atalho
firebase functions:secrets:set ICLOUD_USERNAME           # seu Apple ID (e-mail)
firebase functions:secrets:set ICLOUD_APP_PASSWORD       # senha de app gerada em appleid.apple.com
firebase deploy --only functions
```
A URL da `captureInboxItem` aparece na saída do deploy. Configure um Atalho no iPhone (app Atalhos → Novo Atalho → "Pedir Texto" via Siri/Botão de Ação → "Obter Conteúdo de URL": método POST, corpo JSON `{"text": <Texto Fornecido>}`, cabeçalho `X-Webhook-Secret: <valor do segredo>`) apontando pra essa URL.

`pushScheduleToCalDAV` é `callable` (chamada pelo próprio app, não uma URL pública) e não está com um botão na interface ainda — plano é adicionar isso quando o Blaze estiver ativo, já que sem deploy não há o que testar. É a parte de maior incerteza técnica do projeto (integração CalDAV com iCloud via `tsdav`), então fica pra ser validada por último.

## Rodando localmente

```bash
nvm use
cd web && npm run dev
```

## Deploy (checkpoint da Fase 0)

```bash
nvm use
cd web && npm run build && cd ..
firebase deploy --only hosting,firestore:rules
```

No iPhone: abrir a URL `*.web.app` no Safari → Compartilhar → **Adicionar à Tela de Início** → confirmar que abre em modo standalone (sem a barra do Safari).
