# TJE 2026 — Torneio de Jogos Escolares
Colégio Estadual Malba Tahan

Site 100% Firebase: front-end estático (HTML/CSS/JS puro, hospedado no **GitHub Pages**) + **Firestore**, **Firebase Authentication** e uma função HTTP na nuvem como backend. Tudo configurado **pelo navegador** — não precisa instalar nada no computador.

## Estrutura

```
/                       páginas HTML (index, jogos, premiacao, regulamento, inscricao, area-participante, admin)
/css/style.css          todo o estilo do site
/js/                    lógica de cada página (vanilla JS + Firebase SDK)
/functions/             código da função HTTP (Node.js) — cole no Google Cloud Console
firestore.rules         regras de segurança do Firestore (cole no Firebase Console)
.github/workflows/      publica o site automaticamente no GitHub Pages
```

## 1. Firestore (já deve estar ativo)

Se ainda não fez: **Firebase Console → Firestore Database → Criar banco de dados** (modo produção, região `southamerica-east1`).

### Publicar as regras de segurança

1. **Firestore Database → aba "Regras"**.
2. Apague o conteúdo e cole o texto do arquivo `firestore.rules` deste projeto.
3. Clique em **Publicar**.

### Índice necessário

O formulário de inscrição consulta turmas ativas ordenadas por nome — isso precisa de um índice composto. Duas formas de criar:

- **Automática (mais fácil):** abra `inscricao.html` no navegador. Se faltar o índice, vai aparecer um erro no console do navegador (F12) com um link "Create it here" — clique nele, confirme no Firebase, espera ~1 minuto e pronto.
- **Manual:** **Firestore Database → aba "Índices" → Adicionar índice** → coleção `turmas` → campos `ativo` (Crescente) e `nome` (Crescente) → Criar.

## 2. Authentication (já deve estar ativo)

Se ainda não fez: **Authentication → Sign-in method → E-mail/senha → Ativar**.

## 3. Criar a função HTTP (sem instalar nada — tudo no navegador)

1. Acesse **console.cloud.google.com** (Console do Google Cloud — é o mesmo projeto do Firebase, `tje2026-88227`; confira o nome do projeto no topo da página).
2. No menu ☰ → **Cloud Functions**. Se pedir para ativar a API, clique em **Ativar** (pode levar um minuto).
3. Clique em **Criar função**.
4. Preencha:
   - **Ambiente**: 2ª geração
   - **Nome da função**: `api`
   - **Região**: `us-central1` (ou `southamerica-east1`, se preferir — anote a que escolher)
   - **Acionador**: HTTPS
   - **Autenticação**: marque **"Permitir invocações não autenticadas"** (o código já cuida da segurança internamente)
5. Clique em **"Runtime, build, connections and security settings"** (expande um painel) → aba **Variáveis de ambiente em tempo de execução** → adicione:
   - `MP_ACCESS_TOKEN` = seu token do Mercado Pago (veja seção 5)
   - `PUBLIC_FUNCTIONS_URL` = deixe em branco por enquanto
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` = dados do seu e-mail (veja seção 6)
6. Clique em **Avançar/Next**.
7. Em **Runtime**: escolha **Node.js 20**. Em **Ponto de entrada**: digite `api`.
8. No editor de código embutido, você vai ver os arquivos `index.js` e `package.json` de exemplo — **apague o conteúdo dos dois** e cole o conteúdo dos arquivos deste projeto:
   - `functions/index.js` → cole no `index.js` do editor
   - `functions/package.json` → cole no `package.json` do editor
   - Clique em **"+ Adicionar arquivo"** e crie um arquivo chamado `email.js`, colando o conteúdo de `functions/email.js` deste projeto.
9. Clique em **Implantar**. Leva de 2 a 5 minutos.

Quando terminar, clique na função `api` na lista → aba **Acionador** → copie a **URL** mostrada (algo como `https://api-xxxxxxxxx-uc.a.run.app` ou `https://us-central1-tje2026-88227.cloudfunctions.net/api`).

## 4. Ligar o front-end à função

1. Cole essa URL copiada em `js/firebase-config.js`, na constante `FUNCTIONS_BASE_URL` (sem barra `/` no final).
2. Volte no Cloud Console, na função `api` → **Editar** → variáveis de ambiente → preencha `PUBLIC_FUNCTIONS_URL` com essa mesma URL → **Implantar** de novo (precisa reimplantar pra aplicar).

## 5. Mercado Pago

1. Crie uma aplicação em **mercadopago.com.br/developers** e copie o **Access Token de produção**.
2. Cole em `MP_ACCESS_TOKEN` (passo 3.5 acima, ou edite a função depois em Cloud Functions → `api` → Editar).
3. No painel do Mercado Pago, configure a notification URL como a URL da sua função + `/webhookMercadopago`, por exemplo:
   `https://api-xxxxxxxxx-uc.a.run.app/webhookMercadopago`

## 6. E-mail (envio das credenciais)

Use qualquer provedor SMTP (Gmail com **senha de app**, não a senha normal; ou SendGrid, Resend, Zoho). Preencha `SMTP_HOST`, `SMTP_PORT` (geralmente 587), `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` nas variáveis de ambiente da função (passo 3.5).

## 7. Criar o administrador

1. **Firebase Console → Authentication → Users → Add user**. Cadastre e-mail/senha do admin.
2. Copie o **UID** desse usuário.
3. **Firestore Database → Iniciar coleção** → nome `admins` → ID do documento: cole o UID → adicione um campo `nome` (string) qualquer → Salvar.
4. Acesse `admin.html` e faça login com esse e-mail/senha.

## 8. Publicar o site no GitHub Pages

1. Suba este projeto para um repositório no GitHub (branch `main`).
2. **Settings → Pages → Build and deployment → Source** → escolha **GitHub Actions**.
3. O workflow em `.github/workflows/deploy.yml` já está pronto: a cada push na `main`, publica o site sozinho. Também dá pra rodar manualmente em **Actions → Deploy no GitHub Pages → Run workflow**.
4. O site fica em `https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO/`.

## 9. Ajustes rápidos no código

- **Data de encerramento das inscrições**: `js/countdown.js`, constante `DATA_ENCERRAMENTO`.
- **Valores**: `js/jogos-data.js`, constantes `VALOR_JOGO_UNITARIO` e `VALOR_PASSE_TJE`.
- **Lista de jogos**: `js/jogos-data.js`, array `CATALOGO_JOGOS`.
- **Cronograma individual**: editado direto no Firestore, campo `cronograma` (array) de cada documento em `inscricoes`:
  ```json
  { "jogo": "CS2", "data": "2026-04-01", "horario": "14:00", "adversario": "Turma X", "local": "Sala 12" }
  ```

## Sobre `firebase.json` e `.firebaserc`

Esses dois arquivos só servem se, no futuro, você (ou alguém) quiser instalar o Firebase CLI e publicar por linha de comando. Como este guia usa só o navegador, você pode ignorá-los completamente — não atrapalham em nada ficando aí.

## Observações de segurança

- A senha do participante nunca é lida diretamente pelo cliente: o login e a troca de senha são validados dentro da função HTTP, com o Firebase Admin SDK, e a senha fica salva com hash (bcrypt) depois da primeira troca.
- O painel administrativo só libera acesso para UIDs presentes na coleção `admins`.
- `firestore.rules` bloqueia leitura/escrita direta das coleções `admins` e `contadores` pelo cliente; só a função (Admin SDK) acessa essas coleções.
