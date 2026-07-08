# ctrl_routine — Painel de Rotina Pessoal

PWA pessoal para captura de pensamentos recorrentes, replanejamento de tarefas, hábitos e agenda diária.

Fases de construção: 0) scaffolding + auth + instalabilidade — 1) captura rápida (inbox) — 2) replanejamento de fim de dia — 2.5) infra de push — 3) hábitos — 4) agenda + sync CalDAV com o iPhone.

## Estrutura

- `web/` — frontend React + TypeScript + Vite, PWA instalável.
- `functions/` — Cloud Functions (webhooks e jobs agendados), adicionadas a partir da Fase 1.
- `firebase.json`, `firestore.rules`, `firestore.indexes.json` — configuração do projeto Firebase.

## Setup inicial (passos manuais, uma vez)

1. **Versão do Node**: este projeto usa Node 25 via `nvm` (`.nvmrc` na raiz). Rode `nvm use` antes de qualquer comando.
2. **Criar o projeto no Firebase Console** (console.firebase.google.com): região `southamerica-east1`, ativar **Firestore**, **Authentication** (provedor Google) e **Cloud Messaging**. Fazer upgrade para o plano **Blaze** (necessário para Cloud Scheduler e chamadas HTTP de saída usadas nas Fases 2.5 e 4).
3. **Instalar a CLI do Firebase e logar**:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
4. **Linkar este diretório ao projeto criado**:
   ```bash
   firebase use --add
   ```
   Isso gera o `.firebaserc` (não versionado neste ponto porque o projeto ainda não existia).
5. **Configurar variáveis de ambiente do frontend**: copie `web/.env.example` para `web/.env.local` e preencha com os dados do app web (Configurações do projeto → Geral → Seus apps → SDK).
6. **Travar as regras de segurança no seu usuário**: depois do primeiro login no app, pegue seu `uid` real no Firebase Console (Authentication → Users) e substitua `REPLACE_WITH_ALEX_FIREBASE_UID` em `firestore.rules`.

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
